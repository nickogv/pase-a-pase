// Lógica del juego 3D "Pase a Pase". Mecánica estilo Mini Soccer Star:
// el tiempo se detiene mientras apuntas; arrastras desde el balón para fijar
// dirección y fuerza; al soltar, el balón sale con física (rozamiento) y puede
// llegar a un compañero, colarse en la portería o ser interceptado.
// Reutiliza el motor de español (window.Espanol) y el vocabulario.
import * as Escena from "./escena.js";

const Espanol = window.Espanol;
const NIVELES = window.DATA_NIVELES3D;
const VOCAB = window.DATA_VOCABULARIO;

// Constantes de campo y física (unidades del mundo 3D).
const LARGO = 30, ANCHO = 18;
const RANGO_ARRASTRE = 28;   // distancia de arrastre para potencia máxima
const V_MIN = 26, V_MAX = 86; // velocidad inicial según potencia (u/s)
const DECEL = 46;            // desaceleración por rozamiento (u/s²)
const RECEP = 2.9;           // radio de recepción de un compañero
const RADIO_RIVAL = 3.2;
const MIN_RECORRIDO = 4;     // el balón debe viajar antes de poder ser recibido

const $ = id => document.getElementById(id);
const canvas = $("campo");

const Juego = {
  pantalla: "menu",
  nivel: null,
  resultado: null,
  quiz: null,
  aim: null,          // apuntado con puntero: {dirX, dirZ, potencia}
  tecAngulo: 0,       // apuntado con teclado
  tecPotencia: 0.6,
  tecActivo: false
};

// ---------------- Sonido sintetizado ----------------
const Sonido = (() => {
  let actx = null;
  const ctx = () => (actx || (actx = new (window.AudioContext || window.webkitAudioContext)()));
  function nota(f, dur, tipo, retraso, vol) {
    const a = ctx(), t = a.currentTime + (retraso || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  }
  return {
    pase: p => nota(360 + p * 240, 0.14, "triangle"),
    robo: () => nota(120, 0.32, "sawtooth", 0, 0.08),
    acierto: () => { nota(520, 0.1); nota(780, 0.15, "sine", 0.09); },
    gol: () => { nota(392, 0.15); nota(494, 0.15, "sine", 0.13); nota(587, 0.3, "sine", 0.26); nota(784, 0.45, "sine", 0.4); }
  };
})();

// ---------------- Pantallas ----------------
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.add("oculto"));
  if (id) $(id).classList.remove("oculto");
  $("hud").classList.toggle("oculto", Juego.pantalla !== "juego");
}

function irAlMenu() { Juego.pantalla = "menu"; Juego.nivel = null; mostrar("menu"); }

function irASeleccion() {
  Juego.pantalla = "seleccion";
  const lista = $("lista-niveles");
  lista.innerHTML = "";
  NIVELES.forEach((def, i) => {
    const estrellas = Espanol.progreso.niveles["3d-" + def.id] || 0;
    const bloqueado = i > 0 && !Espanol.progreso.niveles["3d-" + NIVELES[i - 1].id];
    const btn = document.createElement("button");
    btn.className = "nivel-btn" + (bloqueado ? " bloqueado" : "");
    btn.innerHTML = `<span class="nivel-num">${def.id}</span>` +
      `<span class="nivel-nombre">${bloqueado ? "🔒" : def.nombre}</span>` +
      `<span class="nivel-estrellas">${"★".repeat(estrellas)}${"☆".repeat(Math.max(0, 3 - estrellas))}</span>`;
    if (!bloqueado) btn.addEventListener("click", () => iniciarNivel(def));
    lista.appendChild(btn);
  });
  mostrar("seleccion");
}

function irAProgreso() {
  Juego.pantalla = "progreso";
  const cont = $("lista-progreso");
  cont.innerHTML = "";
  let dominadas = 0, vistas = 0;
  for (const tema in VOCAB.temas) {
    const h = document.createElement("h3"); h.textContent = tema.replace(/-/g, " "); cont.appendChild(h);
    for (const w of VOCAB.temas[tema]) {
      const p = Espanol.progreso.palabras[w.es];
      const estado = p && p.dominada ? "✓" : (p && p.vistas > 0 ? "•" : "○");
      if (p && p.dominada) dominadas++; else if (p && p.vistas > 0) vistas++;
      const fila = document.createElement("div");
      fila.className = "palabra-fila" + (p && p.dominada ? " dominada" : "");
      fila.innerHTML = `<span class="palabra-estado">${estado}</span><span class="palabra-es">${w.es}</span><span class="palabra-en">${w.en}</span>`;
      cont.appendChild(fila);
    }
  }
  $("progreso-resumen").textContent = `Dominadas: ${dominadas} · En progreso: ${vistas} · Estrellas: ${Espanol.progreso.monedero} ⭐`;
  mostrar("progreso");
}

