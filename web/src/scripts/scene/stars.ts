// Galaxia: tres capas de estrellas que titilan, más una estrella fugaz ocasional.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Points, PointsMaterial, Sprite, SpriteMaterial } from 'three';
import { radial, streak } from './textures';

export function buildStars(lite: boolean, still: boolean) {
  const group = new Group();
  const map = radial([
    [0, 'rgba(255,255,255,1)'],
    [0.25, 'rgba(255,255,255,0.55)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  const palette = [0xffffff, 0xffffff, 0xbfd0ff, 0x8ea6ff, 0xffc9a8].map((c) => new Color(c));
  const layers = [
    { count: lite ? 520 : 1500, size: 0.3, speed: 0.7, phase: 0 },
    { count: lite ? 220 : 650, size: 0.5, speed: 1.3, phase: 2 },
    { count: lite ? 50 : 150, size: 0.85, speed: 2.1, phase: 4 },
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
    const mat = new PointsMaterial({ size: l.size, map, vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending });
    group.add(new Points(geo, mat));
    return { mat, ...l };
  });

  const trail = new Sprite(new SpriteMaterial({ map: streak(), blending: AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  trail.scale.set(4.5, 0.05, 1);
  const shot = { start: 0, next: 2.5, x: 0, y: 0, angle: 0 };

  /** t = segundos, s = pantallas de scroll (suavizado), intro = 0..1 */
  const update = (t: number, s: number, mx: number, my: number, intro: number) => {
    // Con el scroll la cámara avanza entre las estrellas.
    group.position.set(-mx * 0.6, my * 0.4 + s * 0.6, s * 3.2);
    group.rotation.z = t * 0.006;
    for (const l of layers) l.mat.opacity = intro * (0.72 + 0.28 * Math.sin(t * l.speed + l.phase));

    if (still) return;
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
  };

  return { group, trail, update };
}
