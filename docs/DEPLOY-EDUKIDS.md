# ISABEL bajo edukidsgt.com/ISABEL

ISABEL se despliega como **producto separado** (repo `JARV2332/ISABEL`) y se expone en el dominio principal de EDUKIDS mediante rewrites en Vercel.

## Arquitectura

| URL | Proyecto |
|-----|----------|
| `https://www.edukidsgt.com/` | EDUGUIA (repo `JARV2332/EDUGUIA`) |
| `https://isabel.edukidsgt.com/ISABEL` | ISABEL directo en Vercel (**recomendado**) |
| `https://www.edukidsgt.com/ISABEL` | Redirect → subdominio (sin proxy) |

Guía DNS: **[DNS-ISABEL-SUBDOMINIO.md](./DNS-ISABEL-SUBDOMINIO.md)**

## ISABEL (este repo)

- `next.config.ts` usa `basePath: '/ISABEL'` en producción.
- Las llamadas `fetch('/api/...')` usan `withBasePath()` desde `src/lib/base-path.ts`.
- URL canónica: `NEXT_PUBLIC_SITE_URL=https://www.edukidsgt.com/ISABEL` (opcional en Vercel).

Deploy directo: `https://isabel-lake.vercel.app/ISABEL`

## EDUGUIA

`next.config.mjs` incluye rewrites `beforeFiles` hacia ISABEL (prioridad sobre rutas internas) y el middleware **no** intercepta `/ISABEL`.

## Verificación

1. Deploy ISABEL en Vercel (push a `main`).
2. Deploy EDUGUIA en Vercel (push a `main`).
3. Abrir `https://www.edukidsgt.com/ISABEL`
4. Probar un módulo y una API (p. ej. pizarra → `/ISABEL/api/handwriting`).

## Consumo en Vercel (importante)

Con el **rewrite proxy** de EDUGUIA, cada visita genera **muchas peticiones**:

```
Usuario → edukidsgt.com/ISABEL/*
            → (rewrite) isabel-lake.vercel.app/ISABEL/*
                 → HTML, RSC, JS, CSS, fuentes, /api/*
```

Una sola persona abriendo la home puede disparar **decenas de Edge Requests** en el proyecto ISABEL. Si un bot o crawler rastrea el sitio, el contador sube a cientos de miles en pocas horas (745K+ Edge Requests / 712K Function Invocations es coherente con eso).

### Recomendación de costo (mejor opción)

En lugar del proxy en EDUGUIA, apunta un **subdominio directo** al proyecto ISABEL en Vercel:

| DNS | Proyecto Vercel |
|-----|-----------------|
| `isabel.edukidsgt.com` | ISABEL (`isabel-lake`) |

En EDUGUIA solo un enlace: `https://isabel.edukidsgt.com` (sin rewrite). Así **no duplicas** tráfico ni invocaciones serverless.

### Mitigaciones ya en ISABEL

- `robots.txt` bloquea crawlers en `/ISABEL/api/*`
- Cache CDN en `/api/places/nearby` (5 min)
- `prefetch={false}` en links del header (menos RSC fantasma)
- Headers `Cache-Control` largos en `/_next/static`

### Revisar en Vercel → Observability

Filtra por ruta: si dominan `/ISABEL/_next/*` es tráfico normal amplificado por proxy; si dominan `/ISABEL/api/places/nearby` o `/ISABEL/api/n8n/*`, hay bots o pruebas repetidas en APIs pesadas.

## Desarrollo local

Sin prefijo (raíz):

```bash
npm run dev
# http://localhost:3000
```

Con prefijo (como producción):

```bash
NEXT_PUBLIC_BASE_PATH=/ISABEL npm run dev
# http://localhost:3000/ISABEL
```
