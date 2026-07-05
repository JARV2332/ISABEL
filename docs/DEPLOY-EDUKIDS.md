# ISABEL bajo edukidsgt.com/ISABEL

ISABEL se despliega como **producto separado** (repo `JARV2332/ISABEL`) y se expone en el dominio principal de EDUKIDS mediante rewrites en Vercel.

## Arquitectura

| URL | Proyecto |
|-----|----------|
| `https://www.edukidsgt.com/` | EDUGUIA (repo `JARV2332/EDUGUIA`) |
| `https://www.edukidsgt.com/ISABEL` | ISABEL → `isabel-lake.vercel.app/ISABEL` |

## ISABEL (este repo)

- `next.config.ts` usa `basePath: '/ISABEL'` en producción.
- Las llamadas `fetch('/api/...')` usan `withBasePath()` desde `src/lib/base-path.ts`.
- URL canónica: `NEXT_PUBLIC_SITE_URL=https://www.edukidsgt.com/ISABEL` (opcional en Vercel).

Deploy directo: `https://isabel-lake.vercel.app/ISABEL`

## EDUGUIA

`vercel.json` incluye:

```json
{
  "source": "/ISABEL/:path*",
  "destination": "https://isabel-lake.vercel.app/ISABEL/:path*"
}
```

El header y la home tienen enlace **ISABEL** → `/ISABEL`.

## Verificación

1. Deploy ISABEL en Vercel (push a `main`).
2. Deploy EDUGUIA en Vercel (push a `main`).
3. Abrir `https://www.edukidsgt.com/ISABEL`
4. Probar un módulo y una API (p. ej. pizarra → `/ISABEL/api/handwriting`).

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
