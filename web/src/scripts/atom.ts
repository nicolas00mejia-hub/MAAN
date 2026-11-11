// Escena 3D de fondo: un átomo y una galaxia de estrellas en un único lienzo fijo.
// El átomo es protagonista en la portada y, al bajar, crece y se atenúa como ambiente.
// Las estrellas titilan, y al hacer scroll la cámara avanza entre ellas.
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  WebGLRenderer,
  type Material,
} from 'three';

const ACCENT = 0xff4d1c;
const ICE = 0x7f9bff;
const BONE = 0xf2efe8;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// Textura generada en un lienzo 2D (resplandores, estrellas, estelas).
const texture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  return new CanvasTexture(c);
};
const radial = (stops: [number, string][]) =>
  texture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([at, color]) => grad.addColorStop(at, color));
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });

export function initAtom(canvas: HTMLCanvasElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 720;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.z = 10;

  scene.add(new AmbientLight(0xffffff, 0.55));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 6);
  scene.add(key);
  const warm = new PointLight(ACCENT, 60, 20);
  const cool = new PointLight(ICE, 70, 20);
  cool.position.set(-5, 3, 4);
  scene.add(cool);

  // ---------- Galaxia ----------
  const starMap = radial([
    [0, 'rgba(255,255,255,1)'],
    [0.25, 'rgba(255,255,255,0.55)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  const palette = [new Color(0xffffff), new Color(0xffffff), new Color(0xbfd0ff), new Color(0x8ea6ff), new Color(0xffc9a8)];
  const galaxy = new Group();
  scene.add(galaxy);
  const layers = [
    { count: small ? 700 : 1500, size: 0.3, speed: 0.7, phase: 0 },
    { count: small ? 300 : 650, size: 0.5, speed: 1.3, phase: 2 },
    { count: small ? 70 : 150, size: 0.85, speed: 2.1, phase: 4 },
  ].map((l) => {
    const pos = new Float32Array(l.count * 3);
    const col = new Float32Array(l.count * 3);
    for (let i = 0; i < l.count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = -60 + Math.random() * 64;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('color', new BufferAttribute(col, 3));
    const mat = new PointsMaterial({
      size: l.size,
      map: starMap,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    galaxy.add(new Points(geo, mat));
    return { mat, ...l };
  });

  // Estrella fugaz: una estela que cruza de vez en cuando.
  const trail = new Sprite(
    new SpriteMaterial({
      map: texture(256, 8, (g) => {
        const grad = g.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.85, 'rgba(190,210,255,0.7)');
        grad.addColorStop(1, 'rgba(255,255,255,1)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 8);
      }),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    }),
  );
  trail.scale.set(4.5, 0.05, 1);
  scene.add(trail);
  const shot = { start: 0, next: 2.5, x: 0, y: 0, angle: 0 };

  // ---------- Átomo ----------
  const atom = new Group();
  scene.add(atom);
  const atomMats: { mat: Material; base: number }[] = [];
  const track = <T extends Material>(mat: T, base = 1) => {
    mat.transparent = true;
    atomMats.push({ mat, base });
    return mat;
  };

  const core = new Mesh(
    new SphereGeometry(0.5, 48, 48),
    track(new MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.9, roughness: 0.3 })),
  );
  atom.add(core, warm);

  const glow = new Sprite(
    track(
      new SpriteMaterial({
        map: radial([
          [0, 'rgba(255,110,60,0.85)'],
          [0.35, 'rgba(255,77,28,0.28)'],
          [1, 'rgba(255,77,28,0)'],
        ]),
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  glow.scale.setScalar(4.2);
  atom.add(glow);

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
      track(new MeshStandardMaterial({ color: s.color, metalness: 0.35, roughness: 0.22, emissive: s.color, emissiveIntensity: 0.18 })),
    );
    const electron = new Mesh(new SphereGeometry(0.11, 20, 20), track(new MeshBasicMaterial({ color: BONE })));
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

  let flight = scrollY / innerHeight;
  const frame = (ms: number) => {
    const t = ms / 1000;
    const s = scrollY / h; // pantallas recorridas
    const k = smooth(0.1, 0.95, s); // 0 = portada, 1 = ambiente
    const intro = reduce ? 1 : Math.min(1, t / 1.8);
    const narrow = camera.aspect < 0.9;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    flight += (s - flight) * 0.08;

    // Galaxia: titila, gira despacio y la cámara avanza entre las estrellas con el scroll.
    galaxy.position.set(-mouse.x * 0.6, mouse.y * 0.4 + flight * 0.6, flight * 3.2);
    galaxy.rotation.z = t * 0.006;
    layers.forEach((l) => {
      l.mat.opacity = intro * (0.72 + 0.28 * Math.sin(t * l.speed + l.phase));
    });

    if (!reduce) {
      if (t > shot.next) {
        shot.start = t;
        shot.next = t + 5 + Math.random() * 7;
        shot.x = (Math.random() - 0.7) * 14;
        shot.y = 2 + Math.random() * 4;
        shot.angle = -0.35 - Math.random() * 0.4;
      }
      const life = (t - shot.start) / 0.9;
      if (shot.start && life < 1) {
        const d = life * 16;
        trail.position.set(shot.x + Math.cos(shot.angle) * d, shot.y + Math.sin(shot.angle) * d, -4);
        trail.material.rotation = shot.angle;
        trail.material.opacity = Math.sin(life * Math.PI) * 0.9;
      } else {
        trail.material.opacity = 0;
      }
    }

    // Átomo: se coloca en proporción a la pantalla y se atenúa al dejar la portada.
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const viewW = viewH * camera.aspect;
    const heroX = narrow ? viewW * 0.22 : viewW * 0.27;
    const heroY = narrow ? viewH * 0.2 : -viewH * 0.03;
    const heroScale = narrow ? 0.62 : 0.88;
    atom.position.set(mix(heroX, viewW * 0.3, k), mix(heroY, 0, k) + Math.sin(t * 0.6) * 0.08, 0);
    atom.scale.setScalar(mix(heroScale, narrow ? 1.1 : 1.9, k) * Math.max(0.001, easeOutBack(intro)));
    atom.rotation.set(mouse.y * 0.25 + s * 0.15, mouse.x * 0.35 + s * 0.5 + (1 - intro) * 2.5, 0);
    const fade = mix(narrow ? 0.75 : 1, 0.2, k) * intro;
    atomMats.forEach(({ mat, base }) => (mat.opacity = base * fade));
    warm.intensity = 60 * fade;

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
