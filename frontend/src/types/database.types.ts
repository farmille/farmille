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
      article_products: {
        Row: {
          article_id: string
          created_at: string
          id: string
          position: number
          product_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          position?: number
          product_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_user_id: string | null
          body_md: string
          category: string
          created_at: string
          hero_image_url: string | null
          id: string
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body_md: string
          category: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body_md?: string
          category?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      crop_categories_l1: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      crop_categories_l2: {
        Row: {
          crop_categories_l1_id: string
          id: string
          name: string
        }
        Insert: {
          crop_categories_l1_id: string
          id?: string
          name: string
        }
        Update: {
          crop_categories_l1_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_categories_l2_crop_categories_l1_id_fkey"
            columns: ["crop_categories_l1_id"]
            isOneToOne: false
            referencedRelation: "crop_categories_l1"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_by: string | null
          crop_categories_l2_id: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_by?: string | null
          crop_categories_l2_id: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_by?: string | null
          crop_categories_l2_id?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crops_crop_categories_l2_id_fkey"
            columns: ["crop_categories_l2_id"]
            isOneToOne: false
            referencedRelation: "crop_categories_l2"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          cancelled_at: string | null
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          body: string
          capacity: number | null
          created_at: string
          ends_at: string
          host_type: string
          host_user_id: string
          id: string
          online_url: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          body: string
          capacity?: number | null
          created_at?: string
          ends_at: string
          host_type: string
          host_user_id: string
          id?: string
          online_url?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          body?: string
          capacity?: number | null
          created_at?: string
          ends_at?: string
          host_type?: string
          host_user_id?: string
          id?: string
          online_url?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string
          display_name: string | null
          field_size: number | null
          note: string | null
          prefecture: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city: string
          display_name?: string | null
          field_size?: number | null
          note?: string | null
          prefecture: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string
          display_name?: string | null
          field_size?: number | null
          note?: string | null
          prefecture?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          created_at: string
          displayed_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          displayed_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          displayed_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      home_banners: {
        Row: {
          created_at: string
          displayed_at: string | null
          id: string
          image_url: string
          link_url: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          displayed_at?: string | null
          id?: string
          image_url: string
          link_url: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          displayed_at?: string | null
          id?: string
          image_url?: string
          link_url?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      ja_profiles: {
        Row: {
          city: string | null
          organization_name: string
          prefecture: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          organization_name: string
          prefecture?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          organization_name?: string
          prefecture?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ja_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maker_email_campaigns: {
        Row: {
          body: string
          created_at: string
          id: string
          maker_user_id: string
          queued_at: string | null
          recipient_count: number
          segment_filter: Json
          segment_type: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          maker_user_id: string
          queued_at?: string | null
          recipient_count?: number
          segment_filter?: Json
          segment_type: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          maker_user_id?: string
          queued_at?: string | null
          recipient_count?: number
          segment_filter?: Json
          segment_type?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_email_campaigns_maker_user_id_fkey"
            columns: ["maker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maker_profiles: {
        Row: {
          city: string | null
          company_name: string
          note: string | null
          prefecture: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name: string
          note?: string | null
          prefecture?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string
          note?: string | null
          prefecture?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          id: string
          month: number
          period: string
        }
        Insert: {
          id?: string
          month: number
          period: string
        }
        Update: {
          id?: string
          month?: number
          period?: string
        }
        Relationships: []
      }
      product_application_method_relations: {
        Row: {
          application_method_id: string
          product_id: string
        }
        Insert: {
          application_method_id: string
          product_id: string
        }
        Update: {
          application_method_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_application_method_relations_application_method_id_fkey"
            columns: ["application_method_id"]
            isOneToOne: false
            referencedRelation: "product_application_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_application_method_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_application_methods: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      product_application_recipes: {
        Row: {
          application_method: string | null
          application_timing: string | null
          confidence: string | null
          created_at: string
          crop_category: string | null
          crop_name: string | null
          cultivation_type: string | null
          dilution_rate: string | null
          dose_amount: number | null
          dose_basis: string | null
          dose_raw_text: string | null
          dose_unit: string | null
          growth_stage: string | null
          id: string
          max_dose_amount: number | null
          max_dose_raw_text: string | null
          max_dose_unit: string | null
          original_liquid_equivalent: string | null
          precautions_specific: string | null
          product_id: string
          solution_amount: string | null
          sort_order: number
          updated_at: string
          usage_notes: string | null
        }
        Insert: {
          application_method?: string | null
          application_timing?: string | null
          confidence?: string | null
          created_at?: string
          crop_category?: string | null
          crop_name?: string | null
          cultivation_type?: string | null
          dilution_rate?: string | null
          dose_amount?: number | null
          dose_basis?: string | null
          dose_raw_text?: string | null
          dose_unit?: string | null
          growth_stage?: string | null
          id?: string
          max_dose_amount?: number | null
          max_dose_raw_text?: string | null
          max_dose_unit?: string | null
          original_liquid_equivalent?: string | null
          precautions_specific?: string | null
          product_id: string
          solution_amount?: string | null
          sort_order?: number
          updated_at?: string
          usage_notes?: string | null
        }
        Update: {
          application_method?: string | null
          application_timing?: string | null
          confidence?: string | null
          created_at?: string
          crop_category?: string | null
          crop_name?: string | null
          cultivation_type?: string | null
          dilution_rate?: string | null
          dose_amount?: number | null
          dose_basis?: string | null
          dose_raw_text?: string | null
          dose_unit?: string | null
          growth_stage?: string | null
          id?: string
          max_dose_amount?: number | null
          max_dose_raw_text?: string | null
          max_dose_unit?: string | null
          original_liquid_equivalent?: string | null
          precautions_specific?: string | null
          product_id?: string
          solution_amount?: string | null
          sort_order?: number
          updated_at?: string
          usage_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_application_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_application_window_relations: {
        Row: {
          application_window_id: string
          product_id: string
        }
        Insert: {
          application_window_id: string
          product_id: string
        }
        Update: {
          application_window_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_application_window_relations_application_window_id_fkey"
            columns: ["application_window_id"]
            isOneToOne: false
            referencedRelation: "product_application_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_application_window_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_application_windows: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      product_benefit_relations: {
        Row: {
          product_benefit_id: string
          product_id: string
        }
        Insert: {
          product_benefit_id: string
          product_id: string
        }
        Update: {
          product_benefit_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_benefit_relations_product_benefit_id_fkey"
            columns: ["product_benefit_id"]
            isOneToOne: false
            referencedRelation: "product_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_benefit_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefits: {
        Row: {
          category: string
          id: string
          name: string
          sort_order: number
          version: string
        }
        Insert: {
          category: string
          id?: string
          name: string
          sort_order?: number
          version?: string
        }
        Update: {
          category?: string
          id?: string
          name?: string
          sort_order?: number
          version?: string
        }
        Relationships: []
      }
      product_certifications: {
        Row: {
          certification_id: string
          product_id: string
        }
        Insert: {
          certification_id: string
          product_id: string
        }
        Update: {
          certification_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_certifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_composition_type_relations: {
        Row: {
          composition_type_id: string
          product_id: string
        }
        Insert: {
          composition_type_id: string
          product_id: string
        }
        Update: {
          composition_type_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_composition_type_relations_composition_type_id_fkey"
            columns: ["composition_type_id"]
            isOneToOne: false
            referencedRelation: "product_composition_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_composition_type_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_composition_types: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      product_crops: {
        Row: {
          crop_id: string
          product_id: string
        }
        Insert: {
          crop_id: string
          product_id: string
        }
        Update: {
          crop_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_crops_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          confidence: string | null
          id: string
          image_type: string | null
          is_primary: boolean
          order: number
          product_id: string
          rights_note: string | null
          source_page_url: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          confidence?: string | null
          id?: string
          image_type?: string | null
          is_primary?: boolean
          order?: number
          product_id: string
          rights_note?: string | null
          source_page_url?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          confidence?: string | null
          id?: string
          image_type?: string | null
          is_primary?: boolean
          order?: number
          product_id?: string
          rights_note?: string | null
          source_page_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prefectures: {
        Row: {
          prefecture_code: string
          product_id: string
        }
        Insert: {
          prefecture_code: string
          product_id: string
        }
        Update: {
          prefecture_code?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prefectures_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_science_technologies: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      product_science_technology_relations: {
        Row: {
          product_id: string
          science_technology_id: string
        }
        Insert: {
          product_id: string
          science_technology_id: string
        }
        Update: {
          product_id?: string
          science_technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_science_technology_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_science_technology_relations_science_technology_id_fkey"
            columns: ["science_technology_id"]
            isOneToOne: false
            referencedRelation: "product_science_technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          commercial_status: string | null
          confidence: string | null
          created_at: string
          disease_pest_info: string | null
          expected_effects_farmille: string | null
          expected_effects_official: string | null
          fertilizer_registered: boolean | null
          general_purpose: string | null
          id: string
          is_public: boolean
          is_screened: boolean | null
          label_url: string | null
          maker_id: string
          mode_of_action: string | null
          name: string
          notes: string | null
          pesticide_registered: boolean | null
          precautions: string | null
          primary_compound: string | null
          product_name_jp: string | null
          product_type_id: string
          sds_url: string | null
          storage_shelf_life: string | null
          technology_action: string | null
          updated_at: string
          usage_summary: string | null
        }
        Insert: {
          commercial_status?: string | null
          confidence?: string | null
          created_at?: string
          disease_pest_info?: string | null
          expected_effects_farmille?: string | null
          expected_effects_official?: string | null
          fertilizer_registered?: boolean | null
          general_purpose?: string | null
          id?: string
          is_public?: boolean
          is_screened?: boolean | null
          label_url?: string | null
          maker_id: string
          mode_of_action?: string | null
          name: string
          notes?: string | null
          pesticide_registered?: boolean | null
          precautions?: string | null
          primary_compound?: string | null
          product_name_jp?: string | null
          product_type_id: string
          sds_url?: string | null
          storage_shelf_life?: string | null
          technology_action?: string | null
          updated_at?: string
          usage_summary?: string | null
        }
        Update: {
          commercial_status?: string | null
          confidence?: string | null
          created_at?: string
          disease_pest_info?: string | null
          expected_effects_farmille?: string | null
          expected_effects_official?: string | null
          fertilizer_registered?: boolean | null
          general_purpose?: string | null
          id?: string
          is_public?: boolean
          is_screened?: boolean | null
          label_url?: string | null
          maker_id?: string
          mode_of_action?: string | null
          name?: string
          notes?: string | null
          pesticide_registered?: boolean | null
          precautions?: string | null
          primary_compound?: string | null
          product_name_jp?: string | null
          product_type_id?: string
          sds_url?: string | null
          storage_shelf_life?: string | null
          technology_action?: string | null
          updated_at?: string
          usage_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      researcher_profiles: {
        Row: {
          organization_name: string
          specialty: string | null
          user_id: string
        }
        Insert: {
          organization_name: string
          specialty?: string | null
          user_id: string
        }
        Update: {
          organization_name?: string
          specialty?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "researcher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_benefit_relations: {
        Row: {
          product_benefit_id: string
          review_id: string
        }
        Insert: {
          product_benefit_id: string
          review_id: string
        }
        Update: {
          product_benefit_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_benefit_relations_product_benefit_id_fkey"
            columns: ["product_benefit_id"]
            isOneToOne: false
            referencedRelation: "product_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_benefit_relations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_crops: {
        Row: {
          crop_id: string
          review_id: string
        }
        Insert: {
          crop_id: string
          review_id: string
        }
        Update: {
          crop_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_crops_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_period_relations: {
        Row: {
          period_id: string
          review_id: string
        }
        Insert: {
          period_id: string
          review_id: string
        }
        Update: {
          period_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_period_relations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_period_relations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_point_relations: {
        Row: {
          review_id: string
          review_point_id: string
        }
        Insert: {
          review_id: string
          review_point_id: string
        }
        Update: {
          review_id?: string
          review_point_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_point_relations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_point_relations_review_point_id_fkey"
            columns: ["review_point_id"]
            isOneToOne: false
            referencedRelation: "review_points"
            referencedColumns: ["id"]
          },
        ]
      }
      review_points: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_crops: {
        Row: {
          crop_id: string
          user_id: string
        }
        Insert: {
          crop_id: string
          user_id: string
        }
        Update: {
          crop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_crops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          kind: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          role: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
