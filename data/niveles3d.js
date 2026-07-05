// Niveles del juego 3D. Campo en el plano XZ: x ∈ [-30, 30] (largo, atacamos hacia +x),
// z ∈ [-18, 18] (ancho). Posiciones [x, z]. La portería rival está a la derecha.
// modo: "normal" | "palabra-porteria" (varias mini-porterías etiquetadas) |
//       "palabra-companero" (compañeros etiquetados; pasa al pedido antes de rematar).
// rival tipo: "estatico" | "persigue-linea" (se acerca al portador tras cada pase) |
//             "marca-jugador" (marca al compañero libre más cercano).
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
    ayuda: "Arrastra desde el balón para apuntar; suelta para pasar. Manda el balón a la portería."
  },
  {
    id: 2,
    nombre: "Dos amigos",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 4, robosMax: 1,
    equipo: [[-24, 0], [-2, -11], [-2, 11]],
    rivales: [{ pos: [6, 0], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "El rival intercepta lo que pase cerca de él. Rodéalo por las bandas."
  },
  {
    id: 3,
    nombre: "Triangulación",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 5, robosMax: 1,
    equipo: [[-25, 0], [-4, -12], [-4, 12]],
    rivales: [{ pos: [-10, 0], tipo: "persigue-linea" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Este rival persigue el balón tras cada pase. Muévelo y abre el hueco."
  },
  {
    id: 4,
    nombre: "¿Izquierda o derecha?",
    temaEspanol: "posiciones",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [4, 0]],
    rivales: [{ pos: [16, 0], tipo: "estatico" }],
    porterias: [
      // Con la cámara del juego, z negativo queda a la IZQUIERDA de la pantalla.
      { pos: [28, -12], ancho: 10, palabra: "la izquierda" },
      { pos: [28, 12], ancho: 10, palabra: "la derecha" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Lee el objetivo y pasa a la mini-portería con la palabra correcta en español."
  },
  {
    id: 5,
    nombre: "Marcaje",
    temaEspanol: "posiciones",
    modo: "normal",
    pasesMax: 6, robosMax: 2,
    equipo: [[-25, 0], [-6, -12], [-6, 12], [12, 0]],
    rivales: [
      { pos: [2, -7], tipo: "marca-jugador" },
      { pos: [-12, 0], tipo: "persigue-linea" }
    ],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Un rival marca a tu compañero libre y otro persigue el balón. Paciencia y triángulos."
  },
  {
    id: 6,
    nombre: "¿Quién es quién?",
    temaEspanol: "jugadores",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 6, robosMax: 2,
    equipo: [
      [-24, 0],
      [-2, -13, "el portero"],
      [10, 6, "el defensa"],
      [-2, 13, "el delantero"]
    ],
    rivales: [{ pos: [-10, -3], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Pasa al compañero que pide el objetivo (en inglés). Tras 2 aciertos, ¡a la portería!"
  },
  {
    id: 7,
    nombre: "Los dorsales",
    temaEspanol: "numeros",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 6, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -13, "siete"],
      [10, 7, "nueve"],
      [-4, 13, "diez"]
    ],
    rivales: [{ pos: [-10, -4], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Los números son los dorsales. Pasa al dorsal que pide el objetivo."
  },
  {
    id: 8,
    nombre: "Tres puertas",
    temaEspanol: "numeros",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [2, 0]],
    rivales: [{ pos: [14, 10], tipo: "estatico" }],
    porterias: [
      { pos: [28, -12], ancho: 8, palabra: "dos" },
      { pos: [28, 0], ancho: 8, palabra: "cinco" },
      { pos: [28, 12], ancho: 8, palabra: "ocho" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Tres porterías, tres números. Marca en la que pide el objetivo."
  },
  {
    id: 9,
    nombre: "El pasillo",
    temaEspanol: "numeros",
    modo: "normal",
    pasesMax: 7, robosMax: 2,
    equipo: [[-25, 0], [-8, -12], [-8, 12], [8, -12], [8, 12]],
    rivales: [
      { pos: [-2, 0], tipo: "persigue-linea" },
      { pos: [2, -8], tipo: "marca-jugador" },
      { pos: [2, 8], tipo: "marca-jugador" }
    ],
    porterias: [{ pos: [28, 0], ancho: 10 }],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Tres rivales y poco espacio. Mueve el balón por las bandas."
  },
  {
    id: 10,
    nombre: "Órdenes del míster",
    temaEspanol: "frases",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 6, robosMax: 2,
    equipo: [
      [-24, 0],
      [-2, -13, "el portero"],
      [10, 6, "el delantero"],
      [-2, 13, "el capitán"]
    ],
    rivales: [{ pos: [-10, -3], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pasa el balón al portero", destino: "el portero" },
      { es: "el delantero está desmarcado", destino: "el delantero" },
      { es: "el capitán pide el balón", destino: "el capitán" }
    ],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "El míster da órdenes en español. Escucha (🔊), interpreta la frase y pasa al jugador correcto."
  },
  {
    id: 11,
    nombre: "Por las bandas",
    temaEspanol: "frases",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 6, robosMax: 2,
    equipo: [
      [-14, 0],
      [0, 14, "la derecha"],
      [0, -14, "la izquierda"],
      [-24, 0, "atrás"]
    ],
    rivales: [{ pos: [8, 0], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "un pase largo a la derecha", destino: "la derecha" },
      { es: "ahora por la izquierda", destino: "la izquierda" },
      { es: "vuelve atrás con calma", destino: "atrás" }
    ],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Frases de dirección: derecha e izquierda son las de TU pantalla."
  },
  {
    id: 12,
    nombre: "La final",
    temaEspanol: "frases",
    modo: "frase-companero",
    aciertosNecesarios: 3,
    pasesMax: 9, robosMax: 3,
    equipo: [
      [-25, 0],
      [-5, -13, "el portero"],
      [6, 10, "el delantero"],
      [-12, 12, "el capitán"]
    ],
    // Ojo: nada de "marca-jugador" en niveles de objetivo forzado — se pega al
    // receptor obligatorio y puede bloquear el nivel para siempre.
    rivales: [
      // El perseguidor arranca adelantado, fuera de los carriles del saque;
      // la presión llega cuando empieza a cazar el balón.
      { pos: [2, -2], tipo: "persigue-linea" },
      { pos: [16, -8], tipo: "estatico" }
    ],
    porterias: [{ pos: [28, 0], ancho: 10 }],
    frases: [
      { es: "pasa el balón al portero", destino: "el portero" },
      { es: "el delantero está desmarcado", destino: "el delantero" },
      { es: "el capitán pide el balón", destino: "el capitán" }
    ],
    estrellas: { "5": 3, "7": 2 },
    ayuda: "La final: tres órdenes seguidas con rivales que se mueven. ¡Suerte!"
  },
  {
    id: 13,
    nombre: "El cono mágico",
    temaEspanol: "preposiciones",
    modo: "frase-companero",
    aciertosNecesarios: 2,
    pasesMax: 6, robosMax: 2,
    // El cono es la referencia espacial: cada compañero está donde dice su
    // etiqueta respecto al cono, así la posición ENSEÑA el significado.
    conos: [[0, 0]],
    equipo: [
      [-24, 0],
      [0, 10, "delante"],
      [0, -10, "detrás"],
      [10, 0, "al lado"]
    ],
    rivales: [{ pos: [-12, -8], tipo: "estatico" }],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    frases: [
      { es: "pasa al que está delante del cono", destino: "delante" },
      { es: "pasa al que está detrás del cono", destino: "detrás" },
      { es: "pasa al que está al lado del cono", destino: "al lado" }
    ],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "El cono naranja es tu referencia. Delante = hacia ti, detrás = al fondo."
  },
  {
    id: 14,
    nombre: "Las preguntas",
    temaEspanol: "preguntas",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [2, 0]],
    rivales: [{ pos: [14, -10], tipo: "estatico" }],
    porterias: [
      { pos: [28, -12], ancho: 8, palabra: "dónde" },
      { pos: [28, 0], ancho: 8, palabra: "cuándo" },
      { pos: [28, 12], ancho: 8, palabra: "qué" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Palabras para preguntar: marca en la portería que traduce el objetivo."
  },
  {
    id: 15,
    nombre: "La entrevista",
    temaEspanol: "preguntas",
    modo: "palabra-companero",
    aciertosNecesarios: 3,
    pasesMax: 8, robosMax: 2,
    equipo: [
      [-24, 0],
      [-4, -13, "cómo"],
      [8, 0, "por qué"],
      [-4, 13, "quién"]
    ],
    // Estáticos fuera de todos los carriles obligatorios: con 3 aciertos
    // seguidos, un perseguidor acababa tapando orden y escape a la vez.
    rivales: [
      { pos: [2, 6], tipo: "estatico" },
      { pos: [18, -9], tipo: "estatico" }
    ],
    porterias: [{ pos: [28, 0], ancho: 12 }],
    estrellas: { "5": 3, "6": 2 },
    ayuda: "Los periodistas preguntan en inglés: pasa al jugador con la palabra en español."
  }
];
