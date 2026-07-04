# Guía: Conectar n8n + Sign-Speak con ISABEL

> **Para quién es esta guía:** Si nunca has usado n8n y no tienes cuenta, sigue los pasos en orden. Al final, ISABEL podrá enviar datos a n8n y recibir respuestas con avatar de señas y reconocimiento de gestos.

---

## ¿Qué es n8n y por qué lo necesitas?

**n8n** es un orquestador visual (como un "cableado" entre servicios). ISABEL no llama directamente a Sign-Speak desde el navegador por seguridad. El flujo es:

```
ISABEL (navegador)
    ↓  POST /api/n8n/hearing
Next.js (servidor)
    ↓  POST webhook
n8n (tu cuenta)
    ↓  HTTP Request
Sign-Speak API
    ↓  respuesta JSON
ISABEL muestra avatar / texto
```

**Ventaja:** Las API keys quedan en el servidor, no en el navegador del alumno.

---

## Paso 0 — Requisitos previos

- Node.js instalado (ya lo tienes para ISABEL)
- Cuenta de correo para registrarte
- Proyecto ISABEL corriendo (`npm run dev`)

---

## Paso 1 — Crear cuenta en n8n (GRATIS)

Tienes dos opciones:

### Opción A: n8n Cloud (recomendada para empezar)

1. Ve a **https://n8n.io**
2. Clic en **Get started free**
3. Regístrate con email o Google
4. Elige el plan **Free trial** (14 días gratis, suficiente para probar)
5. Te darán una URL como: `https://tu-nombre.app.n8n.cloud`

### Opción B: n8n local con Docker (100% gratis, sin límite de tiempo)

```powershell
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

Abre **http://localhost:5678** y crea tu usuario admin.

---

## Paso 2 — Tu primer workflow de prueba

1. En n8n, clic en **+ Add workflow**
2. Arrastra el nodo **Webhook** (busca "Webhook" en el panel izquierdo)
3. Configura el Webhook:
   - **HTTP Method:** POST
   - **Path:** `hearing`  ← esto coincide con el módulo de Audición
   - **Respond:** Immediately
   - **Response Code:** 200
4. Arrastra un nodo **Respond to Webhook** y conéctalo al Webhook
5. En "Respond to Webhook", pon este JSON en **Response Body**:

```json
{
  "output": "Hola, bienvenido a ISABEL",
  "signLanguage": "LSM",
  "signSequence": [
    { "gloss": "HOLA", "label": "Hola", "icon": "👋" },
    { "gloss": "BIENVENIDO", "label": "Bienvenido", "icon": "🤗" }
  ]
}
```

6. Clic en **Save** (arriba a la derecha)
7. **Activa el workflow** con el toggle "Inactive → Active" (arriba a la derecha)
8. Clic en el nodo Webhook → copia la **Production URL**. Se verá así:

```
https://tu-nombre.app.n8n.cloud/webhook/hearing
```

---

## Paso 3 — Conectar ISABEL con n8n

1. En la raíz del proyecto ISABEL, copia el archivo de entorno:

```powershell
copy .env.example .env.local
```

2. Abre `.env.local` y agrega la URL base de n8n **sin** el `/webhook/hearing` al final:

```bash
# URL base de n8n (sin /webhook/...)
N8N_WEBHOOK_BASE_URL=https://tu-nombre.app.n8n.cloud

# Opcional: si n8n pide autenticación
# N8N_API_KEY=tu-api-key
```

3. Reinicia el servidor de ISABEL:

```powershell
# Detén el servidor (Ctrl+C) y vuelve a levantarlo
npm run dev
```

4. Prueba:
   - Abre http://localhost:3000/modulos/audicion
   - Activa el micrófono, habla algo, detén
   - Deberías ver la respuesta que configuraste en n8n (no la simulada)

---

## Paso 4 — Crear workflows para cada módulo

Repite el Paso 2 para cada módulo, cambiando solo el **Path** del Webhook:

| Módulo    | Path del Webhook | Ruta en ISABEL           |
|-----------|------------------|--------------------------|
| Audición  | `hearing`        | `/modulos/audicion`      |
| Habla     | `speech`         | `/modulos/habla`         |
| Visual    | `visual`         | `/modulos/visual`        |
| Movilidad | `mobility`       | `/modulos/movilidad`     |

Cada workflow puede devolver el mismo formato JSON:

```json
{
  "output": "Texto para el usuario",
  "avatarVideoUrl": "https://url-del-video.mp4",
  "signSequence": [
    { "gloss": "HOLA", "label": "Hola", "icon": "👋", "videoUrl": "/signs/hola.mp4" }
  ],
  "signLanguage": "LSM"
}
```

---

## Paso 5 — Obtener cuenta Sign-Speak (avatar en video real)

1. Ve a **https://sign-speak.com**
2. Clic en **Request demo** o regístrate en el portal de desarrolladores
3. Obtendrás una **API Key**
4. Agrégala en `.env.local` (solo servidor, nunca en el navegador):

```bash
SIGN_SPEAK_API_KEY=tu-api-key-de-sign-speak
```

> **Nota:** Sign-Speak usa principalmente ASL (Lengua de Señas Americana). Para LSM mexicana a largo plazo conviene combinar videos propios + glosario local que ya tiene ISABEL.

Con la API key configurada, ISABEL enriquece automáticamente las respuestas:
- **Micrófono → texto → avatar video** (produceASL)
- **Cámara → seña → texto** (recognizeASL)

---

## Paso 6 — Workflow n8n con Sign-Speak (avatar video)

Este workflow convierte texto en video de avatar firmando.

### Nodos del workflow `hearing`:

```
[Webhook: hearing]
      ↓
