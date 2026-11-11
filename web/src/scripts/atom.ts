// Átomo 3D de fondo. Vive en un único lienzo fijo detrás del contenido:
// protagonista en la portada y, al bajar, crece y se atenúa como ambiente.
import {
  AdditiveBlending,
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

const ACCENT = 0xff4d1c;
const ICE = 0x7f9bff;
const BONE = 0xf2efe8;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function initAtom(canvas: HTMLCanvasElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.z = 10;

  scene.add(new AmbientLight(0xffffff, 0.55));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 6);
  scene.add(key);
  const warm = new PointLight(ACCENT, 60, 20);
  const cool = new PointLight(ICE, 70, 20);
  cool.position.set(-5, 3, 4);
  scene.add(cool);

  const atom = new Group();
  scene.add(atom);

  // Núcleo con resplandor.
  const core = new Mesh(
    new SphereGeometry(0.5, 48, 48),
    new MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.9, roughness: 0.3 }),
  );
  atom.add(core, warm);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const g = glowCanvas.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,110,60,0.85)');
  grad.addColorStop(0.35, 'rgba(255,77,28,0.28)');
  grad.addColorStop(1, 'rgba(255,77,28,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const glow = new Sprite(
    new SpriteMaterial({ map: new CanvasTexture(glowCanvas), blending: AdditiveBlending, depthWrite: false, transparent: true }),
  );
  glow.scale.setScalar(4.2);
  atom.add(glow);

  // Anillos con un electrón cada uno.
  const specs = [
    { r: 1.35, tube: 0.045, color: ACCENT, tilt: [1.25, 0.2, 0], speed: 0.9 },
    { r: 2.0, tube: 0.05, color: ICE, tilt: [0.5, 0.9, 0.3], speed: -0.6 },
    { r: 2.65, tube: 0.06, color: BONE, tilt: [-0.35, -0.5, 0.6], speed: 0.4 },
  ];
  const rings = specs.map((s) => {
    const group = new Group();
    group.rotation.set(s.tilt[0], s.tilt[1], s.tilt[2]);
    const ring = new Mesh(
      new TorusGeometry(s.r, s.tube, 24, 160),
      new MeshStandardMaterial({ color: s.color, metalness: 0.35, roughness: 0.22, emissive: s.color, emissiveIntensity: 0.18 }),
    );
    const electron = new Mesh(new SphereGeometry(0.11, 20, 20), new MeshBasicMaterial({ color: BONE }));
    group.add(ring, electron);
    atom.add(group);
    return { group, electron, ...s };
  });

  let w = 0;
  let h = 0;
  const resize = () => {
    w = innerWidth;
    h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    'pointermove',
    (e) => {
      mouse.tx = (e.clientX / w - 0.5) * 2;
      mouse.ty = (e.clientY / h - 0.5) * 2;
    },
    { passive: true },
  );

  const frame = (ms: number) => {
    const t = ms / 1000;
    const s = scrollY / h; // pantallas recorridas
    const k = smooth(0.1, 0.95, s); // 0 = portada, 1 = ambiente
    const narrow = camera.aspect < 0.9;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // El ancho visible a la distancia del átomo, para colocarlo en proporción a la pantalla.
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const viewW = viewH * camera.aspect;
    const heroX = narrow ? viewW * 0.22 : viewW * 0.27;
    const heroY = narrow ? viewH * 0.2 : -viewH * 0.03;
    const heroScale = narrow ? 0.62 : 0.88;
    atom.position.set(mix(heroX, viewW * 0.3, k), mix(heroY, 0, k) + Math.sin(t * 0.6) * 0.08, 0);
    atom.scale.setScalar(mix(heroScale, narrow ? 1.1 : 1.9, k));
    atom.rotation.set(mouse.y * 0.25 + s * 0.15, mouse.x * 0.35 + s * 0.5, 0);
    canvas.style.opacity = mix(narrow ? 0.75 : 1, 0.2, k).toFixed(3);

    rings.forEach((r, i) => {
      r.group.rotation.x = r.tilt[0] + t * 0.12 * r.speed + s * 0.55 * (i + 1);
      r.group.rotation.y = r.tilt[1] + t * 0.18 * r.speed + s * 0.3;
      const a = t * r.speed * 1.4 + i * 2;
      r.electron.position.set(Math.cos(a) * r.r, Math.sin(a) * r.r, 0);
    });
    core.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04);
    renderer.render(scene, camera);
  };

  if (reduce) {
    frame(0);
    addEventListener('resize', () => {
      resize();
      frame(0);
    });
    return;
  }

  addEventListener('resize', resize);
  let raf = 0;
  const loop = (ms: number) => {
    frame(ms);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
}
