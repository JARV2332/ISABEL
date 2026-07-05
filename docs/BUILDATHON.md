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

### OpenAI / Groq / Codex (IA) ✅

**En runtime (lo que ven los usuarios):**
- Motor ISA: `src/lib/services/isa-ai.ts` — **Groq** (gratis, prioridad) u **OpenAI**
- Prompt ISA: `src/lib/services/isa-prompt.ts`
- API: `POST /api/isa`
- Fallback en `isa-orchestrator.ts` cuando n8n no genera respuesta

**Codex (categoría buildathon — desarrollo, no runtime):**
- ISABEL se construyó con **Cursor + Codex** (agente de IA para escribir/refactorizar código)
- Evidencia: historial git, `AGENTS.md`, commits incrementales en GitHub
- *Codex no es una API de chat para el usuario final* — para eso usamos Groq/OpenAI como ISA

| Variable | Proveedor | Costo |
|----------|-----------|-------|
| `GROQ_API_KEY` | Groq (Llama 3.3) | Gratis con límites |
| `OPENAI_API_KEY` | OpenAI (GPT) | De pago |

## Checklist stack

| Tecnología | Estado |
|------------|--------|
| Next.js + React 19 + TS | ✅ |
| Tailwind + Shadcn | ✅ |
| Framer Motion | ✅ (dactilología) |
| n8n Cloud | ✅ |
| ElevenLabs | ✅ (con API key) |
| Groq / OpenAI (ISA) | ✅ (con API key) |
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
