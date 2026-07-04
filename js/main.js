// Bucle principal, estados de pantalla, entrada (ratón/táctil/teclado) y sonido.
const Juego = {
  pantalla: "menu",   // menu | seleccion | juego | quiz | fin | progreso
  nivelDef: null,
  nivel: null,
  seleccionado: null, // receptor resaltado
  vuelo: null,        // animación del balón en curso
  balon: { x: 0, y: 0 },
  quiz: null,
  resultado: null     // datos para la pantalla de fin
};

const $ = id => document.getElementById(id);
const canvas = $("campo");
Campo.init(canvas);

// ---------- Pantallas ----------

function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.add("oculto"));
  if (id) $(id).classList.remove("oculto");
  $("hud").classList.toggle("oculto", Juego.pantalla !== "juego");
}

function irAlMenu() {
  Juego.pantalla = "menu";
  Juego.nivel = null;
  mostrar("menu");
}

function irASeleccion() {
  Juego.pantalla = "seleccion";
  const lista = $("lista-niveles");
  lista.innerHTML = "";
  const niveles = window.DATA_NIVELES;
  niveles.forEach((def, i) => {
    const estrellas = Espanol.progreso.niveles[def.id] || 0;
    const bloqueado = i > 0 && !Espanol.progreso.niveles[niveles[i - 1].id];
    const btn = document.createElement("button");
    btn.className = "nivel-btn" + (bloqueado ? " bloqueado" : "");
    btn.innerHTML =
      `<span class="nivel-num">${def.id}</span>` +
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
  for (const tema in window.DATA_VOCABULARIO.temas) {
    const h = document.createElement("h3");
    h.textContent = tema.replace(/-/g, " ");
    cont.appendChild(h);
    for (const w of window.DATA_VOCABULARIO.temas[tema]) {
      const p = Espanol.progreso.palabras[w.es];
      const estado = p && p.dominada ? "✓" : (p && p.vistas > 0 ? "•" : "○");
      if (p && p.dominada) dominadas++;
      else if (p && p.vistas > 0) vistas++;
      const fila = document.createElement("div");
      fila.className = "palabra-fila" + (p && p.dominada ? " dominada" : "");
      fila.innerHTML = `<span class="palabra-estado">${estado}</span><span class="palabra-es">${w.es}</span><span class="palabra-en">${w.en}</span>`;
      cont.appendChild(fila);
    }
  }
  $("progreso-resumen").textContent = `Dominadas: ${dominadas} · En progreso: ${vistas} · Estrellas: ${Espanol.progreso.monedero} ⭐`;
  mostrar("progreso");
}

// ---------- Nivel ----------

function iniciarNivel(def) {
  Juego.pantalla = "juego";
  Juego.nivelDef = def;
  Juego.nivel = Niveles.cargar(def);
  Juego.seleccionado = null;
  Juego.vuelo = null;
  colocarBalon();
  mostrar(null);
  actualizarHUD();
  if (def.ayuda) mensaje(def.ayuda, "ayuda", 4000);
}

function colocarBalon() {
  const p = Juego.nivel.equipo[Juego.nivel.portador];
  Juego.balon.x = p.x + 16;
  Juego.balon.y = p.y - 12;
}

function actualizarHUD() {
  const N = Juego.nivel;
  if (!N) return;
  $("hud-nivel").textContent = `Nivel ${N.def.id}: ${N.def.nombre}`;
  $("hud-pases").textContent = `Pases: ${N.pasesRestantes}`;
  $("hud-robos").textContent = `Robos: ${N.robos}/${N.def.robosMax}`;
  const obj = $("hud-objetivo");
  if (N.objetivo) {
    // El objetivo se muestra en inglés: la tarea del jugador es encontrar
    // la etiqueta en español correcta sobre el campo.
    obj.textContent = `🎯 Pasa a: «${N.objetivo.en}»`;
    obj.classList.remove("oculto");
  } else {
    obj.classList.add("oculto");
  }
}

function pasar(rec) {
  const N = Juego.nivel;
  if (!N || Juego.vuelo || N.terminado) return;
  if (rec.cerrada) { mensaje("La portería está cerrada. Sigue el objetivo 🎯", "error"); return; }
  const desde = { x: Juego.balon.x, y: Juego.balon.y };
  const hasta = { x: rec.x, y: rec.y };
  const inter = Pases.intercepcion(desde, hasta, N.rivales);
  N.pasesRestantes--;
  N.pasesUsados++;
  Juego.seleccionado = null;
  Sonido.pase();
  if (inter) {
    volar(desde, { x: inter.x, y: inter.y }, () => procesarRobo());
  } else {
    volar(desde, hasta, () => procesarLlegada(rec));
  }
  actualizarHUD();
}

function volar(desde, hasta, alLlegar) {
  Juego.vuelo = { desde, hasta, inicio: performance.now(), dur: Pases.duracion(desde, hasta), alLlegar };
}

function procesarRobo(textoExtra) {
  const N = Juego.nivel;
  N.robos++;
  Sonido.robo();
  mensaje(textoExtra || "¡Intercepción!", "error");
  actualizarHUD();
  if (N.robos > N.def.robosMax) return perder("Demasiados balones perdidos.");
  if (N.pasesRestantes <= 0) return perder("Te quedaste sin pases.");
  // el balón vuelve al portador para reintentar
  const p = N.equipo[N.portador];
  volar({ x: Juego.balon.x, y: Juego.balon.y }, { x: p.x + 16, y: p.y - 12 }, () => {});
}

function procesarLlegada(rec) {
  const N = Juego.nivel;
  if (rec.tipo === "porteria") {
    if (N.def.modo === "palabra-porteria" && rec.palabra !== N.objetivo.es) {
      Espanol.registrar(N.objetivo.es, false);
      return procesarRobo(`¡Esa no! «${N.objetivo.en}» es «${N.objetivo.es}»`);
    }
    if (N.def.modo === "palabra-porteria") Espanol.registrar(N.objetivo.es, true);
    return ganar();
  }
  // pase a un compañero
  N.portador = rec.idx;
  colocarBalon();
  if (N.def.modo === "palabra-companero" && N.objetivo && N.objetivo.tipo === "companero" && rec.palabra) {
    if (rec.palabra === N.objetivo.es) {
      Espanol.registrar(rec.palabra, true);
      N.aciertosPalabra++;
      Niveles.elegirObjetivo(N);
      mensaje(N.objetivo.tipo === "gol" ? "¡Muy bien! ¡Ahora a la portería!" : "¡Muy bien!", "exito");
    } else {
      Espanol.registrar(N.objetivo.es, false);
      Niveles.moverRivales(N);
      actualizarHUD();
      return procesarRobo(`Ese es «${rec.palabra}». Buscabas «${N.objetivo.es}»`);
    }
  } else {
    mensaje("¡Pase!", "exito", 700);
  }
  Niveles.moverRivales(N);
  actualizarHUD();
  if (N.pasesRestantes <= 0) perder("Te quedaste sin pases.");
}

function ganar() {
  const N = Juego.nivel;
  N.terminado = true;
  Sonido.gol();
  Campo.sacudir(14);
  mensaje("¡GOOOL! 🎉", "gol", 1500);
  const estrellas = Niveles.calcularEstrellas(N);
  const previas = Espanol.progreso.niveles[N.def.id] || 0;
  Espanol.progreso.niveles[N.def.id] = Math.max(previas, estrellas);
  Espanol.guardar();
  Juego.resultado = { ganado: true, estrellas, def: N.def };
  setTimeout(() => iniciarQuiz(N.def.temaEspanol), 1400);
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

// ---------- Quiz entre niveles ----------

function iniciarQuiz(tema) {
  Juego.pantalla = "quiz";
  Juego.quiz = { preguntas: Espanol.generarQuiz(tema, 3), i: 0, aciertos: 0 };
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
  const cont = $("quiz-opciones");
  cont.innerHTML = "";
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
    Espanol.progreso.monedero++;
    Espanol.guardar();
    Sonido.acierto();
  } else {
    btn.classList.add("incorrecta");
    Sonido.robo();
    // resalta la respuesta correcta
    document.querySelectorAll("#quiz-opciones .opcion").forEach(b => {
      const texto = preg.direccion === "es-en" ? preg.palabra.en : preg.palabra.es;
      if (b.textContent === texto) b.classList.add("correcta");
    });
  }
  setTimeout(() => {
    Juego.quiz.respondida = false;
    Juego.quiz.i++;
    renderPregunta();
  }, 1100);
}

function usarPista(preg) {
  if (Espanol.progreso.monedero < 1) return;
  const malas = Array.from(document.querySelectorAll("#quiz-opciones .opcion")).filter(b => {
    const texto = preg.direccion === "es-en" ? preg.palabra.en : preg.palabra.es;
    return b.textContent !== texto && !b.disabled;
  });
  if (!malas.length) return;
  Espanol.progreso.monedero--;
  Espanol.guardar();
  const b = malas[Math.floor(Math.random() * malas.length)];
  b.disabled = true;
  b.classList.add("descartada");
  $("btn-pista").disabled = Espanol.progreso.monedero < 1;
  $("quiz-progreso").textContent = `Pregunta ${Juego.quiz.i + 1} de ${Juego.quiz.preguntas.length} · ⭐ ${Espanol.progreso.monedero}`;
}

function finDeNivel() {
  const r = Juego.resultado;
  const q = Juego.quiz;
  Juego.pantalla = "fin";
  $("fin-titulo").textContent = `¡Nivel superado! ${"★".repeat(r.estrellas)}`;
  $("fin-detalle").textContent = `Quiz de español: ${q.aciertos} de ${q.preguntas.length} · +${q.aciertos} ⭐ para pistas`;
  const idx = window.DATA_NIVELES.findIndex(d => d.id === r.def.id);
  $("btn-siguiente").classList.toggle("oculto", idx >= window.DATA_NIVELES.length - 1);
  mostrar("fin-nivel");
}

// ---------- Entrada: ratón / táctil ----------

function coordsCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x: cx * canvas.width / rect.width, y: cy * canvas.height / rect.height };
}

