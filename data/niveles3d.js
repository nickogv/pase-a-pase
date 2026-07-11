// Niveles del juego 3D. Campo en el plano XZ: x ∈ [-30, 30] (largo, atacamos hacia +x),
// z ∈ [-18, 18] (ancho). Posiciones [x, z]. La portería rival está a la derecha.
// modo: "normal" | "palabra-porteria" (varias mini-porterías etiquetadas) |
//       "palabra-companero" (compañeros etiquetados; pasa al pedido antes de rematar) |
//       "frase-companero" (la orden llega como frase completa en español).
// equipo: [x, z, palabra?, figura?] — la figura elige el modelo voxel (perro, gato,
// leche, silla…) del catálogo FIGURAS de js3d/escena.js; sin figura = jugador azul.
// Sin rivales: el reto es leer/escuchar el español y apuntar bien, no esquivar.
// OJO al colocar personajes: nada de tres en línea recta — el balón lo recibe el
// primero que toque el carril y un compañero alineado "roba" pases neutrales.
window.DATA_NIVELES3D = [
  {
    id: 1,
    nombre: "El primer pase",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 3, robosMax: 1,
    equipo: [[-22, 0], [2, -6]],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Arrastra desde el balón para apuntar; suelta para pasar. Haz gol en la cancha."
  },
  {
    id: 2,
    nombre: "Pases en cadena",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 4, robosMax: 1,
    equipo: [[-24, 0], [-6, -11], [6, 8]],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Encadena pases con tus compañeros y termina con un gol."
  },
  {
    id: 3,
    nombre: "¿Izquierda o derecha?",
    temaEspanol: "posiciones",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [4, 0]],
    rivales: [],
    porterias: [
      // Con la cámara del juego, z negativo queda a la IZQUIERDA de la pantalla.
      { pos: [28, -12], ancho: 10, palabra: "la izquierda" },
      { pos: [28, 12], ancho: 10, palabra: "la derecha" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Lee el objetivo y haz gol en la portería con la palabra correcta en español."
  },
  {
    id: 4,
    nombre: "Adelante y atrás",
    temaEspanol: "posiciones",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    // La posición de cada compañero ENSEÑA su palabra: adelante está más cerca
    // de la portería, atrás en tu campo, izquierda/derecha según tu pantalla.
    equipo: [
      [-20, 11],
      [4, 4, "adelante"],
      [-27, 0, "atrás"],
      [-6, -13, "la izquierda"],
      [-6, 13, "la derecha"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Pasa al compañero que pide el objetivo. Tras 2 aciertos, ¡haz gol!"
  },
  {
    id: 5,
    nombre: "Órdenes de dirección",
    temaEspanol: "posiciones",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-20, 11],
      [4, 4, "adelante"],
      [-27, 0, "atrás"],
      [-6, -13, "la izquierda"],
      [-6, 13, "la derecha"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pasa atrás", destino: "atrás" },
      { es: "pasa adelante", destino: "adelante" },
      { es: "pasa a la izquierda", destino: "la izquierda" },
      { es: "pasa a la derecha", destino: "la derecha" }
    ],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Escucha (🔊) la orden en español y pasa en esa dirección."
  },
  {
    id: 6,
    nombre: "Los animales",
    temaEspanol: "animales",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "el perro", "perro"],
      [8, 0, "el gato", "gato"],
      [-4, 12, "el pájaro", "pajaro"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "¡Hoy juegan los animales! Pásale al que pide el objetivo."
  },
  {
    id: 7,
    nombre: "El loro también juega",
    temaEspanol: "animales",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "el perro", "perro"],
      [-4, 12, "el gato", "gato"],
      [8, 0, "el loro", "loro"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pásale al perro", destino: "el perro" },
      { es: "pásale al gato", destino: "el gato" },
      { es: "el loro quiere el balón", destino: "el loro" }
    ],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Frases completas: escucha, piensa a qué animal se refiere y pásale."
  },
  {
    id: 8,
    nombre: "Los dorsales",
    temaEspanol: "numeros",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "siete"],
      [8, 0, "nueve"],
      [-4, 12, "diez"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Los números son los dorsales. Pasa al dorsal que pide el objetivo."
  },
  {
    id: 9,
    nombre: "Tres puertas",
    temaEspanol: "numeros",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [2, 0]],
    rivales: [],
    porterias: [
      { pos: [28, -12], ancho: 8, palabra: "dos" },
      { pos: [28, 0], ancho: 8, palabra: "cinco" },
      { pos: [28, 12], ancho: 8, palabra: "ocho" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Tres porterías, tres números. Marca en la que pide el objetivo."
  },
  {
    id: 10,
    nombre: "El desayuno",
    temaEspanol: "comida",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "el agua", "agua"],
      [8, 0, "la leche", "leche"],
      [-4, 12, "el pan", "pan"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "¡El desayuno salta a la cancha! Pásale al alimento que pide el objetivo."
  },
  {
    id: 11,
    nombre: "La frutería",
    temaEspanol: "comida",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "la manzana", "manzana"],
      [8, 0, "el plátano", "platano"],
      [-4, 12, "el pan", "pan"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pasa el balón a la manzana", destino: "la manzana" },
      { es: "el plátano pide un pase", destino: "el plátano" },
      { es: "pásale al pan", destino: "el pan" }
    ],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Escucha la frase completa y pásale a la comida correcta."
  },
  {
    id: 12,
    nombre: "Pon la mesa",
    temaEspanol: "objetos",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "el tenedor", "tenedor"],
      [8, 0, "el plato", "plato"],
      [-4, 12, "la cuchara", "cuchara"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Cubiertos y platos en el campo: pasa al objeto que pide el objetivo."
  },
  {
    id: 13,
    nombre: "En el salón",
    temaEspanol: "objetos",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "la silla", "silla"],
      [8, 0, "la mesa", "mesa"],
      [-4, 12, "el sofá", "sofa"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Los muebles de casa también saben jugar. ¡Pásales el balón!"
  },
  {
    id: 14,
    nombre: "Porterías de colores",
    temaEspanol: "colores",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [2, 0]],
    rivales: [],
    porterias: [
      { pos: [28, -12], ancho: 8, palabra: "rojo", color: 0xd93636 },
      { pos: [28, 0], ancho: 8, palabra: "azul", color: 0x2f6bd8 },
      { pos: [28, 12], ancho: 8, palabra: "amarillo", color: 0xffd94a }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Cada portería tiene su color. Marca en el color que pide el objetivo."
  },
  {
    id: 15,
    nombre: "Camisetas de colores",
    temaEspanol: "colores",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -12, "verde", "jugador-verde"],
      [8, 0, "naranja", "jugador-naranja"],
      [-4, 12, "morado", "jugador-morado"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Mira las camisetas: pasa al jugador del color que pide el objetivo."
  },
  {
    id: 16,
    nombre: "El cono mágico",
    temaEspanol: "preposiciones",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 7, robosMax: 2,
    // El cono es la referencia espacial: cada compañero está donde dice su
    // etiqueta respecto al cono, así la posición ENSEÑA el significado.
    conos: [[0, 0]],
    equipo: [
      [-24, 0],
      [0, 10, "delante"],
      [0, -10, "detrás"],
      [10, 0, "al lado"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pasa al que está delante del cono", destino: "delante" },
      { es: "pasa al que está detrás del cono", destino: "detrás" },
      { es: "pasa al que está al lado del cono", destino: "al lado" }
    ],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "El cono naranja es tu referencia. Delante = hacia ti, detrás = al fondo."
  },
  {
    id: 17,
    nombre: "Las preguntas",
    temaEspanol: "preguntas",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [2, 0]],
    rivales: [],
    porterias: [
      { pos: [28, -12], ancho: 8, palabra: "dónde" },
      { pos: [28, 0], ancho: 8, palabra: "cuándo" },
      { pos: [28, 12], ancho: 8, palabra: "qué" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Palabras para preguntar: marca en la portería que traduce el objetivo."
  },
  {
    id: 18,
    nombre: "La gran final",
    temaEspanol: "frases",
    modo: "frase-companero",
    aciertosNecesarios: 3,
    pasesMax: 9, robosMax: 3,
    equipo: [
      [-24, 0],
      [-6, -13, "el perro", "perro"],
      [8, 2, "la silla", "silla"],
      [-6, 13, "rojo", "jugador-rojo"]
    ],
    rivales: [],
    porterias: [{ pos: [28, 0], ancho: 10 }],
    frases: [
      { es: "pásale al perro", destino: "el perro" },
      { es: "pasa el balón a la silla", destino: "la silla" },
      { es: "pasa al de rojo", destino: "rojo" }
    ],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "La final: un perro, una silla y un jugador de rojo. Tres órdenes y ¡gol!"
  }
];
