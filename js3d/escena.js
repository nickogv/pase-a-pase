// Render 3D con Three.js: campo, jugadores de bloques (voxel), balón, porterías,
// flecha de apuntado y etiquetas flotantes. Separado de la lógica (juego3d.js):
// aquí solo se construyen y sincronizan mallas a partir del estado numérico.
import * as THREE from "three";

const LARGO = 30, ANCHO = 18; // semiejes del campo en x y z

let renderer, scene, camera, raycaster, planoSuelo;
let grupoNivel = null;      // contenedor de todo lo del nivel actual
let mallas = {};            // referencias por sincronizar cada frame
let flecha, flechaCuerpo, flechaPunta;

export function init(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e2a17);
  scene.fog = new THREE.Fog(0x0e2a17, 70, 130);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  // Vista angulada desde detrás de nuestro lado, estilo Mini Soccer Star / Crossy Road.
  camera.position.set(-30, 34, 40);
  camera.lookAt(4, 0, 0);

  scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x2e6b34, 0.9));
  const sol = new THREE.DirectionalLight(0xffffff, 1.15);
  sol.position.set(-18, 44, 24);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  const s = 60;
  sol.shadow.camera.left = -s; sol.shadow.camera.right = s;
  sol.shadow.camera.top = s; sol.shadow.camera.bottom = -s;
  sol.shadow.camera.far = 140;
  scene.add(sol);

  construirCampo();

  raycaster = new THREE.Raycaster();
  planoSuelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  redimensionar(canvas);
  window.addEventListener("resize", () => redimensionar(canvas));
}

function redimensionar(canvas) {
  // En vertical (móvil) el lienzo se hace más alto y la cámara abre el ángulo
  // para que el campo entero siga cabiendo en pantalla.
  const vertical = window.innerHeight > window.innerWidth;
  canvas.style.height = vertical
    ? Math.round(canvas.clientWidth * 1.15) + "px"
    : "";
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.95 ? 70 : camera.aspect < 1.35 ? 56 : 45;
  camera.updateProjectionMatrix();
}

function caja(w, h, d, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function construirCampo() {
  const cesped = new THREE.Group();
  // Franjas de césped alternas (bloques planos), estética a rayas de campo.
  const franjas = 10;
  for (let i = 0; i < franjas; i++) {
    const t = new THREE.Mesh(
      new THREE.BoxGeometry((LARGO * 2) / franjas, 1, ANCHO * 2 + 8),
      new THREE.MeshLambertMaterial({ color: i % 2 ? 0x2f8f3f : 0x2a8339 })
    );
    t.position.set(-LARGO + (i + 0.5) * (LARGO * 2) / franjas, -0.5, 0);
    t.receiveShadow = true;
    cesped.add(t);
  }
  // Líneas del campo (cajas blancas finas sobre el césped).
  const linMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const linea = (w, d, x, z) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), linMat);
    l.position.set(x, 0.06, z);
    cesped.add(l);
  };
  linea(0.3, ANCHO * 2, 0, 0);                         // línea de medio campo
  linea(LARGO * 2, 0.3, 0, -ANCHO);                    // banda inferior
  linea(LARGO * 2, 0.3, 0, ANCHO);                     // banda superior
  linea(0.3, ANCHO * 2, -LARGO, 0);                    // fondo izquierdo
  linea(0.3, ANCHO * 2, LARGO, 0);                     // fondo derecho
  const circulo = new THREE.Mesh(
    new THREE.TorusGeometry(6, 0.15, 8, 40),
    linMat
  );
  circulo.rotation.x = Math.PI / 2;
  circulo.position.y = 0.06;
  cesped.add(circulo);
  scene.add(cesped);
}

// ---------- Jugador de bloques (voxel) ----------
function construirJugador(colorCamiseta) {
  const g = new THREE.Group();
  const piel = 0xf0c090, shorts = 0x1c1c28;
  const piernaIzq = caja(0.7, 1.6, 0.7, shorts); piernaIzq.position.set(0, 0.8, -0.5);
  const piernaDer = caja(0.7, 1.6, 0.7, shorts); piernaDer.position.set(0, 0.8, 0.5);
  const torso = caja(1.5, 1.9, 1.7, colorCamiseta); torso.position.set(0, 2.55, 0);
  const brazoIzq = caja(0.55, 1.6, 0.55, colorCamiseta); brazoIzq.position.set(0, 2.5, -1.15);
  const brazoDer = caja(0.55, 1.6, 0.55, colorCamiseta); brazoDer.position.set(0, 2.5, 1.15);
  const cabeza = caja(1.2, 1.2, 1.2, piel); cabeza.position.set(0, 4.1, 0);
  g.add(piernaIzq, piernaDer, torso, brazoIzq, brazoDer, cabeza);
  return g;
}

