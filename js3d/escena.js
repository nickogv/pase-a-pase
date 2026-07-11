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

function cil(rArr, rAb, h, color, opciones) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rArr, rAb, h, 14),
    new THREE.MeshLambertMaterial(Object.assign({ color }, opciones || {}))
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function bola(r, color, escalaY) {
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 1),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  if (escalaY) m.scale.y = escalaY;
  m.castShadow = true;
  return m;
}

// ---------- Figuras voxel para personajes no humanos ----------
// Los niveles pueden alinear animales, comida y objetos de casa en lugar de
// futbolistas (equipo: [x, z, palabra, figura]). Cada builder devuelve un
// Group con los pies en y=0, mirando hacia +x (la portería de ataque).
function figPerro() {
  const g = new THREE.Group();
  const pelo = 0x8a5a2b, oscuro = 0x6e4520;
  [[0.9, -0.5], [0.9, 0.5], [-0.9, -0.5], [-0.9, 0.5]].forEach(([x, z]) => {
    const pata = caja(0.5, 1.0, 0.5, pelo); pata.position.set(x, 0.5, z); g.add(pata);
  });
  const cuerpo = caja(3.0, 1.4, 1.4, pelo); cuerpo.position.set(0, 1.7, 0);
  const cabeza = caja(1.3, 1.3, 1.3, pelo); cabeza.position.set(2.0, 2.7, 0);
  const hocico = caja(0.7, 0.55, 0.75, oscuro); hocico.position.set(2.9, 2.4, 0);
  const orejaI = caja(0.3, 0.7, 0.35, oscuro); orejaI.position.set(1.7, 3.5, -0.45);
  const orejaD = caja(0.3, 0.7, 0.35, oscuro); orejaD.position.set(1.7, 3.5, 0.45);
  const cola = caja(1.0, 0.3, 0.3, oscuro); cola.position.set(-1.8, 2.4, 0); cola.rotation.z = 0.6;
  g.add(cuerpo, cabeza, hocico, orejaI, orejaD, cola);
  return g;
}

function figGato() {
  const g = new THREE.Group();
  const pelo = 0x8b8b95, rosa = 0xf0a0b0;
  [[0.75, -0.4], [0.75, 0.4], [-0.75, -0.4], [-0.75, 0.4]].forEach(([x, z]) => {
    const pata = caja(0.4, 0.8, 0.4, pelo); pata.position.set(x, 0.4, z); g.add(pata);
  });
  const cuerpo = caja(2.4, 1.1, 1.1, pelo); cuerpo.position.set(0, 1.35, 0);
  const cabeza = caja(1.1, 1.1, 1.1, pelo); cabeza.position.set(1.6, 2.3, 0);
  const nariz = caja(0.3, 0.25, 0.3, rosa); nariz.position.set(2.2, 2.1, 0);
  const orejaI = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), new THREE.MeshLambertMaterial({ color: pelo }));
  orejaI.position.set(1.5, 3.1, -0.35); orejaI.castShadow = true;
  const orejaD = orejaI.clone(); orejaD.position.z = 0.35;
  const cola = caja(0.25, 1.4, 0.25, pelo); cola.position.set(-1.3, 2.1, 0); cola.rotation.z = -0.35;
  g.add(cuerpo, cabeza, nariz, orejaI, orejaD, cola);
  return g;
}

// Base compartida de ave: cuerpo, cabeza, pico, alas y cola con colores propios.
function figAve(cCuerpo, cCabeza, cAla, cPico) {
  const g = new THREE.Group();
  [[-0.25], [0.25]].forEach(([z]) => {
    const pata = caja(0.14, 0.8, 0.14, 0xd98c1a); pata.position.set(0, 0.4, z); g.add(pata);
  });
  const cuerpo = caja(1.5, 1.2, 1.2, cCuerpo); cuerpo.position.set(0, 1.5, 0);
  const cabeza = caja(0.9, 0.9, 0.9, cCabeza); cabeza.position.set(0.85, 2.5, 0);
  const pico = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 4), new THREE.MeshLambertMaterial({ color: cPico }));
  pico.rotation.z = -Math.PI / 2; pico.position.set(1.6, 2.45, 0); pico.castShadow = true;
  const alaI = caja(1.1, 0.18, 0.7, cAla); alaI.position.set(-0.1, 1.8, -0.85); alaI.rotation.x = 0.25;
  const alaD = caja(1.1, 0.18, 0.7, cAla); alaD.position.set(-0.1, 1.8, 0.85); alaD.rotation.x = -0.25;
  const colaAve = caja(0.8, 0.16, 0.5, cAla); colaAve.position.set(-1.0, 1.6, 0); colaAve.rotation.z = 0.35;
  g.add(cuerpo, cabeza, pico, alaI, alaD, colaAve);
  return g;
}