// ---------------- Nivel ----------------
function cargarNivel(def) {
  const N = {
    def,
    equipo: def.equipo.map((e, i) => ({ x: e[0], z: e[1], palabra: e[2] || null, dorsal: i + 1 })),
    rivales: def.rivales.map(r => ({ x: r.pos[0], z: r.pos[1], tipo: r.tipo, radio: RADIO_RIVAL })),
    porterias: def.porterias.map(p => ({ x: p.pos[0], z: p.pos[1], ancho: p.ancho, palabra: p.palabra || null })),
    conos: def.conos || [],
    portador: 0,
    balon: { x: 0, z: 0, y: 0, vx: 0, vz: 0, enVuelo: false, recorrido: 0 },
    pasesRestantes: def.pasesMax,
    pasesUsados: 0,
    robos: 0,
    aciertosPalabra: 0,
    objetivo: null,
    terminado: false
  };
  colocarBalon(N);
  elegirObjetivo(N);
  return N;
}

function colocarBalon(N) {
  const j = N.equipo[N.portador];
  N.balon.x = j.x + 1.5; N.balon.z = j.z; N.balon.y = 0;
  N.balon.vx = N.balon.vz = 0; N.balon.enVuelo = false; N.balon.recorrido = 0;
}

// Los modos "palabra-companero" y "frase-companero" comparten la regla de
// "pasa al compañero pedido antes de poder rematar"; solo cambia cómo se
// muestra el objetivo (palabra suelta en inglés vs. frase completa en español).
function esModoCompanero(def) {
  return def.modo === "palabra-companero" || def.modo === "frase-companero";
}

