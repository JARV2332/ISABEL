/**
 * Punto de entrada público para el cliente de Supabase.
 * La implementación vive en src/lib/services/supabase.ts
 */
export {
  createSupabaseClient,
  getSupabaseBrowserClient,
  type TypedSupabaseClient,
} from "./services/supabase";
