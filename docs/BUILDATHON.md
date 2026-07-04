# ISABEL — Stack Buildathon

## Categorías de evaluación

### n8n (Automatización) ✅
- Proxy seguro: `src/app/api/n8n/[moduleId]/route.ts`
- 5 webhooks: hearing, speech, visual, mobility, **iot**
- Workflows importables en `docs/n8n-workflows/`
- Logging a Supabase por cada interacción

### ElevenLabs (Voz) ✅
- Servicio: `src/lib/services/elevenlabs.ts`
- API: `POST /api/tts`
- Orquestador enriquece respuestas con `audioUrl`
- Hook `useIsaAudio` reproduce en todos los módulos

### OpenAI / Codex (IA) ✅
- Prompt ISA: `src/lib/services/isa-prompt.ts`
- Servicio: `src/lib/services/openai.ts`
- API: `POST /api/isa`
- Fallback en `isa-orchestrator.ts` cuando n8n no genera respuesta

## Checklist stack

| Tecnología | Estado |
|------------|--------|
| Next.js + React 19 + TS | ✅ |
| Tailwind + Shadcn | ✅ |
| Framer Motion | ✅ (dactilología) |
| n8n Cloud | ✅ |
| ElevenLabs | ✅ (con API key) |
| OpenAI | ✅ (con API key) |
| Supabase | ✅ (schema + logging) |
| Web Speech API | ✅ |
| Cámara WebRTC | ✅ |
| Dactilología LSM | ✅ |
| IoT simulado | ✅ |
| Dark mode | ✅ |
| Toasts + Skeleton | ✅ |
| ESLint | ✅ |

## Repositorio

https://github.com/JARV2332/ISABEL

## Deploy

```bash
npm run build
# Vercel: conectar repo y configurar env vars
```
