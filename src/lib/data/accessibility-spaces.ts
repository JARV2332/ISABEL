import type { AccessibilitySpace } from "@/types/accessibility-space";

const SECTION_IDS = {
  welcome: "bienvenida",
  contents: "contenido",
  accessibility: "accesibilidad",
  help: "ayuda",
} as const;

function sections(
  welcome: string,
  contents: string,
  accessibility: string,
  help: string
) {
  return [
    { id: SECTION_IDS.welcome, title: "Bienvenida", content: welcome },
    { id: SECTION_IDS.contents, title: "Qué hay aquí", content: contents },
    {
      id: SECTION_IDS.accessibility,
      title: "Accesibilidad",
      content: accessibility,
    },
    { id: SECTION_IDS.help, title: "Ayuda", content: help },
  ];
}

/** Perfiles curados de espacios físicos para orientación con ISA. */
export const ACCESSIBILITY_SPACES: AccessibilitySpace[] = [
  {
    id: "salon-clases",
    name: "Salón de clases 204",
    subtitle: "Facultad de Ingeniería",
    shortLabel: "Salón",
    sections: sections(
      "Bienvenido al Salón de clases 204, Facultad de Ingeniería. Estás en un aula equipada para clases presenciales y trabajo colaborativo.",
      "En este salón hay 24 escritorios individuales distribuidos en filas. En el centro hay 4 mesas colaborativas para trabajo en grupo. Al frente encontrarás una pizarra blanca amplia y un proyector en el techo. A la derecha hay un estante con material de apoyo y conexión eléctrica en las paredes laterales.",
      "La entrada principal tiene rampa de acceso. Hay espacio para silla de ruedas en la primera fila y en las mesas colaborativas del centro. El baño accesible más cercano está en el segundo piso, ala este, a unos 40 metros por el pasillo.",
      "Si necesitas repetir esta información, usa el botón Repetir. Para emergencias, avisa al docente o dirígete a la salida de emergencia señalizada en verde al fondo del pasillo, lado izquierdo."
    ),
  },
  {
    id: "clinica-pediatrica",
    name: "Clínica pediátrica",
    subtitle: "Sala de espera — consultorio externo",
    shortLabel: "Clínica",
    sections: sections(
      "Bienvenido a la Clínica pediátrica. Estás en la sala de espera del consultorio externo, un espacio pensado para niñas, niños y familias.",
      "Al entrar, el mostrador de recepción queda a tu derecha. Hay filas de sillas a lo largo de la ventana. En la pared izquierda hay un área de juegos infantiles acotada. Hay un consultorio de enfermería al fondo y carteles con turnos en pantalla sobre el mostrador.",
      "La entrada tiene rampa y puertas automáticas. Hay sillas reservadas para embarazadas, adultos mayores y personas con movilidad reducida junto a recepción. El baño accesible está al final del pasillo, mano izquierda, con cambiador para bebés.",
      "Ventanilla 1 atiende citas programadas. Ventanilla 2 es para pagos y resultados. Si necesitas asistencia inmediata, acércate al mostrador o presiona el timbre de ayuda en recepción."
    ),
  },
  {
    id: "biblioteca",
    name: "Biblioteca central",
    subtitle: "Zona de lectura y préstamo",
    shortLabel: "Biblioteca",
    sections: sections(
      "Bienvenido a la Biblioteca central. Estás en la planta baja, zona de lectura y préstamo de libros.",
      "Frente a ti está el mostrador de préstamo y devolución. A la izquierda hay estanterías con libros de consulta. A la derecha hay mesas individuales de estudio y una zona silenciosa señalada con cartel azul. Al fondo hay 6 computadoras con lector de pantalla disponible y una sección de audiolibros.",
      "Hay rampa en la entrada principal y ascensor al fondo del hall para subir al segundo piso. Los pasillos entre estanterías tienen un metro veinte de ancho mínimo. Baño accesible junto al ascensor. Sillas con apoyabrazos en la zona de espera.",
      "Para pedir un libro en voz alta o ayuda con la computadora, acude al mostrador con el número de tu carnet. Si necesitas acompañamiento hasta una sección, solicítalo en recepción."
    ),
  },
  {
    id: "terminal-buses",
    name: "Terminal de buses",
    subtitle: "Andenes urbanos e interurbanos",
    shortLabel: "Terminal",
    sections: sections(
      "Bienvenido a la Terminal de buses. Estás en el hall principal de andenes urbanos e interurbanos.",
      "A la izquierda está la taquilla de boletos y a la derecha la pantalla de salidas con horarios. Los andenes del 1 al 8 están en esta planta; los andenes 9 al 15 suben por la rampa al nivel superior. Hay bancas de espera en el centro y una snack bar al fondo.",
      "La entrada tiene rampa y piso táctil de orientación hacia taquilla. Hay asientos preferentes junto a cada andén. Baño accesible detrás de taquilla, señalizado con símbolo internacional. Personal de información en el mostrador central con chaleco verde.",
      "Para rutas interurbanas pregunta en taquilla 2. Si pierdes tu conexión o necesitas ayuda para subir al bus, solicita apoyo en el mostrador de información o al conductor en el andén señalado en tu boleto."
    ),
  },
  {
    id: "banco",
    name: "Agencia bancaria",
    subtitle: "Planta baja — atención al cliente",
    shortLabel: "Banco",
    sections: sections(
      "Bienvenido a la Agencia bancaria, planta baja. Estás en el área de atención al cliente.",
      "Al entrar, los cajeros automáticos quedan a la izquierda. En el centro hay filas numeradas para turno digital. Ventanilla 1 es para apertura de cuentas, ventanilla 2 para préstamos y ventanilla 3 para pagos y consultas. Hay asientos de espera frente a cada módulo y un escritorio de asesoría financiera al fondo.",
      "Entrada a nivel sin escalones. Hay cajero automático bajo con teclado táctil y opción de audio. Silla giratoria en ventanilla 1 adaptada para silla de ruedas. Baño accesible pasando los cajeros, puerta con barras de apoyo.",
      "Toma turno en la pantalla junto a la entrada o muestra tu documento en recepción si necesitas fila preferencial. Para emergencias habla con el guardia de seguridad junto a la puerta principal."
    ),
  },
  {
    id: "farmacia",
    name: "Farmacia comunitaria",
    subtitle: "Mostrador y consultorio",
    shortLabel: "Farmacia",
    sections: sections(
      "Bienvenido a la Farmacia comunitaria. Estás en el área de mostrador y consultorio del farmacéutico.",
      "El mostrador principal está frente a ti. A la izquierda hay estanterías con medicamentos de venta libre: analgésicos, vitaminas y primeros auxilios. A la derecha está la fila para recetas médicas. Al fondo hay un consultorio privado para asesoría del farmacéutico y una pequeña zona de espera con cuatro sillas.",
      "Entrada plana sin escalones. Mostrador a altura accesible en el extremo derecho para clientes en silla de ruedas. Baño adaptado en el pasillo lateral. Letras grandes en señalización de precios y personal capacitado para leer etiquetas en voz alta si lo solicitas.",
      "Para recetas, ten lista tu identificación. Si necesitas ayuda para encontrar un producto, pregunta en mostrador. En caso de reacción alérgica o urgencia, avisa de inmediato al personal con uniforme blanco."
    ),
  },
];

export function getSpaceById(id: string): AccessibilitySpace | undefined {
  return ACCESSIBILITY_SPACES.find((s) => s.id === id);
}

export function getSpaceSectionText(
  space: AccessibilitySpace,
  sectionIndex: number
): string {
  const section = space.sections[sectionIndex];
  if (!section) return "";
  return `${section.title}. ${section.content}`;
}

export function getSpaceFullText(space: AccessibilitySpace): string {
  return space.sections
    .map((s) => `${s.title}. ${s.content}`)
    .join("\n\n");
}
