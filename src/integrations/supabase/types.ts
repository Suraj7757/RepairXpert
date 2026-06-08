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
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_views: {
        Row: {
          ad_id: string
          created_at: string
          earned: number
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          earned?: number
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          earned?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_discounts: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          percent: number
          reason: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          percent?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          percent?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          active: boolean
          clicks: number
          created_at: string
          created_by: string
          daily_limit: number
          description: string | null
          id: string
          image_url: string | null
          impressions: number
          link_url: string | null
          reward_amount: number
          title: string
        }
        Insert: {
          active?: boolean
          clicks?: number
          created_at?: string
          created_by: string
          daily_limit?: number
          description?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          reward_amount?: number
          title: string
        }
        Update: {
          active?: boolean
          clicks?: number
          created_at?: string
          created_by?: string
          daily_limit?: number
          description?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          reward_amount?: number
          title?: string
        }
        Relationships: []
      }
      ai_quotes: {
        Row: {
          created_at: string
          device: string
          id: string
          image_url: string | null
          problem: string
          quote: Json
          selected_shop_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device: string
          id?: string
          image_url?: string | null
          problem: string
          quote: Json
          selected_shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device?: string
          id?: string
          image_url?: string | null
          problem?: string
          quote?: Json
          selected_shop_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          auto_whatsapp_status: boolean
          created_at: string
          daily_digest_enabled: boolean
          id: string
          low_stock_alerts: boolean
          payment_reminders: boolean
          pending_threshold_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_whatsapp_status?: boolean
          created_at?: string
          daily_digest_enabled?: boolean
          id?: string
          low_stock_alerts?: boolean
          payment_reminders?: boolean
          pending_threshold_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_whatsapp_status?: boolean
          created_at?: string
          daily_digest_enabled?: boolean
          id?: string
          low_stock_alerts?: boolean
          payment_reminders?: boolean
          pending_threshold_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          branch_id: string | null
          converted_job_id: string | null
          created_at: string
          customer_email: string | null
          customer_mobile: string
          customer_name: string
          device_brand: string
          device_model: string | null
          id: string
          notes: string | null
          preferred_date: string | null
          problem_description: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          converted_job_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_mobile: string
          customer_name: string
          device_brand: string
          device_model?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          problem_description: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          converted_job_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_mobile?: string
          customer_name?: string
          device_brand?: string
          device_model?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          problem_description?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          lat: number | null
          line1: string
          lng: number | null
          pincode: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1: string
          lng?: number | null
          pincode?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1?: string
          lng?: number | null
          pincode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          items: Json
          notes: string | null
          shopkeeper_id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          items?: Json
          notes?: string | null
          shopkeeper_id: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          items?: Json
          notes?: string | null
          shopkeeper_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          deleted: boolean
          deleted_at: string | null
          email: string | null
          id: string
          mobile: string
          name: string
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          email?: string | null
          id?: string
          mobile: string
          name: string
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          deleted: boolean
          deleted_at: string | null
          description: string | null
          expense_date: string
          id: string
          payment_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          branch_id: string | null
          category: string | null
          cost_price: number
          created_at: string
          deleted: boolean
          deleted_at: string | null
          gst_percent: number
          id: string
          min_stock: number
          name: string
          quantity: number
          sell_price: number
          sku: string
          supplier: string | null
          supplier_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          gst_percent?: number
          id?: string
          min_stock?: number
          name: string
          quantity?: number
          sell_price?: number
          sku: string
          supplier?: string | null
          supplier_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          gst_percent?: number
          id?: string
          min_stock?: number
          name?: string
          quantity?: number
          sell_price?: number
          sku?: string
          supplier?: string | null
          supplier_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_counter: {
        Row: {
          counter: number
          id: string
          user_id: string
        }
        Insert: {
          counter?: number
          id?: string
          user_id: string
        }
        Update: {
          counter?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          min_redeem_points: number
          points_per_rupee: number
          rupee_per_point: number
          signup_bonus: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          min_redeem_points?: number
          points_per_rupee?: number
          rupee_per_point?: number
          signup_bonus?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          min_redeem_points?: number
          points_per_rupee?: number
          rupee_per_point?: number
          signup_bonus?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          note: string | null
          points: number
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          images: string[] | null
          inventory_item_id: string | null
          location: string | null
          moq: number
          mrp: number | null
          price: number
          rating_avg: number | null
          rating_count: number | null
          seller_id: string
          seller_type: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          inventory_item_id?: string | null
          location?: string | null
          moq?: number
          mrp?: number | null
          price?: number
          rating_avg?: number | null
          rating_count?: number | null
          seller_id: string
          seller_type?: string
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          inventory_item_id?: string | null
          location?: string | null
          moq?: number
          mrp?: number | null
          price?: number
          rating_avg?: number | null
          rating_count?: number | null
          seller_id?: string
          seller_type?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          buyer_address: string | null
          buyer_id: string
          buyer_mobile: string | null
          buyer_name: string | null
          created_at: string
          fulfillment_method: string
          fulfillment_status: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          pickup_date: string | null
          qr_receiver: string | null
          seller_id: string
          shipping: number
          subtotal: number
          total: number
          tracking_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_address?: string | null
          buyer_id: string
          buyer_mobile?: string | null
          buyer_name?: string | null
          created_at?: string
          fulfillment_method?: string
          fulfillment_status?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_date?: string | null
          qr_receiver?: string | null
          seller_id: string
          shipping?: number
          subtotal?: number
          total?: number
          tracking_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_address?: string | null
          buyer_id?: string
          buyer_mobile?: string | null
          buyer_name?: string | null
          created_at?: string
          fulfillment_method?: string
          fulfillment_status?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_date?: string | null
          qr_receiver?: string | null
          seller_id?: string
          shipping?: number
          subtotal?: number
          total?: number
          tracking_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          type: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          type: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          plan: string
          processed_at: string | null
          screenshot_url: string | null
          status: string
          user_id: string
          utr_number: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          plan?: string
          processed_at?: string | null
          screenshot_url?: string | null
          status?: string
          user_id: string
          utr_number: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          plan?: string
          processed_at?: string | null
          screenshot_url?: string | null
          status?: string
          user_id?: string
          utr_number?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_share: number
          amount: number
          branch_id: string | null
          created_at: string
          deleted: boolean
          deleted_at: string | null
          id: string
          job_id: string
          method: Database["public"]["Enums"]["payment_method"]
          qr_receiver: string | null
          repair_job_id: string | null
          settled: boolean
          settlement_cycle_id: string | null
          staff_share: number
          user_id: string
        }
        Insert: {
          admin_share?: number
          amount?: number
          branch_id?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          id?: string
          job_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          qr_receiver?: string | null
          repair_job_id?: string | null
          settled?: boolean
          settlement_cycle_id?: string | null
          staff_share?: number
          user_id: string
        }
        Update: {
          admin_share?: number
          amount?: number
          branch_id?: string | null
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          id?: string
          job_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          qr_receiver?: string | null
          repair_job_id?: string | null
          settled?: boolean
          settlement_cycle_id?: string | null
          staff_share?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_repair_job_id_fkey"
            columns: ["repair_job_id"]
            isOneToOne: false
            referencedRelation: "repair_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_banned: boolean
          phone: string | null
          plan_expires_at: string | null
          referral_code: string | null
          role: string | null
          shop_id: string | null
          tracking_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          plan_expires_at?: string | null
          referral_code?: string | null
          role?: string | null
          shop_id?: string | null
          tracking_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          plan_expires_at?: string | null
          referral_code?: string | null
          role?: string | null
          shop_id?: string | null
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          expiry_date: string | null
          id: string
          usage_limit: number
          used_count: number
          validity_days: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          expiry_date?: string | null
          id?: string
          usage_limit?: number
          used_count?: number
          validity_days?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          expiry_date?: string | null
          id?: string
          usage_limit?: number
          used_count?: number
          validity_days?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          status?: string
        }
        Relationships: []
      }
      repair_jobs: {
        Row: {
          branch_id: string | null
          created_at: string
          customer_id: string | null
          customer_mobile: string
          customer_name: string
          deleted: boolean
          deleted_at: string | null
          delivered_at: string | null
          device_brand: string
          device_model: string | null
          estimated_cost: number
          id: string
          job_id: string
          problem_description: string
          status: Database["public"]["Enums"]["job_status"]
          technician_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_mobile: string
          customer_name: string
          deleted?: boolean
          deleted_at?: string | null
          delivered_at?: string | null
          device_brand: string
          device_model?: string | null
          estimated_cost?: number
          id?: string
          job_id: string
          problem_description: string
          status?: Database["public"]["Enums"]["job_status"]
          technician_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_mobile?: string
          customer_name?: string
          deleted?: boolean
          deleted_at?: string | null
          delivered_at?: string | null
          device_brand?: string
          device_model?: string | null
          estimated_cost?: number
          id?: string
          job_id?: string
          problem_description?: string
          status?: Database["public"]["Enums"]["job_status"]
          technician_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_counter: {
        Row: {
          counter: number
          id: string
          user_id: string
        }
        Insert: {
          counter?: number
          id?: string
          user_id: string
        }
        Update: {
          counter?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      sells: {
        Row: {
          branch_id: string | null
          created_at: string
          customer_mobile: string
          customer_name: string
          deleted: boolean
          deleted_at: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          item_sku: string
          payment_method: string
          quantity: number
          sell_id: string
          sell_price: number
          status: string
          total: number
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          customer_mobile?: string
          customer_name?: string
          deleted?: boolean
          deleted_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          item_sku?: string
          payment_method?: string
          quantity?: number
          sell_id: string
          sell_price?: number
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          customer_mobile?: string
          customer_name?: string
          deleted?: boolean
          deleted_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          item_sku?: string
          payment_method?: string
          quantity?: number
          sell_id?: string
          sell_price?: number
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sells_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_cycles: {
        Row: {
          admin_share: number
          created_at: string
          deleted: boolean
          deleted_at: string | null
          end_date: string
          id: string
          settled_at: string
          settled_by: string | null
          staff_share: number
          start_date: string
          total_jobs: number
          total_revenue: number
          user_id: string
        }
        Insert: {
          admin_share?: number
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          end_date: string
          id?: string
          settled_at?: string
          settled_by?: string | null
          staff_share?: number
          start_date: string
          total_jobs?: number
          total_revenue?: number
          user_id: string
        }
        Update: {
          admin_share?: number
          created_at?: string
          deleted?: boolean
          deleted_at?: string | null
          end_date?: string
          id?: string
          settled_at?: string
          settled_by?: string | null
          staff_share?: number
          start_date?: string
          total_jobs?: number
          total_revenue?: number
          user_id?: string
        }
        Relationships: []
      }
      shop_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_mobile: string | null
          customer_name: string
          id: string
          job_id: string | null
          rating: number
          status: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_mobile?: string | null
          customer_name: string
          id?: string
          job_id?: string | null
          rating: number
          status?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_mobile?: string | null
          customer_name?: string
          id?: string
          job_id?: string | null
          rating?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          address: string
          admin_share_percent: number
          booking_enabled: boolean
          booking_slug: string | null
          created_at: string
          gstin: string
          id: string
          map_lat: number | null
          map_lng: number | null
          map_url: string | null
          phone: string
          qr_receivers: string[]
          revenue_split_enabled: boolean | null
          shop_name: string
          staff_share_percent: number
          updated_at: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          address?: string
          admin_share_percent?: number
          booking_enabled?: boolean
          booking_slug?: string | null
          created_at?: string
          gstin?: string
          id?: string
          map_lat?: number | null
          map_lng?: number | null
          map_url?: string | null
          phone?: string
          qr_receivers?: string[]
          revenue_split_enabled?: boolean | null
          shop_name?: string
          staff_share_percent?: number
          updated_at?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          address?: string
          admin_share_percent?: number
          booking_enabled?: boolean
          booking_slug?: string | null
          created_at?: string
          gstin?: string
          id?: string
          map_lat?: number | null
          map_lng?: number | null
          map_url?: string | null
          phone?: string
          qr_receivers?: string[]
          revenue_split_enabled?: boolean | null
          shop_name?: string
          staff_share_percent?: number
          updated_at?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shopkeeper_applications: {
        Row: {
          address: string | null
          business_type: string
          city: string
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          owner_name: string
          phone: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_name: string
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_type?: string
          city: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          owner_name: string
          phone: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_type?: string
          city?: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          owner_name?: string
          phone?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          coupon_code: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          status: string
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          id: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          access_token: string
          business_account_id: string | null
          created_at: string
          enabled: boolean
          id: string
          phone_number_id: string
          template_delivered: string | null
          template_in_progress: string | null
          template_ready: string | null
          template_received: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string
          business_account_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          phone_number_id?: string
          template_delivered?: string | null
          template_in_progress?: string | null
          template_ready?: string | null
          template_received?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          business_account_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          phone_number_id?: string
          template_delivered?: string | null
          template_in_progress?: string | null
          template_ready?: string | null
          template_received?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wholesale_catalog: {
        Row: {
          active: boolean
          bulk_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          item_name: string
          moq: number
          sku: string
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          bulk_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_name: string
          moq?: number
          sku?: string
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          bulk_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_name?: string
          moq?: number
          sku?: string
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _tracking_code: { Args: { _text: string }; Returns: string }
      _tracking_suffix: { Args: never; Returns: string }
      admin_adjust_wallet: {
        Args: { _delta: number; _note: string; _user_id: string }
        Returns: undefined
      }
      admin_apply_discount: {
        Args: {
          _expires_at?: string
          _percent: number
          _reason: string
          _user_id: string
        }
        Returns: string
      }
      admin_set_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_user_plan: {
        Args: { _expires_at: string; _plan: string; _user_id: string }
        Returns: undefined
      }
      approve_shopkeeper_application: {
        Args: { _app_id: string; _approve: boolean; _reason?: string }
        Returns: undefined
      }
      convert_booking_to_job: {
        Args: {
          _booking_id: string
          _estimated_cost?: number
          _technician_name?: string
        }
        Returns: string
      }
      create_repair_job: {
        Args: {
          p_customer_mobile: string
          p_customer_name: string
          p_device_brand: string
          p_device_details?: Json
          p_device_model: string
          p_estimated_cost: number
          p_problem_description: string
          p_service_category?: string
          p_technician_name: string
          p_user_id: string
        }
        Returns: string
      }
      get_marketplace_listing: { Args: { _id: string }; Returns: Json }
      get_shop_by_slug: { Args: { _slug: string }; Returns: Json }
      get_shop_rating_summary: { Args: { _user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_not_banned: { Args: never; Returns: boolean }
      is_super_admin: { Args: { _user_id?: string }; Returns: boolean }
      nearby_shops: {
        Args: { _lat: number; _lng: number; _radius_km?: number }
        Returns: {
          address: string
          booking_enabled: boolean
          booking_slug: string
          distance_km: number
          map_lat: number
          map_lng: number
          phone: string
          shop_name: string
          user_id: string
        }[]
      }
      next_job_id: {
        Args: { _brand?: string; _user_id: string }
        Returns: string
      }
      next_sell_id: {
        Args: { _item_name?: string; _user_id: string }
        Returns: string
      }
      place_marketplace_order: {
        Args: {
          _buyer_address: string
          _buyer_mobile: string
          _buyer_name: string
          _items: Json
          _notes?: string
          _payment_method?: string
          _seller_id: string
          _shipping?: number
        }
        Returns: string
      }
      redeem_loyalty_points: {
        Args: { _customer_id: string; _points: number }
        Returns: Json
      }
      track_order: { Args: { _tracking_id: string }; Returns: Json }
      update_marketplace_order_status: {
        Args: { _note?: string; _order_id: string; _status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer" | "shopkeeper" | "wholesaler"
      job_status:
        | "Received"
        | "In Progress"
        | "Ready"
        | "Delivered"
        | "Rejected"
        | "Unrepairable"
      payment_method: "Cash" | "UPI/QR" | "Due"
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
      app_role: ["admin", "staff", "customer", "shopkeeper", "wholesaler"],
      job_status: [
        "Received",
        "In Progress",
        "Ready",
        "Delivered",
        "Rejected",
        "Unrepairable",
      ],
      payment_method: ["Cash", "UPI/QR", "Due"],
    },
  },
} as const