function receptorEn(x, y) {
  if (!Juego.nivel) return null;
  let mejor = null, md = 34;
  for (const r of Niveles.receptores(Juego.nivel)) {
    const d = Math.hypot(r.x - x, r.y - y);
    if (d < md) { md = d; mejor = r; }
  }
  return mejor;
}

canvas.addEventListener("mousemove", e => {
  if (Juego.pantalla !== "juego" || Juego.vuelo) return;
  const c = coordsCanvas(e);
  Juego.seleccionado = receptorEn(c.x, c.y);
  canvas.style.cursor = Juego.seleccionado ? "pointer" : "default";
});

canvas.addEventListener("click", e => {
  if (Juego.pantalla !== "juego" || Juego.vuelo) return;
  const c = coordsCanvas(e);
  const rec = receptorEn(c.x, c.y);
  if (rec) pasar(rec);
});

canvas.addEventListener("touchstart", e => {
  if (Juego.pantalla !== "juego" || Juego.vuelo) return;
  e.preventDefault();
  const c = coordsCanvas(e);
  const rec = receptorEn(c.x, c.y);
  if (rec) pasar(rec);
}, { passive: false });

// ---------- Entrada: teclado (compatible con un mando mapeado a teclas) ----------

document.addEventListener("keydown", e => {
  if (Juego.pantalla === "juego") {
    const N = Juego.nivel;
    if (!N || Juego.vuelo) return;
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      e.preventDefault();
      seleccionarPorDireccion(dirs[e.key]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!Juego.seleccionado) seleccionarPorDireccion([1, 0]);
      if (Juego.seleccionado) pasar(Juego.seleccionado);
    } else if (e.key === "Tab") {
      e.preventDefault();
      ciclarSeleccion();
    } else if (e.key === "Escape") {
      irAlMenu();
    }
  } else if (Juego.pantalla === "quiz") {
    const n = parseInt(e.key, 10);
    const botones = document.querySelectorAll("#quiz-opciones .opcion");
    if (n >= 1 && n <= botones.length && !botones[n - 1].disabled) botones[n - 1].click();
  } else if (Juego.pantalla === "fin") {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const btn = $("btn-siguiente").classList.contains("oculto") ? $("btn-repetir") : $("btn-siguiente");
      btn.click();
    } else if (e.key === "Escape") {
      irAlMenu();
    }
  } else if (Juego.pantalla === "menu" && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    irASeleccion();
  } else if ((Juego.pantalla === "seleccion" || Juego.pantalla === "progreso") && e.key === "Escape") {
    irAlMenu();
  }
});