// ¿Está el carril recto entre dos puntos libre de rivales? Se usa al elegir
// la siguiente orden: nunca pedir un pase que ya nace imposible (anti-frustración).
function carrilDespejado(N, ax, az, bx, bz) {
  for (const r of N.rivales) {
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz;
    let t = l2 ? ((r.x - ax) * dx + (r.z - az) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    if (Math.hypot(r.x - (ax + t * dx), r.z - (az + t * dz)) < r.radio + 0.4) return false;
  }
  return true;
}

function elegirObjetivo(N) {
  const d = N.def;
  if (d.modo === "palabra-porteria") {
    const p = N.porterias[Math.floor(Math.random() * N.porterias.length)];
    N.objetivo = Object.assign({ tipo: "porteria" }, Espanol.buscar(p.palabra));
  } else if (esModoCompanero(d)) {
    if (N.aciertosPalabra >= (d.aciertosNecesarios || 2)) {
      N.objetivo = { tipo: "gol", es: "la portería", en: "shoot at the goal!" };
      if (d.modo === "frase-companero") N.objetivo.frase = "¡tira a la portería!";
    } else if (d.modo === "frase-companero") {
      // La orden llega como frase completa en español: interpretarla es el reto.
      const anterior = N.objetivo ? N.objetivo.frase : null;
      let cands = d.frases.filter(f => f.es !== anterior);
      if (!cands.length) cands = d.frases;
      // Preferir órdenes cumplibles ahora mismo (carril sin rivales).
      const libres = cands.filter(f => {
        const j = N.equipo.find(e => e.palabra === f.destino);
        return j && carrilDespejado(N, N.balon.x, N.balon.z, j.x, j.z);
      });
      const pool = libres.length ? libres : cands;
      const f = pool[Math.floor(Math.random() * pool.length)];
      N.objetivo = { tipo: "companero", es: f.destino, frase: f.es, en: Espanol.buscar(f.es).en };
    } else {
      const anterior = N.objetivo ? N.objetivo.es : null;
      let cands = N.equipo.filter((j, i) => j.palabra && i !== N.portador && j.palabra !== anterior);
      if (!cands.length) cands = N.equipo.filter((j, i) => j.palabra && i !== N.portador);
      // Preferir objetivos con carril despejado desde el balón.
      const libres = cands.filter(j => carrilDespejado(N, N.balon.x, N.balon.z, j.x, j.z));
      const pool = libres.length ? libres : cands;
      const j = pool[Math.floor(Math.random() * pool.length)];
      N.objetivo = Object.assign({ tipo: "companero" }, Espanol.buscar(j.palabra));
    }
  } else N.objetivo = null;
  actualizarPorterias();
}

function actualizarPorterias() {
  const N = Juego.nivel;
  if (!N) return;
  const cerrada = esModoCompanero(N.def) && N.objetivo && N.objetivo.tipo !== "gol";
  const abierta = N.objetivo && N.objetivo.tipo === "gol";
  N.porterias.forEach((p, i) => {
    // Nunca resaltar la portería correcta en palabra-porteria: leer la
    // etiqueta en español ES el reto; el color regalaría la respuesta.
    Escena.estadoPorteria(i, { seleccionada: false, cerrada, abierta });
  });
}

// Antes de un nivel con contenido de español se muestra una lección breve
// (presentación → práctica → quiz). "Repetir" la salta: ya la vieron.
function iniciarNivel(def, opciones) {
  if (def.modo !== "normal" && !(opciones && opciones.sinLeccion)) return mostrarLeccion(def);
  empezarNivel(def);
}

function empezarNivel(def) {
  Juego.pantalla = "juego";
  Juego.resultado = null;
  Juego.nivel = cargarNivel(def);
  Escena.construirNivel(Juego.nivel);
  Juego.aim = null; Juego.tecActivo = false; Juego.tecAngulo = 0; Juego.tecPotencia = 0.6;
  Escena.ocultarFlecha();
  mostrar(null);
  actualizarHUD();
  actualizarPorterias();
  if (def.ayuda) mensaje(def.ayuda, "ayuda", 4500);
}

// ---------------- Aula de español (estudio libre por temas) ----------------
const NOMBRES_TEMAS = {
  "futbol-basico": "Fútbol básico",
  "posiciones": "Posiciones y lados",
  "numeros": "Números",
  "jugadores": "Jugadores",
  "preposiciones": "Preposiciones (sobre, debajo…)",
  "preguntas": "Palabras para preguntar",
  "frases": "Frases del míster"
};

function irAlAula() {
  Juego.pantalla = "aula";
  const lista = $("lista-aula");
  lista.innerHTML = "";
  for (const tema in window.DATA_VOCABULARIO.temas) {
    const palabras = Espanol.palabrasDe(tema);
    const dominadas = palabras.filter(w => Espanol.estadoPalabra(w.es).dominada).length;
    const btn = document.createElement("button");
    btn.className = "nivel-btn";
    btn.innerHTML =
      `<span class="nivel-nombre">${NOMBRES_TEMAS[tema] || tema}</span>` +
      `<span class="nivel-estrellas">${dominadas}/${palabras.length} ✓</span>`;
    btn.addEventListener("click", () => mostrarLeccionTema(tema));
    lista.appendChild(btn);
  }
  mostrar("aula");
}

// Reutiliza la pantalla de lección para estudiar un tema completo del aula;
// el botón lleva al quiz en lugar de al campo.
let leccionAula = null;

function mostrarLeccionTema(tema) {
  Juego.pantalla = "leccion";
  leccionAula = tema;
  const cont = $("leccion-lista");
  cont.innerHTML = "";
  for (const w of Espanol.palabrasDe(tema)) {
    const fila = document.createElement("div");
    fila.className = "leccion-fila";
    fila.innerHTML = `<button class="hablar" title="Escuchar en español">🔊</button>` +
      `<span class="palabra-es">${w.es}</span><span class="palabra-en">${w.en}</span>`;
    fila.querySelector(".hablar").addEventListener("click", () => hablar(w.es));
    cont.appendChild(fila);
  }
  $("btn-leccion-jugar").textContent = "¡Al quiz! ✏️";
  mostrar("leccion");
}

function continuarLeccion() {
  if (leccionAula) {
    const tema = leccionAula;
    leccionAula = null;
    iniciarQuiz(tema, "aula");
  } else {
    empezarNivel(nivelPendiente);
  }
}

// ---------------- Lección previa al nivel ----------------
let nivelPendiente = null;

function palabrasDelNivel(def) {
  const lista = [];
  if (def.modo === "palabra-porteria") def.porterias.forEach(p => p.palabra && lista.push(p.palabra));
  else if (def.modo === "palabra-companero") def.equipo.forEach(e => e[2] && lista.push(e[2]));
  else if (def.modo === "frase-companero") def.frases.forEach(f => lista.push(f.es));
  return lista;
}

function mostrarLeccion(def) {
  Juego.pantalla = "leccion";
  nivelPendiente = def;
  leccionAula = null;
  $("btn-leccion-jugar").textContent = "¡A jugar! ⚽";
  const cont = $("leccion-lista");
  cont.innerHTML = "";
  for (const es of palabrasDelNivel(def)) {
    const w = Espanol.buscar(es);
    const fila = document.createElement("div");
    fila.className = "leccion-fila";
    fila.innerHTML = `<button class="hablar" title="Escuchar en español">🔊</button>` +
      `<span class="palabra-es">${w.es}</span><span class="palabra-en">${w.en}</span>`;
    fila.querySelector(".hablar").addEventListener("click", () => hablar(w.es));
    cont.appendChild(fila);
  }
  mostrar("leccion");
}

// Lee un texto en voz alta en español (si el navegador tiene síntesis de voz).
function hablar(texto) {
  try {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}

function actualizarHUD() {
  const N = Juego.nivel; if (!N) return;
  $("hud-nivel").textContent = `Nivel ${N.def.id}: ${N.def.nombre}`;
  $("hud-pases").textContent = `Pases: ${N.pasesRestantes}`;
  $("hud-robos").textContent = `Robos: ${N.robos}/${N.def.robosMax}`;
  const obj = $("hud-objetivo");
  if (N.objetivo) {
    if (N.objetivo.frase) {
      // Modo frases: la orden se muestra EN ESPAÑOL (interpretarla es el juego);
      // la traducción está en el tooltip y el 🔊 la lee en voz alta.
      obj.textContent = `🎯 «${N.objetivo.frase}» 🔊`;
      obj.title = "🇬🇧 " + N.objetivo.en;
    } else {
      obj.textContent = `🎯 Pasa a: «${N.objetivo.en}»`;
      obj.title = "";
    }
    obj.classList.remove("oculto");
  } else obj.classList.add("oculto");
}

// ---------------- Lanzar el balón ----------------
function lanzar(dirX, dirZ, potencia) {
  const N = Juego.nivel;
  if (!N || N.balon.enVuelo || N.terminado) return;
  const len = Math.hypot(dirX, dirZ) || 1;
  const v0 = V_MIN + potencia * (V_MAX - V_MIN);
  N.balon.vx = dirX / len * v0;
  N.balon.vz = dirZ / len * v0;
  N.balon.enVuelo = true;
  N.balon.recorrido = 0;
  N.pasesRestantes--;
  N.pasesUsados++;
  Juego.aim = null;
  Escena.ocultarFlecha();
  Sonido.pase(potencia);
  actualizarHUD();
}

// Integración de la física del balón y detección de eventos.
function fisica(dt) {
  const N = Juego.nivel;
  const b = N.balon;
  if (!b.enVuelo) return;
  const v = Math.hypot(b.vx, b.vz);
  if (v < 0.5) return pararBalon("Pase perdido");
  const nv = Math.max(0, v - DECEL * dt);
  b.vx *= nv / v; b.vz *= nv / v;
  const paso = nv * dt;
  b.x += b.vx * dt; b.z += b.vz * dt;
  b.recorrido += paso;

  // 1) Intercepción de un rival.
  for (const r of N.rivales) {
    if (Math.hypot(b.x - r.x, b.z - r.z) < r.radio) return procesarRobo("¡Intercepción!");
  }
  // 2) Gol (todas las porterías están en +x).
  for (let i = 0; i < N.porterias.length; i++) {
    const p = N.porterias[i];
    if (b.x >= p.x - 0.8 && Math.abs(b.z - p.z) <= p.ancho / 2 + 0.4) return procesarGol(i);
  }
  // 3) Recepción de un compañero.
  if (b.recorrido > MIN_RECORRIDO) {
    for (let i = 0; i < N.equipo.length; i++) {
      if (i === N.portador) continue;
      const j = N.equipo[i];
      if (Math.hypot(b.x - j.x, b.z - j.z) < RECEP) return procesarRecepcion(i);
    }
  }
  // 4) Fuera del campo o balón detenido.
  if (Math.abs(b.x) > LARGO + 3 || Math.abs(b.z) > ANCHO + 3) return pararBalon("¡Fuera!");
  if (nv < 1) return pararBalon("Pase corto");
}

function pararBalon(texto) {
  const N = Juego.nivel;
  N.balon.enVuelo = false;
  mensaje(texto, "error");
  if (N.pasesRestantes <= 0) return perder("Te quedaste sin pases.");
  colocarBalon(N);
}

function procesarRobo(texto) {
  const N = Juego.nivel;
  N.balon.enVuelo = false;
  N.robos++;
  Sonido.robo();
  mensaje(texto, "error");
  actualizarHUD();
  if (N.robos > N.def.robosMax) return perder("Demasiados balones perdidos.");
  if (N.pasesRestantes <= 0) return perder("Te quedaste sin pases.");
  colocarBalon(N);
}

function procesarRecepcion(idx) {
  const N = Juego.nivel;
  N.balon.enVuelo = false;
  const receptor = N.equipo[idx];
  if (esModoCompanero(N.def) && N.objetivo && N.objetivo.tipo === "companero" && receptor.palabra) {
    if (receptor.palabra === N.objetivo.es) {
      Espanol.registrar(receptor.palabra, true);
      N.aciertosPalabra++;
      N.portador = idx; colocarBalon(N);
      elegirObjetivo(N);
      mensaje(N.objetivo.tipo === "gol" ? "¡Muy bien! ¡Ahora a la portería!" : "¡Muy bien!", "exito");
      Sonido.acierto();
      moverRivales(N); actualizarHUD();
      return;
    } else {
      Espanol.registrar(N.objetivo.es, false);
      N.portador = idx; colocarBalon(N);
      moverRivales(N); actualizarHUD();
      return procesarRobo(`Ese es «${receptor.palabra}». Buscabas «${N.objetivo.es}»`);
    }
  }
  N.portador = idx;
  colocarBalon(N);
  mensaje("¡Pase!", "exito", 700);
  moverRivales(N);
  actualizarHUD();
  if (N.pasesRestantes <= 0) perder("Te quedaste sin pases.");
}

function procesarGol(idx) {
  const N = Juego.nivel;
  N.balon.enVuelo = false;
  if (N.def.modo === "palabra-porteria" && N.porterias[idx].palabra !== N.objetivo.es) {
    Espanol.registrar(N.objetivo.es, false);
    return procesarRobo(`¡Esa no! «${N.objetivo.en}» es «${N.objetivo.es}»`);
  }
  if (esModoCompanero(N.def) && N.objetivo && N.objetivo.tipo !== "gol") {
    return pararBalon("Aún no: sigue el objetivo 🎯");
  }
  if (N.def.modo === "palabra-porteria") Espanol.registrar(N.objetivo.es, true);
  ganar();
}

// Reposicionamiento por turnos de los rivales tras cada pase completado.
function moverRivales(N) {
  const portador = N.equipo[N.portador];
  for (const r of N.rivales) {
    if (r.tipo === "persigue-linea") acercar(r, portador, 6, 5);
    else if (r.tipo === "marca-jugador") {
      let mejor = null, md = Infinity;
      N.equipo.forEach((j, i) => {
        if (i === N.portador) return;
        const d = Math.hypot(j.x - r.x, j.z - r.z);
        if (d < md) { md = d; mejor = j; }
      });
      if (mejor) acercar(r, mejor, 6, 4.5);
    }
  }
}

function acercar(r, obj, paso, minDist) {
  const dx = obj.x - r.x, dz = obj.z - r.z, d = Math.hypot(dx, dz);
  if (d <= minDist) return;
  const m = Math.min(paso, d - minDist);
  r.x = Math.max(-LARGO + 2, Math.min(LARGO - 2, r.x + dx / d * m));
  r.z = Math.max(-ANCHO + 2, Math.min(ANCHO - 2, r.z + dz / d * m));
}

function calcularEstrellas(N) {
  const umbrales = Object.keys(N.def.estrellas).map(Number).sort((a, b) => a - b);
  for (const u of umbrales) if (N.pasesUsados <= u) return N.def.estrellas[String(u)];
  return 1;
}

function ganar() {
  const N = Juego.nivel;
  N.terminado = true;
  Sonido.gol();
  Escena.celebrarGol();
  mensaje("¡GOOOL! 🎉", "gol", 1600);
  const estrellas = calcularEstrellas(N);
  const clave = "3d-" + N.def.id;
  Espanol.progreso.niveles[clave] = Math.max(Espanol.progreso.niveles[clave] || 0, estrellas);
  Espanol.guardar();
  Juego.resultado = { ganado: true, estrellas, def: N.def };
  setTimeout(() => iniciarQuiz(N.def.temaEspanol), 1500);
}

function perder(razon) {
  const N = Juego.nivel;
  N.terminado = true;
  Juego.resultado = { ganado: false, razon, def: N.def };
  mensaje("Nivel fallido", "error", 1200);
  setTimeout(() => {
    Juego.pantalla = "fin";
    $("fin-titulo").textContent = "Nivel fallido 😔";
    $("fin-detalle").textContent = razon;
    $("btn-siguiente").classList.add("oculto");
    mostrar("fin-nivel");
  }, 1300);
}

// ---------------- Quiz entre niveles ----------------
function iniciarQuiz(tema, origen) {
  Juego.pantalla = "quiz";
  // Desde el aula el quiz es más largo (estudio); tras un nivel, corto (premio).
  const n = origen === "aula" ? 5 : 3;
  Juego.quiz = { preguntas: Espanol.generarQuiz(tema, n), i: 0, aciertos: 0, respondida: false, origen };
  mostrar("quiz");
  renderPregunta();
}

function renderPregunta() {
  const q = Juego.quiz;
  if (q.i >= q.preguntas.length) return finDeNivel();
  const preg = q.preguntas[q.i];
  $("quiz-progreso").textContent = `Pregunta ${q.i + 1} de ${q.preguntas.length} · ⭐ ${Espanol.progreso.monedero}`;
  $("quiz-pregunta").textContent = preg.direccion === "es-en"
    ? `¿Qué significa «${preg.palabra.es}»?`
    : `¿Cómo se dice "${preg.palabra.en}" en español?`;
  const cont = $("quiz-opciones"); cont.innerHTML = "";
  preg.opciones.forEach(op => {
    const btn = document.createElement("button");
    btn.className = "opcion";
    btn.textContent = preg.direccion === "es-en" ? op.en : op.es;
    btn.addEventListener("click", () => responder(btn, op, preg));
    cont.appendChild(btn);
  });
  const pista = $("btn-pista");
  pista.disabled = Espanol.progreso.monedero < 1;
  pista.onclick = () => usarPista(preg);
}

function responder(btn, op, preg) {
  if (Juego.quiz.respondida) return;
  Juego.quiz.respondida = true;
  const correcta = op.es === preg.palabra.es;
  Espanol.registrar(preg.palabra.es, correcta);
  if (correcta) {
    btn.classList.add("correcta");
    Juego.quiz.aciertos++;
    Espanol.progreso.monedero++; Espanol.guardar();
    Sonido.acierto();
  } else {
    btn.classList.add("incorrecta");
    Sonido.robo();
    document.querySelectorAll("#quiz-opciones .opcion").forEach(b => {
      const texto = preg.direccion === "es-en" ? preg.palabra.en : preg.palabra.es;
      if (b.textContent === texto) b.classList.add("correcta");
    });
  }
  setTimeout(() => { Juego.quiz.respondida = false; Juego.quiz.i++; renderPregunta(); }, 1100);
}

function usarPista(preg) {
  if (Espanol.progreso.monedero < 1) return;
  const malas = Array.from(document.querySelectorAll("#quiz-opciones .opcion")).filter(b => {
    const texto = preg.direccion === "es-en" ? preg.palabra.en : preg.palabra.es;
    return b.textContent !== texto && !b.disabled;
  });
  if (!malas.length) return;
  Espanol.progreso.monedero--; Espanol.guardar();
  const b = malas[Math.floor(Math.random() * malas.length)];
  b.disabled = true; b.classList.add("descartada");
  $("btn-pista").disabled = Espanol.progreso.monedero < 1;
  $("quiz-progreso").textContent = `Pregunta ${Juego.quiz.i + 1} de ${Juego.quiz.preguntas.length} · ⭐ ${Espanol.progreso.monedero}`;
}

function finDeNivel() {
  const r = Juego.resultado, q = Juego.quiz;
  if (q.origen === "aula") {
    // El quiz del aula no viene de ganar un nivel: vuelta al aula con resumen.
    irAlAula();
    mensaje(`Quiz: ${q.aciertos} de ${q.preguntas.length} · +${q.aciertos} ⭐`, "exito", 2500);
    return;
  }
  Juego.pantalla = "fin";
  $("fin-titulo").textContent = `¡Nivel superado! ${"★".repeat(r.estrellas)}`;
  $("fin-detalle").textContent = `Quiz de español: ${q.aciertos} de ${q.preguntas.length} · +${q.aciertos} ⭐ para pistas`;
  const idx = NIVELES.findIndex(d => d.id === r.def.id);
  $("btn-siguiente").classList.toggle("oculto", idx >= NIVELES.length - 1);
  mostrar("fin-nivel");
}

// ---------------- Entrada: puntero (arrastrar para apuntar y dar fuerza) ----------------
function calcularAim(clientX, clientY) {
  const N = Juego.nivel;
  const p = Escena.puntoSuelo(clientX, clientY, canvas);
  if (!p) return null;
  const dx = p.x - N.balon.x, dz = p.z - N.balon.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.5) return null;
  return { dirX: dx, dirZ: dz, potencia: Math.min(1, dist / RANGO_ARRASTRE) };
}

canvas.addEventListener("pointerdown", e => {
  if (Juego.pantalla !== "juego" || Juego.nivel.balon.enVuelo || Juego.nivel.terminado) return;
  // En móvil, sin esto el navegador convierte el arrastre en scroll y roba el gesto.
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  Juego.tecActivo = false;
  Juego.aim = calcularAim(e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (Juego.pantalla !== "juego" || !Juego.aim) return;
  e.preventDefault();
  Juego.aim = calcularAim(e.clientX, e.clientY) || Juego.aim;
});
canvas.addEventListener("pointerup", e => {
  if (Juego.pantalla !== "juego" || !Juego.aim) return;
  const a = Juego.aim;
  if (a.potencia > 0.06) lanzar(a.dirX, a.dirZ, a.potencia);
  else { Juego.aim = null; Escena.ocultarFlecha(); }
});
// El sistema puede cancelar el gesto (llamada, notificación, scroll robado):
// nunca dejar el apuntado a medias.
canvas.addEventListener("pointercancel", () => {
  Juego.aim = null;
  Escena.ocultarFlecha();
});

// ---------------- Entrada: teclado / mando ----------------
document.addEventListener("keydown", e => {
  if (Juego.pantalla === "juego") {
    const N = Juego.nivel;
    if (!N || N.balon.enVuelo || N.terminado) return;
    if (e.key === "Escape") return irAlMenu();
    const paso = 0.1;
    if (e.key === "ArrowLeft") { Juego.tecActivo = true; Juego.tecAngulo -= paso; e.preventDefault(); }
    else if (e.key === "ArrowRight") { Juego.tecActivo = true; Juego.tecAngulo += paso; e.preventDefault(); }
    else if (e.key === "ArrowUp") { Juego.tecActivo = true; Juego.tecPotencia = Math.min(1, Juego.tecPotencia + 0.05); e.preventDefault(); }
    else if (e.key === "ArrowDown") { Juego.tecActivo = true; Juego.tecPotencia = Math.max(0.1, Juego.tecPotencia - 0.05); e.preventDefault(); }
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      Juego.tecActivo = true;
      lanzar(Math.cos(Juego.tecAngulo), Math.sin(Juego.tecAngulo), Juego.tecPotencia);
    }
  } else if (Juego.pantalla === "quiz") {
    const n = parseInt(e.key, 10);
    const botones = document.querySelectorAll("#quiz-opciones .opcion");
    if (n >= 1 && n <= botones.length && !botones[n - 1].disabled) botones[n - 1].click();
  } else if (Juego.pantalla === "fin") {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      ($("btn-siguiente").classList.contains("oculto") ? $("btn-repetir") : $("btn-siguiente")).click();
    } else if (e.key === "Escape") irAlMenu();
  } else if (Juego.pantalla === "menu" && (e.key === " " || e.key === "Enter")) {
    e.preventDefault(); irASeleccion();
  } else if (Juego.pantalla === "leccion" && (e.key === " " || e.key === "Enter")) {
    e.preventDefault(); continuarLeccion();
  } else if ((Juego.pantalla === "seleccion" || Juego.pantalla === "progreso" || Juego.pantalla === "leccion" || Juego.pantalla === "aula") && e.key === "Escape") {
    irAlMenu();
  }
});

