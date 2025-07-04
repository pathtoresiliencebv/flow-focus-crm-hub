export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["customer_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          updated_at?: string
          user_id?: string | null
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
          received_at: string | null
          reply_to: string | null
          sent_at: string | null
          subject: string
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
          received_at?: string | null
          reply_to?: string | null
          sent_at?: string | null
          subject: string
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
          received_at?: string | null
          reply_to?: string | null
          sent_at?: string | null
          subject?: string
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
          created_at: string
          customer_email: string | null
          customer_name: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          message: string | null
          project_title: string | null
          source_quote_id: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          message?: string | null
          project_title?: string | null
          source_quote_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          message?: string | null
          project_title?: string | null
          source_quote_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
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
      notification_preferences: {
        Row: {
          browser_notifications: boolean | null
          chat_notifications: boolean
          created_at: string
          email_digest_frequency: string | null
          email_notifications: boolean
          id: string
          marketing_emails: boolean | null
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
          marketing_emails?: boolean | null
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
          marketing_emails?: boolean | null
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
      profiles: {
        Row: {
          full_name: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
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
      quotes: {
        Row: {
          admin_signature_data: string | null
          client_name: string | null
          client_signature_data: string | null
          client_signed_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          items: Json
          message: string | null
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
          client_name?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          items?: Json
          message?: string | null
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
          client_name?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          items?: Json
          message?: string | null
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
      user_email_settings: {
        Row: {
          created_at: string | null
          display_name: string
          email_address: string
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          is_active: boolean | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email_address: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>
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
          id: string
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          email: string
        }[]
      }
      get_available_chat_users: {
        Args: { current_user_id: string }
        Returns: {
          id: string
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          is_online: boolean
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
          p_role: Database["public"]["Enums"]["user_role"]
          p_permissions: Database["public"]["Enums"]["app_permission"][]
        }
        Returns: undefined
      }
      update_user_online_status: {
        Args: { p_user_id: string; p_is_online: boolean }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