function seleccionarPorDireccion(dir) {
  const N = Juego.nivel;
  const ref = Juego.seleccionado || N.equipo[N.portador];
  const cands = Niveles.receptores(N).filter(r => r.x !== ref.x || r.y !== ref.y);
  let mejor = null, mejorPunt = Infinity;
  for (const r of cands) {
    const dx = r.x - ref.x, dy = r.y - ref.y;
    const d = Math.hypot(dx, dy);
    const alineado = (dx * dir[0] + dy * dir[1]) / (d || 1);
    if (alineado < 0.3) continue; // debe estar en esa dirección
    const punt = d / alineado;
    if (punt < mejorPunt) { mejorPunt = punt; mejor = r; }
  }
  if (mejor) Juego.seleccionado = mejor;
  else if (!Juego.seleccionado) ciclarSeleccion();
}

function ciclarSeleccion() {
  const lista = Niveles.receptores(Juego.nivel);
  if (!lista.length) return;
  const i = Juego.seleccionado
    ? lista.findIndex(r => r.tipo === Juego.seleccionado.tipo && r.idx === Juego.seleccionado.idx)
    : -1;
  Juego.seleccionado = lista[(i + 1) % lista.length];
}

// ---------- Mensajes flotantes ----------

let mensajeTimer = null;
function mensaje(texto, clase, ms) {
  const m = $("mensaje");
  m.textContent = texto;
  m.className = "visible " + (clase || "");
  clearTimeout(mensajeTimer);
  mensajeTimer = setTimeout(() => { m.className = ""; }, ms || 1300);
}