function construirBalon() {
  // Balón "de bloques": icosaedro de baja resolución blanco con manchas oscuras.
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 0),
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
  );
  base.castShadow = true;
  const manchas = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.86, 0),
    new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true, wireframe: true })
  );
  g.add(base, manchas);
  return g;
}

// ---------- Portería 3D ----------
function construirPorteria(ancho, resaltada) {
  const g = new THREE.Group();
  const posteMat = new THREE.MeshLambertMaterial({ color: resaltada ? 0xffd94a : 0xffffff });
  const h = 7, med = ancho / 2;
  const poste = (z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), posteMat);
    p.position.set(0, h / 2, z); p.castShadow = true; return p;
  };
  const larguero = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, ancho), posteMat);
  larguero.position.set(0, h, 0); larguero.castShadow = true;
  const red = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, h),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 })
  );
  red.rotation.y = Math.PI / 2;
  red.position.set(1.6, h / 2, 0);
  g.add(poste(-med), poste(med), larguero, red);
  return g;
}

// ---------- Etiqueta flotante (sprite con textura de canvas) ----------
function construirEtiqueta(texto, escala) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const ctx = c.getContext("2d");
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ancho = ctx.measureText(texto).width + 60;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  redondear(ctx, (512 - ancho) / 2, 26, ancho, 76, 20);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(texto, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set((escala || 8) * (c.width / c.height), escala || 8, 1);
  return sp;
}

function redondear(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Construcción / limpieza del nivel ----------
export function construirNivel(estado) {
  if (grupoNivel) scene.remove(grupoNivel);
  grupoNivel = new THREE.Group();
  mallas = { equipo: [], rivales: [], porterias: [] };

  estado.equipo.forEach((j, i) => {
    const wrap = new THREE.Group();
    const fig = construirJugador(0x2f6bd8);
    wrap.add(fig);
    if (j.palabra) {
      const et = construirEtiqueta(j.palabra, 3.4);
      et.position.y = 6.2;
      wrap.add(et);
    }
    // Aro de resaltado del portador (anillo en el suelo).
    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.18, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd94a })
    );
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0.15;
    aro.visible = false;
    wrap.add(aro);
    wrap.position.set(j.x, 0, j.z);
    grupoNivel.add(wrap);
    mallas.equipo.push({ wrap, fig, aro });
  });

  estado.rivales.forEach((r) => {
    const wrap = new THREE.Group();
    wrap.add(construirJugador(0xd93636));
    // Zona de intercepción (disco translúcido en el suelo).
    const zona = new THREE.Mesh(
      new THREE.CircleGeometry(r.radio, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.18 })
    );
    zona.rotation.x = -Math.PI / 2;
    zona.position.y = 0.08;
    wrap.add(zona);
    wrap.position.set(r.x, 0, r.z);
    grupoNivel.add(wrap);
    mallas.rivales.push({ wrap });
  });

  estado.porterias.forEach((p) => {
    const wrap = new THREE.Group();
    const malla = construirPorteria(p.ancho, false);
    wrap.add(malla);
    let etiqueta = null;
    if (p.palabra) {
      etiqueta = construirEtiqueta(p.palabra, 3.8);
      etiqueta.position.y = 8.5;
      wrap.add(etiqueta);
    }
    wrap.position.set(p.x, 0, p.z);
    grupoNivel.add(wrap);
    mallas.porterias.push({ wrap, malla, etiqueta, ancho: p.ancho });
  });

  // Conos de referencia espacial (niveles de preposiciones).
  (estado.conos || []).forEach(c => {
    const cono = new THREE.Mesh(
      new THREE.ConeGeometry(1.3, 2.6, 12),
      new THREE.MeshLambertMaterial({ color: 0xff8c1a })
    );
    cono.position.set(c[0], 1.3, c[1]);
    cono.castShadow = true;
    const franja = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 0.5, 12),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    franja.position.set(c[0], 1.9, c[1]);
    grupoNivel.add(cono, franja);
  });

  // Balón
  mallas.balon = construirBalon();
  grupoNivel.add(mallas.balon);

  // Flecha de apuntado (cuerpo + punta), oculta por defecto.
  flecha = new THREE.Group();
  flechaCuerpo = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.3, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xffe14a })
  );
  flechaPunta = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffe14a })
  );
  flechaPunta.rotation.x = Math.PI / 2;
  flecha.add(flechaCuerpo, flechaPunta);
  flecha.visible = false;
  grupoNivel.add(flecha);

  scene.add(grupoNivel);
}

