import { NextResponse } from "next/server";

import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/services/interactions";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      tablesReady: false,
      hint: "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY",
    });
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("interactions").select("id").limit(1);

    if (error?.code === "PGRST205") {
      return NextResponse.json({
        configured: true,
        tablesReady: false,
        hint: "Ejecuta supabase/setup-all.sql en el SQL Editor de Supabase",
      });
    }

    if (error) {
      return NextResponse.json({
        configured: true,
        tablesReady: false,
        error: error.message,
      });
    }

    return NextResponse.json({ configured: true, tablesReady: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de conexión";
    return NextResponse.json({ configured: true, tablesReady: false, error: message });
  }
}
