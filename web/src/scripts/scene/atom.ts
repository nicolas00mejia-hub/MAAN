// Construye el átomo de una página a partir de su variante y lo anima según su modo.
import {
  AdditiveBlending,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  type Material,
} from 'three';
import { makePearl } from './pearl';
import { radial } from './textures';
import { ACCENT, BONE, ICE, type Variant } from './variants';

const TAU = Math.PI * 2;

export function buildAtom(v: Variant, lite: boolean) {
  const group = new Group();
  // Cada material guarda su opacidad propia (f); la opacidad final es f × atenuación global.
  const mats: { mat: Material; f: number }[] = [];
  const track = <T extends Material>(mat: T) => {
    mat.transparent = true;
    const entry = { mat, f: 1 };
    mats.push(entry);
    return entry;
  };
  const glossy = (color: number, emissive = 0.18) =>
    new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: emissive, metalness: 0.35, roughness: 0.22 });
  const pearl = makePearl();
  const seg = lite ? 20 : 40;

  // ----- Núcleo -----
  const core = new Group();
  const light = new PointLight(ACCENT, 60, 20);
  group.add(core, light);
  const ball = (r: number, color: number) => {
    const m = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
    track(m);
    return new Mesh(new SphereGeometry(r, seg, seg), m);
  };
  let cage: Mesh | undefined;
  if (v.core === 'sphere') {
    core.add(ball(0.5, ACCENT));
    if (v.cage) {
      const wire = new MeshBasicMaterial({ color: BONE, wireframe: true });
      track(wire).f = 0.55;
      cage = new Mesh(new IcosahedronGeometry(0.82, 1), wire);
      group.add(cage);
    }
  } else if (v.core === 'twin') {
    const a = ball(0.36, ACCENT);
    const b = ball(0.36, ICE);
    a.position.x = 0.62;
    b.position.x = -0.62;
    core.add(a, b);
  } else {
    const solid = new MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.6, roughness: 0.25, flatShading: true });
    const wire = new MeshBasicMaterial({ color: BONE, wireframe: true });
    track(solid);
    track(wire).f = 0.5;
    const cage = new Mesh(new IcosahedronGeometry(0.95, 1), wire);
    core.add(new Mesh(new IcosahedronGeometry(0.6, 0), solid), cage);
  }

  const glowMat = new SpriteMaterial({
    map: radial([
      [0, 'rgba(255,110,60,0.85)'],
      [0.35, 'rgba(255,77,28,0.28)'],
      [1, 'rgba(255,77,28,0)'],
    ]),
    blending: AdditiveBlending,
    depthWrite: false,
  });
  track(glowMat);
  const glow = new Sprite(glowMat);
  glow.scale.setScalar(4.2);
  group.add(glow);

  // ----- Anillos y electrones -----
  const electronMat = new MeshBasicMaterial({ color: BONE });
  track(electronMat);
  const electronGeo = new SphereGeometry(0.11, 14, 14);
  const rings = v.rings.map((spec) => {
    const pivot = new Group();
    pivot.rotation.set(...spec.tilt);
    const entry = track(spec.finish === 'pearl' ? pearl.ring : glossy(spec.color));
    pivot.add(new Mesh(new TorusGeometry(spec.r, spec.tube, lite ? 10 : 20, lite ? 90 : 160), entry.mat));
    if (spec.finish === 'pearl') {
      for (const g of pearl.glows) {
        track(g.mat);
        pivot.add(new Mesh(new TorusGeometry(spec.r, spec.tube * g.tube, 16, lite ? 90 : 160), g.mat));
      }
    }
    const electrons = Array.from({ length: spec.electrons }, () => {
      const e = new Mesh(electronGeo, electronMat);
      pivot.add(e);
      return e;
    });
    group.add(pivot);
    return { pivot, entry, electrons, spec };
  });

  let spun = 0; // giro acumulado del giroscopio

  /** t = segundos, dt = segundos del cuadro, s = pantallas de scroll, vel = velocidad del scroll */
  const update = (t: number, dt: number, s: number, vel: number) => {
    spun += dt * (0.35 + Math.min(6, Math.abs(vel)) * 1.6);
    pearl.tick(t);
    rings.forEach((r, i) => {
      const { pivot, spec } = r;
      const [tx, ty, tz] = spec.tilt;
      switch (v.mode) {
        case 'orbit':
          pivot.rotation.x = tx + t * 0.12 * spec.spin + s * 0.55 * (i + 1);
          pivot.rotation.y = ty + t * 0.18 * spec.spin + s * 0.3;
          break;
        case 'planar':
          // El plano entero se mece con el scroll; los anillos no se cruzan.
          pivot.rotation.set(tx + Math.sin(s * 1.1) * 0.55, ty + Math.sin(t * 0.25) * 0.08, tz + s * 0.35);
          break;
        case 'gyro':
          pivot.rotation.x = tx + spun * spec.spin * (i % 2 ? -1 : 1);
          pivot.rotation.y = ty + spun * spec.spin * 0.6;
          pivot.rotation.z = tz + s * 0.4;
          break;
        case 'twin':
          pivot.rotation.x = tx + Math.sin(t * 0.3 + i) * 0.15 + s * 0.4;
          pivot.rotation.y = ty + t * 0.15 * spec.spin + s * 0.25 * (i + 1);
          break;
        case 'pulse': {
          // Ondas: cada anillo crece desde el núcleo y se desvanece.
          const p = (t * 0.22 + i / rings.length) % 1;
          pivot.scale.setScalar(0.3 + p * 1.6);
          pivot.rotation.set(tx + Math.sin(s * 0.9) * 0.4, ty + s * 0.3, tz);
          r.entry.f = Math.sin(p * Math.PI);
          break;
        }
      }
      r.electrons.forEach((e, j) => {
        const a = t * spec.spin * 1.4 + i * 2 + (j * TAU) / r.electrons.length;
        e.position.set(Math.cos(a) * spec.r, Math.sin(a) * spec.r, 0);
      });
    });

    if (cage) cage.rotation.set(t * 0.22 + s * 0.6, t * 0.3 + s * 0.9, 0);
    if (v.core === 'twin') core.rotation.set(0.35, t * 0.9 + s * 1.5, 0.3);
    else if (v.core === 'crystal') core.rotation.set(spun * 0.4, spun * 0.55, 0);
    else core.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04);
  };

  const fade = (k: number) => {
    for (const m of mats) {
      // Los materiales con shader propio reciben la opacidad por uniform.
      if (m.mat instanceof ShaderMaterial) m.mat.uniforms.uOpacity.value = m.f * k;
      else m.mat.opacity = m.f * k;
    }
    light.intensity = 60 * k;
  };

  return { group, update, fade };
}
