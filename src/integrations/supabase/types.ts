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
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
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
          name: string
          subject: string
          updated_at?: string | null
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
          name?: string
          subject?: string
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quote_public_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