// Colorea una portería según esté seleccionada/abierta/cerrada.
export function estadoPorteria(i, { seleccionada, cerrada, abierta }) {
  const p = mallas.porterias[i];
  if (!p) return;
  const color = seleccionada || abierta ? 0xffd94a : 0xffffff;
  p.malla.traverse(o => {
    if (o.material && o.material.color && !o.material.wireframe) o.material.color.setHex(color);
  });
  p.wrap.children.forEach(c => { if (c.type !== "Sprite") c.visible = true; });
  p.malla.scale.setScalar(cerrada ? 0.9 : 1);
  if (p.malla.children[0]) p.malla.traverse(o => { if (o.material) o.material.opacity = cerrada ? 0.5 : 1; });
}

// ---------- Sincronización por frame ----------
export function dibujar(estado, ahora) {
  const bob = Math.sin(ahora / 250) * 0.15;
  mallas.equipo.forEach((m, i) => {
    const j = estado.equipo[i];
    m.wrap.position.x = j.x;
    m.wrap.position.z = j.z;
    const esPortador = i === estado.portador;
    m.aro.visible = esPortador;
    m.fig.position.y = esPortador ? bob + 0.1 : 0;
    if (m.aro.visible) m.aro.rotation.z = ahora / 600;
    // El jugador mira hacia la portería de ataque (+x).
    m.fig.rotation.y = 0;
  });
  mallas.rivales.forEach((m, i) => {
    const r = estado.rivales[i];
    m.wrap.position.x = r.x;
    m.wrap.position.z = r.z;
  });
  // Balón
  const b = estado.balon;
  mallas.balon.position.set(b.x, 0.85 + (b.y || 0), b.z);
  mallas.balon.rotation.x += (b.vx || 0) * 0.03;
  mallas.balon.rotation.z -= (b.vz || 0) * 0.03;

  // Etiquetas siempre de frente (los sprites ya encaran la cámara solos).
  renderer.render(scene, camera);
}

// Muestra/actualiza la flecha de apuntado desde el balón.
export function mostrarFlecha(desde, dirX, dirZ, potencia) {
  flecha.visible = true;
  const largo = 3 + potencia * 14; // longitud proporcional a la fuerza
  flecha.position.set(desde.x, 0.4, desde.z);
  const ang = Math.atan2(dirZ, dirX);
  flecha.rotation.y = -ang + Math.PI / 2;
  flechaCuerpo.scale.z = largo / 1.4;
  flechaCuerpo.position.set(0, 0, largo / 2);
  flechaPunta.position.set(0, 0, largo + 0.8);
  // De verde (seguro/suave) a rojo (máxima potencia).
  const color = new THREE.Color().setHSL(0.33 * (1 - potencia), 0.85, 0.55);
  flechaCuerpo.material.color.copy(color);
  flechaPunta.material.color.copy(color);
}

export function ocultarFlecha() {
  if (flecha) flecha.visible = false;
}

// Convierte coordenadas de pantalla a un punto {x, z} sobre el césped.
export function puntoSuelo(clientX, clientY, canvas) {
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const destino = new THREE.Vector3();
  raycaster.ray.intersectPlane(planoSuelo, destino);
  return destino ? { x: destino.x, z: destino.z } : null;
}

export function celebrarGol() {
  // Pequeño zoom de cámara al marcar.
  const orig = camera.position.clone();
  let t = 0;
  const id = setInterval(() => {
    t += 0.05;
    camera.position.lerpVectors(orig, new THREE.Vector3(orig.x + 4, orig.y - 4, orig.z + 4), Math.sin(t * Math.PI));
    if (t >= 1) { camera.position.copy(orig); clearInterval(id); }
  }, 16);
}
