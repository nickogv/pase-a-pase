// Render del campo, jugadores, rivales, balón y línea de pase (canvas 2D).
const Campo = (() => {
  let cv, ctx;
  let sacudida = 0;

  function init(canvas) {
    cv = canvas;
    ctx = cv.getContext("2d");
  }

  function sacudir(n) { sacudida = n; }

  function dibujar(J, ahora) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    if (sacudida > 0.5) {
      ctx.translate((Math.random() - 0.5) * sacudida, (Math.random() - 0.5) * sacudida);
      sacudida *= 0.88;
    }
    dibujarCesped();
    const N = J.nivel;
    if (N) {
      N.porterias.forEach((p, i) => dibujarPorteria(p, i, N, J, ahora));
      N.rivales.forEach(r => dibujarZonaRival(r));
      if (!J.vuelo && J.seleccionado) dibujarLineaPase(N, J);
      N.rivales.forEach(r => dibujarRival(r));
      N.equipo.forEach((j, i) => dibujarJugador(j, i, N, J, ahora));
      dibujarBalon(J.balon);
    }
    ctx.restore();
  }

  function dibujarCesped() {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#2f8f3f" : "#2a8339";
      ctx.fillRect(0, i * 65, cv.width, 65);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, cv.width - 44, cv.height - 44);
    ctx.beginPath();
    ctx.moveTo(cv.width / 2, 22);
    ctx.lineTo(cv.width / 2, cv.height - 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cv.width / 2, cv.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(22, cv.height / 2 - 90, 90, 180);           // área izquierda
    ctx.strokeRect(cv.width - 112, cv.height / 2 - 90, 90, 180); // área derecha
  }

  function dibujarPorteria(p, i, N, J, ahora) {
    const sel = J.seleccionado && J.seleccionado.tipo === "porteria" && J.seleccionado.idx === i;
    const cerrada = N.def.modo === "palabra-companero" && N.objetivo && N.objetivo.tipo !== "gol";
    const abierta = N.objetivo && N.objetivo.tipo === "gol";
    ctx.save();
    if (cerrada) ctx.globalAlpha = 0.35;
    // marco y red
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(p.x - 10, p.y - 42, 32, 84);
    ctx.strokeStyle = sel ? "#ffd94a" : "#ffffff";
    ctx.lineWidth = sel ? 4 : 3;
    ctx.strokeRect(p.x - 10, p.y - 42, 32, 84);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath(); ctx.moveTo(p.x - 10 + k * 8, p.y - 42); ctx.lineTo(p.x - 10 + k * 8, p.y + 42); ctx.stroke();
    }
    for (let k = 1; k < 10; k++) {
      ctx.beginPath(); ctx.moveTo(p.x - 10, p.y - 42 + k * 8.4); ctx.lineTo(p.x + 22, p.y - 42 + k * 8.4); ctx.stroke();
    }
    // brillo cuando el gol se desbloquea en modo palabra-compañero
    if (abierta) {
      const pulso = 0.5 + 0.5 * Math.sin(ahora / 200);
      ctx.strokeStyle = `rgba(255,217,74,${0.4 + 0.5 * pulso})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(p.x - 14, p.y - 46, 40, 92);
    }
    if (p.palabra) etiqueta(p.palabra, p.x + 6, p.y + 58);
    ctx.restore();
  }

  function dibujarZonaRival(r) {
    ctx.fillStyle = "rgba(255,60,60,0.10)";
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,90,90,0.45)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function dibujarRival(r) {
    ctx.fillStyle = "#d93636";
    ctx.beginPath();
    ctx.arc(r.x, r.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8f1f1f";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function dibujarJugador(j, i, N, J, ahora) {
    const esPortador = i === N.portador;
    const sel = J.seleccionado && J.seleccionado.tipo === "companero" && J.seleccionado.idx === i;
    if (sel) {
      const pulso = 3 + Math.sin(ahora / 150) * 1.5;
      ctx.strokeStyle = "#ffd94a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(j.x, j.y, 20 + pulso, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = esPortador ? "#4d9bff" : "#1e6fd9";
    ctx.beginPath();
    ctx.arc(j.x, j.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = esPortador ? "#ffffff" : "#124a94";
    ctx.lineWidth = esPortador ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(j.dorsal), j.x, j.y + 1);
    if (j.palabra) etiqueta(j.palabra, j.x, j.y + 34);
  }

  function etiqueta(texto, x, y) {
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ancho = ctx.measureText(texto).width + 12;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(x - ancho / 2, y - 10, ancho, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(texto, x, y + 1);
  }

  function dibujarLineaPase(N, J) {
    const rec = J.seleccionado;
    const desde = J.balon, hasta = { x: rec.x, y: rec.y };
    const inter = Pases.intercepcion(desde, hasta, N.rivales);
    ctx.strokeStyle = inter ? "rgba(255,80,80,0.9)" : "rgba(120,255,120,0.9)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(hasta.x, hasta.y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (inter) {
      ctx.fillStyle = "rgba(255,80,80,0.9)";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✕", inter.x, inter.y - 12);
    }
  }

  function dibujarBalon(b) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return { init, dibujar, sacudir };
})();
