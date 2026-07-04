// Motor de aprendizaje: progreso de palabras, generación de quizzes y monedero de estrellas.
const Espanol = (() => {
  const CLAVE = "paseapase.progreso";

  function cargar() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
  }
  const progreso = cargar();
  progreso.niveles = progreso.niveles || {};   // id de nivel -> estrellas (1-3)
  progreso.palabras = progreso.palabras || {}; // "el balón" -> {seguidos, vistas, dominada, fallosPendientes}
  progreso.monedero = progreso.monedero || 0;  // estrellas para comprar pistas

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(progreso)); } catch (e) {}
  }

  function estadoPalabra(es) {
    if (!progreso.palabras[es]) {
      progreso.palabras[es] = { seguidos: 0, vistas: 0, dominada: false, fallosPendientes: 0 };
    }
    return progreso.palabras[es];
  }

  function registrar(es, acierto) {
    const p = estadoPalabra(es);
    p.vistas++;
    if (acierto) {
      p.seguidos++;
      if (p.seguidos >= 3) p.dominada = true; // 3 aciertos seguidos = dominada
      if (p.fallosPendientes > 0) p.fallosPendientes--;
    } else {
      p.seguidos = 0;
      p.dominada = false;
      p.fallosPendientes = 2; // reaparece en los 2 quizzes siguientes
    }
    guardar();
  }

  function palabrasDe(tema) {
    return (window.DATA_VOCABULARIO.temas[tema] || []).map(w => Object.assign({ tema }, w));
  }

  function todas() {
    const lista = [];
    for (const tema in window.DATA_VOCABULARIO.temas) {
      for (const w of window.DATA_VOCABULARIO.temas[tema]) lista.push(Object.assign({ tema }, w));
    }
    return lista;
  }

  function buscar(es) {
    return todas().find(w => w.es === es) || { es, en: es };
  }

  function barajar(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // n preguntas de opción múltiple: prioriza palabras falladas hace poco,
  // luego las no dominadas del tema del nivel.
  function generarQuiz(tema, n) {
    n = n || 3;
    const propias = palabrasDe(tema);
    const falladas = todas().filter(w => estadoPalabra(w.es).fallosPendientes > 0);
    const noDominadas = propias.filter(w => !estadoPalabra(w.es).dominada);
    const pool = [];
    const usadas = new Set();
    for (const grupo of [barajar(falladas), barajar(noDominadas), barajar(propias)]) {
      for (const w of grupo) {
        if (!usadas.has(w.es)) { usadas.add(w.es); pool.push(w); }
        if (pool.length >= n) break;
      }
      if (pool.length >= n) break;
    }
    return pool.slice(0, n).map(w => {
      const direccion = Math.random() < 0.5 ? "es-en" : "en-es";
      const mismoTema = palabrasDe(w.tema || tema).filter(o => o.es !== w.es);
      const resto = todas().filter(o => o.es !== w.es && !mismoTema.some(m => m.es === o.es));
      const distractores = barajar(mismoTema).concat(barajar(resto)).slice(0, 2);
      return { palabra: w, direccion, opciones: barajar([w].concat(distractores)) };
    });
  }

  return { progreso, guardar, registrar, generarQuiz, palabrasDe, todas, buscar, estadoPalabra, barajar };
})();
