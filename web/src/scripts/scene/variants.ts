// Diseño del átomo en cada página: forma, anillos, tipo de movimiento y recorrido con el scroll.
import type { PageKey } from '../../i18n';

export const ACCENT = 0xff4d1c;
export const ICE = 0x7f9bff;
export const BONE = 0xf2efe8;
export const VIOLET = 0xb07cff;

export interface RingSpec {
  r: number;
  tube: number;
  color: number;
  tilt: [number, number, number];
  spin: number;
  electrons: number;
}

/** Punto del recorrido. `at` = pantallas de scroll; x/y = fracción del ancho/alto visible (0 = centro). */
export interface Waypoint {
  at: number;
  x: number;
  y: number;
  scale: number;
  glow: number;
}

export type Mode = 'orbit' | 'planar' | 'gyro' | 'twin' | 'pulse';
export type Core = 'sphere' | 'crystal' | 'twin';

export interface Variant {
  core: Core;
  mode: Mode;
  rings: RingSpec[];
  /** Cuánto gira el conjunto por cada pantalla de scroll. */
  scrollSpin: number;
  wide: Waypoint[];
  narrow: Waypoint[];
}

const w = (at: number, x: number, y: number, scale: number, glow: number): Waypoint => ({ at, x, y, scale, glow });

// Recorrido común de las páginas interiores; `side` lo refleja para que cada página se sienta distinta.
const inner = (side: 1 | -1) => ({
  wide: [w(0, 0.3 * side, 0.08, 0.72, 1), w(0.9, 0.36 * side, -0.2, 1.2, 0.32), w(2, -0.32 * side, 0.1, 1.6, 0.2), w(3.5, 0.3 * side, 0, 1.3, 0.26)],
  narrow: [w(0, 0.26 * side, 0.27, 0.5, 0.85), w(1, -0.3 * side, -0.12, 0.9, 0.28), w(2.5, 0.34 * side, 0.15, 1.2, 0.2), w(5, -0.3 * side, -0.1, 1, 0.22)],
});

export const variants: Record<PageKey, Variant> = {
  // Inicio: el átomo clásico, tres órbitas que se cruzan.
  home: {
    core: 'sphere',
    mode: 'orbit',
    scrollSpin: 0.5,
    rings: [
      { r: 1.35, tube: 0.045, color: ACCENT, tilt: [1.25, 0.2, 0], spin: 0.9, electrons: 1 },
      { r: 2.0, tube: 0.05, color: ICE, tilt: [0.5, 0.9, 0.3], spin: -0.6, electrons: 1 },
      { r: 2.65, tube: 0.06, color: BONE, tilt: [-0.35, -0.5, 0.6], spin: 0.4, electrons: 1 },
    ],
    wide: [w(0, 0.27, -0.03, 0.88, 1), w(1, -0.3, 0, 1.3, 0.32), w(2, 0.3, -0.05, 1.8, 0.22), w(3.2, -0.05, 0.05, 2.3, 0.16), w(4.6, 0.32, 0.1, 1.5, 0.26), w(7, -0.3, -0.1, 1.2, 0.3)],
    narrow: [w(0, 0.27, 0.27, 0.55, 0.85), w(1, -0.3, -0.15, 0.9, 0.3), w(2.5, 0.35, 0.2, 1.2, 0.22), w(4.5, -0.35, 0, 1.4, 0.2), w(7, 0.3, -0.2, 1, 0.26)],
  },
  // Servicios: un sistema plano con siete satélites, uno por servicio (1 web, 3 pauta, 3 IA).
  services: {
    core: 'sphere',
    mode: 'planar',
    scrollSpin: 0.35,
    rings: [
      { r: 1.2, tube: 0.035, color: BONE, tilt: [1.2, 0, 0.25], spin: 1.1, electrons: 1 },
      { r: 1.95, tube: 0.035, color: ACCENT, tilt: [1.2, 0, 0.25], spin: 0.7, electrons: 3 },
      { r: 2.7, tube: 0.035, color: ICE, tilt: [1.2, 0, 0.25], spin: 0.45, electrons: 3 },
    ],
    ...inner(1),
  },
  // Trabajo: un giroscopio alrededor de un cristal; gira más rápido cuanto más rápido se hace scroll.
  work: {
    core: 'crystal',
    mode: 'gyro',
    scrollSpin: 0.8,
    rings: [
      { r: 1.55, tube: 0.05, color: VIOLET, tilt: [0, 0, 0], spin: 1, electrons: 0 },
      { r: 1.95, tube: 0.05, color: ACCENT, tilt: [1.57, 0, 0], spin: 0.8, electrons: 1 },
      { r: 2.35, tube: 0.05, color: ICE, tilt: [0, 1.57, 0], spin: 0.6, electrons: 0 },
    ],
    ...inner(1),
  },
  // Nosotros: dos núcleos que giran uno alrededor del otro (dos mercados, un equipo).
  about: {
    core: 'twin',
    mode: 'twin',
    scrollSpin: 0.6,
    rings: [
      { r: 1.7, tube: 0.04, color: ACCENT, tilt: [1.1, 0.5, 0], spin: 0.5, electrons: 1 },
      { r: 1.7, tube: 0.04, color: ICE, tilt: [1.1, -0.5, 0], spin: -0.5, electrons: 1 },
      { r: 2.6, tube: 0.05, color: BONE, tilt: [0.2, 0, 0.4], spin: 0.25, electrons: 0 },
    ],
    ...inner(1),
  },
  // Contacto: una señal, ondas que salen del núcleo.
  contact: {
    core: 'sphere',
    mode: 'pulse',
    scrollSpin: 0.3,
    rings: [
      { r: 1.6, tube: 0.03, color: ACCENT, tilt: [1.25, 0.3, 0], spin: 1, electrons: 0 },
      { r: 1.6, tube: 0.03, color: BONE, tilt: [1.25, 0.3, 0], spin: 1, electrons: 0 },
      { r: 1.6, tube: 0.03, color: ICE, tilt: [1.25, 0.3, 0], spin: 1, electrons: 0 },
      { r: 1.6, tube: 0.03, color: BONE, tilt: [1.25, 0.3, 0], spin: 1, electrons: 0 },
    ],
    ...inner(1),
  },
};
