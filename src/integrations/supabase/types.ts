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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          affected_area: string | null
          created_at: string
          details: string | null
          id: string
          message: string
          photos: string[]
          severity: string
          title: string
          type: string
        }
        Insert: {
          affected_area?: string | null
          created_at?: string
          details?: string | null
          id: string
          message: string
          photos?: string[]
          severity?: string
          title: string
          type?: string
        }
        Update: {
          affected_area?: string | null
          created_at?: string
          details?: string | null
          id?: string
          message?: string
          photos?: string[]
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          affected_people: number
          ai_priority_score: number
          assigned_ngo: string | null
          assigned_volunteers: string[]
          category: string
          comments: Json
          coords: Json
          created_at: string
          description: string
          id: string
          images: string[]
          is_ai_verified: boolean
          is_anonymous: boolean
          is_fake: boolean
          location: string | null
          location_risk: number | null
          photos: string[]
          reported_by: string | null
          reporter_id: string | null
          required_resources: string[]
          response_time: string | null
          severity: string | null
          status: string
          title: string
          updated_at: string
          upvotes: number
          urgency: string
        }
        Insert: {
          affected_people?: number
          ai_priority_score?: number
          assigned_ngo?: string | null
          assigned_volunteers?: string[]
          category?: string
          comments?: Json
          coords?: Json
          created_at?: string
          description: string
          id: string
          images?: string[]
          is_ai_verified?: boolean
          is_anonymous?: boolean
          is_fake?: boolean
          location?: string | null
          location_risk?: number | null
          photos?: string[]
          reported_by?: string | null
          reporter_id?: string | null
          required_resources?: string[]
          response_time?: string | null
          severity?: string | null
          status?: string
          title: string
          updated_at?: string
          upvotes?: number
          urgency?: string
        }
        Update: {
          affected_people?: number
          ai_priority_score?: number
          assigned_ngo?: string | null
          assigned_volunteers?: string[]
          category?: string
          comments?: Json
          coords?: Json
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_ai_verified?: boolean
          is_anonymous?: boolean
          is_fake?: boolean
          location?: string | null
          location_risk?: number | null
          photos?: string[]
          reported_by?: string | null
          reporter_id?: string | null
          required_resources?: string[]
          response_time?: string | null
          severity?: string | null
          status?: string
          title?: string
          updated_at?: string
          upvotes?: number
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_ngo_fkey"
            columns: ["assigned_ngo"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      ngos: {
        Row: {
          active_issues: number
          avg_response_time: string | null
          blocked: boolean
          contact_email: string | null
          created_at: string
          description: string | null
          focus_area: string | null
          id: string
          issues_handled: number
          location: string | null
          name: string
          owner_id: string | null
          success_rate: number
          updated_at: string
          volunteer_ids: string[]
        }
        Insert: {
          active_issues?: number
          avg_response_time?: string | null
          blocked?: boolean
          contact_email?: string | null
          created_at?: string
          description?: string | null
          focus_area?: string | null
          id: string
          issues_handled?: number
          location?: string | null
          name: string
          owner_id?: string | null
          success_rate?: number
          updated_at?: string
          volunteer_ids?: string[]
        }
        Update: {
          active_issues?: number
          avg_response_time?: string | null
          blocked?: boolean
          contact_email?: string | null
          created_at?: string
          description?: string | null
          focus_area?: string | null
          id?: string
          issues_handled?: number
          location?: string | null
          name?: string
          owner_id?: string | null
          success_rate?: number
          updated_at?: string
          volunteer_ids?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          assigned_tasks: string[]
          available: boolean
          blocked: boolean
          coords: Json
          created_at: string
          id: string
          location: string | null
          name: string
          phone: string | null
          reliability_score: number
          response_rate: number
          skills: string[]
          tasks_completed: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_tasks?: string[]
          available?: boolean
          blocked?: boolean
          coords?: Json
          created_at?: string
          id: string
          location?: string | null
          name: string
          phone?: string | null
          reliability_score?: number
          response_rate?: number
          skills?: string[]
          tasks_completed?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_tasks?: string[]
          available?: boolean
          blocked?: boolean
          coords?: Json
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          reliability_score?: number
          response_rate?: number
          skills?: string[]
          tasks_completed?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_upvotes: { Args: { row_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "ngo" | "volunteer" | "public"
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
      app_role: ["admin", "ngo", "volunteer", "public"],
    },
  },
} as const
