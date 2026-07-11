// Definición de niveles. Coordenadas sobre un campo de 800x520.
// modo: "normal" (marcar gol), "palabra-porteria" (varias porterías etiquetadas,
// hay que pasar a la correcta) o "palabra-companero" (compañeros etiquetados,
// hay que pasar al que pide el objetivo antes de poder rematar).
// Sin rivales: el reto es el vocabulario, no esquivar defensas.
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
    rivales: [],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Encadena pases con tus dos compañeros y termina con gol."
  },
  {
    id: 3,
    nombre: "Triangulación",
    temaEspanol: "futbol-basico",
    modo: "normal",
    pasesMax: 5,
    robosMax: 1,
    equipo: [[120, 260], [360, 140], [360, 380]],
    rivales: [],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Haz un triángulo de pases antes de rematar a la portería."
  },
  {
    id: 4,
    nombre: "¿Arriba o abajo?",
    temaEspanol: "posiciones",
    modo: "palabra-porteria",
    pasesMax: 4,
    robosMax: 2,
    equipo: [[140, 260], [430, 260]],
    rivales: [],
    porterias: [
      { pos: [770, 110], palabra: "arriba" },
      { pos: [770, 410], palabra: "abajo" }
    ],
    estrellas: { "2": 3, "3": 2 },
    ayuda: "Lee el objetivo y pasa a la portería con la palabra correcta en español."
  },
  {
    id: 5,
    nombre: "Cuatro esquinas",
    temaEspanol: "posiciones",
    modo: "normal",
    pasesMax: 6,
    robosMax: 2,
    equipo: [[120, 260], [340, 120], [340, 400], [560, 260]],
    rivales: [],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "3": 3, "4": 2 },
    ayuda: "Mueve el balón por todo el campo y marca gol."
  },
  {
    id: 6,
    nombre: "Los animales",
    temaEspanol: "animales",
    modo: "palabra-companero",
    aciertosNecesarios: 2,
    pasesMax: 6,
    robosMax: 2,
    equipo: [
      [130, 260],
      [370, 110, "el perro"],
      [450, 260, "el gato"],
      [370, 410, "el pájaro"]
    ],
    rivales: [],
    porterias: [{ pos: [770, 260] }],
    estrellas: { "4": 3, "5": 2 },
    ayuda: "Pasa al animal que pide el objetivo (en inglés). Tras 2 aciertos, ¡a la portería!"
  }
];
