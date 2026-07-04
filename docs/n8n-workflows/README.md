# Workflows de ejemplo para n8n

Importa estos workflows en n8n: **Workflows → Import from file**

## hearing-prueba.json

Workflow mínimo para probar la conexión con ISABEL (módulo Audición).

## hearing-pro.json

Workflow PRO con nodos OpenAI + ElevenLabs (requiere credenciales en n8n).

## iot-prueba.json

Webhook `/iot` para panel IoT simulado en la home.

**Path del webhook:** `hearing`

**Respuesta:** JSON con texto y secuencia de señas LSM.

## Cómo importar

1. En n8n: menú **⋯** → **Import from file**
2. Selecciona el archivo `.json` de esta carpeta
3. Activa el workflow (toggle verde)
4. Copia la Production URL del nodo Webhook
5. Configura `N8N_WEBHOOK_BASE_URL` en `.env.local`

## Estructura mínima de respuesta

Todos los workflows deben responder con JSON:

```json
{
  "output": "Texto para mostrar al usuario",
  "avatarVideoUrl": "https://opcional-video-sign-speak.mp4",
  "signSequence": [
    { "gloss": "HOLA", "label": "Hola", "icon": "👋" }
  ],
  "signLanguage": "LSM"
}
```

Ver guía completa en [N8N-SETUP.md](../N8N-SETUP.md).
