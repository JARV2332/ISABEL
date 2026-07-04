# ISABEL — Estación de Accesibilidad EDUKIDS

Estación web inteligente con 4 módulos: **Audición**, **Habla**, **Visual** y **Movilidad**.

Repositorio: [github.com/JARV2332/ISABEL](https://github.com/JARV2332/ISABEL)

## Stack Buildathon

| Categoría | Integración |
|-----------|-------------|
| **n8n** | Orquestador — webhooks por módulo + IoT |
| **ElevenLabs** | Voz de ISA (`/api/tts` + `audioUrl` desde n8n) |
| **OpenAI** | Respuestas conversacionales ISA (`/api/isa`) |
| **Supabase** | Log de interacciones e eventos IoT |

Ver [docs/BUILDATHON.md](docs/BUILDATHON.md) y [docs/DEMO.md](docs/DEMO.md).

## Inicio rápido

```bash
cp .env.example .env.local
# Completar N8N_WEBHOOK_BASE_URL, OPENAI_API_KEY, ELEVENLABS_API_KEY, Supabase

npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Módulos

| Ruta | Función |
|------|---------|
| `/modulos/audicion` | Micrófono / cámara → señas LSM (dactilología) |
| `/modulos/habla` | Comunicación asistida por voz |
| `/modulos/visual` | Texto a voz accesible |
| `/modulos/movilidad` | Pictogramas → voz y señas |

## n8n

Importar workflows desde `docs/n8n-workflows/` y configurar `N8N_WEBHOOK_BASE_URL`.

Guía completa: [docs/N8N-SETUP.md](docs/N8N-SETUP.md)

## Supabase

Ejecutar migración: `supabase/migrations/001_interactions.sql`

## Scripts

```bash
npm run signs:split-alphabet   # Recortar abecedario LSM en PNG
npm run build
```

## Arquitectura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
