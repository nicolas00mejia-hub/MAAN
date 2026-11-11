// Texturas generadas en un lienzo 2D: evitan descargar imágenes.
import { CanvasTexture, EquirectangularReflectionMapping, RepeatWrapping, SRGBColorSpace } from 'three';

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

/** Entorno de reflejos para el acabado perla: bandas pastel de todo el arcoíris sobre blanco. */
export const pearlEnv = () => {
  const tex = make(256, 128, (g) => {
    const hues = g.createLinearGradient(0, 0, 256, 0);
    for (let i = 0; i <= 12; i++) hues.addColorStop(i / 12, `hsl(${(i * 60) % 360} 95% 72%)`);
    g.fillStyle = hues;
    g.fillRect(0, 0, 256, 128);
    // Luz blanca arriba y penumbra abajo, para que el anillo tenga volumen.
    const light = g.createLinearGradient(0, 0, 0, 128);
    light.addColorStop(0, 'rgba(255,255,255,0.95)');
    light.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    light.addColorStop(0.7, 'rgba(255,255,255,0)');
    light.addColorStop(1, 'rgba(20,24,60,0.55)');
    g.fillStyle = light;
    g.fillRect(0, 0, 256, 128);
  });
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  return tex;
};

/** Piel nacarada: blanco perla con vetas pastel de arcoíris que se repiten sin costura. */
export const pearlSkin = () => {
  const tex = make(256, 64, (g) => {
    const hues = g.createLinearGradient(0, 0, 256, 0);
    for (let i = 0; i <= 6; i++) hues.addColorStop(i / 6, `hsl(${(i * 60) % 360} 100% 74%)`);
    g.fillStyle = hues;
    g.fillRect(0, 0, 256, 64);
    // Franjas blancas: el brillo perla entre color y color.
    const sheen = g.createLinearGradient(0, 0, 0, 64);
    sheen.addColorStop(0, 'rgba(255,255,255,0.78)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(1, 'rgba(255,255,255,0.78)');
    g.fillStyle = sheen;
    g.fillRect(0, 0, 256, 64);
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = SRGBColorSpace;
  return tex;
};
