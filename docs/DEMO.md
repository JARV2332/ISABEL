# Guía de demo — ISABEL Buildathon

## Guión (3 minutos)

1. **Home** — Mostrar dashboard IoT + actividad reciente (Supabase).
2. **Audición** — Hablar al micrófono → n8n → OpenAI (ISA) → ElevenLabs → dactilología LSM letra por letra.
3. **Habla** — ISA responde con voz natural (ElevenLabs).
4. **IoT** — Botón Emergencia → LED rojo → evento en n8n y Supabase.
5. **Arquitectura** — "El navegador nunca llama APIs directamente; todo pasa por `/api/n8n`".

## Variables requeridas (`.env.local`)

```env
N8N_WEBHOOK_BASE_URL=https://tu-cuenta.app.n8n.cloud
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Workflows n8n a importar

| Archivo | Webhook |
|---------|---------|
| `hearing-pro.json` | `/hearing` |
| `speech-pro.json` | `/speech` |
| `visual-pro.json` | `/visual` |
| `mobility-pro.json` | `/mobility` |
| `iot-prueba.json` | `/iot` |

Importar en n8n → activar (toggle verde) → verificar en **Executions**.

## Flujo técnico

```
Usuario → Módulo UI → useModuleN8n → POST /api/n8n/{module}
  → n8n webhook → (OpenAI + ElevenLabs en workflow o fallback servidor)
  → enrichIsaResponse → log Supabase → JSON al cliente
  → useIsaAudio reproduce audioUrl
```

## Capturas recomendadas para jueces

- n8n Executions con peticiones 200
- Consola Network mostrando `/api/n8n/hearing`
- Panel IoT con LED verde/rojo
- Dactilología LSM en pantalla
