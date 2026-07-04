// Geometría del pase: distancia línea-rival e intercepciones.
const Pases = (() => {
  // Punto más cercano del segmento AB al punto P.
  function distSegPunto(ax, ay, bx, by, px, py) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cy = ay + t * dy;
    return { d: Math.hypot(px - cx, py - cy), t, x: cx, y: cy };
  }

  // Primer rival (el más cercano al origen del pase) cuya zona corta la línea.
  // Devuelve null si el pase es seguro.
  function intercepcion(desde, hasta, rivales) {
    let mejor = null;
    for (const r of rivales) {
      const s = distSegPunto(desde.x, desde.y, hasta.x, hasta.y, r.x, r.y);
      if (s.d < r.radio && (!mejor || s.t < mejor.t)) {
        mejor = { rival: r, x: s.x, y: s.y, t: s.t };
      }
    }
    return mejor;
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // Duración del vuelo del balón según distancia (300–500 ms).
  function duracion(desde, hasta) {
    const d = Math.hypot(hasta.x - desde.x, hasta.y - desde.y);
    return 300 + Math.min(200, d * 0.35);
  }

  return { distSegPunto, intercepcion, easeOutCubic, duracion };
})();