// ---------------- Entrada: mando de consola (Gamepad API) ----------------
// PS4/PS5/Xbox por Bluetooth o USB, directo en el navegador, sin apps externas.
// En el campo: stick izquierdo (o cruceta) apunta, mantener ✕ carga la fuerza
// y al soltar sale el pase; △ lee el objetivo en voz alta; ○ vuelve al menú.
// En los menús: stick/cruceta mueve el foco amarillo, ✕ pulsa, ○ atrás.
const Mando = {
  visto: false,          // ya se detectó un mando en esta sesión
  prev: {},              // estado de botones del frame anterior (flancos)
  cargando: false,       // ✕ mantenida: cargando potencia de pase
  focoIdx: 0,
  navCooldown: 0,        // anti-repetición al navegar con el stick
  ultimaPantalla: null,
  // La cámara es fija: estos vectores convierten el stick (espacio de
  // pantalla) a dirección sobre el césped (espacio del mundo).
  DER: { x: 0.76, z: 0.65 },   // "derecha de la pantalla" en el mundo
  ARR: { x: 0.65, z: -0.76 }   // "arriba de la pantalla" en el mundo
};

// Fuente de mandos sustituible (los tests inyectan un mando falso).
let obtenerPads = () => (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []);
window.__setPads = f => { obtenerPads = f; };

