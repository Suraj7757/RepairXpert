export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          entity_id: string | null;
          entity_name: string | null;
          entity_type: string;
          id: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type: string;
          id?: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ad_views: {
        Row: {
          ad_id: string;
          created_at: string;
          earned: number;
          id: string;
          user_id: string;
        };
        Insert: {
          ad_id: string;
          created_at?: string;
          earned?: number;
          id?: string;
          user_id: string;
        };
        Update: {
          ad_id?: string;
          created_at?: string;
          earned?: number;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey";
            columns: ["ad_id"];
            isOneToOne: false;
            referencedRelation: "ads";
            referencedColumns: ["id"];
          },
        ];
      };
      ads: {
        Row: {
          active: boolean;
          clicks: number;
          created_at: string;
          created_by: string;
          daily_limit: number;
          description: string | null;
          id: string;
          image_url: string | null;
          impressions: number;
          link_url: string | null;
          reward_amount: number;
          title: string;
        };
        Insert: {
          active?: boolean;
          clicks?: number;
          created_at?: string;
          created_by: string;
          daily_limit?: number;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          impressions?: number;
          link_url?: string | null;
          reward_amount?: number;
          title: string;
        };
        Update: {
          active?: boolean;
          clicks?: number;
          created_at?: string;
          created_by?: string;
          daily_limit?: number;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          impressions?: number;
          link_url?: string | null;
          reward_amount?: number;
          title?: string;
        };
        Relationships: [];
      };
      customer_feedback: {
        Row: {
          created_at: string | null;
          customer_name: string | null;
          id: string;
          job_id: string | null;
          rating: number | null;
          review_text: string | null;
          tracking_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_name?: string | null;
          id?: string;
          job_id?: string | null;
          rating?: number | null;
          review_text?: string | null;
          tracking_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_name?: string | null;
          id?: string;
          job_id?: string | null;
          rating?: number | null;
          review_text?: string | null;
          tracking_id?: string | null;
        };
        Relationships: [];
      };
      customer_payments: {
        Row: {
          amount: number;
          created_at: string | null;
          customer_name: string | null;
          id: string;
          notes: string | null;
          processed_at: string | null;
          status: string | null;
          tracking_id: string;
          user_id: string | null;
          utr_number: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          customer_name?: string | null;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          status?: string | null;
          tracking_id: string;
          user_id?: string | null;
          utr_number: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          customer_name?: string | null;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          status?: string | null;
          tracking_id?: string;
          user_id?: string | null;
          utr_number?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          created_at: string;
          customer_code: string | null;
          deleted: boolean;
          deleted_at: string | null;
          email: string | null;
          id: string;
          mobile: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          customer_code?: string | null;
          deleted?: boolean;
          deleted_at?: string | null;
          email?: string | null;
          id?: string;
          mobile: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          customer_code?: string | null;
          deleted?: boolean;
          deleted_at?: string | null;
          email?: string | null;
          id?: string;
          mobile?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      erp_expenses: {
        Row: {
          amount: number;
          created_at: string;
          date: string;
          description: string;
          id: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          date?: string;
          description: string;
          id?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          date?: string;
          description?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      erp_leads: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          phone: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          phone: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      erp_tasks: {
        Row: {
          created_at: string;
          done: boolean;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          id?: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      features: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_enabled: boolean | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          category: string | null;
          cost_price: number;
          created_at: string;
          deleted: boolean;
          deleted_at: string | null;
          description: string | null;
          gst_percent: number;
          id: string;
          image_url: string | null;
          is_marketplace_listed: boolean | null;
          min_stock: number;
          name: string;
          quantity: number;
          sell_price: number;
          sku: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          cost_price?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          description?: string | null;
          gst_percent?: number;
          id?: string;
          image_url?: string | null;
          is_marketplace_listed?: boolean | null;
          min_stock?: number;
          name: string;
          quantity?: number;
          sell_price?: number;
          sku: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          cost_price?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          description?: string | null;
          gst_percent?: number;
          id?: string;
          image_url?: string | null;
          is_marketplace_listed?: boolean | null;
          min_stock?: number;
          name?: string;
          quantity?: number;
          sell_price?: number;
          sku?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      job_counter: {
        Row: {
          counter: number;
          id: string;
          user_id: string;
        };
        Insert: {
          counter?: number;
          id?: string;
          user_id: string;
        };
        Update: {
          counter?: number;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      message_logs: {
        Row: {
          customer_name: string | null;
          customer_phone: string | null;
          id: string;
          job_id: string | null;
          message_content: string | null;
          message_type: string | null;
          sent_at: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          customer_name?: string | null;
          customer_phone?: string | null;
          id?: string;
          job_id?: string | null;
          message_content?: string | null;
          message_type?: string | null;
          sent_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          customer_name?: string | null;
          customer_phone?: string | null;
          id?: string;
          job_id?: string | null;
          message_content?: string | null;
          message_type?: string | null;
          sent_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          read: boolean | null;
          title: string;
          type: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          read?: boolean | null;
          title: string;
          type?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          read?: boolean | null;
          title?: string;
          type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      otp_codes: {
        Row: {
          code: string;
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          type: string;
          verified: boolean | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          type: string;
          verified?: boolean | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          type?: string;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      payment_links: {
        Row: {
          amount: number;
          created_at: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          expires_at: string | null;
          id: string;
          job_id: string | null;
          link_token: string | null;
          paid_at: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          expires_at?: string | null;
          id?: string;
          job_id?: string | null;
          link_token?: string | null;
          paid_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          expires_at?: string | null;
          id?: string;
          job_id?: string | null;
          link_token?: string | null;
          paid_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_refunds: {
        Row: {
          created_at: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          id: string;
          job_id: string | null;
          original_amount: number | null;
          payment_id: string | null;
          processed_at: string | null;
          refund_amount: number;
          refund_method: string | null;
          refund_notes: string | null;
          refund_reason: string | null;
          status: string | null;
          upi_or_account: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          id?: string;
          job_id?: string | null;
          original_amount?: number | null;
          payment_id?: string | null;
          processed_at?: string | null;
          refund_amount: number;
          refund_method?: string | null;
          refund_notes?: string | null;
          refund_reason?: string | null;
          status?: string | null;
          upi_or_account?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          id?: string;
          job_id?: string | null;
          original_amount?: number | null;
          payment_id?: string | null;
          processed_at?: string | null;
          refund_amount?: number;
          refund_method?: string | null;
          refund_notes?: string | null;
          refund_reason?: string | null;
          status?: string | null;
          upi_or_account?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_submissions: {
        Row: {
          admin_note: string | null;
          amount: number;
          created_at: string;
          id: string;
          plan: string;
          processed_at: string | null;
          screenshot_url: string | null;
          status: string;
          user_id: string;
          utr_number: string;
        };
        Insert: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          id?: string;
          plan?: string;
          processed_at?: string | null;
          screenshot_url?: string | null;
          status?: string;
          user_id: string;
          utr_number: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          id?: string;
          plan?: string;
          processed_at?: string | null;
          screenshot_url?: string | null;
          status?: string;
          user_id?: string;
          utr_number?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          admin_share: number;
          amount: number;
          created_at: string;
          deleted: boolean;
          deleted_at: string | null;
          id: string;
          job_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          part_cost: number | null;
          qr_receiver: string | null;
          repair_job_id: string | null;
          settled: boolean;
          settlement_cycle_id: string | null;
          staff_share: number;
          user_id: string;
        };
        Insert: {
          admin_share?: number;
          amount?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          id?: string;
          job_id: string;
          method?: Database["public"]["Enums"]["payment_method"];
          part_cost?: number | null;
          qr_receiver?: string | null;
          repair_job_id?: string | null;
          settled?: boolean;
          settlement_cycle_id?: string | null;
          staff_share?: number;
          user_id: string;
        };
        Update: {
          admin_share?: number;
          amount?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          id?: string;
          job_id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          part_cost?: number | null;
          qr_receiver?: string | null;
          repair_job_id?: string | null;
          settled?: boolean;
          settlement_cycle_id?: string | null;
          staff_share?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_repair_job_id_fkey";
            columns: ["repair_job_id"];
            isOneToOne: false;
            referencedRelation: "repair_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_type: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_banned: boolean | null;
          mobile: string | null;
          plan_expires_at: string | null;
          plan_type: string | null;
          referral_code: string | null;
          role: string | null;
          tracking_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_banned?: boolean | null;
          mobile?: string | null;
          plan_expires_at?: string | null;
          plan_type?: string | null;
          referral_code?: string | null;
          role?: string | null;
          tracking_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_banned?: boolean | null;
          mobile?: string | null;
          plan_expires_at?: string | null;
          plan_type?: string | null;
          referral_code?: string | null;
          role?: string | null;
          tracking_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          created_by: string;
          expiry_date: string | null;
          id: string;
          usage_limit: number;
          used_count: number;
          validity_days: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          created_by: string;
          expiry_date?: string | null;
          id?: string;
          usage_limit?: number;
          used_count?: number;
          validity_days?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          created_by?: string;
          expiry_date?: string | null;
          id?: string;
          usage_limit?: number;
          used_count?: number;
          validity_days?: number;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          referral_code: string;
          referred_id: string;
          referrer_id: string;
          reward_amount: number;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          referral_code: string;
          referred_id: string;
          referrer_id: string;
          reward_amount?: number;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          referral_code?: string;
          referred_id?: string;
          referrer_id?: string;
          reward_amount?: number;
          status?: string;
        };
        Relationships: [];
      };
      repair_jobs: {
        Row: {
          created_at: string;
          customer_id: string | null;
          customer_mobile: string;
          customer_name: string;
          deleted: boolean;
          deleted_at: string | null;
          delivered_at: string | null;
          device_brand: string;
          device_details: Json | null;
          device_model: string | null;
          estimated_cost: number;
          id: string;
          job_id: string;
          problem_description: string;
          return_reason: string | null;
          rework_count: number | null;
          service_category: string | null;
          status: Database["public"]["Enums"]["job_status"];
          technician_name: string | null;
          tracking_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          customer_mobile: string;
          customer_name: string;
          deleted?: boolean;
          deleted_at?: string | null;
          delivered_at?: string | null;
          device_brand: string;
          device_details?: Json | null;
          device_model?: string | null;
          estimated_cost?: number;
          id?: string;
          job_id: string;
          problem_description: string;
          return_reason?: string | null;
          rework_count?: number | null;
          service_category?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          technician_name?: string | null;
          tracking_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          customer_mobile?: string;
          customer_name?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          delivered_at?: string | null;
          device_brand?: string;
          device_details?: Json | null;
          device_model?: string | null;
          estimated_cost?: number;
          id?: string;
          job_id?: string;
          problem_description?: string;
          return_reason?: string | null;
          rework_count?: number | null;
          service_category?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          technician_name?: string | null;
          tracking_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repair_jobs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      sell_counter: {
        Row: {
          counter: number;
          id: string;
          user_id: string;
        };
        Insert: {
          counter?: number;
          id?: string;
          user_id: string;
        };
        Update: {
          counter?: number;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      sells: {
        Row: {
          created_at: string;
          customer_mobile: string;
          customer_name: string;
          deleted: boolean;
          deleted_at: string | null;
          id: string;
          inventory_item_id: string | null;
          item_name: string;
          item_sku: string;
          payment_method: string;
          quantity: number;
          sell_id: string;
          sell_price: number;
          status: string;
          total: number;
          tracking_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          customer_mobile?: string;
          customer_name?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          id?: string;
          inventory_item_id?: string | null;
          item_name: string;
          item_sku?: string;
          payment_method?: string;
          quantity?: number;
          sell_id: string;
          sell_price?: number;
          status?: string;
          total?: number;
          tracking_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          customer_mobile?: string;
          customer_name?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          id?: string;
          inventory_item_id?: string | null;
          item_name?: string;
          item_sku?: string;
          payment_method?: string;
          quantity?: number;
          sell_id?: string;
          sell_price?: number;
          status?: string;
          total?: number;
          tracking_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sells_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory";
            referencedColumns: ["id"];
          },
        ];
      };
      service_bookings: {
        Row: {
          created_at: string | null;
          customer_user_id: string | null;
          device_brand: string | null;
          device_model: string | null;
          device_type: string;
          id: string;
          preferred_date: string | null;
          preferred_time: string | null;
          problem_description: string;
          repair_job_id: string | null;
          shop_notes: string | null;
          shop_user_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_user_id?: string | null;
          device_brand?: string | null;
          device_model?: string | null;
          device_type: string;
          id?: string;
          preferred_date?: string | null;
          preferred_time?: string | null;
          problem_description: string;
          repair_job_id?: string | null;
          shop_notes?: string | null;
          shop_user_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_user_id?: string | null;
          device_brand?: string | null;
          device_model?: string | null;
          device_type?: string;
          id?: string;
          preferred_date?: string | null;
          preferred_time?: string | null;
          problem_description?: string;
          repair_job_id?: string | null;
          shop_notes?: string | null;
          shop_user_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      settlement_cycles: {
        Row: {
          admin_share: number;
          created_at: string;
          deleted: boolean;
          deleted_at: string | null;
          end_date: string;
          id: string;
          settled_at: string;
          settled_by: string | null;
          staff_share: number;
          start_date: string;
          total_jobs: number;
          total_revenue: number;
          user_id: string;
        };
        Insert: {
          admin_share?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          end_date: string;
          id?: string;
          settled_at?: string;
          settled_by?: string | null;
          staff_share?: number;
          start_date: string;
          total_jobs?: number;
          total_revenue?: number;
          user_id: string;
        };
        Update: {
          admin_share?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          end_date?: string;
          id?: string;
          settled_at?: string;
          settled_by?: string | null;
          staff_share?: number;
          start_date?: string;
          total_jobs?: number;
          total_revenue?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      shop_settings: {
        Row: {
          address: string;
          admin_share_percent: number;
          created_at: string;
          gstin: string;
          id: string;
          phone: string;
          qr_receivers: string[];
          revenue_split_enabled: boolean | null;
          shop_name: string;
          staff_share_percent: number;
          updated_at: string;
          upi_id: string | null;
          user_id: string;
        };
        Insert: {
          address?: string;
          admin_share_percent?: number;
          created_at?: string;
          gstin?: string;
          id?: string;
          phone?: string;
          qr_receivers?: string[];
          revenue_split_enabled?: boolean | null;
          shop_name?: string;
          staff_share_percent?: number;
          updated_at?: string;
          upi_id?: string | null;
          user_id: string;
        };
        Update: {
          address?: string;
          admin_share_percent?: number;
          created_at?: string;
          gstin?: string;
          id?: string;
          phone?: string;
          qr_receivers?: string[];
          revenue_split_enabled?: boolean | null;
          shop_name?: string;
          staff_share_percent?: number;
          updated_at?: string;
          upi_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      staff_job_assignments: {
        Row: {
          assigned_at: string | null;
          completed_at: string | null;
          earnings_credited: number | null;
          id: string;
          repair_job_id: string | null;
          shop_user_id: string | null;
          staff_member_id: string | null;
        };
        Insert: {
          assigned_at?: string | null;
          completed_at?: string | null;
          earnings_credited?: number | null;
          id?: string;
          repair_job_id?: string | null;
          shop_user_id?: string | null;
          staff_member_id?: string | null;
        };
        Update: {
          assigned_at?: string | null;
          completed_at?: string | null;
          earnings_credited?: number | null;
          id?: string;
          repair_job_id?: string | null;
          shop_user_id?: string | null;
          staff_member_id?: string | null;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          commission_percent: number | null;
          created_at: string | null;
          email: string | null;
          fixed_salary: number | null;
          id: string;
          is_active: boolean | null;
          joined_at: string | null;
          name: string;
          phone: string | null;
          role: string | null;
          salary_type: string | null;
          shop_user_id: string;
        };
        Insert: {
          commission_percent?: number | null;
          created_at?: string | null;
          email?: string | null;
          fixed_salary?: number | null;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          name: string;
          phone?: string | null;
          role?: string | null;
          salary_type?: string | null;
          shop_user_id: string;
        };
        Update: {
          commission_percent?: number | null;
          created_at?: string | null;
          email?: string | null;
          fixed_salary?: number | null;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          name?: string;
          phone?: string | null;
          role?: string | null;
          salary_type?: string | null;
          shop_user_id?: string;
        };
        Relationships: [];
      };
      staff_salary_records: {
        Row: {
          created_at: string | null;
          deductions: number | null;
          gross_earnings: number | null;
          id: string;
          net_salary: number | null;
          notes: string | null;
          paid_at: string | null;
          payment_method: string | null;
          period_end: string;
          period_start: string;
          shop_user_id: string | null;
          staff_member_id: string | null;
          total_jobs: number | null;
        };
        Insert: {
          created_at?: string | null;
          deductions?: number | null;
          gross_earnings?: number | null;
          id?: string;
          net_salary?: number | null;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          period_end: string;
          period_start: string;
          shop_user_id?: string | null;
          staff_member_id?: string | null;
          total_jobs?: number | null;
        };
        Update: {
          created_at?: string | null;
          deductions?: number | null;
          gross_earnings?: number | null;
          id?: string;
          net_salary?: number | null;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          period_end?: string;
          period_start?: string;
          shop_user_id?: string | null;
          staff_member_id?: string | null;
          total_jobs?: number | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          coupon_code: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          plan: string;
          status: string;
          trial_ends_at: string | null;
          user_id: string;
        };
        Insert: {
          coupon_code?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          user_id: string;
        };
        Update: {
          coupon_code?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      system_config: {
        Row: {
          id: string;
          updated_at: string | null;
          value: Json | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          value?: Json | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          value?: Json | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          source: string;
          status: string;
          type: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          source?: string;
          status?: string;
          type?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          source?: string;
          status?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          balance: number;
          created_at: string;
          id: string;
          total_earned: number;
          total_withdrawn: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          id?: string;
          total_earned?: number;
          total_withdrawn?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          id?: string;
          total_earned?: number;
          total_withdrawn?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      withdraw_requests: {
        Row: {
          admin_note: string | null;
          amount: number;
          created_at: string;
          id: string;
          processed_at: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          admin_note?: string | null;
          amount: number;
          created_at?: string;
          id?: string;
          processed_at?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          id?: string;
          processed_at?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_user_ban: {
        Args: { ban_status: boolean; target_user_id: string };
        Returns: undefined;
      };
      create_repair_job: {
        Args: {
          p_user_id: string;
          p_customer_name: string;
          p_customer_mobile: string;
          p_device_brand: string;
          p_device_model: string | null;
          p_problem_description: string;
          p_technician_name: string | null;
          p_estimated_cost: number;
          p_service_category: string | null;
          p_device_details: Json | null;
        };
        Returns: string;
      };
      generate_alphanumeric_id: { Args: { len: number }; Returns: string };
      generate_random_string: { Args: { length: number }; Returns: string };
      generate_tracking_id: { Args: { length: number }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      next_job_id: { Args: { _user_id: string }; Returns: string };
      next_sell_id: { Args: { _user_id: string }; Returns: string };
      track_order: { Args: { _tracking_id: string }; Returns: Json };
    };
    Enums: {
      app_role: "admin" | "staff";
      job_status:
        | "Received"
        | "In Progress"
        | "Ready"
        | "Delivered"
        | "Rejected"
        | "Unrepairable"
        | "Returned"
        | "Re-work";
      payment_method: "Cash" | "UPI/QR" | "Due";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      job_status: [
        "Received",
        "In Progress",
        "Ready",
        "Delivered",
        "Rejected",
        "Unrepairable",
        "Returned",
        "Re-work",
      ],
      payment_method: ["Cash", "UPI/QR", "Due"],
    },
  },
} as const;
