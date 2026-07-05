import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, InteractionRow, IotEventRow, Json } from "@/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de Supabase: NEXT_PUBLIC_SUPABASE_URL y ANON_KEY o SERVICE_ROLE_KEY"
    );
  }

  return { url, key };
}

export function createSupabaseClient(): TypedSupabaseClient {
  const { url, key } = getSupabaseEnv();
  return createClient<Database>(url, key);
}

let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) {
      throw new Error("Supabase no configurado en el cliente");
    }
    browserClient = createClient<Database>(url, anonKey);
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(url && key);
}

export interface LogInteractionInput {
  moduleId: string;
  eventType: string;
  inputText?: string;
  outputText?: string;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function logInteraction(
  input: LogInteractionInput
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("interactions").insert({
      module_id: input.moduleId,
      event_type: input.eventType,
      input_text: input.inputText ?? null,
      output_text: input.outputText ?? null,
      audio_url: input.audioUrl ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[supabase] logInteraction:", error.message);
    }
  } catch {
    /* no bloquear flujo principal */
  }
}

export async function logIotEvent(
  action: string,
  ledState?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("iot_events").insert({
      action,
      led_state: ledState ?? null,
      device_connected: true,
      payload: (payload ?? {}) as Json,
    });
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[supabase] logIotEvent:", error.message);
    }
  } catch {
    /* no bloquear */
  }
}

export async function fetchRecentInteractions(
  limit = 10
): Promise<InteractionRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("interactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchRecentIotEvents(limit = 5): Promise<IotEventRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("iot_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
