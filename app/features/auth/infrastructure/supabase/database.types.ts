export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_accounts: {
        Row: {
          id: number;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          id: number;
          credit_account_id: number;
          amount: number;
          entry_type: "topup" | "usage" | "refund" | "bonus" | "adjustment";
          idempotency_key: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          credit_account_id: number;
          amount: number;
          entry_type: "topup" | "usage" | "refund" | "bonus" | "adjustment";
          idempotency_key?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      usage_records: {
        Row: {
          id: number;
          user_id: string;
          request_id: string;
          feature: "cek_lartas" | "hs_finder";
          requested_item_count: number;
          billable_item_count: number;
          credits_charged: number;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          request_id: string;
          feature: "cek_lartas" | "hs_finder";
          requested_item_count: number;
          billable_item_count?: number;
          credits_charged?: number;
          status?: "pending" | "completed" | "failed" | "refunded";
          created_at?: string;
          completed_at?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
