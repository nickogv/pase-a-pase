// Definición de niveles. Coordenadas sobre un campo de 800x520.
// modo: "normal" (marcar gol), "palabra-porteria" (varias porterías etiquetadas,
// hay que pasar a la correcta) o "palabra-companero" (compañeros etiquetados,
// hay que pasar al que pide el objetivo antes de poder rematar).
// tipo de rival: "estatico", "persigue-linea" (se acerca al portador tras cada
// pase) o "marca-jugador" (se pega al compañero libre más cercano).
window.DATA_NIVELES = [
  {
    id: 1,
    nombre: "El primer pase",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 3,
    robosMax: 1,
    equipo: [[140, 260], [420, 200]],
    rivales: [],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Haz clic en un compañero para pasarle el balón. Marca gol pasando a la portería."
  },
  {
    id: 2,
    nombre: "Dos amigos",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 4,
    robosMax: 1,
    equipo: [[130, 260], [390, 120], [390, 400]],
    rivales: [{ pos: [450, 260], tipo: "estatico" }],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "El rival corta los pases que cruzan su zona. Rodéalo."
  },
  {
    id: 3,
    nombre: "Triangulación",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 5,
    robosMax: 1,
    equipo: [[120, 260], [360, 140], [360, 380]],
    rivales: [{ pos: [300, 260], tipo: "persigue-linea" }],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Este rival persigue el balón después de cada pase. Muévelo con pases y busca el hueco."
  },
  {
    id: 4,
    nombre: "¿Arriba o abajo?",
    temaEspanol: "posiciones",
    modo: "palabra-porteria",
    pasesMax: 4,
    robosMax: 2,
    equipo: [[140, 260], [430, 260]],
    rivales: [{ pos: [600, 260], tipo: "estatico" }],
    porterias: [
      { pos: [770, 110], palabra: "arriba" },
      { pos: [770, 410], palabra: "abajo" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Lee el objetivo y pasa a la portería con la palabra correcta en español."
  },
  {
    id: 5,
    nombre: "Marcaje",
    temaEspanol: "posiciones",
    modo: "normal",
    pasesMax: 6,
    robosMax: 2,
    equipo: [[120, 260], [340, 120], [340, 400], [560, 260]],
    rivales: [
      { pos: [420, 190], tipo: "marca-jugador" },
      { pos: [280, 260], tipo: "persigue-linea" }
    ],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Un rival marca a tu compañero libre y otro persigue el balón. Paciencia y triángulos."
  },
  {
    id: 6,
    nombre: "¿Quién es quién?",
    temaEspanol: "jugadores",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 6,
    robosMax: 2,
    equipo: [
      [130, 260],
      [370, 110, "el portero"],
      [450, 260, "el defensa"],
      [370, 410, "el delantero"]
    ],
    rivales: [{ pos: [260, 260], tipo: "estatico" }],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Pasa al compañero que pide el objetivo (en inglés). Tras 2 aciertos, ¡a la portería!"
  }
];
