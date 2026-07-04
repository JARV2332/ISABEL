import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, anonKey };
}

/**
 * Crea una instancia tipada del cliente de Supabase.
 * Usar en Server Components, Route Handlers o scripts.
 */
export function createSupabaseClient(): TypedSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey);
}

/**
 * Cliente singleton para uso en el navegador.
 * Importar solo desde Client Components o hooks.
 */
let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }
  return browserClient;
}
