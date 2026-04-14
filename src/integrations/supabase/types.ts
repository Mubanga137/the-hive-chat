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
      hive_catalogue: {
        Row: {
          allow_mobile_service: boolean | null
          allow_reselling: boolean | null
          auto_dispatch: boolean | null
          category: string | null
          created_at: string
          digital_payload: string | null
          digital_vault: string | null
          fulfillment_type: string | null
          id: number
          image_url: string | null
          is_mobile: boolean | null
          is_wholesale: boolean | null
          is_wholesale_enabled: boolean | null
          item_type: string | null
          logistics_needed: string | null
          old_price: number | null
          price: number | null
          product_name: string | null
          promo_code: string | null
          promo_discount: number | null
          resell_code: string | null
          sme_id: number | null
          stock_count: number | null
          unit: string | null
          wholesale_price: number | null
        }
        Insert: {
          allow_mobile_service?: boolean | null
          allow_reselling?: boolean | null
          auto_dispatch?: boolean | null
          category?: string | null
          created_at?: string
          digital_payload?: string | null
          digital_vault?: string | null
          fulfillment_type?: string | null
          id?: number
          image_url?: string | null
          is_mobile?: boolean | null
          is_wholesale?: boolean | null
          is_wholesale_enabled?: boolean | null
          item_type?: string | null
          logistics_needed?: string | null
          old_price?: number | null
          price?: number | null
          product_name?: string | null
          promo_code?: string | null
          promo_discount?: number | null
          resell_code?: string | null
          sme_id?: number | null
          stock_count?: number | null
          unit?: string | null
          wholesale_price?: number | null
        }
        Update: {
          allow_mobile_service?: boolean | null
          allow_reselling?: boolean | null
          auto_dispatch?: boolean | null
          category?: string | null
          created_at?: string
          digital_payload?: string | null
          digital_vault?: string | null
          fulfillment_type?: string | null
          id?: number
          image_url?: string | null
          is_mobile?: boolean | null
          is_wholesale?: boolean | null
          is_wholesale_enabled?: boolean | null
          item_type?: string | null
          logistics_needed?: string | null
          old_price?: number | null
          price?: number | null
          product_name?: string | null
          promo_code?: string | null
          promo_discount?: number | null
          resell_code?: string | null
          sme_id?: number | null
          stock_count?: number | null
          unit?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hive_catalogue_sme_id_fkey"
            columns: ["sme_id"]
            isOneToOne: false
            referencedRelation: "sme_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hive_ledger: {
        Row: {
          amount: number | null
          created_at: string
          id: number
          order_id: number | null
          product_id: number | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: number
          order_id?: number | null
          product_id?: number | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: number
          order_id?: number | null
          product_id?: number | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hive_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hive_ledger_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "sme_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hive_nodes: {
        Row: {
          balance: number | null
          created_at: string
          id: number
          is_verified: boolean
          lat: number | null
          location_description: string | null
          long: number | null
          "manager_phone numbeer/whatsapp": string | null
          node_name: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: number
          is_verified?: boolean
          lat?: number | null
          location_description?: string | null
          long?: number | null
          "manager_phone numbeer/whatsapp"?: string | null
          node_name?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: number
          is_verified?: boolean
          lat?: number | null
          location_description?: string | null
          long?: number | null
          "manager_phone numbeer/whatsapp"?: string | null
          node_name?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string | null
          created_at: string
          "customer_phone number": string | null
          hive_skim_amount: number | null
          id: number
          is_resold_item: boolean | null
          item_id: number | null
          node_id: number | null
          rider_id: number | null
          runner_id: number | null
          sme_id: number | null
          status: string | null
          system_fee: number | null
          total_price: number | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          "customer_phone number"?: string | null
          hive_skim_amount?: number | null
          id?: number
          is_resold_item?: boolean | null
          item_id?: number | null
          node_id?: number | null
          rider_id?: number | null
          runner_id?: number | null
          sme_id?: number | null
          status?: string | null
          system_fee?: number | null
          total_price?: number | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          "customer_phone number"?: string | null
          hive_skim_amount?: number | null
          id?: number
          is_resold_item?: boolean | null
          item_id?: number | null
          node_id?: number | null
          rider_id?: number | null
          runner_id?: number | null
          sme_id?: number | null
          status?: string | null
          system_fee?: number | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hive_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "hive_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sme_id_fkey"
            columns: ["sme_id"]
            isOneToOne: false
            referencedRelation: "hive_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_type: string | null
          created_at: string
          full_name: string | null
          gig_role: string | null
          id: string
          phone: string | null
          preferences: string[] | null
          pulse_credits: number | null
          role: string
          service_fulfillment: string | null
          user_id: string
          wholesale_category: string | null
          wholesale_category_other: string | null
          zmw_balance: number | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          gig_role?: string | null
          id?: string
          phone?: string | null
          preferences?: string[] | null
          pulse_credits?: number | null
          role?: string
          service_fulfillment?: string | null
          user_id: string
          wholesale_category?: string | null
          wholesale_category_other?: string | null
          zmw_balance?: number | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          gig_role?: string | null
          id?: string
          phone?: string | null
          preferences?: string[] | null
          pulse_credits?: number | null
          role?: string
          service_fulfillment?: string | null
          user_id?: string
          wholesale_category?: string | null
          wholesale_category_other?: string | null
          zmw_balance?: number | null
        }
        Relationships: []
      }
      riders: {
        Row: {
          created_at: string
          current_lat: number | null
          current_long: number | null
          id: number
          is_available: boolean | null
          license_plate: string | null
          rider_name: string | null
          tax_debt: number | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_long?: number | null
          id?: number
          is_available?: boolean | null
          license_plate?: string | null
          rider_name?: string | null
          tax_debt?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_long?: number | null
          id?: number
          is_available?: boolean | null
          license_plate?: string | null
          rider_name?: string | null
          tax_debt?: number | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      runners: {
        Row: {
          created_at: string
          current_lat: number | null
          current_long: number | null
          id: number
          is_active: boolean | null
          runner_name: string | null
          tax_debt: number | null
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_long?: number | null
          id?: number
          is_active?: boolean | null
          runner_name?: string | null
          tax_debt?: number | null
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_long?: number | null
          id?: number
          is_active?: boolean | null
          runner_name?: string | null
          tax_debt?: number | null
        }
        Relationships: []
      }
      sme_stores: {
        Row: {
          banner_url: string | null
          brand_name: string | null
          business_type: string | null
          created_at: string
          description: string | null
          id: number
          message_debt: number | null
          owner_user_id: string | null
          prepaid_credits: number | null
          whatsapp_number: string | null
        }
        Insert: {
          banner_url?: string | null
          brand_name?: string | null
          business_type?: string | null
          created_at?: string
          description?: string | null
          id?: number
          message_debt?: number | null
          owner_user_id?: string | null
          prepaid_credits?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          banner_url?: string | null
          brand_name?: string | null
          business_type?: string | null
          created_at?: string
          description?: string | null
          id?: number
          message_debt?: number | null
          owner_user_id?: string | null
          prepaid_credits?: number | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      vendor_cloned_items: {
        Row: {
          catalogue_item_id: number
          created_at: string
          id: string
          is_active: boolean | null
          markup_price: number
          vendor_id: string
        }
        Insert: {
          catalogue_item_id: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          markup_price: number
          vendor_id: string
        }
        Update: {
          catalogue_item_id?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          markup_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_cloned_items_catalogue_item_id_fkey"
            columns: ["catalogue_item_id"]
            isOneToOne: false
            referencedRelation: "hive_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_complete_schema: { Args: never; Returns: Json }
      is_runner: { Args: { _user_id: string }; Returns: boolean }
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
