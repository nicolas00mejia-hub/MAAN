// Luz que sigue al cursor sobre las tarjetas, con una leve inclinación 3D.
// Solo en dispositivos con ratón y si no se pidió reducir el movimiento.
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !reduce) {
  document.querySelectorAll<HTMLElement>('.pillar, .demo, .why__item').forEach((card) => {
    card.classList.add('spot');
    const tilt = card.classList.contains('pillar') ? 5 : 0;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (tilt) {
        card.style.setProperty('--rx', `${((0.5 - y) * tilt).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((x - 0.5) * tilt).toFixed(2)}deg`);
      }
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  // Halo suave que acompaña al cursor por toda la página.
  const halo = document.querySelector<HTMLElement>('[data-halo]');
  if (halo) {
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let tx = x;
    let ty = y;
    addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      halo.style.opacity = '1';
    });
    const move = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      halo.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      requestAnimationFrame(move);
    };
    requestAnimationFrame(move);
  }
}
