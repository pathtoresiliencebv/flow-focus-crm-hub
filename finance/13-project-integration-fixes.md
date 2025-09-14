# 13 - Project Integration Fixes

## Problem
- Project creation during quote/invoice flow may have issues
- Unclear project-quote-invoice relationships
- Missing project management integration
- Workflow breaks between finance and project systems

## Current Implementation
- Basic project creation from quotes
- Limited integration between systems
- Potential data consistency issues

## Solution
1. **Strengthen Quote-Project Links**
   - Clear project reference in quotes
   - Project creation from approved quotes
   - Bidirectional relationship tracking

2. **Project Status Integration**
   - Project status affects quote/invoice availability
   - Project completion triggers invoice finalization
   - Status synchronization between systems

3. **Enhanced Project Creation**
   - Auto-populate project from quote data
   - Transfer customer information
   - Copy quote items as project tasks

4. **Workflow Indicators**
   - Show project status in quote/invoice lists
   - Link to project from finance records
   - Clear workflow progression indicators

## Database Integrity
```sql
-- Ensure proper foreign key relationships
ALTER TABLE projects ADD CONSTRAINT fk_projects_quote 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- Add project reference to invoices
ALTER TABLE invoices ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create workflow tracking table
CREATE TABLE finance_workflow_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id),
  invoice_id UUID REFERENCES invoices(id),
  project_id UUID REFERENCES projects(id),
  workflow_stage TEXT NOT NULL,
  stage_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files to Modify
- `src/services/quoteToInvoiceService.ts` - Enhanced project creation
- `src/components/quotes/QuotesTable.tsx` - Show project links
- `src/components/invoicing/InvoicesTable.tsx` - Show project links
- `src/hooks/useProjectIntegration.ts` - New hook for integration
- `src/components/projects/ProjectQuoteLink.tsx` - New component

## Enhanced Project Creation
```jsx
const createProjectFromQuote = async (quote, invoiceId = null) => {
  try {
    const projectData = {
      title: quote.project_title || `Project voor ${quote.customer_name}`,
      description: `Automatisch aangemaakt vanuit offerte ${quote.quote_number}`,
      customer_id: quote.customer_id,
      quote_id: quote.id,
      value: quote.total_amount,
      status: 'te-plannen',
      project_status: 'te-plannen'
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;

    // Link invoice to project if provided
    if (invoiceId) {
      await supabase
        .from('invoices')
        .update({ project_id: project.id })
        .eq('id', invoiceId);
    }

    // Generate project tasks from quote items
    await supabase.rpc('generate_project_tasks_from_quote', {
      p_project_id: project.id,
      p_quote_id: quote.id
    });

    // Track workflow progress
    await supabase
      .from('finance_workflow_tracking')
      .insert([{
        quote_id: quote.id,
        invoice_id: invoiceId,
        project_id: project.id,
        workflow_stage: 'project_created'
      }]);

    return project;
    
  } catch (error) {
    console.error('Error creating project from quote:', error);
    throw error;
  }
};
```

## Workflow Indicators
```jsx
const WorkflowStatus = ({ quote }) => {
  const { project, invoice } = useProjectIntegration(quote.id);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={quote.status === 'goedgekeurd' ? 'success' : 'secondary'}>
        Offerte: {quote.status}
      </Badge>
      
      {invoice && (
        <Badge variant={invoice.status === 'sent' ? 'success' : 'warning'}>
          Factuur: {invoice.status}
        </Badge>
      )}
      
      {project && (
        <Badge variant={project.status === 'afgerond' ? 'success' : 'info'}>
          Project: {project.status}
        </Badge>
      )}
    </div>
  );
};
```

## Implementation Priority
**MEDIUM** - Important for system coherence

## Dependencies
- Project management system must be stable
- Quote and invoice systems should be working properly

## Testing
- Quote approval → project created correctly
- Project data matches quote information
- Invoice links to project properly
- Workflow status updates correctly
- No data integrity issues