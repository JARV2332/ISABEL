# Conectar tus cuentas reales — ISABEL Buildathon

> **Importante:** El código de ElevenLabs, OpenAI y Supabase **ya está en el repo**, pero **solo se activa cuando pegas tus API keys** en `.env.local` y reinicias el servidor. Hasta ahora solo **n8n** está conectado en tu máquina.

Comprueba el estado en: **http://localhost:3000** (panel amarillo) o **GET /api/status**

---

## Resumen: qué usa qué

```
Usuario habla
    → Web Speech API (navegador, gratis)
    → POST /api/n8n/hearing
        → n8n (tu cuenta jromerodev28) ← YA CONFIGURADO
        → Si hay GROQ_API_KEY u OPENAI_API_KEY → ISA responde con IA
        → Si hay ELEVENLABS_API_KEY → voz MP3 en audioUrl
        → Si hay Supabase → guarda en interactions
    → UI: dactilología LSM + reproduce audio ElevenLabs
```

**Dos formas de usar ElevenLabs/OpenAI:**

| Modo | Dónde van las keys | Para jueces |
|------|-------------------|-------------|
| **A — Rápido (recomendado)** | `.env.local` en ISABEL | Next.js llama APIs después de n8n |
| **B — Pro n8n** | Credenciales dentro de n8n Cloud | Todo visible en Executions de n8n |

Puedes usar **A** para la demo y **B** para impresionar en la categoría n8n.

---

## Paso 0 — Archivo `.env.local`

En la raíz del proyecto (`c:\Users\BDGSA\isabel\.env.local`):

```env
# ─── n8n (YA LO TIENES) ───
N8N_WEBHOOK_BASE_URL=https://jromerodev28.app.n8n.cloud

# ─── IA de ISA (elige una) ───
# Opción A — Groq (GRATIS, recomendado si no tienes créditos OpenAI)
GROQ_API_KEY=gsk_PEGA_AQUI_TU_KEY
GROQ_MODEL=llama-3.3-70b-versatile

# Opción B — OpenAI (si tienes créditos)
# OPENAI_API_KEY=sk-proj-PEGA_AQUI_TU_KEY
# OPENAI_MODEL=gpt-4o-mini

# ─── ElevenLabs ───
ELEVENLABS_API_KEY=PEGA_AQUI_TU_KEY
ELEVENLABS_VOICE_ID=PEGA_ID_DE_VOZ
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Después de **cada cambio**:

```powershell
# Ctrl+C para detener, luego:
npm run dev
```

Verifica: abre http://localhost:3000/api/status — debe mostrar `"configured": 4`

---

## 1. n8n (ya conectado)

### Qué tienes hoy
- URL en `.env.local`: `https://jromerodev28.app.n8n.cloud`
- ISABEL llama: `POST https://jromerodev28.app.n8n.cloud/webhook/{modulo}`

### Qué falta para que sea “pro”
1. Entra a https://jromerodev28.app.n8n.cloud
2. Importa workflows de `docs/n8n-workflows/`:
   - `hearing-prueba.json` → webhook `/hearing`
   - `iot-prueba.json` → webhook `/iot`
   - (opcional) `hearing-pro.json` → con OpenAI + ElevenLabs **dentro** de n8n
3. **Activa** cada workflow (toggle verde)
4. Prueba en **Executions** que lleguen peticiones cuando usas Audición

### Probar manualmente
```powershell
curl -X POST https://jromerodev28.app.n8n.cloud/webhook/hearing `
  -H "Content-Type: application/json" `
  -d '{"event":"hearing.transcribe","moduleId":"hearing","data":{"transcript":"Hola"}}'
```

Debe responder JSON con `"output"`.

---

## 2. IA de ISA — Groq u OpenAI {#2-ia-isa-groq-u-openai}

**No hace falta OpenAI.** ISABEL usa el primer proveedor que encuentre en `.env.local`:

1. **Groq** (gratis, recomendado) — si existe `GROQ_API_KEY`
2. **OpenAI** — si existe `OPENAI_API_KEY` y no hay Groq

### Opción A — Groq (gratis) ⭐

1. https://console.groq.com → crear cuenta
2. **API Keys → Create API Key**
3. Copia la key (empieza con `gsk_...`)
4. Pégala en `.env.local`:

```env
GROQ_API_KEY=gsk_tu_key_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

Modelos útiles: `llama-3.3-70b-versatile` (mejor calidad), `llama-3.1-8b-instant` (más rápido).

### Opción B — OpenAI (si tienes créditos)

1. https://platform.openai.com/api-keys
2. **Create new secret key**
3. Copia la key (empieza con `sk-...`)
4. Pégala en `.env.local` → `OPENAI_API_KEY=`

### Cómo se usa en ISABEL
- Archivo: `src/lib/services/isa-ai.ts`
- Se llama desde `src/lib/services/isa-orchestrator.ts` cuando n8n no devuelve respuesta enriquecida
- También disponible: `POST /api/isa` con body `{ "prompt": "Hola", "moduleId": "hearing" }`

### Probar
```powershell
curl -X POST http://localhost:3000/api/isa `
  -H "Content-Type: application/json" `
  -d '{"prompt":"Hola ISA, como estas?","moduleId":"hearing"}'
```

