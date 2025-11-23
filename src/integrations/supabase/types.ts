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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buyers: {
        Row: {
          created_at: string
          emoji: string
          household_id: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          household_id: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          household_id?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyers_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_givers: {
        Row: {
          created_at: string
          gift_id: string
          giver_id: string
          id: string
        }
        Insert: {
          created_at?: string
          gift_id: string
          giver_id: string
          id?: string
        }
        Update: {
          created_at?: string
          gift_id?: string
          giver_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_givers_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_givers_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "givers"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_templates: {
        Row: {
          created_at: string
          default_cost: number | null
          default_giver_ids: string[] | null
          display_order: number
          household_id: string
          id: string
          name: string
          tag_color: string | null
          tag_icon: string | null
        }
        Insert: {
          created_at?: string
          default_cost?: number | null
          default_giver_ids?: string[] | null
          display_order?: number
          household_id: string
          id?: string
          name: string
          tag_color?: string | null
          tag_icon?: string | null
        }
        Update: {
          created_at?: string
          default_cost?: number | null
          default_giver_ids?: string[] | null
          display_order?: number
          household_id?: string
          id?: string
          name?: string
          tag_color?: string | null
          tag_icon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_templates_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          assigned_to: string | null
          cost: number | null
          created_at: string
          household_id: string
          id: string
          is_placeholder: boolean
          name: string
          purchased: boolean | null
          recipient_id: string
          template_id: string | null
          tracking: string | null
          updated_at: string
          url: string | null
          wrapped: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          household_id: string
          id?: string
          is_placeholder?: boolean
          name: string
          purchased?: boolean | null
          recipient_id: string
          template_id?: string | null
          tracking?: string | null
          updated_at?: string
          url?: string | null
          wrapped?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          household_id?: string
          id?: string
          is_placeholder?: boolean
          name?: string
          purchased?: boolean | null
          recipient_id?: string
          template_id?: string | null
          tracking?: string | null
          updated_at?: string
          url?: string | null
          wrapped?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "gift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      givers: {
        Row: {
          created_at: string
          display_order: number
          household_id: string
          icon: string | null
          id: string
          is_virtual: boolean
          name: string
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          household_id: string
          icon?: string | null
          id?: string
          is_virtual?: boolean
          name: string
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          household_id?: string
          icon?: string | null
          id?: string
          is_virtual?: boolean
          name?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givers_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          household_id: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          household_id: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          household_id?: string
          id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          household_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          household_id?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          household_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recipient_notes: {
        Row: {
          content: string
          created_at: string
          display_order: number
          household_id: string
          id: string
          link_label: string | null
          link_url: string | null
          recipient_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          household_id: string
          id?: string
          link_label?: string | null
          link_url?: string | null
          recipient_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          household_id?: string
          id?: string
          link_label?: string | null
          link_url?: string | null
          recipient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipient_notes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipient_notes_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string
          household_id: string
          id: string
          manual_complete: boolean | null
          name: string
          notes: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string
          household_id: string
          id?: string
          manual_complete?: boolean | null
          name: string
          notes?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string
          household_id?: string
          id?: string
          manual_complete?: boolean | null
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipients_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_household_and_profile: {
        Args: {
          _currency?: string
          _display_name: string
          _email: string
          _user_id: string
        }
        Returns: string
      }
      generate_invite_code: { Args: never; Returns: string }
      get_household_members: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          id: string
        }[]
      }
      get_user_household_id: { Args: { _user_id: string }; Returns: string }
      join_household_by_code: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
