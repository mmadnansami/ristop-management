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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          affiliate_code: string | null
          biannual_rate: number
          business_name: string | null
          city: string
          country: string
          created_at: string
          email: string
          experience: string | null
          full_name: string
          id: string
          lifetime_earnings: number
          monthly_rate: number
          paid_commission: number
          pending_commission: number
          phone: string
          quarterly_rate: number
          reviewed_at: string | null
          reviewed_by: string | null
          social_link: string | null
          status: string
          total_clicks: number
          total_sales: number
          total_signups: number
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          affiliate_code?: string | null
          biannual_rate?: number
          business_name?: string | null
          city: string
          country: string
          created_at?: string
          email: string
          experience?: string | null
          full_name: string
          id?: string
          lifetime_earnings?: number
          monthly_rate?: number
          paid_commission?: number
          pending_commission?: number
          phone: string
          quarterly_rate?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: string
          total_clicks?: number
          total_sales?: number
          total_signups?: number
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          affiliate_code?: string | null
          biannual_rate?: number
          business_name?: string | null
          city?: string
          country?: string
          created_at?: string
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          lifetime_earnings?: number
          monthly_rate?: number
          paid_commission?: number
          pending_commission?: number
          phone?: string
          quarterly_rate?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          status?: string
          total_clicks?: number
          total_sales?: number
          total_signups?: number
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          converted_at: string | null
          expires_at: string
          id: string
          ip_hash: string | null
          landing_path: string
          signed_up_user_id: string | null
          user_agent_hash: string | null
          visitor_token_hash: string
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          converted_at?: string | null
          expires_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string
          signed_up_user_id?: string | null
          user_agent_hash?: string | null
          visitor_token_hash: string
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          converted_at?: string | null
          expires_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string
          signed_up_user_id?: string | null
          user_agent_hash?: string | null
          visitor_token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          customer_id: string
          id: string
          paid_at: string | null
          payment_amount: number
          payment_request_id: string
          plan: string
          rate: number
          status: string
          subscription_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          created_at?: string
          customer_id: string
          id?: string
          paid_at?: string | null
          payment_amount: number
          payment_request_id: string
          plan: string
          rate: number
          status?: string
          subscription_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          paid_at?: string | null
          payment_amount?: number
          payment_request_id?: string
          plan?: string
          rate?: number
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: true
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          id: boolean
          minimum_withdrawal: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          minimum_withdrawal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          minimum_withdrawal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_withdrawals: {
        Row: {
          account_details: string
          affiliate_id: string
          amount: number
          id: string
          method: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          account_details: string
          affiliate_id: string
          amount: number
          id?: string
          method: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          account_details?: string
          affiliate_id?: string
          amount?: number
          id?: string
          method?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      career_applications: {
        Row: {
          applicant_name: string
          created_at: string
          cv_url: string | null
          email: string
          id: string
          interview_date: string | null
          phone: string
          position: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          created_at?: string
          cv_url?: string | null
          email: string
          id?: string
          interview_date?: string | null
          phone: string
          position: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          created_at?: string
          cv_url?: string | null
          email?: string
          id?: string
          interview_date?: string | null
          phone?: string
          position?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dues_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["due_kind"]
          note: string | null
          occurred_at: string
          party_id: string
          party_type: Database["public"]["Enums"]["due_party"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["due_kind"]
          note?: string | null
          occurred_at?: string
          party_id: string
          party_type: Database["public"]["Enums"]["due_party"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["due_kind"]
          note?: string | null
          occurred_at?: string
          party_id?: string
          party_type?: Database["public"]["Enums"]["due_party"]
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          delivery_method: string | null
          duration_days: number | null
          expiry_date: string | null
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price: number
          stock: number
          updated_at: string
          user_id: string
          warranty: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          delivery_method?: string | null
          duration_days?: number | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price?: number
          stock?: number
          updated_at?: string
          user_id: string
          warranty?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          delivery_method?: string | null
          duration_days?: number | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          stock?: number
          updated_at?: string
          user_id?: string
          warranty?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          company_tagline: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          language: string
          phone: string | null
          referral_code: string
          referral_status: string
          referred_by: string | null
          reward_months: number
          reward_status: string
          successful_referral_count: number
          updated_at: string
          user_number: number
        }
        Insert: {
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tagline?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
          referral_code: string
          referral_status?: string
          referred_by?: string | null
          reward_months?: number
          reward_status?: string
          successful_referral_count?: number
          updated_at?: string
          user_number?: number
        }
        Update: {
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tagline?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
          referral_code?: string
          referral_status?: string
          referred_by?: string | null
          reward_months?: number
          reward_status?: string
          successful_referral_count?: number
          updated_at?: string
          user_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          purchased_at: string
          quantity: number
          supplier_id: string | null
          total: number
          unit_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          purchased_at?: string
          quantity?: number
          supplier_id?: string | null
          total?: number
          unit_cost?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          purchased_at?: string
          quantity?: number
          supplier_id?: string | null
          total?: number
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          payment_status: string
          referral_code: string
          referred_reward_days: number
          referred_user_id: string
          referrer_id: string
          referrer_reward_days: number
          registered_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          reward_status: string
          status: string
          subscribed_at: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_status?: string
          referral_code: string
          referred_reward_days?: number
          referred_user_id: string
          referrer_id: string
          referrer_reward_days?: number
          registered_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_status?: string
          status?: string
          subscribed_at?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_status?: string
          referral_code?: string
          referred_reward_days?: number
          referred_user_id?: string
          referrer_id?: string
          referrer_reward_days?: number
          registered_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_status?: string
          status?: string
          subscribed_at?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          product_id: string | null
          product_name: string
          profit: number
          quantity: number
          sold_at: string
          total: number
          unit_cost: number
          unit_price: number
          user_id: string
          validity_end: string | null
          validity_start: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          product_name: string
          profit?: number
          quantity?: number
          sold_at?: string
          total?: number
          unit_cost?: number
          unit_price?: number
          user_id: string
          validity_end?: string | null
          validity_start?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          product_name?: string
          profit?: number
          quantity?: number
          sold_at?: string
          total?: number
          unit_cost?: number
          unit_price?: number
          user_id?: string
          validity_end?: string | null
          validity_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          affiliate_click_id: string | null
          affiliate_code: string | null
          amount: number
          coupon_code: string | null
          created_at: string
          currency: string
          email: string
          id: string
          name: string
          notes: string | null
          payment_method: string
          phone: string
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["req_status"]
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          affiliate_click_id?: string | null
          affiliate_code?: string | null
          amount: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          payment_method: string
          phone: string
          plan: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["req_status"]
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          affiliate_click_id?: string | null
          affiliate_code?: string | null
          amount?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          payment_method?: string
          phone?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["req_status"]
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          bonus_days: number
          created_at: string
          expires_at: string | null
          id: string
          is_paid: boolean
          plan: Database["public"]["Enums"]["plan_type"]
          source_request_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["sub_status"]
          user_id: string
        }
        Insert: {
          bonus_days?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_paid?: boolean
          plan: Database["public"]["Enums"]["plan_type"]
          source_request_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["sub_status"]
          user_id: string
        }
        Update: {
          bonus_days?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_paid?: boolean
          plan?: Database["public"]["Enums"]["plan_type"]
          source_request_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["sub_status"]
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_subscription_request: {
        Args: {
          _plan: Database["public"]["Enums"]["plan_type"]
          _request_id: string
        }
        Returns: string
      }
      attach_referral: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      claim_affiliate_click: { Args: { _click_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_partner_code: {
        Args: { _name: string; _number: number; _prefix: string }
        Returns: string
      }
      track_affiliate_click: {
        Args: {
          _code: string
          _ip_hash?: string
          _landing_path: string
          _user_agent_hash?: string
          _visitor_hash: string
        }
        Returns: string
      }
      validate_referral_code: {
        Args: { _code: string }
        Returns: {
          referrer_id: string
          referrer_name: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      due_kind: "charge" | "payment"
      due_party: "customer" | "supplier"
      plan_type: "monthly" | "quarterly" | "biannual" | "lifetime"
      req_status: "pending" | "approved" | "rejected"
      sub_status: "active" | "expired" | "cancelled" | "pending"
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
    Enums: {
      app_role: ["admin", "user"],
      due_kind: ["charge", "payment"],
      due_party: ["customer", "supplier"],
      plan_type: ["monthly", "quarterly", "biannual", "lifetime"],
      req_status: ["pending", "approved", "rejected"],
      sub_status: ["active", "expired", "cancelled", "pending"],
    },
  },
} as const
