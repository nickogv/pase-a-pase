// Vocabulario por temas. Cada entrada: es (español), en (traducción), tipo opcional "frase".
// Temas de vocabulario BÁSICO (direcciones, animales, comida, objetos, colores):
// los personajes del campo pueden ser animales u objetos, no solo futbolistas.
window.DATA_VOCABULARIO = {
  "temas": {
    "futbol-basico": [
      {"es": "el balón", "en": "the ball"},
      {"es": "el pase", "en": "the pass"},
      {"es": "el gol", "en": "the goal (score)"},
      {"es": "la portería", "en": "the goal (net)"},
      {"es": "la cancha", "en": "the field / pitch"},
      {"es": "el equipo", "en": "the team"},
      {"es": "¡pásala!", "en": "pass it!", "tipo": "frase"},
      {"es": "¡gooool!", "en": "goooal!", "tipo": "frase"}
    ],
    "posiciones": [
      {"es": "la izquierda", "en": "the left"},
      {"es": "la derecha", "en": "the right"},
      {"es": "adelante", "en": "forward"},
      {"es": "atrás", "en": "back"},
      {"es": "arriba", "en": "up"},
      {"es": "abajo", "en": "down"},
      {"es": "cerca", "en": "near"},
      {"es": "lejos", "en": "far"},
      {"es": "pasa atrás", "en": "pass back", "tipo": "frase"},
      {"es": "pasa adelante", "en": "pass forward", "tipo": "frase"},
      {"es": "pasa a la izquierda", "en": "pass to the left", "tipo": "frase"},
      {"es": "pasa a la derecha", "en": "pass to the right", "tipo": "frase"}
    ],
    "numeros": [
      {"es": "uno", "en": "one"},
      {"es": "dos", "en": "two"},
      {"es": "tres", "en": "three"},
      {"es": "cuatro", "en": "four"},
      {"es": "cinco", "en": "five"},
      {"es": "seis", "en": "six"},
      {"es": "siete", "en": "seven"},
      {"es": "ocho", "en": "eight"},
      {"es": "nueve", "en": "nine"},
      {"es": "diez", "en": "ten"},
      {"es": "pasa al número siete", "en": "pass to number seven", "tipo": "frase"}
    ],
    "animales": [
      {"es": "el perro", "en": "the dog"},
      {"es": "el gato", "en": "the cat"},
      {"es": "el pájaro", "en": "the bird"},
      {"es": "el loro", "en": "the parrot"},
      {"es": "el conejo", "en": "the rabbit"},
      {"es": "el pez", "en": "the fish"},
      {"es": "pásale al perro", "en": "pass it to the dog", "tipo": "frase"},
      {"es": "pásale al gato", "en": "pass it to the cat", "tipo": "frase"},
      {"es": "el loro quiere el balón", "en": "the parrot wants the ball", "tipo": "frase"}
    ],
    "comida": [
      {"es": "el agua", "en": "the water"},
      {"es": "la leche", "en": "the milk"},
      {"es": "el pan", "en": "the bread"},
      {"es": "la manzana", "en": "the apple"},
      {"es": "el plátano", "en": "the banana"},
      {"es": "el queso", "en": "the cheese"},
      {"es": "pasa el balón a la manzana", "en": "pass the ball to the apple", "tipo": "frase"},
      {"es": "el plátano pide un pase", "en": "the banana asks for a pass", "tipo": "frase"},
      {"es": "pásale al pan", "en": "pass it to the bread", "tipo": "frase"}
    ],
    "objetos": [
      {"es": "el tenedor", "en": "the fork"},
      {"es": "la cuchara", "en": "the spoon"},
      {"es": "el plato", "en": "the plate"},
      {"es": "el vaso", "en": "the glass (cup)"},
      {"es": "la silla", "en": "the chair"},
      {"es": "la mesa", "en": "the table"},
      {"es": "el sofá", "en": "the sofa"},
      {"es": "pasa el balón a la silla", "en": "pass the ball to the chair", "tipo": "frase"}
    ],
    "colores": [
      {"es": "rojo", "en": "red"},
      {"es": "azul", "en": "blue"},
      {"es": "amarillo", "en": "yellow"},
      {"es": "verde", "en": "green"},
      {"es": "naranja", "en": "orange"},
      {"es": "morado", "en": "purple"},
      {"es": "blanco", "en": "white"},
      {"es": "negro", "en": "black"},
      {"es": "pasa al de rojo", "en": "pass to the one in red", "tipo": "frase"}
    ],
    "preposiciones": [
      {"es": "sobre", "en": "on / above"},
      {"es": "debajo", "en": "under / below"},
      {"es": "al lado", "en": "beside / next to"},
      {"es": "delante", "en": "in front"},
      {"es": "detrás", "en": "behind"},
      {"es": "entre", "en": "between"},
      {"es": "dentro", "en": "inside"},
      {"es": "fuera", "en": "outside"},
      {"es": "pasa al que está delante del cono", "en": "pass to the one in front of the cone", "tipo": "frase"},
      {"es": "pasa al que está detrás del cono", "en": "pass to the one behind the cone", "tipo": "frase"},
      {"es": "pasa al que está al lado del cono", "en": "pass to the one beside the cone", "tipo": "frase"}
    ],
    "preguntas": [
      {"es": "qué", "en": "what"},
      {"es": "dónde", "en": "where"},
      {"es": "cuándo", "en": "when"},
      {"es": "cómo", "en": "how"},
      {"es": "por qué", "en": "why"},
      {"es": "quién", "en": "who"},
      {"es": "cuál", "en": "which"},
      {"es": "cuánto", "en": "how much / how many"},
      {"es": "¿dónde está el balón?", "en": "where is the ball?", "tipo": "frase"},
      {"es": "¿quién marcó el gol?", "en": "who scored the goal?", "tipo": "frase"}
    ],
    "frases": [
      {"es": "un pase largo a la derecha", "en": "a long pass to the right", "tipo": "frase"},
      {"es": "ahora por la izquierda", "en": "now down the left", "tipo": "frase"},
      {"es": "vuelve atrás con calma", "en": "go back calmly", "tipo": "frase"},
      {"es": "tenemos poco tiempo", "en": "we have little time", "tipo": "frase"},
      {"es": "¡qué buena jugada!", "en": "what a great play!", "tipo": "frase"},
      {"es": "¡tira a la portería!", "en": "shoot at the goal!", "tipo": "frase"}
    ]
  }
};
