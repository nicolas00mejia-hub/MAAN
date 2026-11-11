// Acabado "perla": blanco luminoso con visos de arcoíris que cambian según el ángulo
// y el tiempo, más un resplandor real alrededor (se desvanece hacia los bordes).
import { AdditiveBlending, ShaderMaterial } from 'three';

const vertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec2 vUv;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

const common = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  varying vec2 vUv;
  vec3 hue(float h) {
    return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  }
  // Tono pastel: el color mezclado con blanco, para que el viso sea sobrio.
  vec3 tint(float h) {
    return mix(hue(h), vec3(1.0), 0.5);
  }
`;

// El aro: casi blanco de frente, con color en los cantos; un brillo recorre el anillo.
const ringFragment = /* glsl */ `
  ${common}
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float edge = 1.0 - abs(dot(n, v));
    float h = vUv.x * 2.0 + vUv.y * 0.7 + edge * 0.9 + uTime * 0.13;
    vec3 col = mix(vec3(1.0), tint(h), 0.06 + 0.42 * pow(edge, 1.4));
    float spec = pow(max(dot(n, normalize(v + vec3(0.3, 0.6, 0.7))), 0.0), 28.0);
    float sweep = pow(0.5 + 0.5 * sin(vUv.x * 6.2832 * 2.0 - uTime * 1.5), 26.0);
    col += spec * 0.7 + sweep * 0.3;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

// El resplandor: intenso junto al aro y transparente hacia afuera, teñido por los mismos visos.
const glowFragment = /* glsl */ `
  ${common}
  uniform float uStrength;
  uniform float uFalloff;
  void main() {
    float core = pow(abs(dot(normalize(vN), normalize(vV))), uFalloff);
    vec3 col = mix(vec3(1.0), tint(vUv.x * 2.0 + uTime * 0.13), 0.45);
    gl_FragColor = vec4(col, core * uStrength * uOpacity);
  }
`;

export function makePearl() {
  const time = { value: 0 };
  const ring = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: ringFragment,
    uniforms: { uTime: time, uOpacity: { value: 1 } },
    transparent: true,
  });
  const glow = (strength: number, falloff: number) =>
    new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: glowFragment,
      uniforms: { uTime: time, uOpacity: { value: 1 }, uStrength: { value: strength }, uFalloff: { value: falloff } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  return {
    ring,
    // Dos capas: una ceñida y brillante, otra amplia y tenue.
    glows: [
      { mat: glow(0.42, 2.6), tube: 3 },
      { mat: glow(0.1, 3.4), tube: 8 },
    ],
    tick: (t: number) => (time.value = t),
  };
}