window.addEventListener("gamepadconnected", e => {
  Mando.visto = true;
  mensaje("🎮 Mando conectado: apunta con el stick, ✕ para pasar", "exito", 3000);
});
window.addEventListener("gamepaddisconnected", () => {
  Mando.cargando = false;
  mensaje("🎮 Mando desconectado", "error");
});

function botonesVisibles() {
  const p = document.querySelector(".pantalla:not(.oculto)");
  return p ? [...p.querySelectorAll("button")].filter(b => !b.disabled && b.offsetParent !== null) : [];
}

function enfocarBoton(delta) {
  const botones = botonesVisibles();
  if (!botones.length) return;
  const actual = botones.findIndex(b => b.classList.contains("gp-foco"));
  botones.forEach(b => b.classList.remove("gp-foco"));
  Mando.focoIdx = actual < 0 ? 0 : (actual + delta + botones.length) % botones.length;
  const b = botones[Mando.focoIdx];
  b.classList.add("gp-foco");
  if (b.scrollIntoView) b.scrollIntoView({ block: "nearest" });
}

function pulsarFoco() {
  const botones = botonesVisibles();
  const b = botones.find(x => x.classList.contains("gp-foco"));
  if (b) b.click();
  else if (botones.length) enfocarBoton(0); // primera pulsación: solo enfocar
}

