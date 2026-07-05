import { NextResponse } from "next/server";

import { getServicesStatus } from "@/lib/services/service-status";

/** GET /api/status — qué integraciones están activas (sin exponer keys) */
export async function GET() {
  const services = getServicesStatus();
  const configured = services.filter((s) => s.configured).length;

  return NextResponse.json({
    ok: configured > 0,
    configured,
    total: services.length,
    services,
    hint:
      configured < services.length
        ? "Completa .env.local siguiendo docs/SETUP-CUENTAS.md y reinicia npm run dev"
        : "Todas las integraciones tienen variables de entorno",
  });
}
