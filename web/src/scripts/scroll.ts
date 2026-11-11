// Motor de animaciones ligadas al scroll.
// Calcula el avance de cada bloque y lo expone como variables CSS (--enter, --pin, --hp);
// el movimiento en sí se define en global.css.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const all = <T extends HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

// Aparición suave de los bloques al entrar en pantalla.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
all('[data-reveal]').forEach((el) => io.observe(el));

if (!reduce) {
  const root = document.documentElement;
  root.classList.add('motion');

  // Títulos que se "encienden" palabra por palabra.
  const scrubs = all('[data-scrub]').map((el) => {
    const words: HTMLElement[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of node.data.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(' ');
          continue;
        }
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = part;
        frag.append(span);
        words.push(span);
      }
      node.replaceWith(frag);
    }
    return { el, words, shown: -1 };
  });

  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const enters = all('[data-enter]');
  const pins = all('[data-pin]').map((el) => {
    const slides = [...el.querySelectorAll<HTMLElement>('[data-slide]')];
    return {
      el,
      steps: [...el.querySelectorAll<HTMLElement>('[data-step]')],
      slides,
      count: slides.reduce((n, s) => Math.max(n, Number(s.dataset.slide) + 1), 0),
      shown: -1,
      on: -1,
    };
  });
  const throughs = all('[data-through]');
  const track = document.querySelector<HTMLElement>('[data-marquee]');

  // Para que el scroll sea fluido, primero se MIDE todo y después se ESCRIBE todo:
  // alternar lecturas y escrituras obliga al navegador a recalcular la página en cada paso.
  const last = new Map<string, string>();
  const writes: (() => void)[] = [];
  const setVar = (el: HTMLElement, id: string, name: string, value: string) => {
    if (last.get(id) === value) return;
    last.set(id, value);
    writes.push(() => el.style.setProperty(name, value));
  };

  const update = () => {
    const vh = innerHeight;
    writes.length = 0;

    // ----- Medir -----
    if (bar) setVar(bar, 'bar', '--sp', clamp(scrollY / (root.scrollHeight - vh || 1)).toFixed(3));

    enters.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh * 1.2 || r.bottom < -vh * 0.2) return;
      setVar(el, `e${i}`, '--enter', clamp((vh - r.top) / (vh * 0.65)).toFixed(3));
    });

    // Avance de un bloque mientras cruza toda la pantalla (0 al entrar, 1 al salir).
    throughs.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      setVar(el, `t${i}`, '--through', clamp((vh - r.top) / (vh + r.height)).toFixed(3));
    });

    for (const s of scrubs) {
      const r = s.el.getBoundingClientRect();
      const n = Math.round(clamp((vh * 0.92 - r.top) / (vh * 0.5)) * s.words.length);
      if (n === s.shown) continue;
      s.shown = n;
      writes.push(() => s.words.forEach((w, i) => w.classList.toggle('on', i < n)));
    }

    pins.forEach((pin, k) => {
      const { el, steps } = pin;
      const r = el.getBoundingClientRect();
      if (r.top > vh * 1.5 || r.bottom < -vh * 0.5) return;
      // Sección fijada (alta): avance durante el tramo fijo. Si no, avance al cruzar la pantalla.
      const pinned = r.height > vh * 1.3;
      const p = pinned ? clamp(-r.top / (r.height - vh)) : clamp((vh * 0.7 - r.top) / (r.height * 0.75));
      setVar(el, `p${k}`, '--pin', p.toFixed(3));
      const on = steps.filter((_, i) => p >= (i + 0.35) / steps.length).length;
      if (on !== pin.on) {
        pin.on = on;
        writes.push(() => steps.forEach((s, i) => s.classList.toggle('on', i < on)));
      }
      // Diapositivas: solo una activa a la vez (titulares que cambian, frases, frentes de servicio).
      if (pin.count) {
        const idx = Math.min(pin.count - 1, Math.floor(p * pin.count));
        if (idx !== pin.shown) {
          pin.shown = idx;
          writes.push(() => {
            el.style.setProperty('--idx', String(idx));
            for (const s of pin.slides) {
              const n = Number(s.dataset.slide);
              s.classList.toggle('is-active', n === idx);
              s.classList.toggle('is-past', n < idx);
            }
          });
        }
      }
    });

    // ----- Escribir -----
    for (const w of writes) w();
  };

  // Cinta de servicios: se acelera y cambia de dirección con el scroll.
  let x = 0;
  let half = 0;
  let lastY = scrollY;
  let vel = 0;
  let dir = -1;
  let dirty = true;
  const measure = () => {
    half = track ? track.scrollWidth / 2 : 0;
    dirty = true;
  };
  measure();
  addEventListener('resize', measure);
  addEventListener('scroll', () => (dirty = true), { passive: true });
  document.fonts?.ready.then(measure);

  const tick = () => {
    const y = scrollY;
    const d = y - lastY;
    lastY = y;
    vel += (d - vel) * 0.12;
    if (Math.abs(d) > 0.5) dir = d > 0 ? -1 : 1;
    if (track && half) {
      x = (x + dir * (0.7 + Math.abs(vel) * 0.4)) % half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${clamp(vel * -0.2, -10, 10).toFixed(2)}deg)`;
    }
    if (dirty) {
      dirty = false;
      update();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
