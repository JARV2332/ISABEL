# Subdominio directo: isabel.edukidsgt.com

Evita el **proxy rewrite** de EDUGUIA (que duplicaba Edge Requests e invocaciones serverless).

## Arquitectura nueva

| URL | Destino |
|-----|---------|
| `https://isabel.edukidsgt.com/ISABEL` | Proyecto ISABEL en Vercel (directo) |
| `https://www.edukidsgt.com/ISABEL` | Redirect 307 → subdominio (EDUGUIA) |

## Paso 1 — Vercel (proyecto ISABEL)

1. Abre [Vercel Dashboard](https://vercel.com) → proyecto **ISABEL** (`isabel-lake`).
2. **Settings → Domains → Add**
3. Escribe: `isabel.edukidsgt.com`
4. Vercel mostrará un registro DNS (CNAME o A). Cópialo.

## Paso 2 — DNS (donde gestionas edukidsgt.com)

Crea un registro **CNAME**:

| Tipo | Nombre | Valor |
|------|--------|--------|
| CNAME | `isabel` | `cname.vercel-dns.com` |

*(Usa el valor exacto que muestre Vercel si es distinto.)*

Espera 5–30 minutos a que propague.

## Paso 3 — Variables en Vercel (ISABEL)

En **Settings → Environment Variables** (Production):

```
NEXT_PUBLIC_SITE_URL=https://isabel.edukidsgt.com/ISABEL
NEXT_PUBLIC_BASE_PATH=/ISABEL
```

Redeploy ISABEL tras guardar.

## Paso 4 — EDUGUIA (ya en repo)

- Eliminado el **rewrite proxy** a `isabel-lake.vercel.app`.
- `/ISABEL` ahora **redirige** al subdominio (sin pasar tráfico por serverless de EDUGUIA).
- Enlaces del header/home apuntan a `https://isabel.edukidsgt.com/ISABEL`.

Deploy EDUGUIA después del push.

## Verificación

1. `https://isabel.edukidsgt.com/ISABEL` — carga ISABEL directo.
2. `https://www.edukidsgt.com/ISABEL` — redirige al subdominio.
3. Vercel → ISABEL → Observability: las Edge Requests deberían **bajar** (sin doble proxy).

## Fallback temporal

Si el DNS aún no propaga, la app sigue en:

`https://isabel-lake.vercel.app/ISABEL`
