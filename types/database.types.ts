// Generated from the Supabase schema. Do not edit by hand.
// Regenerate after every migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      booking_car_rentals: {
        Row: {
          company: string
          confirmation_code: string | null
          created_at: string
          dropoff_at: string | null
          dropoff_location: string | null
          dropoff_on: string | null
          id: string
          notes: string | null
          pickup_at: string | null
          pickup_location: string | null
          pickup_on: string | null
          trip_id: string
          vehicle: string | null
        }
        Insert: {
          company: string
          confirmation_code?: string | null
          created_at?: string
          dropoff_at?: string | null
          dropoff_location?: string | null
          dropoff_on?: string | null
          id?: string
          notes?: string | null
          pickup_at?: string | null
          pickup_location?: string | null
          pickup_on?: string | null
          trip_id: string
          vehicle?: string | null
        }
        Update: {
          company?: string
          confirmation_code?: string | null
          created_at?: string
          dropoff_at?: string | null
          dropoff_location?: string | null
          dropoff_on?: string | null
          id?: string
          notes?: string | null
          pickup_at?: string | null
          pickup_location?: string | null
          pickup_on?: string | null
          trip_id?: string
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_car_rentals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_extras: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_flights: {
        Row: {
          airline: string
          arrives_at: string | null
          confirmation_code: string | null
          created_at: string
          departs_at: string | null
          departs_on: string | null
          flight_number: string
          id: string
          notes: string | null
          route: string | null
          seat: string | null
          trip_id: string
        }
        Insert: {
          airline: string
          arrives_at?: string | null
          confirmation_code?: string | null
          created_at?: string
          departs_at?: string | null
          departs_on?: string | null
          flight_number: string
          id?: string
          notes?: string | null
          route?: string | null
          seat?: string | null
          trip_id: string
        }
        Update: {
          airline?: string
          arrives_at?: string | null
          confirmation_code?: string | null
          created_at?: string
          departs_at?: string | null
          departs_on?: string | null
          flight_number?: string
          id?: string
          notes?: string | null
          route?: string | null
          seat?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_flights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_hotels: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          id: string
          name: string
          trip_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          id?: string
          name: string
          trip_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          id?: string
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_hotels_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          cards: Json | null
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          cards?: Json | null
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          cards?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage: {
        Row: {
          day: string
          request_count: number
          user_id: string
        }
        Insert: {
          day: string
          request_count?: number
          user_id: string
        }
        Update: {
          day?: string
          request_count?: number
          user_id?: string
        }
        Relationships: []
      }
      explore_plan_activities: {
        Row: {
          activity: string | null
          day_id: string
          ends_at: string | null
          id: string
          notes: string | null
          place: string | null
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          activity?: string | null
          day_id: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          place?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          activity?: string | null
          day_id?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          place?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_plan_activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "explore_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_plan_days: {
        Row: {
          day_number: number
          id: string
          plan_id: string
          title: string | null
        }
        Insert: {
          day_number: number
          id?: string
          plan_id: string
          title?: string | null
        }
        Update: {
          day_number?: number
          id?: string
          plan_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "explore_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_plans: {
        Row: {
          category: string
          created_at: string
          description: string | null
          destination: string
          id: string
          image_key: string | null
          rough_cost: string
          sort_order: number
          tags: string[]
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          destination: string
          id?: string
          image_key?: string | null
          rough_cost: string
          sort_order?: number
          tags?: string[]
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          destination?: string
          id?: string
          image_key?: string | null
          rough_cost?: string
          sort_order?: number
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      itinerary_activities: {
        Row: {
          activity: string | null
          created_at: string
          day_id: string
          ends_at: string | null
          id: string
          is_done: boolean
          notes: string | null
          place: string | null
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          activity?: string | null
          created_at?: string
          day_id: string
          ends_at?: string | null
          id?: string
          is_done?: boolean
          notes?: string | null
          place?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          activity?: string | null
          created_at?: string
          day_id?: string
          ends_at?: string | null
          id?: string
          is_done?: boolean
          notes?: string | null
          place?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          created_at: string
          date: string | null
          day_number: number
          id: string
          title: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          day_number: number
          id?: string
          title?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          day_number?: number
          id?: string
          title?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_packed: boolean
          label: string
          trip_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_packed?: boolean
          label: string
          trip_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_packed?: boolean
          label?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      place_usage: {
        Row: {
          day: string
          request_count: number
          user_id: string
        }
        Insert: {
          day: string
          request_count?: number
          user_id: string
        }
        Update: {
          day?: string
          request_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          interests: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          city: string
          created_at: string
          id: string
          label: string
          name: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          label?: string
          name: string
          user_id?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          label?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      traffic_daily: {
        Row: {
          day: string
          sign_ups: number
          source: string
          visits: number
        }
        Insert: {
          day: string
          sign_ups?: number
          source: string
          visits?: number
        }
        Update: {
          day?: string
          sign_ups?: number
          source?: string
          visits?: number
        }
        Relationships: []
      }
      trip_join_codes: {
        Row: {
          code: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          code: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_join_codes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          id: string
          role: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          trip_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          trip_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_path: string
          trip_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_path: string
          trip_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_path?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          description: string | null
          destination: string
          end_date: string
          id: string
          image_path: string | null
          source: string
          start_date: string
          status: string
          title: string
          traveler_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destination: string
          end_date: string
          id?: string
          image_path?: string | null
          source: string
          start_date: string
          status?: string
          title: string
          traveler_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destination?: string
          end_date?: string
          id?: string
          image_path?: string | null
          source?: string
          start_date?: string
          status?: string
          title?: string
          traveler_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_chat_request: {
        Args: {
          p_limit: number
        }
        Returns: boolean
      }
      consume_cover_generation: {
        Args: {
          p_limit: number
        }
        Returns: number
      }
      consume_place_lookup: {
        Args: {
          p_limit: number
        }
        Returns: boolean
      }
      cover_generations_used: {
        Args: never
        Returns: number
      }
      create_trip: {
        Args: {
          p_activities?: Json
          p_description?: string
          p_destination: string
          p_end_date: string
          p_image_path?: string
          p_source: string
          p_start_date: string
          p_status?: string
          p_title: string
          p_traveler_count?: number
        }
        Returns: string
      }
      join_trip: {
        Args: {
          p_code: string
        }
        Returns: string
      }
      ping: {
        Args: never
        Returns: string
      }
      record_sign_up: {
        Args: {
          p_source: string
        }
        Returns: undefined
      }
      record_visit: {
        Args: {
          p_source: string
        }
        Returns: undefined
      }
      replace_day_activities: {
        Args: {
          p_activities: Json
          p_day_id: string
        }
        Returns: number
      }
      reschedule_trip: {
        Args: {
          p_confirm_drop?: boolean
          p_end_date: string
          p_start_date: string
          p_trip_id: string
        }
        Returns: undefined
      }
      rotate_trip_code: {
        Args: {
          p_trip_id: string
        }
        Returns: string
      }
      trip_people: {
        Args: {
          p_trip_id: string
        }
        Returns: {
          avatar_path: string
          avatar_url: string
          full_name: string
          id: string
          is_you: boolean
          role: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
