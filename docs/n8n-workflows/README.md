# Workflows de ejemplo para n8n

Importa en n8n: **Workflows → Import from file**

Guía completa de uso: **[N8N-ROADMAP.md](../N8N-ROADMAP.md)**

## Workflows PRO (recomendados para buildathon)

| Archivo | Webhook | Descripción |
|---------|---------|-------------|
| `hearing-pro.json` | `hearing` | OpenAI + ElevenLabs |
| `speech-pro.json` | `speech` | OpenAI ISA módulo Habla |
| `visual-pro.json` | `visual` | OpenAI describe texto |
| `mobility-pro.json` | `mobility` | OpenAI + pictogramas |
| `iot-emergency-pro.json` | `iot` | IF emergencia → LED rojo |
| **`mobility-events-pro.json`** | **`mobility-events`** | Eventos async: búsqueda lugares, reportes, emergencia |

## Workflows de prueba (mínimos)

| Archivo | Webhook |
|---------|---------|
| `hearing-prueba.json` | `hearing` |
| `mobility-prueba.json` | `mobility` |
| `iot-prueba.json` | `iot` |

## Configuración

```env
N8N_WEBHOOK_BASE_URL=https://tu-cuenta.app.n8n.cloud
```

Sin barra final. ISABEL llama `{BASE}/webhook/{path}`.

## Eventos async (mobility-events)

ISABEL envía automáticamente (no bloquea al usuario):

- `mobility.places-search` — búsqueda de lugares accesibles
- `mobility.place-report` — reporte comunitario de accesibilidad
- `iot.emergency` — botón emergencia

Añade nodos Gmail/Slack después del Switch en `mobility-events-pro.json`.

## Respuesta mínima (webhooks síncronos)

```json
{
  "output": "Texto para el usuario",
  "signSequence": [{ "gloss": "HOLA", "label": "Hola", "icon": "👋" }],
  "signLanguage": "LSM"
}
```

Ver [N8N-SETUP.md](../N8N-SETUP.md) para Sign-Speak y más detalle.
