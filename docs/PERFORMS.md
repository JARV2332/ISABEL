# Avatar 3D con Performs (gratis, open source)

ISABEL integra **[Performs](https://performs.gti.upf.edu)** de la Universidad Pompeu Fabra (UPF) para mostrar un **personaje 3D humanoide** que interpreta señas en el navegador.

## Cómo funciona

```
Texto / pictograma → glosa LSM → BML (Performs) → avatar 3D animado
```

| Archivo | Rol |
|---------|-----|
| `public/performs/player.html` | Reproductor embebido (iframe) |
| `src/lib/services/performs-bml.ts` | Convierte glosas en animaciones BML |
| `src/components/modules/shared/PerformsAvatar.tsx` | Componente iframe accesible |
| `SignLanguageAvatar.tsx` | Orquesta Performs + controles + glosas |

## Dónde verlo

- `/modulos/audicion` — pestaña micrófono o cámara, tras recibir respuesta
- `/modulos/movilidad` — tras enviar pictogramas

## Limitación importante

Performs **no incluye LSM nativo**. Las animaciones actuales son **aproximaciones visuales** (saludo, mano al pecho, asentir, etc.) generadas con instrucciones BML.

Para señas LSM **exactas y certificadas**:

1. Abre **[Animics](https://animics.gti.upf.edu)** (editor web gratuito)
2. Crea la animación de cada seña en modo Script
3. Exporta el BML/SiGML
4. Añade la entrada en `performs-bml.ts` o envíala desde n8n en la respuesta

## Crear señas personalizadas en Animics

1. Ve a https://animics.gti.upf.edu
2. Modo **Script** → crea clips para cada seña LSM
3. Exporta la animación
4. Visualiza en Performs con el botón de preview
5. Copia el JSON BML al glosario de ISABEL

## Recursos

- Performs: https://performs.gti.upf.edu
- Animics: https://animics.gti.upf.edu
- Atelier (config avatar): https://atelier.gti.upf.edu
- GitHub Performs: https://github.com/upf-gti/performs
- Licencia: Apache 2.0

## Requisitos

- Conexión a internet (carga avatar ReadyEva desde servidores UPF)
- Navegador con WebGL
