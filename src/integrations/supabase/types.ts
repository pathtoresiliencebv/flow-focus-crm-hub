export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          compliance_relevant: boolean | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          severity: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          compliance_relevant?: boolean | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          severity?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          compliance_relevant?: boolean | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          severity?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions_config: Json
          created_at: string | null
          created_by: string
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          trigger_config: Json
          updated_at: string | null
        }
        Insert: {
          actions_config: Json
          created_at?: string | null
          created_by: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          trigger_config: Json
          updated_at?: string | null
        }
        Update: {
          actions_config?: Json
          created_at?: string | null
          created_by?: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          trigger_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      bonnetjes: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string | null
          id: number
          sender: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: never
          sender?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: never
          sender?: string | null
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_direct_message: boolean | null
          name: string
          participants: Json | null
          project_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_direct_message?: boolean | null
          name: string
          participants?: Json | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_direct_message?: boolean | null
          name?: string
          participants?: Json | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string
          delivery_status: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          message_type: string
          read_by: Json | null
          reply_to_id: string | null
          sender_id: string
          translated_content: Json | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string
          delivery_status?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string
          read_by?: Json | null
          reply_to_id?: string | null
          sender_id: string
          translated_content?: Json | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string
          delivery_status?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string
          read_by?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          translated_content?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_typing_indicators: {
        Row: {
          channel_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_events: {
        Row: {
          compliance_standard: string | null
          description: string
          detected_at: string
          event_type: string
          id: string
          metadata: Json | null
          remediation_required: boolean | null
          remediation_status: string | null
          resolved_at: string | null
          resource_affected: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          compliance_standard?: string | null
          description: string
          detected_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          remediation_required?: boolean | null
          remediation_status?: string | null
          resolved_at?: string | null
          resource_affected?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          compliance_standard?: string | null
          description?: string
          detected_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          remediation_required?: boolean | null
          remediation_status?: string | null
          resolved_at?: string | null
          resource_affected?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_source: string | null
          consent_type: string
          created_at: string
          data_categories: string[] | null
          expiry_date: string | null
          given_at: string
          id: string
          is_active: boolean | null
          legal_basis: string | null
          purpose: string
          updated_at: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_source?: string | null
          consent_type: string
          created_at?: string
          data_categories?: string[] | null
          expiry_date?: string | null
          given_at?: string
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          purpose: string
          updated_at?: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_source?: string | null
          consent_type?: string
          created_at?: string
          data_categories?: string[] | null
          expiry_date?: string | null
          given_at?: string
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          purpose?: string
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          avg_response_time: unknown | null
          conversation_participants: string[]
          created_at: string | null
          date: string
          id: string
          language_distribution: Json | null
          message_count: number | null
          project_id: string | null
          sentiment_score: number | null
          topic_keywords: string[] | null
        }
        Insert: {
          avg_response_time?: unknown | null
          conversation_participants: string[]
          created_at?: string | null
          date: string
          id?: string
          language_distribution?: Json | null
          message_count?: number | null
          project_id?: string | null
          sentiment_score?: number | null
          topic_keywords?: string[] | null
        }
        Update: {
          avg_response_time?: unknown | null
          conversation_participants?: string[]
          created_at?: string | null
          date?: string
          id?: string
          language_distribution?: Json | null
          message_count?: number | null
          project_id?: string | null
          sentiment_score?: number | null
          topic_keywords?: string[] | null
        }
        Relationships: []
      }
      conversation_insights: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string
          id: string
          insight_type: string
          is_read: boolean | null
          project_id: string | null
          severity: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          project_id?: string | null
          severity?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          project_id?: string | null
          severity?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          btw_number: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          email_addresses: Json | null
          id: string
          invoice_address: Json | null
          kvk_number: string | null
          name: string
          notes: string | null
          phone: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["customer_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_addresses?: Json | null
          id?: string
          invoice_address?: Json | null
          kvk_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_addresses?: Json | null
          id?: string
          invoice_address?: Json | null
          kvk_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          archive_before_deletion: boolean | null
          automatic_deletion: boolean | null
          created_at: string
          data_type: string
          description: string | null
          id: string
          is_active: boolean | null
          legal_basis: string | null
          policy_name: string
          retention_period_days: number
          updated_at: string
        }
        Insert: {
          archive_before_deletion?: boolean | null
          automatic_deletion?: boolean | null
          created_at?: string
          data_type: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          policy_name: string
          retention_period_days: number
          updated_at?: string
        }
        Update: {
          archive_before_deletion?: boolean | null
          automatic_deletion?: boolean | null
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          policy_name?: string
          retention_period_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          audio_duration: number | null
          content: string
          context_type: string | null
          created_at: string
          detected_language: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          from_user_id: string
          id: string
          is_read: boolean | null
          message_type: string | null
          original_language: string
          thumbnail_url: string | null
          to_user_id: string
          transcription_text: string | null
          translated_content: Json | null
          translation_confidence: number | null
          updated_at: string
        }
        Insert: {
          audio_duration?: number | null
          content: string
          context_type?: string | null
          created_at?: string
          detected_language?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          from_user_id: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          original_language?: string
          thumbnail_url?: string | null
          to_user_id: string
          transcription_text?: string | null
          translated_content?: Json | null
          translation_confidence?: number | null
          updated_at?: string
        }
        Update: {
          audio_duration?: number | null
          content?: string
          context_type?: string | null
          created_at?: string
          detected_language?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          original_language?: string
          thumbnail_url?: string | null
          to_user_id?: string
          transcription_text?: string | null
          translated_content?: Json | null
          translation_confidence?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          body_html: string | null
          body_text: string | null
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          recipient_email: string
          recipient_name: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          template_variables: Json | null
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sync_logs: {
        Row: {
          created_at: string
          email_settings_id: string
          emails_added: number | null
          emails_processed: number | null
          emails_updated: number | null
          error_message: string | null
          id: string
          sync_completed_at: string | null
          sync_duration_ms: number | null
          sync_started_at: string
          sync_status: string
        }
        Insert: {
          created_at?: string
          email_settings_id: string
          emails_added?: number | null
          emails_processed?: number | null
          emails_updated?: number | null
          error_message?: string | null
          id?: string
          sync_completed_at?: string | null
          sync_duration_ms?: number | null
          sync_started_at?: string
          sync_status?: string
        }
        Update: {
          created_at?: string
          email_settings_id?: string
          emails_added?: number | null
          emails_processed?: number | null
          emails_updated?: number | null
          error_message?: string | null
          id?: string
          sync_completed_at?: string | null
          sync_duration_ms?: number | null
          sync_started_at?: string
          sync_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_logs_email_settings_id_fkey"
            columns: ["email_settings_id"]
            isOneToOne: false
            referencedRelation: "user_email_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          last_used_at: string | null
          name: string
          subject: string
          template_type: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          last_used_at?: string | null
          name: string
          subject: string
          template_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          last_used_at?: string | null
          name?: string
          subject?: string
          template_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          attachments: Json | null
          bcc_addresses: string[] | null
          body_html: string | null
          body_text: string | null
          cc_addresses: string[] | null
          created_at: string | null
          email_settings_id: string
          folder: string | null
          from_address: string
          from_name: string | null
          id: string
          in_reply_to: string | null
          is_draft: boolean | null
          is_read: boolean | null
          is_sent: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          message_id: string | null
          provider_message_id: string | null
          raw_headers: Json | null
          received_at: string | null
          reply_to: string | null
          sent_at: string | null
          subject: string
          sync_hash: string | null
          thread_id: string | null
          to_addresses: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          email_settings_id: string
          folder?: string | null
          from_address: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_draft?: boolean | null
          is_read?: boolean | null
          is_sent?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          provider_message_id?: string | null
          raw_headers?: Json | null
          received_at?: string | null
          reply_to?: string | null
          sent_at?: string | null
          subject: string
          sync_hash?: string | null
          thread_id?: string | null
          to_addresses: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          email_settings_id?: string
          folder?: string | null
          from_address?: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_draft?: boolean | null
          is_read?: boolean | null
          is_sent?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          provider_message_id?: string | null
          raw_headers?: Json | null
          received_at?: string | null
          reply_to?: string | null
          sent_at?: string | null
          subject?: string
          sync_hash?: string | null
          thread_id?: string | null
          to_addresses?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_email_settings_id_fkey"
            columns: ["email_settings_id"]
            isOneToOne: false
            referencedRelation: "user_email_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          block_order: number | null
          block_title: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_formatting: Json | null
          order_index: number
          quantity: number | null
          total: number | null
          type: string
          unit_price: number | null
          vat_rate: number
        }
        Insert: {
          block_order?: number | null
          block_title?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          item_formatting?: Json | null
          order_index?: number
          quantity?: number | null
          total?: number | null
          type?: string
          unit_price?: number | null
          vat_rate?: number
        }
        Update: {
          block_order?: number | null
          block_title?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_formatting?: Json | null
          order_index?: number
          quantity?: number | null
          total?: number | null
          type?: string
          unit_price?: number | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          auto_saved_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          is_archived: boolean | null
          message: string | null
          original_quote_total: number | null
          payment_term_sequence: number | null
          project_title: string | null
          source_quote_id: string | null
          status: string
          subtotal: number
          total_amount: number
          total_payment_terms: number | null
          updated_at: string
          vat_amount: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          auto_saved_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          is_archived?: boolean | null
          message?: string | null
          original_quote_total?: number | null
          payment_term_sequence?: number | null
          project_title?: string | null
          source_quote_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          total_payment_terms?: number | null
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          auto_saved_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_archived?: boolean | null
          message?: string | null
          original_quote_total?: number | null
          payment_term_sequence?: number | null
          project_title?: string | null
          source_quote_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          total_payment_terms?: number | null
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      message_bookmarks: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          message_id: string | null
          notes: string | null
          remind_at: string | null
          tags: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          notes?: string | null
          remind_at?: string | null
          tags?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          notes?: string | null
          remind_at?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_bookmarks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_classifications: {
        Row: {
          confidence: number
          entities: Json | null
          id: string
          intent: string
          message_id: string | null
          processed_at: string | null
          sentiment: string
          topics: string[] | null
          urgency: string
        }
        Insert: {
          confidence: number
          entities?: Json | null
          id?: string
          intent: string
          message_id?: string | null
          processed_at?: string | null
          sentiment: string
          topics?: string[] | null
          urgency: string
        }
        Update: {
          confidence?: number
          entities?: Json | null
          id?: string
          intent?: string
          message_id?: string | null
          processed_at?: string | null
          sentiment?: string
          topics?: string[] | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_classifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          language: string
          name: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          language?: string
          name: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          language?: string
          name?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          parent_message_id: string | null
          participants: string[] | null
          priority: string | null
          resolved_at: string | null
          resolved_by: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_message_id?: string | null
          participants?: string[] | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_message_id?: string | null
          participants?: string[] | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_logs: {
        Row: {
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_method: string
          endpoint: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_id: string | null
          opened_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_method: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          browser_notifications: boolean | null
          chat_notifications: boolean
          created_at: string
          email_digest_frequency: string | null
          email_notifications: boolean
          id: string
          instant_notifications: boolean | null
          marketing_emails: boolean | null
          notification_schedule: Json | null
          notification_sound: boolean | null
          project_notifications: boolean
          push_notifications: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quote_notifications: boolean
          updated_at: string
          user_id: string
          weekend_notifications: boolean | null
        }
        Insert: {
          browser_notifications?: boolean | null
          chat_notifications?: boolean
          created_at?: string
          email_digest_frequency?: string | null
          email_notifications?: boolean
          id?: string
          instant_notifications?: boolean | null
          marketing_emails?: boolean | null
          notification_schedule?: Json | null
          notification_sound?: boolean | null
          project_notifications?: boolean
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quote_notifications?: boolean
          updated_at?: string
          user_id: string
          weekend_notifications?: boolean | null
        }
        Update: {
          browser_notifications?: boolean | null
          chat_notifications?: boolean
          created_at?: string
          email_digest_frequency?: string | null
          email_notifications?: boolean
          id?: string
          instant_notifications?: boolean | null
          marketing_emails?: boolean | null
          notification_schedule?: Json | null
          notification_sound?: boolean | null
          project_notifications?: boolean
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quote_notifications?: boolean
          updated_at?: string
          user_id?: string
          weekend_notifications?: boolean | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          id: string
          max_retries: number | null
          message: string
          notification_type: string
          payload: Json | null
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_retries?: number | null
          message: string
          notification_type: string
          payload?: Json | null
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_retries?: number | null
          message?: string
          notification_type?: string
          payload?: Json | null
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          rule_type: string
          target_users: string[] | null
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          rule_type: string
          target_users?: string[] | null
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          rule_type?: string
          target_users?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          subject_template: string | null
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          subject_template?: string | null
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subject_template?: string | null
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      offline_message_queue: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_synced: boolean | null
          message_type: string | null
          synced_at: string | null
          temp_id: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_synced?: boolean | null
          message_type?: string | null
          synced_at?: string | null
          temp_id?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_synced?: boolean | null
          message_type?: string | null
          synced_at?: string | null
          temp_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      planning_items: {
        Row: {
          assigned_user_id: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          project_id: string | null
          start_date: string
          start_time: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_user_id: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          project_id?: string | null
          start_date: string
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_user_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          project_id?: string | null
          start_date?: string
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          analytics_consent: boolean | null
          created_at: string
          data_export_requests: Json | null
          data_processing_consent: Json | null
          deletion_requests: Json | null
          id: string
          marketing_consent: boolean | null
          privacy_preferences: Json | null
          third_party_sharing: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics_consent?: boolean | null
          created_at?: string
          data_export_requests?: Json | null
          data_processing_consent?: Json | null
          deletion_requests?: Json | null
          id?: string
          marketing_consent?: boolean | null
          privacy_preferences?: Json | null
          third_party_sharing?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics_consent?: boolean | null
          created_at?: string
          data_export_requests?: Json | null
          data_processing_consent?: Json | null
          deletion_requests?: Json | null
          id?: string
          marketing_consent?: boolean | null
          privacy_preferences?: Json | null
          third_party_sharing?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          is_online: boolean | null
          language_detection_enabled: boolean | null
          language_preference: string | null
          last_seen: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          is_online?: boolean | null
          language_detection_enabled?: boolean | null
          language_preference?: string | null
          last_seen?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          language_detection_enabled?: boolean | null
          language_preference?: string | null
          last_seen?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_deliveries: {
        Row: {
          client_name: string
          client_signature_data: string | null
          created_at: string | null
          delivered_at: string | null
          delivered_by: string
          delivery_photos: Json | null
          delivery_summary: string
          id: string
          monteur_signature_data: string | null
          project_id: string
          updated_at: string | null
          work_report_generated: boolean | null
        }
        Insert: {
          client_name: string
          client_signature_data?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_by: string
          delivery_photos?: Json | null
          delivery_summary: string
          id?: string
          monteur_signature_data?: string | null
          project_id: string
          updated_at?: string | null
          work_report_generated?: boolean | null
        }
        Update: {
          client_name?: string
          client_signature_data?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivered_by?: string
          delivery_photos?: Json | null
          delivery_summary?: string
          id?: string
          monteur_signature_data?: string | null
          project_id?: string
          updated_at?: string | null
          work_report_generated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          added_by: string
          created_at: string
          id: string
          material_name: string
          project_id: string
          quantity: number | null
          receipt_photo_url: string | null
          supplier: string | null
          total_cost: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          material_name: string
          project_id: string
          quantity?: number | null
          receipt_photo_url?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          material_name?: string
          project_id?: string
          quantity?: number | null
          receipt_photo_url?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_receipts: {
        Row: {
          added_by: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          receipt_date: string | null
          receipt_photo_url: string
          supplier: string | null
          total_amount: number | null
        }
        Insert: {
          added_by: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          receipt_date?: string | null
          receipt_photo_url: string
          supplier?: string | null
          total_amount?: number | null
        }
        Update: {
          added_by?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          receipt_date?: string | null
          receipt_photo_url?: string
          supplier?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      project_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          hours_type: string | null
          id: string
          is_approved: boolean | null
          photo_url: string | null
          project_id: string
          quantity: number | null
          registration_type: string
          start_time: string | null
          total_cost: number | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_type?: string | null
          id?: string
          is_approved?: boolean | null
          photo_url?: string | null
          project_id: string
          quantity?: number | null
          registration_type: string
          start_time?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_type?: string | null
          id?: string
          is_approved?: boolean | null
          photo_url?: string | null
          project_id?: string
          quantity?: number | null
          registration_type?: string
          start_time?: string | null
          total_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_registrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          block_title: string
          created_at: string | null
          id: string
          info_text: string | null
          is_completed: boolean | null
          is_info_block: boolean | null
          order_index: number | null
          project_id: string
          quote_item_type: string | null
          source_quote_block_id: string | null
          source_quote_item_id: string | null
          task_description: string | null
          updated_at: string | null
        }
        Insert: {
          block_title: string
          created_at?: string | null
          id?: string
          info_text?: string | null
          is_completed?: boolean | null
          is_info_block?: boolean | null
          order_index?: number | null
          project_id: string
          quote_item_type?: string | null
          source_quote_block_id?: string | null
          source_quote_item_id?: string | null
          task_description?: string | null
          updated_at?: string | null
        }
        Update: {
          block_title?: string
          created_at?: string | null
          id?: string
          info_text?: string | null
          is_completed?: boolean | null
          is_info_block?: boolean | null
          order_index?: number | null
          project_id?: string
          quote_item_type?: string | null
          source_quote_block_id?: string | null
          source_quote_item_id?: string | null
          task_description?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_work_orders: {
        Row: {
          client_name: string | null
          client_signature_data: string | null
          created_at: string | null
          delivery_id: string | null
          delivery_photos: Json | null
          id: string
          is_delivery_complete: boolean | null
          monteur_signature_data: string | null
          project_id: string
          signed_at: string | null
          summary_text: string | null
          updated_at: string | null
          work_order_number: string
          work_photos: Json | null
        }
        Insert: {
          client_name?: string | null
          client_signature_data?: string | null
          created_at?: string | null
          delivery_id?: string | null
          delivery_photos?: Json | null
          id?: string
          is_delivery_complete?: boolean | null
          monteur_signature_data?: string | null
          project_id: string
          signed_at?: string | null
          summary_text?: string | null
          updated_at?: string | null
          work_order_number: string
          work_photos?: Json | null
        }
        Update: {
          client_name?: string | null
          client_signature_data?: string | null
          created_at?: string | null
          delivery_id?: string | null
          delivery_photos?: Json | null
          id?: string
          is_delivery_complete?: boolean | null
          monteur_signature_data?: string | null
          project_id?: string
          signed_at?: string | null
          summary_text?: string | null
          updated_at?: string | null
          work_order_number?: string
          work_photos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_work_orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "project_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          customer_id: string
          date: string | null
          description: string | null
          id: string
          project_status: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          customer_id: string
          date?: string | null
          description?: string | null
          id?: string
          project_status?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at?: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          customer_id?: string
          date?: string | null
          description?: string | null
          id?: string
          project_status?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          subscription_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          subscription_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          subscription_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_settings: {
        Row: {
          company_address: string | null
          company_city: string | null
          company_country: string | null
          company_kvk_number: string | null
          company_name: string | null
          company_postal_code: string | null
          company_vat_number: string | null
          created_at: string
          id: string
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_kvk_number?: string | null
          company_name?: string | null
          company_postal_code?: string | null
          company_vat_number?: string | null
          created_at?: string
          id?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_kvk_number?: string | null
          company_name?: string | null
          company_postal_code?: string | null
          company_vat_number?: string | null
          created_at?: string
          id?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          admin_signature_data: string | null
          archived_at: string | null
          archived_by: string | null
          attachments: Json | null
          auto_saved_at: string | null
          client_name: string | null
          client_signature_data: string | null
          client_signed_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          is_archived: boolean | null
          items: Json
          message: string | null
          payment_terms: Json | null
          project_title: string | null
          public_token: string | null
          quote_date: string
          quote_number: string
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          valid_until: string
          vat_amount: number
        }
        Insert: {
          admin_signature_data?: string | null
          archived_at?: string | null
          archived_by?: string | null
          attachments?: Json | null
          auto_saved_at?: string | null
          client_name?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          is_archived?: boolean | null
          items?: Json
          message?: string | null
          payment_terms?: Json | null
          project_title?: string | null
          public_token?: string | null
          quote_date: string
          quote_number: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          valid_until: string
          vat_amount?: number
        }
        Update: {
          admin_signature_data?: string | null
          archived_at?: string | null
          archived_by?: string | null
          attachments?: Json | null
          auto_saved_at?: string | null
          client_name?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          is_archived?: boolean | null
          items?: Json
          message?: string | null
          payment_terms?: Json | null
          project_title?: string | null
          public_token?: string | null
          quote_date?: string
          quote_number?: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string
          vat_amount?: number
        }
        Relationships: []
      }
      realtime_event_logs: {
        Row: {
          acknowledged_at: string | null
          channel_id: string | null
          created_at: string
          delivery_status: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          channel_id?: string | null
          created_at?: string
          delivery_status?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          channel_id?: string | null
          created_at?: string
          delivery_status?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          description: string | null
          email_from: string | null
          email_message_id: string | null
          id: string
          receipt_file_name: string
          receipt_file_type: string
          receipt_file_url: string
          rejection_reason: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          email_from?: string | null
          email_message_id?: string | null
          id?: string
          receipt_file_name: string
          receipt_file_type: string
          receipt_file_url: string
          rejection_reason?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          email_from?: string | null
          email_message_id?: string | null
          id?: string
          receipt_file_name?: string
          receipt_file_type?: string
          receipt_file_url?: string
          rejection_reason?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      smart_reply_feedback: {
        Row: {
          created_at: string | null
          custom_text: string | null
          feedback_text: string | null
          id: string
          message_id: string | null
          suggestion_id: string
          suggestion_text: string
          user_id: string
          was_helpful: boolean | null
          was_used: boolean
        }
        Insert: {
          created_at?: string | null
          custom_text?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          suggestion_id: string
          suggestion_text: string
          user_id: string
          was_helpful?: boolean | null
          was_used: boolean
        }
        Update: {
          created_at?: string | null
          custom_text?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          suggestion_id?: string
          suggestion_text?: string
          user_id?: string
          was_helpful?: boolean | null
          was_used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "smart_reply_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_cache: {
        Row: {
          confidence: number | null
          context_type: string | null
          created_at: string | null
          id: string
          last_used_at: string | null
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          usage_count: number | null
        }
        Insert: {
          confidence?: number | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          usage_count?: number | null
        }
        Update: {
          confidence?: number | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          source_language?: string
          source_text?: string
          target_language?: string
          translated_text?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      user_email_settings: {
        Row: {
          auto_add_signature: boolean | null
          created_at: string | null
          display_name: string
          email_address: string
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          is_active: boolean | null
          is_syncing: boolean | null
          last_sync_at: string | null
          oauth_access_token: string | null
          oauth_refresh_token: string | null
          oauth_token_expires_at: string | null
          provider_type: string | null
          signature_html: string | null
          signature_text: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          sync_error_message: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_add_signature?: boolean | null
          created_at?: string | null
          display_name: string
          email_address: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          is_syncing?: boolean | null
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          oauth_token_expires_at?: string | null
          provider_type?: string | null
          signature_html?: string | null
          signature_text?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_add_signature?: boolean | null
          created_at?: string | null
          display_name?: string
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          is_syncing?: boolean | null
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          oauth_token_expires_at?: string | null
          provider_type?: string | null
          signature_html?: string | null
          signature_text?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          event_types: string[] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret_key: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_types?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_types?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_user_password: {
        Args: { p_new_password: string; p_user_id: string }
        Returns: undefined
      }
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_safely: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      demote_other_admins: {
        Args: { p_user_id_to_keep: string }
        Returns: undefined
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number_with_sequence: {
        Args: { base_number?: string; sequence_num?: number }
        Returns: string
      }
      generate_project_tasks_from_quote: {
        Args: { p_project_id: string; p_quote_id: string }
        Returns: undefined
      }
      generate_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_quote_public_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_work_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_user_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
        }[]
      }
      get_available_chat_users: {
        Args: { current_user_id: string }
        Returns: {
          full_name: string
          id: string
          is_online: boolean
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_or_create_direct_channel: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_user_channels: {
        Args: Record<PropertyKey, never>
        Returns: {
          channel_id: string
        }[]
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      start_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      update_role_permissions: {
        Args: {
          p_permissions: Database["public"]["Enums"]["app_permission"][]
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      update_user_online_status: {
        Args: { p_is_online: boolean; p_user_id: string }
        Returns: undefined
      }
      user_can_access_channel: {
        Args: { channel_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "customers_view"
        | "customers_edit"
        | "customers_delete"
        | "projects_view"
        | "projects_edit"
        | "projects_delete"
        | "invoices_view"
        | "invoices_edit"
        | "invoices_delete"
        | "users_view"
        | "users_edit"
        | "users_delete"
        | "reports_view"
        | "settings_edit"
        | "projects_create"
        | "planning_create"
      customer_status: "Actief" | "In behandeling" | "Inactief"
      project_status:
        | "te-plannen"
        | "gepland"
        | "in-uitvoering"
        | "herkeuring"
        | "afgerond"
      user_role:
        | "Administrator"
        | "Verkoper"
        | "Installateur"
        | "Administratie"
        | "Bekijker"
      user_status: "Actief" | "Inactief"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "customers_view",
        "customers_edit",
        "customers_delete",
        "projects_view",
        "projects_edit",
        "projects_delete",
        "invoices_view",
        "invoices_edit",
        "invoices_delete",
        "users_view",
        "users_edit",
        "users_delete",
        "reports_view",
        "settings_edit",
        "projects_create",
        "planning_create",
      ],
      customer_status: ["Actief", "In behandeling", "Inactief"],
      project_status: [
        "te-plannen",
        "gepland",
        "in-uitvoering",
        "herkeuring",
        "afgerond",
      ],
      user_role: [
        "Administrator",
        "Verkoper",
        "Installateur",
        "Administratie",
        "Bekijker",
      ],
      user_status: ["Actief", "Inactief"],
    },
  },
} as const