function sondearMando(dt) {
  const pad = obtenerPads().find(p => p && p.connected);
  if (!pad) return;
  Mando.visto = true;

  // Estado de botones de este frame (mapeo estándar: 0=✕ 1=○ 3=△ 12-15=cruceta)
  const ahora = {};
  [0, 1, 3, 12, 13, 14, 15].forEach(i => { ahora[i] = !!(pad.buttons[i] && pad.buttons[i].pressed); });
  const flancoAbajo = i => ahora[i] && !Mando.prev[i];
  const flancoArriba = i => !ahora[i] && Mando.prev[i];

  // Cambio de pantalla: limpiar foco y estado de carga para no arrastrar nada.
  if (Juego.pantalla !== Mando.ultimaPantalla) {
    Mando.ultimaPantalla = Juego.pantalla;
    Mando.cargando = false;
    document.querySelectorAll(".gp-foco").forEach(b => b.classList.remove("gp-foco"));
    if (Juego.pantalla !== "juego") enfocarBoton(0);
  }

  const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
  const mag = Math.hypot(ax, ay);

  if (Juego.pantalla === "juego") {
    const N = Juego.nivel;
    const puedeJugar = N && !N.balon.enVuelo && !N.terminado;
    // Stick → dirección de pase en el mundo (respetando lo que ves en pantalla).
    if (puedeJugar && mag > 0.3) {
      const sx = ax / Math.max(1, mag), sy = ay / Math.max(1, mag);
      const dirX = sx * Mando.DER.x + (-sy) * Mando.ARR.x;
      const dirZ = sx * Mando.DER.z + (-sy) * Mando.ARR.z;
      Juego.tecAngulo = Math.atan2(dirZ, dirX);
      Juego.tecActivo = true;
    }
    // Cruceta: giro fino del ángulo.
    if (puedeJugar && ahora[14]) { Juego.tecAngulo -= 2.4 * dt; Juego.tecActivo = true; }
    if (puedeJugar && ahora[15]) { Juego.tecAngulo += 2.4 * dt; Juego.tecActivo = true; }
    // ✕: mantener carga la potencia, soltar lanza (como estirar la flecha).
    if (puedeJugar && flancoAbajo(0)) { Mando.cargando = true; Juego.tecPotencia = 0.15; Juego.tecActivo = true; }
    if (Mando.cargando && ahora[0]) Juego.tecPotencia = Math.min(1, Juego.tecPotencia + 0.85 * dt);
    if (flancoArriba(0) && Mando.cargando) {
      Mando.cargando = false;
      if (puedeJugar) lanzar(Math.cos(Juego.tecAngulo), Math.sin(Juego.tecAngulo), Juego.tecPotencia);
    }
    if (flancoAbajo(3) && N && N.objetivo) hablar(N.objetivo.frase || N.objetivo.es);
    if (flancoAbajo(1)) irAlMenu();
  } else {
    // Menús: cruceta o stick mueven el foco, ✕ pulsa, ○ vuelve.
    Mando.navCooldown -= dt;
    const stickNav = Mando.navCooldown <= 0 && Math.abs(ay) > 0.55 ? Math.sign(ay) : 0;
    if (flancoAbajo(13) || flancoAbajo(15) || stickNav > 0) { enfocarBoton(1); Mando.navCooldown = 0.25; }
    if (flancoAbajo(12) || flancoAbajo(14) || stickNav < 0) { enfocarBoton(-1); Mando.navCooldown = 0.25; }
    if (flancoAbajo(0)) pulsarFoco();
    if (flancoAbajo(3) && Juego.pantalla === "quiz" && Juego.quiz) hablar(Juego.quiz.preguntas[Juego.quiz.i].palabra.es);
    if (flancoAbajo(1) && Juego.pantalla !== "menu") irAlMenu();
  }

  Mando.prev = ahora;
}
window.__sondearMando = sondearMando; // gancho de pruebas (RAF se pausa en pestañas ocultas)

