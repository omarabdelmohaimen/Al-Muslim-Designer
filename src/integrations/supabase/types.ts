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
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name_ar: string
          name_en: string | null
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name_ar: string
          name_en?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name_ar?: string
          name_en?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_item_tags: {
        Row: {
          media_item_id: string
          tag_id: string
        }
        Insert: {
          media_item_id: string
          tag_id: string
        }
        Update: {
          media_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_item_tags_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          aspect_ratio: string | null
          background_type: Database["public"]["Enums"]["background_type"] | null
          category_id: string | null
          clip_type: string | null
          content_style: Database["public"]["Enums"]["content_style"] | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          download_enabled: boolean
          duration_seconds: number | null
          file_type: string | null
          id: string
          is_featured: boolean
          is_visible: boolean
          juz: number | null
          language_code: string
          media_kind: Database["public"]["Enums"]["media_kind"]
          media_status: Database["public"]["Enums"]["media_status"]
          mood: string | null
          published_at: string | null
          reciter_id: string | null
          resolution: string | null
          saves_count: number
          slug: string
          surah_id: number | null
          thumbnail_url: string | null
          pcloud_video_file_id: string | null
          pcloud_thumbnail_file_id: string | null
          title_ar: string
          title_en: string | null
          updated_at: string
          uploaded_by: string | null
          video_url: string
          views_count: number
        }
        Insert: {
          aspect_ratio?: string | null
          background_type?:
            | Database["public"]["Enums"]["background_type"]
            | null
          category_id?: string | null
          clip_type?: string | null
          content_style?: Database["public"]["Enums"]["content_style"] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          download_enabled?: boolean
          duration_seconds?: number | null
          file_type?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          juz?: number | null
          language_code?: string
          media_kind: Database["public"]["Enums"]["media_kind"]
          media_status?: Database["public"]["Enums"]["media_status"]
          mood?: string | null
          published_at?: string | null
          reciter_id?: string | null
          resolution?: string | null
          saves_count?: number
          slug: string
          surah_id?: number | null
          thumbnail_url?: string | null
          pcloud_video_file_id?: string | null
          pcloud_thumbnail_file_id?: string | null
          title_ar: string
          title_en?: string | null
          updated_at?: string
          uploaded_by?: string | null
          video_url: string
          views_count?: number
        }
        Update: {
          aspect_ratio?: string | null
          background_type?:
            | Database["public"]["Enums"]["background_type"]
            | null
          category_id?: string | null
          clip_type?: string | null
          content_style?: Database["public"]["Enums"]["content_style"] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          download_enabled?: boolean
          duration_seconds?: number | null
          file_type?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          juz?: number | null
          language_code?: string
          media_kind?: Database["public"]["Enums"]["media_kind"]
          media_status?: Database["public"]["Enums"]["media_status"]
          mood?: string | null
          published_at?: string | null
          reciter_id?: string | null
          resolution?: string | null
          saves_count?: number
          slug?: string
          surah_id?: number | null
          thumbnail_url?: string | null
          pcloud_video_file_id?: string | null
          pcloud_thumbnail_file_id?: string | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "reciters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reciters: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          language_code: string | null
          normalized_query: string
          query_text: string
          results_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          language_code?: string | null
          normalized_query: string
          query_text: string
          results_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          language_code?: string | null
          normalized_query?: string
          query_text?: string
          results_count?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          created_at: string
          hero_subtitle_ar: string | null
          hero_title_ar: string | null
          homepage_sections: Json
          id: boolean
          seo_description_default: string | null
          seo_title_default: string | null
          site_name_ar: string
          site_name_en: string
          site_tagline_ar: string | null
          site_tagline_en: string | null
          social_links: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          hero_subtitle_ar?: string | null
          hero_title_ar?: string | null
          homepage_sections?: Json
          id?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name_ar?: string
          site_name_en?: string
          site_tagline_ar?: string | null
          site_tagline_en?: string | null
          social_links?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          hero_subtitle_ar?: string | null
          hero_title_ar?: string | null
          homepage_sections?: Json
          id?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name_ar?: string
          site_name_en?: string
          site_tagline_ar?: string | null
          site_tagline_en?: string | null
          social_links?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      surahs: {
        Row: {
          ayah_count: number | null
          created_at: string
          id: number
          juz_start: number | null
          name_ar: string
          name_en: string | null
          transliteration: string | null
          updated_at: string
        }
        Insert: {
          ayah_count?: number | null
          created_at?: string
          id: number
          juz_start?: number | null
          name_ar: string
          name_en?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Update: {
          ayah_count?: number | null
          created_at?: string
          id?: number
          juz_start?: number | null
          name_ar?: string
          name_en?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label_ar: string
          label_en: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_ar: string
          label_en?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          label_ar?: string
          label_en?: string | null
          slug?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_media_saves: { Args: { _media_id: string }; Returns: undefined }
      increment_media_views: { Args: { _media_id: string }; Returns: undefined }
      log_search: {
        Args: { _lang?: string; _query: string; _results?: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      background_type:
        | "nature"
        | "mosque"
        | "abstract"
        | "solid"
        | "chroma"
        | "mixed"
      content_style:
        | "cinematic"
        | "minimal"
        | "calligraphy"
        | "documentary"
        | "ambient"
        | "other"
      media_kind:
        | "quran_video"
        | "islamic_design"
        | "chroma"
        | "nature_scene"
        | "other"
      media_status: "draft" | "published" | "archived"
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
      app_role: ["admin", "moderator", "user"],
      background_type: [
        "nature",
        "mosque",
        "abstract",
        "solid",
        "chroma",
        "mixed",
      ],
      content_style: [
        "cinematic",
        "minimal",
        "calligraphy",
        "documentary",
        "ambient",
        "other",
      ],
      media_kind: [
        "quran_video",
        "islamic_design",
        "chroma",
        "nature_scene",
        "other",
      ],
      media_status: ["draft", "published", "archived"],
    },
  },
} as const
