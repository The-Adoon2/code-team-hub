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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author: string
          content: string
          created_at: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          content: string
          created_at?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          content?: string
          created_at?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      competition_settings: {
        Row: {
          competition_date: string | null
          id: string
          team_member_count: number | null
          updated_at: string | null
        }
        Insert: {
          competition_date?: string | null
          id?: string
          team_member_count?: number | null
          updated_at?: string | null
        }
        Update: {
          competition_date?: string | null
          id?: string
          team_member_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_admin: boolean | null
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scouting_data: {
        Row: {
          auto_notes: string | null
          auto_points_scored: number | null
          climbed: boolean | null
          created_at: string | null
          defense_rating: number | null
          driver_skill_rating: number | null
          general_notes: string | null
          id: string
          match_number: string
          parked: boolean | null
          robot_reliability_rating: number | null
          scouted_by: string
          team_number: string
          teleop_notes: string | null
          teleop_points_scored: number | null
        }
        Insert: {
          auto_notes?: string | null
          auto_points_scored?: number | null
          climbed?: boolean | null
          created_at?: string | null
          defense_rating?: number | null
          driver_skill_rating?: number | null
          general_notes?: string | null
          id?: string
          match_number: string
          parked?: boolean | null
          robot_reliability_rating?: number | null
          scouted_by: string
          team_number: string
          teleop_notes?: string | null
          teleop_points_scored?: number | null
        }
        Update: {
          auto_notes?: string | null
          auto_points_scored?: number | null
          climbed?: boolean | null
          created_at?: string | null
          defense_rating?: number | null
          driver_skill_rating?: number | null
          general_notes?: string | null
          id?: string
          match_number?: string
          parked?: boolean | null
          robot_reliability_rating?: number | null
          scouted_by?: string
          team_number?: string
          teleop_notes?: string | null
          teleop_points_scored?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed: boolean | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed?: boolean | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed?: boolean | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_sessions: {
        Row: {
          admin_notes: string | null
          check_in_time: string
          check_out_time: string | null
          created_at: string
          id: string
          is_flagged: boolean
          total_hours: number | null
          updated_at: string
          user_code: string
        }
        Insert: {
          admin_notes?: string | null
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          id?: string
          is_flagged?: boolean
          total_hours?: number | null
          updated_at?: string
          user_code: string
        }
        Update: {
          admin_notes?: string | null
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          id?: string
          is_flagged?: boolean
          total_hours?: number | null
          updated_at?: string
          user_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_hours_summary: {
        Row: {
          code: string | null
          flagged_sessions: number | null
          last_activity: string | null
          name: string | null
          role: string | null
          total_hours: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      set_current_user_code: {
        Args: { user_code: string }
        Returns: undefined
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