// ---------------- Mensajes ----------------
let mensajeTimer = null;
function mensaje(texto, clase, ms) {
  const m = $("mensaje");
  m.textContent = texto;
  m.className = "visible " + (clase || "");
  clearTimeout(mensajeTimer);
  mensajeTimer = setTimeout(() => { m.className = ""; }, ms || 1300);
}

// ---------------- Botones ----------------
$("btn-jugar").addEventListener("click", irASeleccion);
$("btn-progreso").addEventListener("click", irAProgreso);
$("btn-volver-menu").addEventListener("click", irAlMenu);
$("btn-progreso-volver").addEventListener("click", irAlMenu);
$("btn-repetir").addEventListener("click", () => iniciarNivel(Juego.resultado.def, { sinLeccion: true }));
$("btn-siguiente").addEventListener("click", () => {
  const idx = NIVELES.findIndex(d => d.id === Juego.resultado.def.id);
  iniciarNivel(NIVELES[idx + 1]);
});
$("btn-fin-menu").addEventListener("click", irAlMenu);
$("btn-leccion-jugar").addEventListener("click", continuarLeccion);
$("btn-aula").addEventListener("click", irAlAula);
$("btn-aula-volver").addEventListener("click", irAlMenu);
// El objetivo del HUD se puede escuchar en voz alta (clic en el 🔊).
$("hud-objetivo").addEventListener("click", () => {
  const N = Juego.nivel;
  if (N && N.objetivo) hablar(N.objetivo.frase || N.objetivo.es);
});
// La pregunta del quiz también se puede escuchar.
$("quiz-pregunta").addEventListener("click", () => {
  const q = Juego.quiz;
  if (q && q.preguntas[q.i]) hablar(q.preguntas[q.i].palabra.es);
});

