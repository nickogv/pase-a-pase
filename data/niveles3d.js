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
    nombre: "¿Arriba o abajo?",
    temaEspanol: "posiciones",
    modo: "palabra-porteria",
    pasesMax: 4, robosMax: 2,
    equipo: [[-22, 0], [4, 0]],
    rivales: [{ pos: [16, 0], tipo: "estatico" }],
    porterias: [
      { pos: [28, -12], ancho: 10, palabra: "la derecha" },
      { pos: [28, 12], ancho: 10, palabra: "la izquierda" }
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
  }
];