Debe devolver `{ "output": "..." }` con respuesta de ISA (no error 503).

### En n8n (modo B)
1. n8n → **Settings → Credentials → Add credential → OpenAI** (Groq también acepta credencial OpenAI con base URL `https://api.groq.com/openai/v1`)
2. Pega la API key de Groq u OpenAI
3. En workflow `hearing-pro.json`: nodo **OpenAI** usa esa credencial

---

## 3. ElevenLabs {#3-elevenlabs}

### Obtener API key
1. https://elevenlabs.io → Iniciar sesión en **tu cuenta**
2. Click en tu avatar → **Profile + API key**
3. Copia la key
4. Pégala en `.env.local` → `ELEVENLABS_API_KEY=`

### Obtener Voice ID
1. https://elevenlabs.io/app/voice-library
2. Elige una voz (ej. una voz cálida en español)
3. Click en la voz → **Voice ID** (o en URL)
4. Pégala en `.env.local` → `ELEVENLABS_VOICE_ID=`

Ejemplo de voz multilingüe por defecto si no pones ID: `EXAVITQu4vr4xnSDxMaL` (Sarah)

### Cómo se usa en ISABEL
- Archivo: `src/lib/services/elevenlabs.ts`
- Después de cada respuesta n8n, el orquestador genera `audioUrl` (data URL MP3)
- `useIsaAudio` reproduce ese audio en Audición, Habla, Visual, Movilidad
- También: `POST /api/tts` con `{ "text": "Hola" }` → devuelve audio/mpeg

### Probar voz
```powershell
curl -X POST http://localhost:3000/api/tts `
  -H "Content-Type: application/json" `
  -d '{"text":"Hola, soy ISA de ISABEL"}' `
  --output prueba-isa.mp3
```

Abre `prueba-isa.mp3` — debe sonar la voz ElevenLabs.

### Probar flujo completo
1. Configura GROQ (o OpenAI) + ELEVENLABS en `.env.local`
2. Reinicia `npm run dev`
3. Ve a `/modulos/audicion` → habla → detén micrófono
4. Debes escuchar voz ElevenLabs (no la voz robótica del navegador)

### En n8n (modo B — para jueces)
1. n8n → **Settings → Variables**:
   - `ELEVENLABS_API_KEY` = tu key
   - `ELEVENLABS_VOICE_ID` = tu voice id
2. Importa `docs/n8n-workflows/hearing-pro.json`
3. El nodo HTTP Request llama a `api.elevenlabs.io`
4. En Executions verás la cadena: Webhook → OpenAI → ElevenLabs → Respond

---

## 4. Supabase {#4-supabase}

### Crear proyecto
1. https://supabase.com → New project
2. Anota **Project URL** y **anon public key**
3. Settings → API → **service_role key** (solo servidor, nunca en frontend)

### Crear tablas
1. Supabase → **SQL Editor**
2. Pega y ejecuta el contenido de `supabase/migrations/001_interactions.sql`

### Configurar `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Cómo se usa
- Cada llamada a `/api/n8n/*` guarda en tabla `interactions`
- Botones IoT guardan en `iot_events`
- Home muestra **Actividad reciente** desde `/api/interactions`

### Probar
1. Usa cualquier módulo
2. Supabase → **Table Editor → interactions** → debe aparecer una fila

---

## 5. Checklist antes de la buildathon

- [ ] `/api/status` muestra 4/4 servicios en verde
- [ ] `/api/tts` genera MP3 con tu voz ElevenLabs
- [ ] `/api/isa` responde con personalidad ISA (Groq u OpenAI)
- [ ] n8n Executions muestra llamadas al hablar en Audición
- [ ] Panel IoT cambia LED al pulsar Emergencia
- [ ] Supabase `interactions` tiene filas

---

## 6. Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Voz robótica del navegador | Sin ElevenLabs key | Agregar `ELEVENLABS_API_KEY` y reiniciar |
| ISA repite lo que dijiste | Sin IA configurada | Agregar `GROQ_API_KEY` (gratis) u `OPENAI_API_KEY` |
| Error 503 en /api/tts | Key inválida o sin créditos | Revisar dashboard ElevenLabs |
| n8n 404 | Workflow inactivo | Activar toggle verde en n8n |
| Sin historial en home | Supabase sin migración | Ejecutar SQL migration |
| Panel amarillo 1/4 | Solo n8n configurado | Completar `.env.local` |

---

## 7. Qué decir a los jueces

> "ISABEL orquesta con **n8n Cloud**. La IA conversacional de ISA corre con **Groq (Llama)** en runtime — API compatible con OpenAI. **ElevenLabs** sintetiza la voz y **Supabase** registra interacciones. El proyecto se desarrolló con **Cursor y Codex** (agente de IA para código). Pueden verlo en n8n Executions y en `/api/status`."

Si usas **modo A** (keys en `.env.local`), aclara que n8n recibe el evento y Next.js enriquece con IA/voz — igual es válido para buildathon si muestras Executions de n8n.