[IF: evento contiene "sign-capture"?]
   ↓ SÍ                          ↓ NO
[HTTP Request: recognizeASL]   [HTTP Request: produceASL]
   ↓                              ↓
[Respond to Webhook]  ←──────────┘
```

### Nodo HTTP Request — produceASL (texto → video avatar)

- **Method:** POST
- **URL:** `https://api.sign-speak.com/produceASL`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `={{$env.SIGN_SPEAK_API_KEY}}`
- **Body (JSON):**

```json
{
  "english": "={{ $json.body.data.input || $json.body.data.transcript }}",
  "model": "FEMALE",
  "request_class": "BLOCKING"
}
```

### Nodo HTTP Request — recognizeASL (cámara → texto)

- **Method:** POST
- **URL:** `https://api.sign-speak.com/recognizeASL`
- **Headers:** igual que arriba
- **Body (JSON):**

```json
{
  "payload": "={{ $json.body.data.videoFrame }}"
}
```

### Respond to Webhook — respuesta final

```json
{
  "output": "={{ $json.text || $json.english || $json.body.data.input }}",
  "avatarVideoUrl": "={{ $json.video_url || $json.url }}"
}
```

### Guardar API key en n8n (más seguro)

1. En n8n: **Settings → Variables**
2. Crea variable: `SIGN_SPEAK_API_KEY` = tu key
3. En el nodo HTTP usa: `={{$env.SIGN_SPEAK_API_KEY}}`

---

## Paso 7 — Workflow Movilidad (pictogramas → señas)

Path del webhook: `mobility`

```
[Webhook: mobility]
      ↓
[Set: extraer mensaje]
  message = {{ $json.body.data.input }}
      ↓
[HTTP Request: produceASL]  ← opcional si tienes Sign-Speak
      ↓
[Code: generar signSequence desde glosario]
      ↓
[Respond to Webhook]
```

Respuesta de ejemplo:

```json
{
  "output": "Hola. Necesito ayuda",
  "avatarVideoUrl": "https://...",
  "signSequence": [
    { "gloss": "HOLA", "label": "Hola", "icon": "👋" },
    { "gloss": "AYUDA", "label": "Ayuda", "icon": "🆘" }
  ]
}
```

---

## Paso 8 — Probar las 3 funcionalidades

### 1. Avatar video (Sign-Speak vía n8n)
- `/modulos/audicion` → pestaña **Micrófono**
- Habla → detén → debe aparecer avatar con video o secuencia de señas

### 2. Cámara sign-to-text
- `/modulos/audicion` → pestaña **Cámara (señas)**
- Activa cámara → haz una seña → **Capturar seña**
- El texto reconocido aparece abajo

### 3. Pictogramas → señas (Movilidad)
- `/modulos/movilidad`
- Selecciona pictogramas → **Enviar mensaje**
- Aparece avatar LSM + texto + voz

---

## Formato de datos que envía ISABEL

Cada llamada a n8n lleva este JSON:

```json
{
  "event": "hearing.transcribe",
  "moduleId": "hearing",
  "data": {
    "input": "texto del usuario",
    "transcript": "transcripción del micrófono"
  }
}
```

Eventos disponibles:

| Evento | Módulo | Descripción |
|--------|--------|-------------|
| `hearing.transcribe` | Audición | Audio transcrito → avatar |
| `hearing.sign-capture` | Audición | Frame de cámara → texto |
| `hearing.sign-produce` | Audición | Texto reconocido → avatar |
| `mobility.communicate` | Movilidad | Pictogramas → avatar |
| `speech.process` | Habla | Voz → texto/voz |
| `visual.describe` | Visual | Texto → voz |

---

## Solución de problemas

### "Respuesta simulada" sigue apareciendo
- Verifica que `.env.local` tiene `N8N_WEBHOOK_BASE_URL`
- Reinicia `npm run dev` después de cambiar `.env.local`
- Confirma que el workflow en n8n está **Active** (toggle verde)

### Error CORS o 404
- La URL debe ser la **Production URL** del webhook, no la Test URL
- En `.env.local` usa solo la base: `https://tu.app.n8n.cloud` (sin `/webhook`)

### El avatar no muestra video
- Sign-Speak requiere `SIGN_SPEAK_API_KEY` en `.env.local`
- O que n8n devuelva `avatarVideoUrl` en la respuesta JSON

### La cámara no funciona
- El navegador debe estar en `https://` o `localhost`
- Acepta el permiso de cámara cuando el navegador lo pida

### n8n no recibe datos
- Abre n8n → **Executions** (ejecuciones) para ver si llegó la petición
- Revisa que el path del webhook coincida: `hearing`, `mobility`, etc.

---

## Orden recomendado de implementación

```
Semana 1:  Cuenta n8n → workflow de prueba → conectar ISABEL
Semana 2:  Workflows hearing + mobility con respuestas JSON manuales
Semana 3:  Cuenta Sign-Speak → integrar produceASL en n8n
Semana 4:  Integrar recognizeASL (cámara) + videos LSM propios
```

---

## Variables de entorno — resumen

```bash
# .env.local

# n8n (obligatorio para salir del modo simulado)
N8N_WEBHOOK_BASE_URL=https://tu-nombre.app.n8n.cloud

# Sign-Speak (opcional — avatar video real)
SIGN_SPEAK_API_KEY=tu-api-key

# Supabase (cuando lo configures)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## ¿Necesitas ayuda?

1. Revisa las ejecuciones en n8n (**Executions**)
2. Abre la consola del navegador (F12) → pestaña **Network** → busca llamadas a `/api/n8n/`
3. Los workflows de ejemplo están en `docs/n8n-workflows/`
