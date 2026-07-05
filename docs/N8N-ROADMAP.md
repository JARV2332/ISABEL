# ISABEL — Qué más puede hacer con n8n

Guía para el track **Mejor uso de n8n** del buildathon. n8n es el **cerebro de automatización** entre ISABEL, IA, voz, mapas y alertas.

---

## Arquitectura: qué pasa por n8n hoy

```
┌─────────────────────────────────────────────────────────────┐
│  ISABEL (navegador) — nunca expone API keys                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  /api/n8n/{modulo}   /api/places/*     Supabase log
  (síncrono)          (async notify)    (directo)
         │                  │
         ▼                  ▼
    n8n webhooks      n8n mobility-events
    hearing          (búsquedas, reportes,
    speech            emergencias)
    visual
    mobility
    iot
```

| Flujo | Webhook n8n | ¿Cuándo? |
|-------|-------------|----------|
| Audición (voz → señas) | `/hearing` | Al transcribir / capturar seña |
| Habla (pizarra / voz) | `/speech` | Al enviar mensaje |
| Visual (PDF / texto) | `/visual` | Al describir contenido |
| Movilidad (pictogramas) | `/mobility` | Al enviar mensaje |
| IoT (emergencia, LED) | `/iot` | Al pulsar botones home |
| **Eventos async** | `/mobility-events` | Búsqueda lugares, reportes, emergencia |
| Reporte diario (cron) | Schedule → HTTP | Cada día 18:00 (workflow opcional) |

---

## Workflows listos para importar

Carpeta: `docs/n8n-workflows/`

| Archivo | Path webhook | Qué hace |
|---------|--------------|----------|
| `hearing-pro.json` | `hearing` | OpenAI + ElevenLabs |
| `speech-pro.json` | `speech` | OpenAI ISA respuestas |
| `visual-pro.json` | `visual` | OpenAI describe/simplifica |
| `mobility-pro.json` | `mobility` | OpenAI + pictogramas |
| `iot-emergency-pro.json` | `iot` | IF emergencia → LED rojo |
| **`mobility-events-pro.json`** | **`mobility-events`** | Switch: búsqueda / reporte / emergencia |
| `hearing-prueba.json` | `hearing` | Prueba mínima |
| `mobility-prueba.json` | `mobility` | Prueba mínima |
| `iot-prueba.json` | `iot` | Prueba mínima |

### Importar en 3 minutos

1. n8n → **Workflows** → **Import from file**
2. Selecciona los `.json` de la carpeta
3. **Activa** cada workflow (toggle verde)
4. En `.env.local` y Vercel:

```env
N8N_WEBHOOK_BASE_URL=https://tu-cuenta.app.n8n.cloud
# Opcional si n8n pide auth:
# N8N_API_KEY=tu-key
```

5. Reinicia ISABEL (`npm run dev`) o redeploy Vercel

---

## Eventos que ISABEL envía a n8n automáticamente

Desde el código (`src/lib/services/n8n-notify.ts`):

| Evento | Disparador | Payload `data` |
|--------|------------|----------------|
| `mobility.places-search` | Buscar lugares cerca (15 km) | `latitude`, `longitude`, `category`, `placesFound`, `locationLabel` |
| `mobility.place-report` | Usuario reporta accesibilidad | `placeId`, `placeName`, `rating`, `notes`, coords |
| `iot.emergency` | Botón emergencia en home | `action`, `led`, `output` |

El workflow `mobility-events-pro.json` recibe estos eventos y puedes **añadir nodos**:
- **Gmail** → alerta al docente / familia
- **Slack / Telegram** → canal del aula
- **Google Sheets** → bitácora de búsquedas
- **Supabase** → INSERT en tabla propia
- **HTTP Request** → llamar otra API

---

## Ideas PRO para impresionar a los jueces n8n

### 1. Alerta docente por lugar no accesible
```
mobility-events → IF rating = inaccessible
  → Gmail: "Alumno reportó {{ placeName }} como no accesible"
  → Slack #aula-inclusiva
```

### 2. Emergencia IoT en cadena
```
iot webhook → IF emergency
  → Gmail + SMS (Twilio)
  → HTTP POST mobility-events (duplicado)
  → Supabase iot_events
```

### 3. Reporte pedagógico diario (Cron)
```
Schedule 18:00
  → HTTP GET https://isabel-lake.vercel.app/api/interactions
  → OpenAI: "Resume actividad del día en aula inclusiva"
  → ElevenLabs: audio del resumen
  → Gmail al docente con audio adjunto
```

### 4. Audición completa en n8n (no solo fallback)
```
hearing webhook
  → IF sign-capture → Sign-Speak recognize
  → ELSE → Groq/OpenAI simplifica texto
  → ElevenLabs TTS
  → Code: generar signSequence LSM
  → Supabase INSERT interaction
  → Respond JSON
```

### 5. Lugares accesibles 100% en n8n (avanzado)
```
mobility-events (places-search)
  → HTTP Overpass API (misma query que ISABEL)
  → Merge con Supabase accessibility_reports
  → IF placesFound = 0 → Gmail "sin lugares cerca"
  → Google Sheets log
```
*Hoy ISABEL busca en OpenStreetMap directo por velocidad; n8n recibe el evento para automatizar consecuencias.*

### 6. Sub-workflows reutilizables
Crea en n8n:
- `isa-respond` — texto → OpenAI → output
- `tts-elevenlabs` — texto → MP3
- `log-supabase` — cualquier payload → HTTP POST

### 7. WhatsApp Business (si tienes API)
Reporte de accesibilidad → mensaje a contacto del aula con enlace Google Maps.

---

## Nodos n8n recomendados por caso

| Caso | Nodos |
|------|-------|
| IA | OpenAI, Groq (HTTP Request) |
| Voz | ElevenLabs (HTTP Request) |
| Mapas | HTTP Request → Overpass / Nominatim |
| Base de datos | Supabase, Postgres |
| Alertas | Gmail, Slack, Telegram, Twilio |
| Programación | Schedule Trigger |
| Lógica | IF, Switch, Merge, Code |
| Errores | Error Trigger + retry |

---

## Variables de entorno en n8n

En **Settings → Variables**:

| Variable | Uso |
|----------|-----|
| `OPENAI_API_KEY` | Nodos OpenAI |
| `ELEVENLABS_API_KEY` | TTS en workflow |
| `ELEVENLABS_VOICE_ID` | Voz ISA |
| `TEACHER_EMAIL` | Alertas Gmail |
| `ISABEL_URL` | `https://isabel-lake.vercel.app` |

---

## Demo de 2 minutos para jueces n8n

1. Abre **n8n → Executions** en una pestaña
2. En ISABEL: **Audición** → habla → muestra ejecución `hearing`
3. **Movilidad → Lugares** → busca cerca → ejecución `mobility-events`
4. Reporta un lugar **No accesible** → ejecución con rama IF
5. **Home → Emergencia IoT** → ejecución `iot` + `mobility-events`
6. Di: *"El navegador nunca llama APIs directamente; n8n orquesta IA, voz, alertas y logging"*

---

## Próximos pasos sugeridos

- [ ] Importar todos los workflows PRO
- [ ] Conectar Gmail en `mobility-events-pro` (rama reporte + emergencia)
- [ ] Activar `hearing-pro` con OpenAI + ElevenLabs
- [ ] Crear workflow Cron reporte diario
- [ ] Captura de Executions para la presentación

Ver también: [N8N-SETUP.md](./N8N-SETUP.md) · [BUILDATHON.md](./BUILDATHON.md)