function figVasoAgua() {
  const g = new THREE.Group();
  const vaso = cil(1.0, 0.8, 2.8, 0xd8ecff, { transparent: true, opacity: 0.5 });
  vaso.position.y = 1.4;
  const agua = cil(0.8, 0.65, 1.9, 0x3f8fe0);
  agua.position.y = 1.0;
  g.add(agua, vaso);
  return g;
}

function figLeche() {
  const g = new THREE.Group();
  const carton = caja(1.6, 2.8, 1.6, 0xf5f5f0); carton.position.y = 1.4;
  const franja = caja(1.65, 0.7, 1.65, 0xd93636); franja.position.y = 1.7;
  const pico = caja(1.15, 0.6, 1.15, 0xf5f5f0); pico.position.y = 3.05; pico.rotation.y = Math.PI / 4;
  const tapa = caja(0.35, 0.35, 0.35, 0x2f6bd8); tapa.position.y = 3.5;
  g.add(carton, franja, pico, tapa);
  return g;
}

function figPan() {
  const g = new THREE.Group();
  const base = caja(2.8, 1.2, 1.5, 0xc98b45); base.position.y = 0.6;
  const corteza = caja(2.5, 0.7, 1.25, 0xe0aa66); corteza.position.y = 1.5;
  const corte1 = caja(0.12, 0.3, 1.3, 0xc98b45); corte1.position.set(-0.6, 1.85, 0);
  const corte2 = corte1.clone(); corte2.position.x = 0.3;
  g.add(base, corteza, corte1, corte2);
  return g;
}

function figManzana() {
  const g = new THREE.Group();
  const fruta = bola(1.2, 0xd93636, 0.92); fruta.position.y = 1.15;
  const rabito = caja(0.16, 0.7, 0.16, 0x6e4520); rabito.position.y = 2.35;
  const hoja = caja(0.6, 0.12, 0.35, 0x2fae4e); hoja.position.set(0.35, 2.5, 0); hoja.rotation.z = 0.4;
  g.add(fruta, rabito, hoja);
  return g;
}

function figPlatano() {
  const g = new THREE.Group();
  const amarillo = 0xffd94a;
  const centro = caja(1.9, 0.65, 0.65, amarillo); centro.position.y = 1.0;
  const izq = caja(1.1, 0.6, 0.6, amarillo); izq.position.set(-1.25, 1.35, 0); izq.rotation.z = 0.55;
  const der = caja(1.1, 0.6, 0.6, amarillo); der.position.set(1.25, 1.35, 0); der.rotation.z = -0.55;
  const puntaI = caja(0.3, 0.3, 0.3, 0x6e4520); puntaI.position.set(-1.75, 1.7, 0);
  const puntaD = caja(0.3, 0.3, 0.3, 0x6e4520); puntaD.position.set(1.75, 1.7, 0);
  g.add(centro, izq, der, puntaI, puntaD);
  return g;
}

function figTenedor() {
  const g = new THREE.Group();
  const metal = 0xb8bec9;
  const mango = caja(0.4, 2.4, 0.4, metal); mango.position.y = 1.2;
  const base = caja(1.2, 0.35, 0.45, metal); base.position.y = 2.55;
  [-0.45, 0, 0.45].forEach(x => {
    const diente = caja(0.2, 1.0, 0.3, metal); diente.position.set(x, 3.2, 0); g.add(diente);
  });
  g.add(mango, base);
  return g;
}

function figCuchara() {
  const g = new THREE.Group();
  const metal = 0xb8bec9;
  const mango = caja(0.4, 2.4, 0.4, metal); mango.position.y = 1.2;
  const cazo = bola(0.85, metal, 0.55); cazo.position.y = 2.9; cazo.scale.z = 0.75;
  g.add(mango, cazo);
  return g;
}

function figPlato() {
  const g = new THREE.Group();
  const borde = cil(2.0, 1.5, 0.45, 0xf2f2f2); borde.position.y = 0.25;
  const centro = cil(1.2, 1.2, 0.18, 0xdddddd); centro.position.y = 0.55;
  g.add(borde, centro);
  return g;
}

