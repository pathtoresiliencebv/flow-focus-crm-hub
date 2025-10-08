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
      calendar_event_shares: {
        Row: {
          created_at: string
          event_id: string
          id: string
          permission_level: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          permission_level?: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          permission_level?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          assigned_to_role: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user: string | null
          category: Database["public"]["Enums"]["calendar_event_category"]
          color_code: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          end_datetime: string
          id: string
          is_all_day: boolean
          is_recurring: boolean
          is_team_event: boolean | null
          location: string | null
          parent_event_id: string | null
          privacy_level: Database["public"]["Enums"]["calendar_privacy_level"]
          project_id: string | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern:
            | Database["public"]["Enums"]["calendar_recurrence_pattern"]
            | null
          reminder_minutes_before: number[] | null
          start_datetime: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user?: string | null
          category?: Database["public"]["Enums"]["calendar_event_category"]
          color_code?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_datetime: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          is_team_event?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          privacy_level?: Database["public"]["Enums"]["calendar_privacy_level"]
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["calendar_recurrence_pattern"]
            | null
          reminder_minutes_before?: number[] | null
          start_datetime: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user?: string | null
          category?: Database["public"]["Enums"]["calendar_event_category"]
          color_code?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_datetime?: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          is_team_event?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          privacy_level?: Database["public"]["Enums"]["calendar_privacy_level"]
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["calendar_recurrence_pattern"]
            | null
          reminder_minutes_before?: number[] | null
          start_datetime?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      company_settings: {
        Row: {
          address: string | null
          btw_number: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          default_attachments: Json | null
          general_terms: string | null
          id: string
          kvk_number: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_attachments?: Json | null
          general_terms?: string | null
          id?: string
          kvk_number?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_attachments?: Json | null
          general_terms?: string | null
          id?: string
          kvk_number?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      completion_photos: {
        Row: {
          category: string | null
          completion_id: string
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          id: string
          photo_url: string
          uploaded_at: string | null
        }
        Insert: {
          category?: string | null
          completion_id: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          photo_url: string
          uploaded_at?: string | null
        }
        Update: {
          category?: string | null
          completion_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          photo_url?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completion_photos_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "project_completions"
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
      customer_notifications: {
        Row: {
          bounced_at: string | null
          channel: string
          clicked_at: string | null
          completion_id: string | null
          cost: number | null
          created_at: string | null
          customer_id: string
          delivered_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          message: string | null
          message_id: string | null
          metadata: Json | null
          next_retry_at: string | null
          notification_type: string
          opened_at: string | null
          planning_id: string | null
          project_id: string | null
          provider: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_name: string | null
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          channel: string
          clicked_at?: string | null
          completion_id?: string | null
          cost?: number | null
          created_at?: string | null
          customer_id: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message?: string | null
          message_id?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          notification_type: string
          opened_at?: string | null
          planning_id?: string | null
          project_id?: string | null
          provider?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          channel?: string
          clicked_at?: string | null
          completion_id?: string | null
          cost?: number | null
          created_at?: string | null
          customer_id?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message?: string | null
          message_id?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          notification_type?: string
          opened_at?: string | null
          planning_id?: string | null
          project_id?: string | null
          provider?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "project_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          average_satisfaction: number | null
          billing_email: string | null
          btw_number: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          country: string | null
          created_at: string
          customer_since: string | null
          customer_type: string | null
          email: string | null
          email_addresses: Json | null
          id: string
          invoice_address: Json | null
          kvk_number: string | null
          language: string | null
          last_contact_at: string | null
          lifetime_value: number | null
          name: string
          notes: string | null
          notification_preferences: Json | null
          phone: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["customer_status"] | null
          timezone: string | null
          total_projects_completed: number | null
          updated_at: string
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          average_satisfaction?: number | null
          billing_email?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string
          customer_since?: string | null
          customer_type?: string | null
          email?: string | null
          email_addresses?: Json | null
          id?: string
          invoice_address?: Json | null
          kvk_number?: string | null
          language?: string | null
          last_contact_at?: string | null
          lifetime_value?: number | null
          name: string
          notes?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          timezone?: string | null
          total_projects_completed?: number | null
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          average_satisfaction?: number | null
          billing_email?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string
          customer_since?: string | null
          customer_type?: string | null
          email?: string | null
          email_addresses?: Json | null
          id?: string
          invoice_address?: Json | null
          kvk_number?: string | null
          language?: string | null
          last_contact_at?: string | null
          lifetime_value?: number | null
          name?: string
          notes?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          timezone?: string | null
          total_projects_completed?: number | null
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
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
          content: string | null
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean | null
          media_filename: string | null
          media_mime_type: string | null
          media_size: number | null
          media_type: string | null
          media_url: string | null
          original_language: string
          to_user_id: string
          translated_content: Json | null
          updated_at: string
          voice_duration: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean | null
          media_filename?: string | null
          media_mime_type?: string | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          original_language?: string
          to_user_id: string
          translated_content?: Json | null
          updated_at?: string
          voice_duration?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          media_filename?: string | null
          media_mime_type?: string | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          original_language?: string
          to_user_id?: string
          translated_content?: Json | null
          updated_at?: string
          voice_duration?: number | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          auto_sync: boolean | null
          connection_status: string | null
          connection_test_result: Json | null
          created_at: string | null
          display_name: string | null
          email_address: string
          history_id: string | null
          id: string
          imap_encryption: string | null
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_settings: Json | null
          imap_username: string | null
          is_active: boolean | null
          is_primary: boolean | null
          last_connection_test: string | null
          last_error: string | null
          last_error_at: string | null
          last_sync_at: string | null
          smtp_encryption: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_settings: Json | null
          smtp_username: string | null
          sync_enabled: boolean | null
          sync_interval: number | null
          sync_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          connection_status?: string | null
          connection_test_result?: Json | null
          created_at?: string | null
          display_name?: string | null
          email_address: string
          history_id?: string | null
          id?: string
          imap_encryption?: string | null
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_settings?: Json | null
          imap_username?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connection_test?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_settings?: Json | null
          smtp_username?: string | null
          sync_enabled?: boolean | null
          sync_interval?: number | null
          sync_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          connection_status?: string | null
          connection_test_result?: Json | null
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          history_id?: string | null
          id?: string
          imap_encryption?: string | null
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_settings?: Json | null
          imap_username?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_connection_test?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_settings?: Json | null
          smtp_username?: string | null
          sync_enabled?: boolean | null
          sync_interval?: number | null
          sync_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          attachment_id: string | null
          content_id: string | null
          created_at: string | null
          filename: string
          id: string
          is_inline: boolean | null
          message_id: string
          mime_type: string | null
          size: number | null
          storage_url: string | null
        }
        Insert: {
          attachment_id?: string | null
          content_id?: string | null
          created_at?: string | null
          filename: string
          id?: string
          is_inline?: boolean | null
          message_id: string
          mime_type?: string | null
          size?: number | null
          storage_url?: string | null
        }
        Update: {
          attachment_id?: string | null
          content_id?: string | null
          created_at?: string | null
          filename?: string
          id?: string
          is_inline?: boolean | null
          message_id?: string
          mime_type?: string | null
          size?: number | null
          storage_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_drafts: {
        Row: {
          account_id: string
          bcc_emails: Json | null
          body_html: string | null
          body_text: string | null
          cc_emails: Json | null
          created_at: string | null
          id: string
          in_reply_to_message_id: string | null
          is_forward: boolean | null
          is_reply: boolean | null
          subject: string | null
          to_emails: Json | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          created_at?: string | null
          id?: string
          in_reply_to_message_id?: string | null
          is_forward?: boolean | null
          is_reply?: boolean | null
          subject?: string | null
          to_emails?: Json | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          created_at?: string | null
          id?: string
          in_reply_to_message_id?: string | null
          is_forward?: boolean | null
          is_reply?: boolean | null
          subject?: string | null
          to_emails?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_in_reply_to_message_id_fkey"
            columns: ["in_reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_labels: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          label_type: string | null
          message_count: number | null
          name: string
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          label_type?: string | null
          message_count?: number | null
          name: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          label_type?: string | null
          message_count?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_labels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          attachments: Json | null
          bcc_email: string[] | null
          body_html: string | null
          body_text: string | null
          cc_email: string[] | null
          created_at: string | null
          direction: string
          external_message_id: string | null
          folder: string | null
          from_email: string
          id: string
          in_reply_to: string | null
          is_starred: boolean | null
          read_at: string | null
          received_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          thread_id: string | null
          to_email: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          bcc_email?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_email?: string[] | null
          created_at?: string | null
          direction: string
          external_message_id?: string | null
          folder?: string | null
          from_email: string
          id?: string
          in_reply_to?: string | null
          is_starred?: boolean | null
          read_at?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          thread_id?: string | null
          to_email: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          bcc_email?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_email?: string[] | null
          created_at?: string | null
          direction?: string
          external_message_id?: string | null
          folder?: string | null
          from_email?: string
          id?: string
          in_reply_to?: string | null
          is_starred?: boolean | null
          read_at?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          thread_id?: string | null
          to_email?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_in_reply_to_fkey"
            columns: ["in_reply_to"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
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
      email_threads: {
        Row: {
          account_id: string
          created_at: string | null
          first_message_at: string | null
          folder: string | null
          id: string
          is_archived: boolean | null
          is_important: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          last_message_at: string | null
          message_count: number | null
          participants: Json | null
          snippet: string | null
          subject: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          first_message_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_message_at?: string | null
          message_count?: number | null
          participants?: Json | null
          snippet?: string | null
          subject?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          first_message_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_message_at?: string | null
          message_count?: number | null
          participants?: Json | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      external_calendar_events: {
        Row: {
          attendees: Json | null
          calendar_setting_id: string
          created_at: string
          description: string | null
          end_time: string
          external_event_id: string
          id: string
          location: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          calendar_setting_id: string
          created_at?: string
          description?: string | null
          end_time: string
          external_event_id: string
          id?: string
          location?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          calendar_setting_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          external_event_id?: string
          id?: string
          location?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendar_events_calendar_setting_id_fkey"
            columns: ["calendar_setting_id"]
            isOneToOne: false
            referencedRelation: "google_calendar_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_settings: {
        Row: {
          access_token: string | null
          calendar_id: string
          calendar_name: string
          created_at: string
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          selected_calendars: Json | null
          sync_enabled: boolean
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          access_token?: string | null
          calendar_id: string
          calendar_name: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          selected_calendars?: Json | null
          sync_enabled?: boolean
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          access_token?: string | null
          calendar_id?: string
          calendar_name?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          selected_calendars?: Json | null
          sync_enabled?: boolean
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
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
          attachments: Json | null
          auto_saved_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          due_date: string
          expires_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          is_archived: boolean | null
          message: string | null
          original_quote_total: number | null
          payment_date: string | null
          payment_failure_reason: string | null
          payment_link_url: string | null
          payment_method: string | null
          payment_status: string | null
          payment_term_sequence: number | null
          payment_terms: Json | null
          project_title: string | null
          sent_date: string | null
          source_quote_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          total_amount: number
          total_payment_terms: number | null
          updated_at: string
          vat_amount: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          attachments?: Json | null
          auto_saved_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          due_date: string
          expires_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          is_archived?: boolean | null
          message?: string | null
          original_quote_total?: number | null
          payment_date?: string | null
          payment_failure_reason?: string | null
          payment_link_url?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term_sequence?: number | null
          payment_terms?: Json | null
          project_title?: string | null
          sent_date?: string | null
          source_quote_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          total_amount?: number
          total_payment_terms?: number | null
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          attachments?: Json | null
          auto_saved_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          due_date?: string
          expires_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_archived?: boolean | null
          message?: string | null
          original_quote_total?: number | null
          payment_date?: string | null
          payment_failure_reason?: string | null
          payment_link_url?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term_sequence?: number | null
          payment_terms?: Json | null
          project_title?: string | null
          sent_date?: string | null
          source_quote_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
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
      material_catalog: {
        Row: {
          category: string | null
          created_at: string | null
          datasheet_url: string | null
          default_unit_price: number | null
          description: string | null
          dimensions: string | null
          discontinued_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          material_code: string
          material_name: string
          minimum_stock: number | null
          notes: string | null
          reorder_quantity: number | null
          replacement_material_id: string | null
          specifications: Json | null
          stock_quantity: number | null
          subcategory: string | null
          supplier: string | null
          supplier_product_code: string | null
          unit: string | null
          updated_at: string | null
          warranty_months: number | null
          weight_kg: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          datasheet_url?: string | null
          default_unit_price?: number | null
          description?: string | null
          dimensions?: string | null
          discontinued_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material_code: string
          material_name: string
          minimum_stock?: number | null
          notes?: string | null
          reorder_quantity?: number | null
          replacement_material_id?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string | null
          updated_at?: string | null
          warranty_months?: number | null
          weight_kg?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          datasheet_url?: string | null
          default_unit_price?: number | null
          description?: string | null
          dimensions?: string | null
          discontinued_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material_code?: string
          material_name?: string
          minimum_stock?: number | null
          notes?: string | null
          reorder_quantity?: number | null
          replacement_material_id?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string | null
          updated_at?: string | null
          warranty_months?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_replacement_material_id_fkey"
            columns: ["replacement_material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      material_usage: {
        Row: {
          category: string | null
          completion_id: string | null
          created_at: string | null
          id: string
          installation_location: string | null
          installer_id: string
          material_code: string | null
          material_description: string | null
          material_name: string
          notes: string | null
          photo_url: string | null
          project_id: string
          quantity: number
          scanned_from_qr: boolean | null
          serial_numbers: string[] | null
          supplier: string | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          used_at: string | null
          warranty_months: number | null
        }
        Insert: {
          category?: string | null
          completion_id?: string | null
          created_at?: string | null
          id?: string
          installation_location?: string | null
          installer_id: string
          material_code?: string | null
          material_description?: string | null
          material_name: string
          notes?: string | null
          photo_url?: string | null
          project_id: string
          quantity: number
          scanned_from_qr?: boolean | null
          serial_numbers?: string[] | null
          supplier?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          used_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          category?: string | null
          completion_id?: string | null
          created_at?: string | null
          id?: string
          installation_location?: string | null
          installer_id?: string
          material_code?: string | null
          material_description?: string | null
          material_name?: string
          notes?: string | null
          photo_url?: string | null
          project_id?: string
          quantity?: number
          scanned_from_qr?: boolean | null
          serial_numbers?: string[] | null
          supplier?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          used_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_usage_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "project_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          cancellation_reason: string | null
          cancelled_at: string | null
          color_code: string | null
          confirmed_at: string | null
          confirmed_by_customer: boolean | null
          created_at: string
          customer_id: string | null
          description: string | null
          end_time: string
          expected_duration_minutes: number | null
          google_calendar_event_id: string | null
          id: string
          last_synced_at: string | null
          location: string | null
          notify_customer: boolean | null
          notify_sms: boolean | null
          planning_type: string | null
          project_id: string | null
          rescheduled_from: string | null
          special_instructions: string | null
          start_date: string
          start_time: string
          status: string | null
          team_size: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_user_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          color_code?: string | null
          confirmed_at?: string | null
          confirmed_by_customer?: boolean | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_time: string
          expected_duration_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notify_customer?: boolean | null
          notify_sms?: boolean | null
          planning_type?: string | null
          project_id?: string | null
          rescheduled_from?: string | null
          special_instructions?: string | null
          start_date: string
          start_time: string
          status?: string | null
          team_size?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_user_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          color_code?: string | null
          confirmed_at?: string | null
          confirmed_by_customer?: boolean | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_time?: string
          expected_duration_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notify_customer?: boolean | null
          notify_sms?: boolean | null
          planning_type?: string | null
          project_id?: string | null
          rescheduled_from?: string | null
          special_instructions?: string | null
          start_date?: string
          start_time?: string
          status?: string | null
          team_size?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_items_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "planning_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_items_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "planning_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_participants: {
        Row: {
          confirmation_method: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          notification_method: string | null
          notified: boolean | null
          notified_at: string | null
          participant_type: string
          planning_id: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confirmation_method?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          notification_method?: string | null
          notified?: boolean | null
          notified_at?: string | null
          participant_type: string
          planning_id: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confirmation_method?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          notification_method?: string | null
          notified?: boolean | null
          notified_at?: string | null
          participant_type?: string
          planning_id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planning_participants_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_participants_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_participants_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_overview"
            referencedColumns: ["id"]
          },
        ]
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
          chat_language: string | null
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
          chat_language?: string | null
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
          chat_language?: string | null
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
      project_completions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_duration_minutes: number | null
          completion_date: string
          created_at: string | null
          customer_feedback: string | null
          customer_satisfaction: number | null
          customer_signature: string
          email_sent_at: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          installer_id: string
          installer_language: string | null
          installer_signature: string
          internal_notes: string | null
          issues_encountered: string | null
          labor_cost: number | null
          materials_cost: number | null
          materials_used: string | null
          net_work_hours: number | null
          notes: string | null
          original_materials_used: string | null
          original_notes: string | null
          original_recommendations: string | null
          original_work_performed: string | null
          other_costs: number | null
          pdf_url: string | null
          project_id: string
          quality_rating: number | null
          recommendations: string | null
          status: string | null
          total_cost: number | null
          total_work_hours: number | null
          updated_at: string | null
          weather_conditions: string | null
          work_performed: string
          work_summary_json: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_duration_minutes?: number | null
          completion_date: string
          created_at?: string | null
          customer_feedback?: string | null
          customer_satisfaction?: number | null
          customer_signature: string
          email_sent_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          installer_id: string
          installer_language?: string | null
          installer_signature: string
          internal_notes?: string | null
          issues_encountered?: string | null
          labor_cost?: number | null
          materials_cost?: number | null
          materials_used?: string | null
          net_work_hours?: number | null
          notes?: string | null
          original_materials_used?: string | null
          original_notes?: string | null
          original_recommendations?: string | null
          original_work_performed?: string | null
          other_costs?: number | null
          pdf_url?: string | null
          project_id: string
          quality_rating?: number | null
          recommendations?: string | null
          status?: string | null
          total_cost?: number | null
          total_work_hours?: number | null
          updated_at?: string | null
          weather_conditions?: string | null
          work_performed: string
          work_summary_json?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_duration_minutes?: number | null
          completion_date?: string
          created_at?: string | null
          customer_feedback?: string | null
          customer_satisfaction?: number | null
          customer_signature?: string
          email_sent_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          installer_id?: string
          installer_language?: string | null
          installer_signature?: string
          internal_notes?: string | null
          issues_encountered?: string | null
          labor_cost?: number | null
          materials_cost?: number | null
          materials_used?: string | null
          net_work_hours?: number | null
          notes?: string | null
          original_materials_used?: string | null
          original_notes?: string | null
          original_recommendations?: string | null
          original_work_performed?: string | null
          other_costs?: number | null
          pdf_url?: string | null
          project_id?: string
          quality_rating?: number | null
          recommendations?: string | null
          status?: string | null
          total_cost?: number | null
          total_work_hours?: number | null
          updated_at?: string | null
          weather_conditions?: string | null
          work_performed?: string
          work_summary_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_completions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_personnel: {
        Row: {
          assigned_by: string
          created_at: string | null
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          project_id: string
          project_role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          project_id: string
          project_role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          project_id?: string
          project_role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_personnel_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_personnel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          actual_hours: number | null
          actual_labor_cost: number | null
          actual_materials_cost: number | null
          assigned_user_id: string | null
          completion_date: string | null
          completion_id: string | null
          created_at: string
          customer_id: string
          date: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          labor_budget: number | null
          materials_budget: number | null
          metadata: Json | null
          priority: number | null
          profit_margin: number | null
          project_status: string | null
          quote_id: string | null
          started_at: string | null
          started_by: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
          value: number | null
        }
        Insert: {
          actual_hours?: number | null
          actual_labor_cost?: number | null
          actual_materials_cost?: number | null
          assigned_user_id?: string | null
          completion_date?: string | null
          completion_id?: string | null
          created_at?: string
          customer_id: string
          date?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          labor_budget?: number | null
          materials_budget?: number | null
          metadata?: Json | null
          priority?: number | null
          profit_margin?: number | null
          project_status?: string | null
          quote_id?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
          value?: number | null
        }
        Update: {
          actual_hours?: number | null
          actual_labor_cost?: number | null
          actual_materials_cost?: number | null
          assigned_user_id?: string | null
          completion_date?: string | null
          completion_id?: string | null
          created_at?: string
          customer_id?: string
          date?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          labor_budget?: number | null
          materials_budget?: number | null
          metadata?: Json | null
          priority?: number | null
          profit_margin?: number | null
          project_status?: string | null
          quote_id?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "project_completions"
            referencedColumns: ["id"]
          },
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
        Relationships: []
      }
      supported_languages: {
        Row: {
          created_at: string | null
          deepl_code: string
          flag_emoji: string
          id: string
          is_active: boolean | null
          language_code: string
          language_name: string
          native_name: string
          ui_supported: boolean | null
        }
        Insert: {
          created_at?: string | null
          deepl_code: string
          flag_emoji: string
          id?: string
          is_active?: boolean | null
          language_code: string
          language_name: string
          native_name: string
          ui_supported?: boolean | null
        }
        Update: {
          created_at?: string | null
          deepl_code?: string
          flag_emoji?: string
          id?: string
          is_active?: boolean | null
          language_code?: string
          language_name?: string
          native_name?: string
          ui_supported?: boolean | null
        }
        Relationships: []
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
      ui_translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          language_code: string
          translated_text: string
          translation_key: string
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          language_code: string
          translated_text: string
          translation_key: string
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          language_code?: string
          translated_text?: string
          translation_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_availability: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          notes: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_calendar_settings: {
        Row: {
          created_at: string
          default_reminder_minutes: number
          default_view: string
          id: string
          show_weekends: boolean
          timezone: string
          updated_at: string
          user_id: string
          work_days: number[]
          work_hours_end: string
          work_hours_start: string
        }
        Insert: {
          created_at?: string
          default_reminder_minutes?: number
          default_view?: string
          id?: string
          show_weekends?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
        }
        Update: {
          created_at?: string
          default_reminder_minutes?: number
          default_view?: string
          id?: string
          show_weekends?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
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
      user_language_preferences: {
        Row: {
          auto_detect_language: boolean | null
          chat_translation_enabled: boolean | null
          created_at: string | null
          id: string
          preferred_language: string
          ui_language: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_detect_language?: boolean | null
          chat_translation_enabled?: boolean | null
          created_at?: string | null
          id?: string
          preferred_language?: string
          ui_language?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_detect_language?: boolean | null
          chat_translation_enabled?: boolean | null
          created_at?: string | null
          id?: string
          preferred_language?: string
          ui_language?: string
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
      user_time_off: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
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
      work_time_logs: {
        Row: {
          break_duration_minutes: number | null
          break_notes: string | null
          created_at: string | null
          distance_from_project_km: number | null
          end_location_address: string | null
          end_location_lat: number | null
          end_location_lng: number | null
          ended_at: string | null
          id: string
          installer_id: string
          metadata: Json | null
          notes: string | null
          paused_at: string | null
          planning_id: string | null
          project_id: string
          resumed_at: string | null
          start_location_address: string | null
          start_location_lat: number | null
          start_location_lng: number | null
          started_at: string
          status: string | null
          total_duration_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          break_notes?: string | null
          created_at?: string | null
          distance_from_project_km?: number | null
          end_location_address?: string | null
          end_location_lat?: number | null
          end_location_lng?: number | null
          ended_at?: string | null
          id?: string
          installer_id: string
          metadata?: Json | null
          notes?: string | null
          paused_at?: string | null
          planning_id?: string | null
          project_id: string
          resumed_at?: string | null
          start_location_address?: string | null
          start_location_lat?: number | null
          start_location_lng?: number | null
          started_at: string
          status?: string | null
          total_duration_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          break_notes?: string | null
          created_at?: string | null
          distance_from_project_km?: number | null
          end_location_address?: string | null
          end_location_lat?: number | null
          end_location_lng?: number | null
          ended_at?: string | null
          id?: string
          installer_id?: string
          metadata?: Json | null
          notes?: string | null
          paused_at?: string | null
          planning_id?: string | null
          project_id?: string
          resumed_at?: string | null
          start_location_address?: string | null
          start_location_lat?: number | null
          start_location_lng?: number | null
          started_at?: string
          status?: string | null
          total_duration_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_time_logs_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_time_logs_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "planning_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      planning_overview: {
        Row: {
          assigned_user_id: string | null
          assigned_user_name: string | null
          color_code: string | null
          confirmed_by_customer: boolean | null
          created_at: string | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          end_time: string | null
          expected_duration_minutes: number | null
          id: string | null
          is_overdue: boolean | null
          is_today: boolean | null
          is_upcoming: boolean | null
          location: string | null
          participant_count: number | null
          planning_type: string | null
          project_id: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          project_title: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          team_size: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planning_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      work_time_summary: {
        Row: {
          break_duration_minutes: number | null
          distance_from_project_km: number | null
          end_location_lat: number | null
          end_location_lng: number | null
          ended_at: string | null
          id: string | null
          installer_id: string | null
          installer_name: string | null
          is_active: boolean | null
          net_duration_minutes: number | null
          net_hours: number | null
          project_id: string | null
          project_title: string | null
          start_location_lat: number | null
          start_location_lng: number | null
          started_at: string | null
          status: string | null
          total_duration_minutes: number | null
          work_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      complete_project: {
        Args: { p_completion_id: string; p_project_id: string }
        Returns: boolean
      }
      delete_user_safely: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      demote_other_admins: {
        Args: { p_user_id_to_keep: string }
        Returns: undefined
      }
      fix_duplicate_quote_numbers: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_quote_number: string
          old_quote_number: string
          quote_id: string
        }[]
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
      get_accounts_for_sync: {
        Args: Record<PropertyKey, never>
        Returns: {
          email_address: string
          id: string
          imap_encryption: string
          imap_host: string
          imap_password: string
          imap_port: number
          imap_username: string
          last_sync_at: string
          smtp_encryption: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_username: string
          user_id: string
        }[]
      }
      get_active_work_session: {
        Args: { p_user_id?: string }
        Returns: {
          break_duration_minutes: number
          break_notes: string
          created_at: string
          distance_from_project_km: number
          end_location_address: string
          end_location_lat: number
          end_location_lng: number
          ended_at: string
          id: string
          installer_id: string
          metadata: Json
          notes: string
          paused_at: string
          planning_id: string
          project_id: string
          resumed_at: string
          start_location_address: string
          start_location_lat: number
          start_location_lng: number
          started_at: string
          status: string
          total_duration_minutes: number
          updated_at: string
        }[]
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
          email: string
          full_name: string
          id: string
          is_online: boolean
          role: string
        }[]
      }
      get_completion_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_satisfaction: number
          completions_by_installer: Json
          completions_by_month: Json
          total_completions: number
        }[]
      }
      get_or_create_direct_channel: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_project_material_costs: {
        Args: { p_project_id: string }
        Returns: number
      }
      get_project_work_hours: {
        Args: { p_project_id: string }
        Returns: number
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
      has_active_work_session: {
        Args: { p_user_id?: string }
        Returns: boolean
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
      validate_email_account_config: {
        Args: { account_id: string }
        Returns: Json
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
      calendar_event_category:
        | "werk"
        | "persoonlijk"
        | "vakantie"
        | "meeting"
        | "project"
        | "reminder"
        | "deadline"
      calendar_privacy_level: "private" | "shared" | "public"
      calendar_recurrence_pattern:
        | "none"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
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
      calendar_event_category: [
        "werk",
        "persoonlijk",
        "vakantie",
        "meeting",
        "project",
        "reminder",
        "deadline",
      ],
      calendar_privacy_level: ["private", "shared", "public"],
      calendar_recurrence_pattern: [
        "none",
        "daily",
        "weekly",
        "monthly",
        "yearly",
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
