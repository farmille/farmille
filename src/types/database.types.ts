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
      crops: {
        Row: {
          aliases: string[]
          created_at: string
          group_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          group_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          group_id?: string
          id?: string
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
          material_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string | null
          material_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string | null
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
          official_url: string | null
          price_range: string | null
          publication_status: string
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
          official_url?: string | null
          price_range?: string | null
          publication_status?: string
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
          official_url?: string | null
          price_range?: string | null
          publication_status?: string
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
      profile_contact_details: {
        Row: {
          city: string
          family_name: string
          given_name: string
          phone: string | null
          postal_code: string
          terms_accepted_at: string
          user_id: string
        }
        Insert: {
          city: string
          family_name: string
          given_name: string
          phone?: string | null
          postal_code: string
          terms_accepted_at?: string
          user_id: string
        }
        Update: {
          city?: string
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
      review_crops: {
        Row: {
          created_at: string
          crop_id: string
          id: string
          review_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id: string
          id?: string
          review_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string
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
      usage_report_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
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
          media_type?: string
          placement?: string | null
          sort_order?: number
          updated_at?: string
          url?: string
          usage_report_id?: string
        }
        Relationships: [
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
      usage_reports: {
        Row: {
          author_user_id: string
          climate_note: string | null
          created_at: string
          crop_id: string
          cultivation_tags: string[]
          cultivation_type: string | null
          editor_note: string | null
          field_name: string | null
          growth_stage: string | null
          id: string
          is_provided_sample: boolean
          material_id: string
          negative_note: string | null
          observed_change: string
          pesticide_ack: boolean
          planting_date: string | null
          prefecture_code: number | null
          published_at: string | null
          purpose_note: string | null
          purpose_tags: string[]
          status: string
          summary: string
          title: string | null
          updated_at: string
          variety: string | null
        }
        Insert: {
          author_user_id: string
          climate_note?: string | null
          created_at?: string
          crop_id: string
          cultivation_tags?: string[]
          cultivation_type?: string | null
          editor_note?: string | null
          field_name?: string | null
          growth_stage?: string | null
          id?: string
          is_provided_sample?: boolean
          material_id: string
          negative_note?: string | null
          observed_change: string
          pesticide_ack: boolean
          planting_date?: string | null
          prefecture_code?: number | null
          published_at?: string | null
          purpose_note?: string | null
          purpose_tags?: string[]
          status?: string
          summary: string
          title?: string | null
          updated_at?: string
          variety?: string | null
        }
        Update: {
          author_user_id?: string
          climate_note?: string | null
          created_at?: string
          crop_id?: string
          cultivation_tags?: string[]
          cultivation_type?: string | null
          editor_note?: string | null
          field_name?: string | null
          growth_stage?: string | null
          id?: string
          is_provided_sample?: boolean
          material_id?: string
          negative_note?: string | null
          observed_change?: string
          pesticide_ack?: boolean
          planting_date?: string | null
          prefecture_code?: number | null
          published_at?: string | null
          purpose_note?: string | null
          purpose_tags?: string[]
          status?: string
          summary?: string
          title?: string | null
          updated_at?: string
          variety?: string | null
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          handle: string | null
          prefecture_code: number | null
          standpoint: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          handle?: string | null
          prefecture_code?: number | null
          standpoint?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          handle?: string | null
          prefecture_code?: number | null
          standpoint?: string | null
          user_id?: string | null
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
    }
    Functions: {
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
      confirm_material_information: {
        Args: { p_material_id: string }
        Returns: undefined
      }
      create_review_with_crops: {
        Args: {
          p_author_user_id: string
          p_body: string
          p_crop_ids: string[]
          p_has_control_plot: boolean
          p_material_id: string
          p_pesticide_ack: boolean
          p_purchase_channel?: string
          p_rating: number
        }
        Returns: string
      }
      reject_material_change_request: {
        Args: {
          p_request_id: string
          p_review_note: string
          p_reviewed_by_user_id: string
        }
        Returns: undefined
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
          p_has_control_plot: boolean
          p_material_id: string
          p_pesticide_ack: boolean
          p_purchase_channel?: string
          p_rating: number
          p_review_id: string
        }
        Returns: string
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

