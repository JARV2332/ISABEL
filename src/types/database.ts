/**
 * Tipos del esquema Supabase para ISABEL.
 */

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
      interactions: {
        Row: {
          id: string;
          module_id: string;
          event_type: string;
          input_text: string | null;
          output_text: string | null;
          audio_url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          event_type?: string;
          input_text?: string | null;
          output_text?: string | null;
          audio_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Insert"]>;
      };
      iot_events: {
        Row: {
          id: string;
          action: string;
          led_state: string | null;
          device_connected: boolean | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          led_state?: string | null;
          device_connected?: boolean | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["iot_events"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type InteractionRow = Database["public"]["Tables"]["interactions"]["Row"];
export type IotEventRow = Database["public"]["Tables"]["iot_events"]["Row"];