function figSilla() {
  const g = new THREE.Group();
  const madera = 0x9a6a33;
  [[0.8, -0.8], [0.8, 0.8], [-0.8, -0.8], [-0.8, 0.8]].forEach(([x, z]) => {
    const p = caja(0.3, 1.4, 0.3, madera); p.position.set(x, 0.7, z); g.add(p);
  });
  const asiento = caja(2.0, 0.3, 2.0, madera); asiento.position.y = 1.55;
  const respaldo = caja(0.3, 2.2, 2.0, 0x8a5a2b); respaldo.position.set(-0.85, 2.7, 0);
  g.add(asiento, respaldo);
  return g;
}

function figMesa() {
  const g = new THREE.Group();
  const madera = 0x8a5a2b;
  [[1.3, -0.9], [1.3, 0.9], [-1.3, -0.9], [-1.3, 0.9]].forEach(([x, z]) => {
    const p = caja(0.35, 1.8, 0.35, madera); p.position.set(x, 0.9, z); g.add(p);
  });
  const tablero = caja(3.3, 0.35, 2.4, 0x9a6a33); tablero.position.y = 1.95;
  g.add(tablero);
  return g;
}

function figSofa() {
  const g = new THREE.Group();
  const tela = 0x3b6bb5, cojin = 0x5b8bd5;
  const base = caja(3.4, 1.2, 1.9, tela); base.position.y = 0.6;
  const respaldo = caja(3.4, 1.6, 0.6, tela); respaldo.position.set(0, 1.7, -0.75);
  const brazoI = caja(0.5, 1.0, 1.9, tela); brazoI.position.set(-1.7, 1.5, 0);
  const brazoD = caja(0.5, 1.0, 1.9, tela); brazoD.position.set(1.7, 1.5, 0);
  const cojin1 = caja(1.45, 0.4, 1.3, cojin); cojin1.position.set(-0.78, 1.35, 0.2);
  const cojin2 = caja(1.45, 0.4, 1.3, cojin); cojin2.position.set(0.78, 1.35, 0.2);
  g.add(base, respaldo, brazoI, brazoD, cojin1, cojin2);
  return g;
}

// Catálogo: clave = 4º elemento de la entrada de equipo en data/niveles3d.js.
const FIGURAS = {
  "perro": figPerro,
  "gato": figGato,
  "pajaro": () => figAve(0x3f8fe0, 0x2f6bd8, 0x7fb3ef, 0xff8c1a),
  "loro": () => figAve(0x2fae4e, 0xd93636, 0xffd94a, 0x8b8b95),
  "agua": figVasoAgua,
  "leche": figLeche,
  "pan": figPan,
  "manzana": figManzana,
  "platano": figPlatano,
  "tenedor": figTenedor,
  "cuchara": figCuchara,
  "plato": figPlato,
  "silla": figSilla,
  "mesa": figMesa,
  "sofa": figSofa,
  "jugador-rojo": () => construirJugador(0xd93636),
  "jugador-verde": () => construirJugador(0x2fae4e),
  "jugador-naranja": () => construirJugador(0xff8c1a),
  "jugador-morado": () => construirJugador(0x8e44ad)
};

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
function construirPorteria(ancho, colorBase) {
  const g = new THREE.Group();
  const posteMat = new THREE.MeshLambertMaterial({ color: colorBase || 0xffffff });
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
    // Figura voxel personalizada (animal, comida, objeto…) o futbolista azul.
    const fig = j.figura && FIGURAS[j.figura] ? FIGURAS[j.figura]() : construirJugador(0x2f6bd8);
    wrap.add(fig);
    if (j.palabra) {
      const et = construirEtiqueta(j.palabra, 3.4);
      // Las figuras no humanas son más bajas: etiqueta más cerca del suelo.
      et.position.y = j.figura && !j.figura.startsWith("jugador") ? 5.2 : 6.2;
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
    const malla = construirPorteria(p.ancho, p.color);
    wrap.add(malla);
    let etiqueta = null;
    if (p.palabra) {
      etiqueta = construirEtiqueta(p.palabra, 3.8);
      etiqueta.position.y = 8.5;
      wrap.add(etiqueta);
    }
    wrap.position.set(p.x, 0, p.z);
    grupoNivel.add(wrap);
    mallas.porterias.push({ wrap, malla, etiqueta, ancho: p.ancho, colorBase: p.color || null });
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
  // Las porterías de colores (niveles de "colores") conservan su tono base.
  const color = seleccionada || abierta ? 0xffd94a : (p.colorBase || 0xffffff);
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
