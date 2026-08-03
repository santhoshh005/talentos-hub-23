// ---------------------------------------------------------------------------
// TalentOS Supabase Database Types
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type SubscriptionStatus = "trial" | "active" | "expired" | "blocked";
export type UserRole = "user" | "admin";
export type EventType = "analysis" | "jd_generation" | "report_download";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  usage_count: number;
  max_usage: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  metadata: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      usage_events: {
        Row: UsageEvent;
        Insert: Omit<UsageEvent, "id" | "created_at">;
        Update: Partial<UsageEvent>;
        Relationships: [];
      };
    };
  };
}