// ---------------- Bucle principal ----------------
let ultimo = performance.now();
function bucle(ahora) {
  const dt = Math.min(0.05, (ahora - ultimo) / 1000);
  ultimo = ahora;
  sondearMando(dt);
  const N = Juego.nivel;
  if (Juego.pantalla === "juego" && N) {
    fisica(dt);
    // Flecha de apuntado según el modo de entrada activo.
    if (!N.balon.enVuelo && !N.terminado) {
      if (Juego.aim) Escena.mostrarFlecha(N.balon, Juego.aim.dirX, Juego.aim.dirZ, Juego.aim.potencia);
      else if (Juego.tecActivo) Escena.mostrarFlecha(N.balon, Math.cos(Juego.tecAngulo), Math.sin(Juego.tecAngulo), Juego.tecPotencia);
    }
    Escena.dibujar(N, ahora);
  } else if (N) {
    Escena.dibujar(N, ahora);
  }
  requestAnimationFrame(bucle);
}

// ---------------- Arranque ----------------
// Ganchos para pruebas automatizadas (la pestaña oculta pausa requestAnimationFrame,
// así que los tests avanzan la física con reloj manual).
window.JuegoDbg = Juego;
window.__fisica = fisica;

Escena.init(canvas);
irAlMenu();
requestAnimationFrame(bucle);
// Activa el botón Jugar del menú: el motor 3D ya está cargado.
if (window.__juego3dListo) window.__juego3dListo();
