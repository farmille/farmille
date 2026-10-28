export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      affiliation_options: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      answers: {
        Row: {
          author_seller_id: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          author_seller_id?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          author_seller_id?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_seller_id_fkey"
            columns: ["author_seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_author_seller_id_fkey"
            columns: ["author_seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "answers_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      article_materials: {
        Row: {
          article_id: string
          created_at: string
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_materials_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          body: string
          created_at: string
          hero_image_url: string | null
          id: string
          published_at: string | null
          seller_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          seller_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          seller_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_import_baselines: {
        Row: {
          field_name: string
          material_id: string
          run_id: string
          source_sha256: string
        }
        Insert: {
          field_name: string
          material_id: string
          run_id: string
          source_sha256: string
        }
        Update: {
          field_name?: string
          material_id?: string
          run_id?: string
          source_sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_import_baselines_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_import_baselines_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "catalog_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_import_runs: {
        Row: {
          applied_at: string
          id: string
          plan_sha256: string
          source_sha256: string
        }
        Insert: {
          applied_at?: string
          id: string
          plan_sha256: string
          source_sha256: string
        }
        Update: {
          applied_at?: string
          id?: string
          plan_sha256?: string
          source_sha256?: string
        }
        Relationships: []
      }
      catalog_source_evidence: {
        Row: {
          evidence_id: string
          field_code: string
          source_product_id: string
          source_text: string
          source_title: string | null
          source_url: string | null
        }
        Insert: {
          evidence_id: string
          field_code: string
          source_product_id: string
          source_text: string
          source_title?: string | null
          source_url?: string | null
        }
        Update: {
          evidence_id?: string
          field_code?: string
          source_product_id?: string
          source_text?: string
          source_title?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_source_evidence_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_source_products"
            referencedColumns: ["source_product_id"]
          },
        ]
      }
      catalog_source_products: {
        Row: {
          imported_at: string
          material_id: string
          publication_decision: string
          source_name: string
          source_product_id: string
        }
        Insert: {
          imported_at?: string
          material_id: string
          publication_decision: string
          source_name: string
          source_product_id: string
        }
        Update: {
          imported_at?: string
          material_id?: string
          publication_decision?: string
          source_name?: string
          source_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_source_products_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_access: {
        Row: {
          company_name: string
          consumed_at: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          session_expires_at: string | null
          session_hash: string | null
          token_expires_at: string
          token_hash: string
        }
        Insert: {
          company_name: string
          consumed_at?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          session_expires_at?: string | null
          session_hash?: string | null
          token_expires_at: string
          token_hash: string
        }
        Update: {
          company_name?: string
          consumed_at?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          session_expires_at?: string | null
          session_hash?: string | null
          token_expires_at?: string
          token_hash?: string
        }
        Relationships: []
      }
      company_application_consents: {
        Row: {
          accepted_at: string
          application_id: string
          position: number
          text_snapshot: string
          version: string
        }
        Insert: {
          accepted_at?: string
          application_id: string
          position: number
          text_snapshot: string
          version: string
        }
        Update: {
          accepted_at?: string
          application_id?: string
          position?: number
          text_snapshot?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_consents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "company_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_evidence: {
        Row: {
          byte_size: number
          created_at: string
          declared_mime: string
          file_name: string
          id: string
          intent_id: string
          item_key: string | null
          purpose: string
          sealed_path: string | null
          sha256: string | null
          staging_path: string
          verified_at: string | null
        }
        Insert: {
          byte_size: number
          created_at?: string
          declared_mime: string
          file_name: string
          id?: string
          intent_id: string
          item_key?: string | null
          purpose: string
          sealed_path?: string | null
          sha256?: string | null
          staging_path: string
          verified_at?: string | null
        }
        Update: {
          byte_size?: number
          created_at?: string
          declared_mime?: string
          file_name?: string
          id?: string
          intent_id?: string
          item_key?: string | null
          purpose?: string
          sealed_path?: string | null
          sha256?: string | null
          staging_path?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_application_evidence_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "company_application_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_evidence_links: {
        Row: {
          item_id: string
          url: string
        }
        Insert: {
          item_id: string
          url: string
        }
        Update: {
          item_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_evidence_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "company_application_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_intents: {
        Row: {
          access_id: string | null
          cleanup_claimed_at: string | null
          content_hash: string | null
          expires_at: string
          id: string
          kind: string
          seller_id: string | null
          submitted_at: string | null
        }
        Insert: {
          access_id?: string | null
          cleanup_claimed_at?: string | null
          content_hash?: string | null
          expires_at?: string
          id?: string
          kind: string
          seller_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          access_id?: string | null
          cleanup_claimed_at?: string | null
          content_hash?: string | null
          expires_at?: string
          id?: string
          kind?: string
          seller_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_application_intents_access_id_fkey"
            columns: ["access_id"]
            isOneToOne: false
            referencedRelation: "company_application_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_application_intents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_application_intents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_items: {
        Row: {
          application_id: string
          id: string
          material_id: string | null
          material_name: string
          material_url: string
          position: number
        }
        Insert: {
          application_id: string
          id: string
          material_id?: string | null
          material_name: string
          material_url: string
          position: number
        }
        Update: {
          application_id?: string
          id?: string
          material_id?: string | null
          material_name?: string
          material_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_application_items_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "company_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_application_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_mail_deliveries: {
        Row: {
          application_id: string
          attempts: number
          claimed_at: string | null
          last_error_code: string | null
          recipient: string
          sent_at: string | null
        }
        Insert: {
          application_id: string
          attempts?: number
          claimed_at?: string | null
          last_error_code?: string | null
          recipient: string
          sent_at?: string | null
        }
        Update: {
          application_id?: string
          attempts?: number
          claimed_at?: string | null
          last_error_code?: string | null
          recipient?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_application_mail_deliveries_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "company_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_rate_limits: {
        Row: {
          attempts: number
          key_hash: string
          started_at: string
        }
        Insert: {
          attempts: number
          key_hash: string
          started_at: string
        }
        Update: {
          attempts?: number
          key_hash?: string
          started_at?: string
        }
        Relationships: []
      }
      company_application_registration_items: {
        Row: {
          item_id: string
          official_url: string
          target: string
        }
        Insert: {
          item_id: string
          official_url: string
          target: string
        }
        Update: {
          item_id?: string
          official_url?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_registration_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "company_application_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_relations: {
        Row: {
          item_id: string
          relation: string
        }
        Insert: {
          item_id: string
          relation: string
        }
        Update: {
          item_id?: string
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_relations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "company_application_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_removal_items: {
        Row: {
          disclose_reason: boolean
          item_id: string
          reason: string
          request_type: string
        }
        Insert: {
          disclose_reason: boolean
          item_id: string
          reason: string
          request_type: string
        }
        Update: {
          disclose_reason?: boolean
          item_id?: string
          reason?: string
          request_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_removal_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "company_application_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_removals: {
        Row: {
          application_id: string
          company_url: string
          kind: string
        }
        Insert: {
          application_id: string
          company_url: string
          kind?: string
        }
        Update: {
          application_id?: string
          company_url?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_removals_application_id_kind_fkey"
            columns: ["application_id", "kind"]
            isOneToOne: false
            referencedRelation: "company_applications"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      company_application_transfer_in: {
        Row: {
          application_id: string
          background: string
          kind: string
        }
        Insert: {
          application_id: string
          background: string
          kind?: string
        }
        Update: {
          application_id?: string
          background?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_transfer_in_application_id_kind_fkey"
            columns: ["application_id", "kind"]
            isOneToOne: false
            referencedRelation: "company_applications"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      company_application_transfer_in_items: {
        Row: {
          item_id: string
          owner_information: string
          owner_name: string
        }
        Insert: {
          item_id: string
          owner_information: string
          owner_name: string
        }
        Update: {
          item_id?: string
          owner_information?: string
          owner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_transfer_in_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "company_application_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_application_transfer_out: {
        Row: {
          account_id: string
          application_id: string
          company_name: string
          contact_name: string
          corporate_number: string
          department: string
          destination_seller_id: string
          email: string
          kind: string
          phone: string
        }
        Insert: {
          account_id: string
          application_id: string
          company_name: string
          contact_name: string
          corporate_number: string
          department: string
          destination_seller_id: string
          email: string
          kind?: string
          phone: string
        }
        Update: {
          account_id?: string
          application_id?: string
          company_name?: string
          contact_name?: string
          corporate_number?: string
          department?: string
          destination_seller_id?: string
          email?: string
          kind?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_transfer_out_application_id_kind_fkey"
            columns: ["application_id", "kind"]
            isOneToOne: false
            referencedRelation: "company_applications"
            referencedColumns: ["id", "kind"]
          },
          {
            foreignKeyName: "company_application_transfer_out_destination_seller_id_fkey"
            columns: ["destination_seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_application_transfer_out_destination_seller_id_fkey"
            columns: ["destination_seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_applications: {
        Row: {
          access_id: string | null
          account_id: string
          application_date: string
          company_name: string
          contact_name: string
          corporate_number: string | null
          department: string
          email: string
          id: string
          kind: string
          phone: string
          receipt_number: number
          seller_id: string | null
          signer_name: string
          submitted_at: string
        }
        Insert: {
          access_id?: string | null
          account_id: string
          application_date: string
          company_name: string
          contact_name: string
          corporate_number?: string | null
          department: string
          email: string
          id: string
          kind: string
          phone: string
          receipt_number?: never
          seller_id?: string | null
          signer_name: string
          submitted_at?: string
        }
        Update: {
          access_id?: string | null
          account_id?: string
          application_date?: string
          company_name?: string
          contact_name?: string
          corporate_number?: string | null
          department?: string
          email?: string
          id?: string
          kind?: string
          phone?: string
          receipt_number?: never
          seller_id?: string | null
          signer_name?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_applications_access_id_fkey"
            columns: ["access_id"]
            isOneToOne: false
            referencedRelation: "company_application_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_applications_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "company_application_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_applications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_applications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      composition_types: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      container_types: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crop_groups: {
        Row: {
          created_at: string
          hierarchy_level: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hierarchy_level?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hierarchy_level?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "crop_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          aliases: string[]
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crops_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "crop_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      effect_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      effects: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "effects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "effect_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      helpful_votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ingredient_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer_profile_versions: {
        Row: {
          base_logo_url: string | null
          base_profile_text: string | null
          base_website_url: string | null
          created_at: string
          id: string
          logo_url: string
          profile_text: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          status: string
          website_url: string
        }
        Insert: {
          base_logo_url?: string | null
          base_profile_text?: string | null
          base_website_url?: string | null
          created_at?: string
          id?: string
          logo_url: string
          profile_text: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          status: string
          website_url: string
        }
        Update: {
          base_logo_url?: string | null
          base_profile_text?: string | null
          base_website_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string
          profile_text?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          status?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_profile_versions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_profile_versions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          created_at: string
          name: string
        }
        Insert: {
          created_at?: string
          name: string
        }
        Update: {
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      material_application_methods: {
        Row: {
          material_id: string
          method: string
          sort_order: number
          source_text: string
        }
        Insert: {
          material_id: string
          method: string
          sort_order?: number
          source_text: string
        }
        Update: {
          material_id?: string
          method?: string
          sort_order?: number
          source_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_application_methods_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_crops: {
        Row: {
          created_at: string
          crop_id: string
          id: string
          request_id: string
          sort_order: number
          source_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id: string
          id?: string
          request_id: string
          sort_order?: number
          source_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string
          id?: string
          request_id?: string
          sort_order?: number
          source_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_crops_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_details: {
        Row: {
          catalog_url: string | null
          composition_type_id: string | null
          created_at: string
          description: string | null
          general_use: string | null
          main_components: string | null
          manufacturer_name: string
          mechanism: string | null
          name: string
          official_url: string | null
          price_range: string | null
          request_id: string
          sales_status: string | null
          updated_at: string
          usage_text: string | null
        }
        Insert: {
          catalog_url?: string | null
          composition_type_id?: string | null
          created_at?: string
          description?: string | null
          general_use?: string | null
          main_components?: string | null
          manufacturer_name: string
          mechanism?: string | null
          name: string
          official_url?: string | null
          price_range?: string | null
          request_id: string
          sales_status?: string | null
          updated_at?: string
          usage_text?: string | null
        }
        Update: {
          catalog_url?: string | null
          composition_type_id?: string | null
          created_at?: string
          description?: string | null
          general_use?: string | null
          main_components?: string | null
          manufacturer_name?: string
          mechanism?: string | null
          name?: string
          official_url?: string | null
          price_range?: string | null
          request_id?: string
          sales_status?: string | null
          updated_at?: string
          usage_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_details_composition_type_id_fkey"
            columns: ["composition_type_id"]
            isOneToOne: false
            referencedRelation: "composition_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_details_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_effects: {
        Row: {
          created_at: string
          effect_id: string
          id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effect_id: string
          id?: string
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effect_id?: string
          id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_effects_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_effects_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_evidences: {
        Row: {
          created_at: string
          evidence_type: string
          external_url: string | null
          file_url: string | null
          id: string
          meta: Json | null
          request_id: string
          sort_order: number
          source_evidence_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_type: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          meta?: Json | null
          request_id: string
          sort_order?: number
          source_evidence_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          meta?: Json | null
          request_id?: string
          sort_order?: number
          source_evidence_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_evidences_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_evidences_source_evidence_id_fkey"
            columns: ["source_evidence_id"]
            isOneToOne: false
            referencedRelation: "material_evidences"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_ingredient_categories: {
        Row: {
          created_at: string
          id: string
          ingredient_category_id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_category_id: string
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_category_id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_ingredient__ingredient_category_id_fkey"
            columns: ["ingredient_category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_ingredient_categories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_ingredients_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_product_types: {
        Row: {
          created_at: string
          id: string
          product_type_id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_type_id: string
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_type_id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_product_types_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_product_types_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_request_search_tags: {
        Row: {
          created_at: string
          id: string
          request_id: string
          search_tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          search_tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          search_tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_request_search_tags_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "material_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_request_search_tags_search_tag_id_fkey"
            columns: ["search_tag_id"]
            isOneToOne: false
            referencedRelation: "search_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      material_change_requests: {
        Row: {
          base_content_revision: number | null
          change_type: string
          created_at: string
          id: string
          material_id: string | null
          reason: string | null
          result_material_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          seller_id: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          base_content_revision?: number | null
          change_type: string
          created_at?: string
          id?: string
          material_id?: string | null
          reason?: string | null
          result_material_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          seller_id: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          base_content_revision?: number | null
          change_type?: string
          created_at?: string
          id?: string
          material_id?: string | null
          reason?: string | null
          result_material_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          seller_id?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_change_requests_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_requests_result_material_id_fkey"
            columns: ["result_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_change_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      material_crop_groups: {
        Row: {
          crop_group_id: string
          material_id: string
          sort_order: number
          source_name: string
        }
        Insert: {
          crop_group_id: string
          material_id: string
          sort_order?: number
          source_name: string
        }
        Update: {
          crop_group_id?: string
          material_id?: string
          sort_order?: number
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_crop_groups_crop_group_id_fkey"
            columns: ["crop_group_id"]
            isOneToOne: false
            referencedRelation: "crop_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_crop_groups_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_crops: {
        Row: {
          created_at: string
          crop_id: string
          id: string
          material_id: string
          sort_order: number
          source_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id: string
          id?: string
          material_id: string
          sort_order?: number
          source_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string
          id?: string
          material_id?: string
          sort_order?: number
          source_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_crops_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_editor_grants: {
        Row: {
          document_reference: string
          granted_at: string
          granted_by: string
          id: string
          material_id: string
          revoked_at: string | null
          revoked_by: string | null
          seller_id: string
        }
        Insert: {
          document_reference: string
          granted_at?: string
          granted_by: string
          id?: string
          material_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          seller_id: string
        }
        Update: {
          document_reference?: string
          granted_at?: string
          granted_by?: string
          id?: string
          material_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_editor_grants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_editor_grants_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_editor_grants_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      material_editor_legacy_links: {
        Row: {
          material_id: string
          seller_id: string
          suspended_at: string
        }
        Insert: {
          material_id: string
          seller_id: string
          suspended_at?: string
        }
        Update: {
          material_id?: string
          seller_id?: string
          suspended_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_editor_legacy_links_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_editor_legacy_links_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_editor_legacy_links_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      material_effects: {
        Row: {
          created_at: string
          effect_id: string
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effect_id: string
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effect_id?: string
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_effects_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_effects_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_evidences: {
        Row: {
          created_at: string
          evidence_type: string
          external_url: string | null
          file_url: string | null
          id: string
          material_id: string
          meta: Json | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_type: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          material_id: string
          meta?: Json | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          material_id?: string
          meta?: Json | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_evidences_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_images: {
        Row: {
          created_at: string
          id: string
          image_type: string | null
          is_current: boolean
          material_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string | null
          is_current?: boolean
          material_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string | null
          is_current?: boolean
          material_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_images_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_ingredient_categories: {
        Row: {
          created_at: string
          id: string
          ingredient_category_id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_category_id: string
          material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_category_id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_ingredient_categories_ingredient_category_id_fkey"
            columns: ["ingredient_category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_ingredient_categories_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_ingredients_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_name_aliases: {
        Row: {
          material_id: string
          name: string
        }
        Insert: {
          material_id: string
          name: string
        }
        Update: {
          material_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_name_aliases_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_audits: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          material_id: string
          note: string
          outcome: string
          version_id: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          material_id: string
          note: string
          outcome: string
          version_id?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          material_id?: string
          note?: string
          outcome?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_page_audits_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_audits_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_audits_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_certifications: {
        Row: {
          id: string
          sort_order: number
          title: string
          version_id: string
        }
        Insert: {
          id?: string
          sort_order: number
          title: string
          version_id: string
        }
        Update: {
          id?: string
          sort_order?: number
          title?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_certifications_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_certifications_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_existing_images: {
        Row: {
          alt: string
          image_id: string
          sort_order: number
          version_id: string
        }
        Insert: {
          alt?: string
          image_id: string
          sort_order: number
          version_id: string
        }
        Update: {
          alt?: string
          image_id?: string
          sort_order?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_existing_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "material_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_existing_images_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_existing_images_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_images: {
        Row: {
          alt: string
          id: string
          sort_order: number
          storage_path: string
          version_id: string
        }
        Insert: {
          alt?: string
          id?: string
          sort_order: number
          storage_path: string
          version_id: string
        }
        Update: {
          alt?: string
          id?: string
          sort_order?: number
          storage_path?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_images_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_images_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_links: {
        Row: {
          group_name: string | null
          id: string
          sort_order: number
          title: string
          trial_crops: string | null
          trial_institution: string | null
          trial_page_count: number | null
          trial_summary: string | null
          trial_year: number | null
          url: string
          version_id: string
        }
        Insert: {
          group_name?: string | null
          id?: string
          sort_order: number
          title: string
          trial_crops?: string | null
          trial_institution?: string | null
          trial_page_count?: number | null
          trial_summary?: string | null
          trial_year?: number | null
          url: string
          version_id: string
        }
        Update: {
          group_name?: string | null
          id?: string
          sort_order?: number
          title?: string
          trial_crops?: string | null
          trial_institution?: string | null
          trial_page_count?: number | null
          trial_summary?: string | null
          trial_year?: number | null
          url?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_links_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_links_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_registrations: {
        Row: {
          company_name: string
          effects: string
          kind: string
          version_id: string
        }
        Insert: {
          company_name: string
          effects?: string
          kind: string
          version_id: string
        }
        Update: {
          company_name?: string
          effects?: string
          kind?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_registrations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_registrations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_related_companies: {
        Row: {
          company_name: string
          sort_order: number
          version_id: string
        }
        Insert: {
          company_name: string
          sort_order: number
          version_id: string
        }
        Update: {
          company_name?: string
          sort_order?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_related_companies_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_related_companies_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_timings: {
        Row: {
          timing: number
          version_id: string
        }
        Insert: {
          timing: number
          version_id: string
        }
        Update: {
          timing?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_timings_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_timings_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_usages: {
        Row: {
          detail: string
          id: string
          method: string
          sort_order: number
          version_id: string
        }
        Insert: {
          detail?: string
          id?: string
          method: string
          sort_order: number
          version_id: string
        }
        Update: {
          detail?: string
          id?: string
          method?: string
          sort_order?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_usages_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_usages_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_page_versions: {
        Row: {
          base_revision: number
          catalog_import_run_id: string | null
          content_contract: number
          created_at: string
          description: string
          grant_id: string | null
          id: string
          main_components: string
          material_id: string
          mechanism: string
          origin: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string | null
          status: string
        }
        Insert: {
          base_revision: number
          catalog_import_run_id?: string | null
          content_contract?: number
          created_at?: string
          description?: string
          grant_id?: string | null
          id?: string
          main_components?: string
          material_id: string
          mechanism?: string
          origin?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string | null
          status: string
        }
        Update: {
          base_revision?: number
          catalog_import_run_id?: string | null
          content_contract?: number
          created_at?: string
          description?: string
          grant_id?: string | null
          id?: string
          main_components?: string
          material_id?: string
          mechanism?: string
          origin?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_page_versions_catalog_import_run_id_fkey"
            columns: ["catalog_import_run_id"]
            isOneToOne: false
            referencedRelation: "catalog_import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_versions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "material_editor_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_versions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_page_versions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      material_product_types: {
        Row: {
          created_at: string
          id: string
          material_id: string
          product_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          product_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          product_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_product_types_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_product_types_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      material_search_tags: {
        Row: {
          created_at: string
          id: string
          material_id: string
          search_tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          search_tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          search_tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_search_tags_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_search_tags_search_tag_id_fkey"
            columns: ["search_tag_id"]
            isOneToOne: false
            referencedRelation: "search_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      material_sources: {
        Row: {
          created_at: string
          id: string
          material_id: string
          note: string | null
          source_type: string | null
          source_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          note?: string | null
          source_type?: string | null
          source_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          note?: string | null
          source_type?: string | null
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_sources_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          archived_at: string | null
          avg_rating: number | null
          catalog_url: string | null
          composition_type_id: string | null
          container_type_id: number | null
          content_revision: number
          control_plot_ratio: number | null
          created_at: string
          description: string | null
          general_use: string | null
          id: string
          main_components: string | null
          manufacturer_name: string
          manufacturer_verification_method: string | null
          manufacturer_verified_at: string | null
          manufacturer_verified_by_seller_id: string | null
          mechanism: string | null
          name: string
          name_reading: string | null
          official_name: string | null
          official_url: string | null
          price_range: string | null
          publication_status: string
          published_page_version_id: string | null
          review_count: number
          sales_status: string | null
          seller_id: string | null
          updated_at: string
          usage_text: string | null
        }
        Insert: {
          archived_at?: string | null
          avg_rating?: number | null
          catalog_url?: string | null
          composition_type_id?: string | null
          container_type_id?: number | null
          content_revision?: number
          control_plot_ratio?: number | null
          created_at?: string
          description?: string | null
          general_use?: string | null
          id?: string
          main_components?: string | null
          manufacturer_name: string
          manufacturer_verification_method?: string | null
          manufacturer_verified_at?: string | null
          manufacturer_verified_by_seller_id?: string | null
          mechanism?: string | null
          name: string
          name_reading?: string | null
          official_name?: string | null
          official_url?: string | null
          price_range?: string | null
          publication_status?: string
          published_page_version_id?: string | null
          review_count?: number
          sales_status?: string | null
          seller_id?: string | null
          updated_at?: string
          usage_text?: string | null
        }
        Update: {
          archived_at?: string | null
          avg_rating?: number | null
          catalog_url?: string | null
          composition_type_id?: string | null
          container_type_id?: number | null
          content_revision?: number
          control_plot_ratio?: number | null
          created_at?: string
          description?: string | null
          general_use?: string | null
          id?: string
          main_components?: string | null
          manufacturer_name?: string
          manufacturer_verification_method?: string | null
          manufacturer_verified_at?: string | null
          manufacturer_verified_by_seller_id?: string | null
          mechanism?: string | null
          name?: string
          name_reading?: string | null
          official_name?: string | null
          official_url?: string | null
          price_range?: string | null
          publication_status?: string
          published_page_version_id?: string | null
          review_count?: number
          sales_status?: string | null
          seller_id?: string | null
          updated_at?: string
          usage_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_composition_type_id_fkey"
            columns: ["composition_type_id"]
            isOneToOne: false
            referencedRelation: "composition_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_container_type_id_fkey"
            columns: ["container_type_id"]
            isOneToOne: false
            referencedRelation: "container_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_manufacturer_name_fkey"
            columns: ["manufacturer_name"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "materials_manufacturer_verified_by_seller_id_fkey"
            columns: ["manufacturer_verified_by_seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_manufacturer_verified_by_seller_id_fkey"
            columns: ["manufacturer_verified_by_seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_published_page_version_id_fkey"
            columns: ["published_page_version_id"]
            isOneToOne: false
            referencedRelation: "material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_published_page_version_id_fkey"
            columns: ["published_page_version_id"]
            isOneToOne: false
            referencedRelation: "public_material_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_readings: {
        Row: {
          applied_at: string | null
          created_at: string
          error_code: string | null
          finished_at: string | null
          id: string
          input_tokens: number | null
          material_id: string | null
          model: string | null
          output_tokens: number | null
          report_id: string | null
          speed: string | null
          status: string
          upload_path: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          material_id?: string | null
          model?: string | null
          output_tokens?: number | null
          report_id?: string | null
          speed?: string | null
          status?: string
          upload_path: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          material_id?: string | null
          model?: string | null
          output_tokens?: number | null
          report_id?: string | null
          speed?: string | null
          status?: string
          upload_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_readings_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_readings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_affiliations: {
        Row: {
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_affiliations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_affiliations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_contact_details: {
        Row: {
          building_name: string | null
          city_street: string
          family_name: string
          given_name: string
          phone: string | null
          postal_code: string
          terms_accepted_at: string
          user_id: string
        }
        Insert: {
          building_name?: string | null
          city_street: string
          family_name: string
          given_name: string
          phone?: string | null
          postal_code: string
          terms_accepted_at?: string
          user_id: string
        }
        Update: {
          building_name?: string | null
          city_street?: string
          family_name?: string
          given_name?: string
          phone?: string | null
          postal_code?: string
          terms_accepted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_contact_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_contact_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_crops: {
        Row: {
          crop_id: string | null
          crop_name_other: string | null
          id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          crop_id?: string | null
          crop_name_other?: string | null
          id?: string
          sort_order?: number
          user_id: string
        }
        Update: {
          crop_id?: string | null
          crop_name_other?: string | null
          id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_crops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_crops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_details: {
        Row: {
          bio: string
          user_id: string
        }
        Insert: {
          bio?: string
          user_id: string
        }
        Update: {
          bio?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_links: {
        Row: {
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          handle: string
          prefecture_code: number | null
          standpoint: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          handle: string
          prefecture_code?: number | null
          standpoint: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          handle?: string
          prefecture_code?: number | null
          standpoint?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "questions_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "questions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_notifications: {
        Row: {
          claimed_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_crops: {
        Row: {
          created_at: string
          crop_id: string | null
          crop_name_other: string | null
          id: string
          review_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id?: string | null
          crop_name_other?: string | null
          id?: string
          review_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string | null
          crop_name_other?: string | null
          id?: string
          review_id?: string
          sort_order?: number
          updated_at?: string
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
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          review_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          review_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          review_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          has_control_plot: boolean | null
          id: string
          is_provided_sample: boolean
          material_id: string
          pesticide_ack: boolean
          purchase_channel: string | null
          rating: number
          status: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          has_control_plot?: boolean | null
          id?: string
          is_provided_sample?: boolean
          material_id: string
          pesticide_ack: boolean
          purchase_channel?: string | null
          rating: number
          status?: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          has_control_plot?: boolean | null
          id?: string
          is_provided_sample?: boolean
          material_id?: string
          pesticide_ack?: boolean
          purchase_channel?: string | null
          rating?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          review_id: string | null
          usage_report_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id?: string | null
          usage_report_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string | null
          usage_report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_usage_report_id_fkey"
            columns: ["usage_report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      search_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_accounts: {
        Row: {
          approved_at: string | null
          auth_user_id: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          corporate_number: string | null
          created_at: string
          id: string
          invite_code: string | null
          location: string | null
          login_id: string
          logo_url: string | null
          manufacturer_name: string | null
          material_request_notes: string | null
          official_name: string
          profile_text: string | null
          region_scope: string | null
          rejected_reason: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          auth_user_id?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          corporate_number?: string | null
          created_at?: string
          id?: string
          invite_code?: string | null
          location?: string | null
          login_id: string
          logo_url?: string | null
          manufacturer_name?: string | null
          material_request_notes?: string | null
          official_name: string
          profile_text?: string | null
          region_scope?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          auth_user_id?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          corporate_number?: string | null
          created_at?: string
          id?: string
          invite_code?: string | null
          location?: string | null
          login_id?: string
          logo_url?: string | null
          manufacturer_name?: string | null
          material_request_notes?: string | null
          official_name?: string
          profile_text?: string | null
          region_scope?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_accounts_manufacturer_name_fkey"
            columns: ["manufacturer_name"]
            isOneToOne: true
            referencedRelation: "manufacturers"
            referencedColumns: ["name"]
          },
        ]
      }
      usage_report_applications: {
        Row: {
          applied_on: string | null
          created_at: string
          detail: string | null
          id: string
          method: string | null
          sort_order: number
          updated_at: string
          usage_report_id: string
        }
        Insert: {
          applied_on?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          method?: string | null
          sort_order?: number
          updated_at?: string
          usage_report_id: string
        }
        Update: {
          applied_on?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          method?: string | null
          sort_order?: number
          updated_at?: string
          usage_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_applications_usage_report_id_fkey"
            columns: ["usage_report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_compared_materials: {
        Row: {
          id: string
          name: string
          report_id: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          report_id: string
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          report_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_compared_materials_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_documents: {
        Row: {
          id: string
          name: string
          report_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          id: string
          name: string
          report_id: string
          sort_order: number
          storage_path: string
        }
        Update: {
          id?: string
          name?: string
          report_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_documents_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_graph_rows: {
        Row: {
          graph_id: string
          id: string
          label: string
          plot_id: string | null
          sort_order: number
          value_text: string
        }
        Insert: {
          graph_id: string
          id: string
          label: string
          plot_id?: string | null
          sort_order: number
          value_text: string
        }
        Update: {
          graph_id?: string
          id?: string
          label?: string
          plot_id?: string | null
          sort_order?: number
          value_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_graph_rows_graph_id_fkey"
            columns: ["graph_id"]
            isOneToOne: false
            referencedRelation: "usage_report_graphs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_report_graph_rows_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "usage_report_plots"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_graphs: {
        Row: {
          heading: string
          id: string
          measurement_id: string
          sort_order: number
        }
        Insert: {
          heading: string
          id: string
          measurement_id: string
          sort_order: number
        }
        Update: {
          heading?: string
          id?: string
          measurement_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_graphs_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "usage_report_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_headings: {
        Row: {
          report_id: string
          section: string
          title: string
        }
        Insert: {
          report_id: string
          section: string
          title: string
        }
        Update: {
          report_id?: string
          section?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_headings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_measurements: {
        Row: {
          body: string
          id: string
          kind: string
          name: string
          report_id: string
          sort_order: number
          unit: string
        }
        Insert: {
          body: string
          id: string
          kind: string
          name: string
          report_id: string
          sort_order: number
          unit: string
        }
        Update: {
          body?: string
          id?: string
          kind?: string
          name?: string
          report_id?: string
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_measurements_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          measurement_id: string | null
          media_type: string
          placement: string | null
          sort_order: number
          updated_at: string
          url: string
          usage_report_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          measurement_id?: string | null
          media_type: string
          placement?: string | null
          sort_order?: number
          updated_at?: string
          url: string
          usage_report_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          measurement_id?: string | null
          media_type?: string
          placement?: string | null
          sort_order?: number
          updated_at?: string
          url?: string
          usage_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_media_measurement_fkey"
            columns: ["measurement_id", "usage_report_id"]
            isOneToOne: false
            referencedRelation: "usage_report_measurements"
            referencedColumns: ["id", "report_id"]
          },
          {
            foreignKeyName: "usage_report_media_usage_report_id_fkey"
            columns: ["usage_report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          sort_order: number
          treated_value: number | null
          unit: string | null
          untreated_value: number | null
          updated_at: string
          usage_report_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          sort_order?: number
          treated_value?: number | null
          unit?: string | null
          untreated_value?: number | null
          updated_at?: string
          usage_report_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          sort_order?: number
          treated_value?: number | null
          unit?: string | null
          untreated_value?: number | null
          updated_at?: string
          usage_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_metrics_usage_report_id_fkey"
            columns: ["usage_report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_pdf_reading_fields: {
        Row: {
          field_key: string
          quote: string
          reading_id: string
          value: string
        }
        Insert: {
          field_key: string
          quote: string
          reading_id: string
          value: string
        }
        Update: {
          field_key?: string
          quote?: string
          reading_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_pdf_reading_fields_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "pdf_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_plot_steps: {
        Row: {
          id: string
          method: string
          other_text: string
          plot_id: string
          sort_order: number
        }
        Insert: {
          id: string
          method: string
          other_text: string
          plot_id: string
          sort_order: number
        }
        Update: {
          id?: string
          method?: string
          other_text?: string
          plot_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_plot_steps_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "usage_report_plots"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_plots: {
        Row: {
          compared_material_id: string | null
          description: string
          id: string
          name: string
          report_id: string
          sort_order: number
          survey_scope: string
          treatment: string | null
          variety_id: string | null
        }
        Insert: {
          compared_material_id?: string | null
          description: string
          id: string
          name: string
          report_id: string
          sort_order: number
          survey_scope: string
          treatment?: string | null
          variety_id?: string | null
        }
        Update: {
          compared_material_id?: string | null
          description?: string
          id?: string
          name?: string
          report_id?: string
          sort_order?: number
          survey_scope?: string
          treatment?: string | null
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_plots_compared_material_fkey"
            columns: ["compared_material_id", "report_id"]
            isOneToOne: false
            referencedRelation: "usage_report_compared_materials"
            referencedColumns: ["id", "report_id"]
          },
          {
            foreignKeyName: "usage_report_plots_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_report_plots_variety_fkey"
            columns: ["variety_id", "report_id"]
            isOneToOne: false
            referencedRelation: "usage_report_varieties"
            referencedColumns: ["id", "report_id"]
          },
        ]
      }
      usage_report_private_locations: {
        Row: {
          city: string
          report_id: string
        }
        Insert: {
          city: string
          report_id: string
        }
        Update: {
          city?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_private_locations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_step_targets: {
        Row: {
          step_id: string
          target: string
        }
        Insert: {
          step_id: string
          target: string
        }
        Update: {
          step_id?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_step_targets_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "usage_report_plot_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_timings: {
        Row: {
          report_id: string
          stage: number
        }
        Insert: {
          report_id: string
          stage: number
        }
        Update: {
          report_id?: string
          stage?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_timings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_report_varieties: {
        Row: {
          id: string
          name: string
          report_id: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          report_id: string
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          report_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_report_varieties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "usage_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_reports: {
        Row: {
          author_user_id: string
          climate_note: string | null
          common_plot_description: string
          created_at: string
          crop_id: string | null
          crop_name_other: string | null
          cultivation_environment: string
          cultivation_tags: string[]
          cultivation_type: string | null
          documents_ack: boolean
          editor_note: string | null
          field_name: string | null
          form_version: number
          growth_stage: string | null
          id: string
          is_provided_sample: boolean
          material_id: string
          method_details_ack: boolean
          negative_note: string | null
          observed_change: string
          pdf_values_checked: boolean
          pesticide_ack: boolean
          planting_date: string | null
          prefecture_code: number | null
          publish_city: boolean
          published_at: string | null
          purpose_note: string | null
          purpose_tags: string[]
          status: string
          summary: string
          timing_note: string
          title: string | null
          updated_at: string
          variety: string | null
          variety_unknown: boolean
        }
        Insert: {
          author_user_id: string
          climate_note?: string | null
          common_plot_description?: string
          created_at?: string
          crop_id?: string | null
          crop_name_other?: string | null
          cultivation_environment?: string
          cultivation_tags?: string[]
          cultivation_type?: string | null
          documents_ack?: boolean
          editor_note?: string | null
          field_name?: string | null
          form_version?: number
          growth_stage?: string | null
          id?: string
          is_provided_sample?: boolean
          material_id: string
          method_details_ack?: boolean
          negative_note?: string | null
          observed_change: string
          pdf_values_checked?: boolean
          pesticide_ack: boolean
          planting_date?: string | null
          prefecture_code?: number | null
          publish_city?: boolean
          published_at?: string | null
          purpose_note?: string | null
          purpose_tags?: string[]
          status?: string
          summary: string
          timing_note?: string
          title?: string | null
          updated_at?: string
          variety?: string | null
          variety_unknown?: boolean
        }
        Update: {
          author_user_id?: string
          climate_note?: string | null
          common_plot_description?: string
          created_at?: string
          crop_id?: string | null
          crop_name_other?: string | null
          cultivation_environment?: string
          cultivation_tags?: string[]
          cultivation_type?: string | null
          documents_ack?: boolean
          editor_note?: string | null
          field_name?: string | null
          form_version?: number
          growth_stage?: string | null
          id?: string
          is_provided_sample?: boolean
          material_id?: string
          method_details_ack?: boolean
          negative_note?: string | null
          observed_change?: string
          pdf_values_checked?: boolean
          pesticide_ack?: boolean
          planting_date?: string | null
          prefecture_code?: number | null
          publish_city?: boolean
          published_at?: string | null
          purpose_note?: string | null
          purpose_tags?: string[]
          status?: string
          summary?: string
          timing_note?: string
          title?: string | null
          updated_at?: string
          variety?: string | null
          variety_unknown?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "usage_reports_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "usage_reports_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "usage_reports_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_reports_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      view_events: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          updated_at: string
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          updated_at?: string
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "view_events_viewer_user_id_fkey"
            columns: ["viewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "view_events_viewer_user_id_fkey"
            columns: ["viewer_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      helpful_counts: {
        Row: {
          helpful_count: number | null
          target_id: string | null
          target_type: string | null
        }
        Relationships: []
      }
      public_material_page_versions: {
        Row: {
          description: string | null
          id: string | null
          main_components: string | null
          material_id: string | null
          mechanism: string | null
          origin: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_page_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          handle: string | null
          prefecture_code: number | null
          standpoint: string | null
          user_id: string | null
        }
        Relationships: []
      }
      public_sellers: {
        Row: {
          approved_at: string | null
          created_at: string | null
          id: string | null
          location: string | null
          login_id: string | null
          logo_url: string | null
          official_name: string | null
          profile_text: string | null
          region_scope: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          id?: string | null
          location?: string | null
          login_id?: string | null
          logo_url?: string | null
          official_name?: string | null
          profile_text?: string | null
          region_scope?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          id?: string | null
          location?: string | null
          login_id?: string | null
          logo_url?: string | null
          official_name?: string | null
          profile_text?: string | null
          region_scope?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      view_counts_daily: {
        Row: {
          target_id: string | null
          target_type: string | null
          view_count: number | null
          view_date: string | null
        }
        Relationships: []
      }
      view_counts_total: {
        Row: {
          target_id: string | null
          target_type: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_pdf_reading: {
        Args: { p_fields: Json; p_reading_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_material_change_request: {
        Args: {
          p_request_id: string
          p_review_note: string
          p_reviewed_by_user_id: string
        }
        Returns: string
      }
      approve_seller_with_manufacturer: {
        Args: {
          p_auth_user_id: string
          p_create_manufacturer: boolean
          p_manufacturer_name: string
          p_seller_id: string
        }
        Returns: undefined
      }
      cancel_material_change_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      catalog_material_counts: {
        Args: never
        Returns: {
          material_id: string
          report_count: number
          saved_count: number
        }[]
      }
      check_company_application_rate: {
        Args: { p_key_hash: string; p_limit: number }
        Returns: boolean
      }
      claim_expired_company_application_uploads: {
        Args: never
        Returns: {
          access_id: string | null
          cleanup_claimed_at: string | null
          content_hash: string | null
          expires_at: string
          id: string
          kind: string
          seller_id: string | null
          submitted_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "company_application_intents"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_pdf_reading: {
        Args: {
          p_material_id: string
          p_report_id: string
          p_upload_path: string
          p_user_id: string
        }
        Returns: {
          reading_id: string
          remaining: number
        }[]
      }
      confirm_company_application_access: {
        Args: { p_session_hash: string; p_token_hash: string }
        Returns: string
      }
      confirm_material_information: {
        Args: { p_material_id: string }
        Returns: undefined
      }
      create_review_with_crops: {
        Args: {
          p_author_user_id: string
          p_body: string
          p_crop_ids: string[]
          p_crop_name_other?: string
          p_has_control_plot?: boolean
          p_material_id: string
          p_pesticide_ack?: boolean
          p_purchase_channel?: string
          p_rating: number
        }
        Returns: string
      }
      finalize_company_application_evidence: {
        Args: {
          p_id: string
          p_sealed_path?: string
          p_session_hash?: string
          p_sha256?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      finish_pdf_reading: {
        Args: {
          p_error_code?: string
          p_input_tokens?: number
          p_model?: string
          p_output_tokens?: number
          p_reading_id: string
          p_speed?: string
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      hide_owned_material_page: {
        Args: { p_material_id: string; p_note: string }
        Returns: undefined
      }
      list_expired_pdf_reading_uploads: {
        Args: { p_limit: number }
        Returns: string[]
      }
      list_usage_report_previews: {
        Args: never
        Returns: {
          author_user_id: string
          climate_note: string | null
          common_plot_description: string
          created_at: string
          crop_id: string | null
          crop_name_other: string | null
          cultivation_environment: string
          cultivation_tags: string[]
          cultivation_type: string | null
          documents_ack: boolean
          editor_note: string | null
          field_name: string | null
          form_version: number
          growth_stage: string | null
          id: string
          is_provided_sample: boolean
          material_id: string
          method_details_ack: boolean
          negative_note: string | null
          observed_change: string
          pdf_values_checked: boolean
          pesticide_ack: boolean
          planting_date: string | null
          prefecture_code: number | null
          publish_city: boolean
          published_at: string | null
          purpose_note: string | null
          purpose_tags: string[]
          status: string
          summary: string
          timing_note: string
          title: string | null
          updated_at: string
          variety: string | null
          variety_unknown: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "usage_reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pdf_reading_remaining: {
        Args: { p_user_id: string }
        Returns: number
      }
      record_material_page_audit: {
        Args: {
          p_actor_id: string
          p_material_id: string
          p_note: string
          p_outcome: string
        }
        Returns: undefined
      }
      reject_material_change_request: {
        Args: {
          p_request_id: string
          p_review_note: string
          p_reviewed_by_user_id: string
        }
        Returns: undefined
      }
      remove_company_application_evidence: {
        Args: { p_id: string; p_session_hash?: string; p_user_id?: string }
        Returns: {
          byte_size: number
          created_at: string
          declared_mime: string
          file_name: string
          id: string
          intent_id: string
          item_key: string | null
          purpose: string
          sealed_path: string | null
          sha256: string | null
          staging_path: string
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "company_application_evidence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_company_application_evidence: {
        Args: {
          p_file_name?: string
          p_intent_id: string
          p_item_key?: string
          p_mime?: string
          p_purpose?: string
          p_session_hash?: string
          p_size?: number
          p_user_id?: string
        }
        Returns: {
          byte_size: number
          created_at: string
          declared_mime: string
          file_name: string
          id: string
          intent_id: string
          item_key: string | null
          purpose: string
          sealed_path: string | null
          sha256: string | null
          staging_path: string
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "company_application_evidence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restart_removal_application: {
        Args: { p_intent_id: string; p_session_hash: string }
        Returns: string
      }
      review_manufacturer_profile_version: {
        Args: {
          p_actor_id: string
          p_note: string
          p_publish: boolean
          p_version_id: string
        }
        Returns: string
      }
      review_material_page_version: {
        Args: {
          p_actor_id: string
          p_note: string
          p_publish: boolean
          p_version_id: string
        }
        Returns: string
      }
      revoke_material_editor_grant: {
        Args: { p_actor_id: string; p_material_id: string }
        Returns: undefined
      }
      save_manufacturer_profile_version: {
        Args: {
          p_expected_version?: string
          p_logo_url: string
          p_profile_text: string
          p_submit: boolean
          p_website_url: string
        }
        Returns: string
      }
      save_material_page_version: {
        Args: {
          p_content: Json
          p_expected_version?: string
          p_material_id: string
          p_submit: boolean
        }
        Returns: string
      }
      save_profile_details: {
        Args: {
          p_affiliations: string[]
          p_bio: string
          p_crop_ids: string[]
          p_crop_names_other?: string[]
          p_handle: string
          p_links: string[]
        }
        Returns: undefined
      }
      save_usage_report: {
        Args: { p_input: Json; p_submit: boolean }
        Returns: {
          report_id: string
          status: string
          updated_at: string
        }[]
      }
      set_material_editor_grant: {
        Args: {
          p_actor_id: string
          p_document_reference: string
          p_material_id: string
          p_seller_id: string
        }
        Returns: undefined
      }
      submit_company_application: {
        Args: {
          p_consents?: string[]
          p_input?: Json
          p_intent_id: string
          p_session_hash?: string
          p_user_id?: string
        }
        Returns: string
      }
      submit_material_archive_request: {
        Args: { p_material_id: string; p_reason: string }
        Returns: string
      }
      submit_material_create_change: {
        Args: {
          p_catalog_url: string
          p_composition_type_id: string
          p_crop_ids: string[]
          p_description: string
          p_effect_ids: string[]
          p_general_use: string
          p_ingredient_category_ids: string[]
          p_ingredient_ids: string[]
          p_main_components: string
          p_mechanism: string
          p_name: string
          p_official_url: string
          p_price_range: string
          p_product_type_ids: string[]
          p_reason: string
          p_sales_status: string
          p_search_tag_ids: string[]
          p_usage_text: string
        }
        Returns: string
      }
      submit_material_create_request: {
        Args: {
          p_catalog_url: string
          p_composition_type_id: string
          p_crop_ids: string[]
          p_description: string
          p_effect_ids: string[]
          p_general_use: string
          p_ingredient_category_ids: string[]
          p_ingredient_ids: string[]
          p_main_components: string
          p_mechanism: string
          p_name: string
          p_official_url: string
          p_price_range: string
          p_product_type_ids: string[]
          p_reason: string
          p_sales_status: string
          p_search_tag_ids: string[]
          p_usage_text: string
        }
        Returns: string
      }
      submit_material_evidence_add_request: {
        Args: {
          p_evidence_type: string
          p_external_url: string
          p_file_url: string
          p_material_id: string
          p_meta: Json
          p_title: string
        }
        Returns: string
      }
      submit_material_evidence_remove_request: {
        Args: { p_evidence_id: string; p_material_id: string }
        Returns: string
      }
      submit_material_update_change: {
        Args: {
          p_catalog_url: string
          p_composition_type_id: string
          p_crop_ids: string[]
          p_description: string
          p_effect_ids: string[]
          p_general_use: string
          p_ingredient_category_ids: string[]
          p_ingredient_ids: string[]
          p_main_components: string
          p_material_id: string
          p_mechanism: string
          p_name: string
          p_official_url: string
          p_price_range: string
          p_product_type_ids: string[]
          p_reason: string
          p_sales_status: string
          p_search_tag_ids: string[]
          p_usage_text: string
        }
        Returns: string
      }
      submit_material_update_request: {
        Args: {
          p_catalog_url: string
          p_composition_type_id: string
          p_crop_ids: string[]
          p_description: string
          p_effect_ids: string[]
          p_general_use: string
          p_ingredient_category_ids: string[]
          p_ingredient_ids: string[]
          p_main_components: string
          p_material_id: string
          p_mechanism: string
          p_name: string
          p_official_url: string
          p_price_range: string
          p_product_type_ids: string[]
          p_reason: string
          p_sales_status: string
          p_search_tag_ids: string[]
          p_usage_text: string
        }
        Returns: string
      }
      update_review_with_crops: {
        Args: {
          p_author_user_id: string
          p_body: string
          p_crop_ids: string[]
          p_crop_name_other?: string
          p_has_control_plot?: boolean
          p_material_id: string
          p_pesticide_ack?: boolean
          p_purchase_channel?: string
          p_rating: number
          p_review_id: string
        }
        Returns: string
      }
      withdraw_manufacturer_profile_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      withdraw_material_page_version: {
        Args: { p_version_id: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