// ---------- Sonido (sintetizado, sin archivos) ----------

const Sonido = (() => {
  let actx = null;
  function ctx() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return actx;
  }
  function nota(freq, dur, tipo, retraso, vol) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime + (retraso || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = tipo || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur);
  }
  return {
    pase: () => nota(420, 0.12, "triangle"),
    robo: () => nota(130, 0.3, "sawtooth", 0, 0.08),
    acierto: () => { nota(520, 0.1); nota(780, 0.15, "sine", 0.09); },
    gol: () => { nota(392, 0.15); nota(494, 0.15, "sine", 0.13); nota(587, 0.3, "sine", 0.26); nota(784, 0.45, "sine", 0.4); }
  };
})();

// ---------- Botones de las pantallas ----------

$("btn-jugar").addEventListener("click", irASeleccion);
$("btn-progreso").addEventListener("click", irAProgreso);
$("btn-volver-menu").addEventListener("click", irAlMenu);
$("btn-progreso-volver").addEventListener("click", irAlMenu);
$("btn-repetir").addEventListener("click", () => iniciarNivel(Juego.resultado.def));
$("btn-siguiente").addEventListener("click", () => {
  const idx = window.DATA_NIVELES.findIndex(d => d.id === Juego.resultado.def.id);
  iniciarNivel(window.DATA_NIVELES[idx + 1]);
});
$("btn-fin-menu").addEventListener("click", irAlMenu);

// ---------- Bucle ----------

function paso(ahora) {
  const v = Juego.vuelo;
  if (v) {
    const t = Math.min(1, (ahora - v.inicio) / v.dur);
    const k = Pases.easeOutCubic(t);
    Juego.balon.x = v.desde.x + (v.hasta.x - v.desde.x) * k;
    Juego.balon.y = v.desde.y + (v.hasta.y - v.desde.y) * k;
    if (t >= 1) {
      Juego.vuelo = null;
      v.alLlegar();
    }
  }
  Campo.dibujar(Juego, ahora);
  requestAnimationFrame(paso);
}

irAlMenu();
requestAnimationFrame(paso);
