// Escena 3D de fondo: galaxia + átomo, en un único lienzo fijo detrás del contenido.
// Se carga cuando la página ya pintó, y ajusta su calidad sola si el dispositivo va justo.
import { AmbientLight, DirectionalLight, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from 'three';
import type { PageKey } from '../../i18n';
import { buildAtom } from './atom';
import { buildStars } from './stars';
import { ICE, variants, type Stop, type Waypoint } from './variants';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
// Suavizado independiente de los cuadros por segundo.
const damp = (cur: number, target: number, rate: number, dt: number) => mix(cur, target, 1 - Math.exp(-rate * dt));

/** Posición del átomo para `s` pantallas de scroll, interpolando entre los puntos del recorrido. */
function along(path: Waypoint[], s: number, out: Waypoint) {
  let i = 0;
  while (i < path.length - 2 && s > path[i + 1].at) i++;
  const a = path[i];
  const b = path[i + 1];
  const k = ease(Math.min(1, Math.max(0, (s - a.at) / (b.at - a.at))));
  out.x = mix(a.x, b.x, k);
  out.y = mix(a.y, b.y, k);
  out.scale = mix(a.scale, b.scale, k);
  out.glow = mix(a.glow, b.glow, k);
}

/** Convierte las paradas ancladas a capítulos en puntos del recorrido, midiendo la página real. */
function resolve(stops: Stop[], vh: number): Waypoint[] {
  const boxes = new Map<string, { top: number; height: number } | null>();
  const path: Waypoint[] = [];
  for (const s of stops) {
    if (!boxes.has(s.ch)) {
      const el = document.querySelector<HTMLElement>(`[data-ch="${s.ch}"]`);
      const r = el?.getBoundingClientRect();
      boxes.set(s.ch, r ? { top: r.top + scrollY, height: r.height } : null);
    }
    const box = boxes.get(s.ch);
    if (!box) continue;
    // Capítulo fijo (más alto que la pantalla): f recorre su tramo fijo.
    // Capítulo normal: f marca qué punto suyo pasa por el centro de la pantalla.
    const pinned = box.height > vh * 1.3;
    const y = pinned ? box.top + s.f * (box.height - vh) : box.top + s.f * box.height - vh / 2;
    path.push({ at: Math.max(0, y / vh), x: s.x, y: s.y, scale: s.scale, glow: s.glow });
  }
  return path.sort((a, b) => a.at - b.at);
}

export function initScene(canvas: HTMLCanvasElement, page: PageKey) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const lite = touch || innerWidth < 720;
  const variant = variants[page] ?? variants.home;

  // Nitidez: hasta 2 píxeles reales por punto y bordes suavizados, también en celular.
  // (Más de 2 no se nota a simple vista y cuesta el doble.)
  let dpr = Math.min(devicePixelRatio || 1, 2);
  const minDpr = lite ? 1.5 : 1;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.z = 10;
  const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;

  scene.add(new AmbientLight(0xffffff, 0.55));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 6);
  const cool = new PointLight(ICE, 70, 20);
  cool.position.set(-5, 3, 4);
  scene.add(key, cool);

  const stars = buildStars(lite, still);
  const atom = buildAtom(variant, lite);
  scene.add(stars.group, stars.trail, atom.group);

  // Tamaño. En celular la barra del navegador cambia el alto al hacer scroll:
  // esos cambios se ignoran para no redibujar ni mover el átomo a saltos.
  let w = 0;
  let h = 0;
  const resize = (force = false) => {
    // Se usa el tamaño real del lienzo en pantalla (alto estable en celular), no el de la ventana:
    // si no coinciden, la imagen se estira y se ve borrosa.
    const nw = canvas.clientWidth || innerWidth;
    const nh = canvas.clientHeight || innerHeight;
    if (!force && nw === w && Math.abs(nh - h) < 160) return;
    w = nw;
    h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize(true);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!touch) {
    addEventListener(
      'pointermove',
      (e) => {
        mouse.tx = (e.clientX / w - 0.5) * 2;
        mouse.ty = (e.clientY / h - 0.5) * 2;
      },
      { passive: true },
    );
  }

  // Recorrido del átomo: fijo por variante, o medido sobre los capítulos de la página.
  let path = variant.wide;
  const route = () => {
    const narrow = camera.aspect < 0.9;
    const anchored = variant.stops ? resolve(narrow ? variant.stops.narrow : variant.stops.wide, h) : [];
    path = anchored.length > 1 ? anchored : narrow ? variant.narrow : variant.wide;
  };
  route();
  // La página cambia de alto al cargar fuentes o girar el teléfono: se vuelve a medir.
  let pending = 0;
  new ResizeObserver(() => {
    clearTimeout(pending);
    pending = window.setTimeout(route, 200);
  }).observe(document.body);

  let s = scrollY / h; // scroll suavizado, en pantallas
  let last = 0;
  let clock = 0;
  const target: Waypoint = { at: 0, x: 0, y: 0, scale: 1, glow: 1 };

  const frame = (dt: number) => {
    clock += dt;
    const t = clock;
    const raw = scrollY / h;
    const prev = s;
    s = still ? raw : damp(s, raw, 7, dt);
    const vel = dt > 0 ? (s - prev) / dt : 0;
    const intro = still ? 1 : Math.min(1, t / 1.8);
    mouse.x = damp(mouse.x, mouse.tx, 4, dt);
    mouse.y = damp(mouse.y, mouse.ty, 4, dt);

    stars.update(t, s, mouse.x, mouse.y, intro);

    along(path, s, target);
    const viewW = viewH * camera.aspect;
    atom.group.position.set(target.x * viewW, target.y * viewH + Math.sin(t * 0.6) * 0.08, 0);
    atom.group.scale.setScalar(target.scale * Math.max(0.001, easeOutBack(intro)));
    atom.group.rotation.set(mouse.y * 0.25 + s * variant.scrollSpin * 0.3, mouse.x * 0.35 + s * variant.scrollSpin + (1 - intro) * 2.5, 0);
    atom.update(t, dt, s, vel);
    atom.fade(target.glow * intro);

    renderer.render(scene, camera);
  };

  if (still) {
    frame(0);
    addEventListener('resize', () => {
      resize();
      frame(0);
    });
    return;
  }

  addEventListener('resize', () => resize());

  // Calidad adaptable: si los cuadros tardan demasiado, baja la resolución interna.
  let slow = 0;
  let frames = 0;
  const watch = (ms: number) => {
    // Los primeros cuadros no cuentan: ahí se compilan los shaders y siempre son lentos.
    if (clock < 3) return;
    frames++;
    if (ms > 28) slow++;
    if (frames < 120) return;
    if (slow > 70 && dpr > minDpr) {
      dpr = Math.max(minDpr, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    }
    slow = frames = 0;
  };

  let raf = 0;
  const loop = (now: number) => {
    const ms = last ? now - last : 16;
    last = now;
    watch(ms);
    frame(Math.min(ms, 50) / 1000);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    last = 0;
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
}
