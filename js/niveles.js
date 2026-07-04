// Estado en ejecución de un nivel: jugadores, rivales, objetivo de español y turnos.
const Niveles = (() => {
  const RADIO_RIVAL = 26;

  function cargar(def) {
    const N = {
      def,
      equipo: def.equipo.map((e, i) => ({ x: e[0], y: e[1], palabra: e[2] || null, dorsal: i + 1 })),
      rivales: def.rivales.map(r => ({ x: r.pos[0], y: r.pos[1], tipo: r.tipo, radio: RADIO_RIVAL })),
      porterias: def.porterias.map(p => ({ x: p.pos[0], y: p.pos[1], palabra: p.palabra || null })),
      portador: 0,
      pasesRestantes: def.pasesMax,
      pasesUsados: 0,
      robos: 0,
      aciertosPalabra: 0,
      objetivo: null,   // {tipo, es, en} en los modos palabra
      terminado: false
    };
    elegirObjetivo(N);
    return N;
  }

  function elegirObjetivo(N) {
    const d = N.def;
    if (d.modo === "palabra-porteria") {
      const p = N.porterias[Math.floor(Math.random() * N.porterias.length)];
      N.objetivo = Object.assign({ tipo: "porteria" }, Espanol.buscar(p.palabra));
    } else if (d.modo === "palabra-companero") {
      if (N.aciertosPalabra >= (d.aciertosNecesarios || 2)) {
        N.objetivo = { tipo: "gol", es: "la portería", en: "the goal" };
      } else {
        const anterior = N.objetivo ? N.objetivo.es : null;
        let cands = N.equipo.filter((j, i) => j.palabra && i !== N.portador && j.palabra !== anterior);
        if (!cands.length) cands = N.equipo.filter((j, i) => j.palabra && i !== N.portador);
        const j = cands[Math.floor(Math.random() * cands.length)];
        N.objetivo = Object.assign({ tipo: "companero" }, Espanol.buscar(j.palabra));
      }
    } else {
      N.objetivo = null;
    }
  }

  // Receptores posibles del portador actual (compañeros + porterías si están abiertas).
  function receptores(N) {
    const lista = [];
    N.equipo.forEach((j, i) => {
      if (i !== N.portador) lista.push({ tipo: "companero", idx: i, x: j.x, y: j.y, palabra: j.palabra });
    });
    const golCerrado = N.def.modo === "palabra-companero" && N.objetivo && N.objetivo.tipo !== "gol";
    N.porterias.forEach((p, i) => {
      lista.push({ tipo: "porteria", idx: i, x: p.x, y: p.y, palabra: p.palabra, cerrada: golCerrado });
    });
    return lista;
  }

  // Reposicionamiento por turnos tras cada pase completado (estilo puzzle, no arcade).
  function moverRivales(N) {
    const portador = N.equipo[N.portador];
    for (const r of N.rivales) {
      if (r.tipo === "persigue-linea") {
        acercar(N, r, portador, 48, 46);
      } else if (r.tipo === "marca-jugador") {
        let mejor = null, md = Infinity;
        N.equipo.forEach((j, i) => {
          if (i === N.portador) return;
          const d = Math.hypot(j.x - r.x, j.y - r.y);
          if (d < md) { md = d; mejor = j; }
        });
        if (mejor) acercar(N, r, mejor, 48, 40);
      }
    }
  }

  function acercar(N, r, obj, paso, minDist) {
    const dx = obj.x - r.x, dy = obj.y - r.y, d = Math.hypot(dx, dy);
    if (d <= minDist) return;
    const m = Math.min(paso, d - minDist);
    r.x = Math.max(45, Math.min(740, r.x + dx / d * m));
    r.y = Math.max(45, Math.min(475, r.y + dy / d * m));
  }

  // Estrellas según pases usados: {"2":3,"3":2} = 3 estrellas con ≤2 pases, 2 con ≤3, si no 1.
  function calcularEstrellas(N) {
    const umbrales = Object.keys(N.def.estrellas).map(Number).sort((a, b) => a - b);
    for (const u of umbrales) {
      if (N.pasesUsados <= u) return N.def.estrellas[String(u)];
    }
    return 1;
  }

  return { cargar, receptores, moverRivales, elegirObjetivo, calcularEstrellas };
})();
