# MAAN Studio

Agencia de marketing digital (páginas web, Meta Ads, Google Ads, TikTok Ads, agentes de IA, automatizaciones y CRM a la medida) para Colombia y Estados Unidos.

- `web/`: sitio de la agencia en Astro. Verificar con `cd web && npm run build`.
- Sitio de varias páginas: rutas en `web/src/i18n/index.ts`, una vista por página en `web/src/views/` y archivos delgados en `web/src/pages/` (español en la raíz, inglés en `/en/`).
- Todo texto visible va en los dos idiomas: `web/src/i18n/es.ts` y `en.ts` (mismas claves).
- Datos de contacto y redes solo en `web/src/config/site.ts`.
- Inicio por capítulos fijos (`data-pin` + `data-slide`, lógica en `web/src/scripts/scroll.ts`); cada capítulo lleva `data-ch` y el recorrido del átomo se ancla a ellos en `variants.ts` (`stops`).
- Fondo 3D en `web/src/scripts/scene/`: el átomo de cada página (forma, movimiento y recorrido con el scroll) se define en `variants.ts`. Se carga después de la página; en táctiles usa menos resolución y sin desenfoques.
- Íconos y flechas con `web/src/components/Icon.astro` (SVG); no usar caracteres como → ↗ ✳ porque los teléfonos los muestran como emojis.
- No inventar clientes, testimonios ni cifras de resultados en el sitio.
- `clientes/`: una carpeta por cliente a partir de `clientes/_plantilla/`. Sin credenciales en el repo.
