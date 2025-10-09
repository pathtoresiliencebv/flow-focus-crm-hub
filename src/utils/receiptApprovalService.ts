import { supabase } from '@/integrations/supabase/client';

export interface Receipt {
  id: string;
  user_id: string;
  amount: number | null;
  description?: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected';
  auto_approved?: boolean;
  approval_rule_id?: string | null;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description?: string;
  max_amount?: number | null;
  category?: string | null;
  user_id?: string | null;
  role?: string | null;
  auto_approve: boolean;
  is_active: boolean;
  priority: number;
}

export interface AutoApprovalResult {
  shouldAutoApprove: boolean;
  ruleId?: string | null;
  ruleName?: string | null;
}

/**
 * Check if a receipt should be auto-approved based on approval rules
 */
export async function checkAutoApproval(
  userId: string,
  amount: number | null,
  category?: string
): Promise<AutoApprovalResult> {
  try {
    const { data, error } = await supabase.rpc('check_receipt_auto_approval', {
      p_user_id: userId,
      p_amount: amount,
      p_category: category || null
    });

    if (error) {
      console.error('Error checking auto-approval:', error);
      return { shouldAutoApprove: false };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        shouldAutoApprove: result.should_auto_approve || false,
        ruleId: result.rule_id || null,
        ruleName: result.rule_name || null
      };
    }

    return { shouldAutoApprove: false };
  } catch (error) {
    console.error('Exception in checkAutoApproval:', error);
    return { shouldAutoApprove: false };
  }
}

/**
 * Apply auto-approval to a receipt if rules match
 */
export async function applyAutoApproval(receiptId: string, receipt: Partial<Receipt>): Promise<boolean> {
  try {
    if (!receipt.user_id || receipt.amount === undefined) {
      return false;
    }

    const approvalResult = await checkAutoApproval(
      receipt.user_id,
      receipt.amount,
      receipt.category
    );

    if (approvalResult.shouldAutoApprove) {
      // Update receipt to approved status
      const { error: updateError } = await supabase
        .from('receipts')
        .update({
          status: 'approved',
          auto_approved: true,
          approval_rule_id: approvalResult.ruleId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId);

      if (updateError) {
        console.error('Error updating receipt for auto-approval:', updateError);
        
        // Log the error
        await logProcessing(receiptId, 'auto_approval_error', {
          error: updateError.message,
          rule_id: approvalResult.ruleId
        }, updateError.message);
        
        return false;
      }

      // Log successful auto-approval
      await logProcessing(receiptId, 'auto_approved', {
        rule_id: approvalResult.ruleId,
        rule_name: approvalResult.ruleName,
        amount: receipt.amount
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Exception in applyAutoApproval:', error);
    return false;
  }
}

/**
 * Get all active approval rules
 */
export async function getApprovalRules(): Promise<ApprovalRule[]> {
  try {
    const { data, error } = await supabase
      .from('receipt_approval_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approval rules:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getApprovalRules:', error);
    return [];
  }
}

/**
 * Create a new approval rule
 */
export async function createApprovalRule(rule: Omit<ApprovalRule, 'id' | 'created_at' | 'updated_at'>): Promise<ApprovalRule | null> {
  try {
    const { data, error } = await supabase
      .from('receipt_approval_rules')
      .insert(rule)
      .select()
      .single();

    if (error) {
      console.error('Error creating approval rule:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in createApprovalRule:', error);
    return null;
  }
}

/**
 * Update an existing approval rule
 */
export async function updateApprovalRule(ruleId: string, updates: Partial<ApprovalRule>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('receipt_approval_rules')
      .update(updates)
      .eq('id', ruleId);

    if (error) {
      console.error('Error updating approval rule:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in updateApprovalRule:', error);
    return false;
  }
}

/**
 * Delete an approval rule
 */
export async function deleteApprovalRule(ruleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('receipt_approval_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting approval rule:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in deleteApprovalRule:', error);
    return false;
  }
}

/**
 * Log receipt processing action
 */
export async function logProcessing(
  receiptId: string,
  action: string,
  details?: any,
  errorMessage?: string,
  processedBy?: string | null,
  emailMessageId?: string | null
): Promise<void> {
  try {
    await supabase.rpc('log_receipt_processing', {
      p_receipt_id: receiptId,
      p_action: action,
      p_details: details ? JSON.stringify(details) : null,
      p_error_message: errorMessage || null,
      p_processed_by: processedBy || null,
      p_email_message_id: emailMessageId || null
    });
  } catch (error) {
    console.error('Exception in logProcessing:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Get processing log for a receipt
 */
export async function getProcessingLog(receiptId: string) {
  try {
    const { data, error } = await supabase
      .from('receipt_processing_log')
      .select('*')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching processing log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getProcessingLog:', error);
    return [];
  }
}

/**
 * Bulk approve multiple receipts
 */
export async function bulkApproveReceipts(receiptIds: string[], approvedBy: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', receiptIds)
      .select('id');

    if (error) {
      console.error('Error bulk approving receipts:', error);
      return 0;
    }

    // Log each approval
    for (const receipt of data || []) {
      await logProcessing(receipt.id, 'approved', { bulk_approval: true }, undefined, approvedBy);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception in bulkApproveReceipts:', error);
    return 0;
  }
}

/**
 * Bulk reject multiple receipts
 */
export async function bulkRejectReceipts(receiptIds: string[], rejectionReason: string, rejectedBy: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .in('id', receiptIds)
      .select('id');

    if (error) {
      console.error('Error bulk rejecting receipts:', error);
      return 0;
    }

    // Log each rejection
    for (const receipt of data || []) {
      await logProcessing(receipt.id, 'rejected', { 
        bulk_rejection: true, 
        reason: rejectionReason 
      }, undefined, rejectedBy);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception in bulkRejectReceipts:', error);
    return 0;
  }
}

