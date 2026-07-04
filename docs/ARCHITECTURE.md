# ISABEL — Arquitectura del Proyecto

> Estación inteligente de accesibilidad para EDUKIDS  
> Enfoque: **Feature-First Architecture** (orientada a funcionalidades)

## Visión general

ISABEL se organiza en capas desacopladas. Cada módulo de accesibilidad es independiente y se comunica con los servicios externos únicamente a través de la capa `src/lib/services`. Los componentes de UI no llaman APIs directamente.

```
┌─────────────────────────────────────────────────────────┐
│                    App Router (src/app)                  │
│              Páginas y rutas por módulo                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Components (src/components)                 │
│  ┌──────────┐  ┌──────────────────────────────────────┐   │
│  │   ui/    │  │  modules/  +  layout/                │   │
│  │ (shadcn) │  │  hearing · speech · visual · mobility│   │
│  └──────────┘  └──────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  Hooks (src/lib/hooks)                   │
│         useVoice · useSpeech · (futuros hooks)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Services (src/lib/services)                │
│    supabase · elevenlabs · openai · n8n                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Proveedores externos (APIs)                 │
└─────────────────────────────────────────────────────────┘
```

## Estructura de carpetas

```
src/
├── app/                    # Rutas Next.js (App Router)
├── components/
│   ├── ui/                 # Componentes base Shadcn/UI
│   ├── layout/             # Header, Layout, estructura global
│   └── modules/            # Definición y UI por módulo
│       ├── hearing/
│       ├── speech/
│       ├── visual/
│       └── mobility/
├── lib/
│   ├── services/           # Integraciones con APIs externas
│   ├── hooks/              # Hooks reutilizables
│   ├── supabase.ts         # Re-export del cliente Supabase
│   └── utils.ts            # Utilidades (cn, etc.)
└── types/
    ├── module.ts           # ModuleInterface y tipos de módulo
    └── database.ts         # Tipos del esquema Supabase
```

## Contrato de módulos (`ModuleInterface`)

Todo módulo debe implementar `ModuleInterface` definido en `src/types/module.ts`:

| Campo           | Propósito                                      |
|-----------------|------------------------------------------------|
| `id`            | Identificador único (`hearing`, `speech`, …)   |
| `name`          | Nombre visible en navegación                     |
| `description`   | Descripción accesible del módulo               |
| `status`        | Estado operativo (`idle`, `active`, …)         |
| `route`         | Ruta de navegación                             |
| `enabled`       | Si el módulo está activo en la estación        |
| `capabilities`  | Permisos y servicios que consume               |

El registro central vive en `src/components/modules/index.ts` (`moduleRegistry`).

## Flujo de comunicación: Módulo → Servicio

1. **UI del módulo** (`src/components/modules/{modulo}/`) renderiza la interfaz accesible.
2. **Hook** (`src/lib/hooks/`) encapsula estado, efectos y lógica del navegador (micrófono, voz, etc.).
3. **Servicio** (`src/lib/services/`) ejecuta la llamada HTTP/SDK al proveedor externo.
4. **Tipos** (`src/types/`) garantizan contratos compartidos entre capas.

### Ejemplo de flujo (módulo Habla)

```
Usuario habla
    → useSpeech() captura audio
        → openAIService.transcribe(audio)
            → Supabase guarda sesión (opcional)
                → UI actualiza transcript
```

### Servicios disponibles

| Servicio    | Archivo                        | Responsabilidad                    |
|-------------|--------------------------------|------------------------------------|
| Supabase    | `lib/services/supabase.ts`     | Persistencia, auth, realtime       |
| ElevenLabs  | `lib/services/elevenlabs.ts`   | Síntesis de voz (TTS)              |
| OpenAI      | `lib/services/openai.ts`       | NLP, transcripción, completado     |
| n8n         | `lib/services/n8n.ts`          | Orquestación de flujos automatizados |

> Los servicios actuales son **stubs** (caja negra). Conecta las API keys en `.env.local` e implementa cada método cuando estés listo.

## Accesibilidad (WCAG 2.1 AA)

- **Contraste**: paleta ISABEL (azul profundo, índigo, cian) validada para texto sobre fondos oscuros/claros.
- **Navegación por teclado**: skip-link, `:focus-visible`, menú móvil con `aria-expanded`.
- **Semántica**: `<header>`, `<nav>`, `<main>`, `aria-label`, `aria-current="page"`.
- **Texto escalable**: unidades `rem`, sin bloqueo de zoom.
- **Movimiento reducido**: respetar `prefers-reduced-motion` en animaciones (Framer Motion).

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Futuras integraciones:
# ELEVENLABS_API_KEY=
# OPENAI_API_KEY=
# N8N_WEBHOOK_URL=
```

## Próximos pasos

1. Definir esquema Supabase y regenerar `src/types/database.ts`.
2. Implementar métodos en cada servicio stub.
3. Conectar hooks (`useVoice`, `useSpeech`) con los servicios.
4. Crear UI específica por módulo en `src/components/modules/{modulo}/`.
5. Añadir tests de accesibilidad (axe-core, jest-axe).
