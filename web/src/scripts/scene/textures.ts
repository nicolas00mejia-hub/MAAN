// Texturas generadas en un lienzo 2D: evitan descargar imágenes.
import { CanvasTexture } from 'three';

const make = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  return new CanvasTexture(c);
};

export const radial = (stops: [number, string][], size = 64) =>
  make(size, size, (g) => {
    const r = size / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    stops.forEach(([at, color]) => grad.addColorStop(at, color));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  });

export const streak = () =>
  make(128, 4, (g) => {
    const grad = g.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.85, 'rgba(190,210,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 4);
  });
