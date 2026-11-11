# MAAN Studio

Agencia de marketing digital. Servicios: páginas web, Meta Ads, Google Ads, TikTok Ads, agentes de IA, automatizaciones y CRM a la medida.
Mercados iniciales: Colombia y Estados Unidos (español e inglés).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `web/` | Sitio web de la agencia (Astro, bilingüe ES/EN) |
| `clientes/` | Una carpeta por cliente. Copia `clientes/_plantilla/` para empezar |
| `marca/` | Identidad de MAAN Studio: logo, colores, tipografías |

## Sitio web

```bash
cd web
npm install
npm run dev      # desarrollo en http://localhost:4321
npm run build    # genera el sitio estático en web/dist
```

- Páginas: Inicio, Servicios, Trabajo (demos), Nosotros y Contacto. Español en `/`, inglés en `/en/`.
- Rutas: `web/src/i18n/index.ts`. Contenido de cada página: `web/src/views/`.
- Publicado en Cloudflare: cada cambio en `main` se despliega solo.
- Textos: `web/src/i18n/es.ts` y `web/src/i18n/en.ts`.
- Correo, redes, WhatsApp, dominio y formulario: `web/src/config/site.ts`.
- Colores y tipografías: variables al inicio de `web/src/styles/global.css`.
- Secciones: `web/src/components/`.

`web/dist` es un sitio estático: se puede publicar en Vercel, Netlify o Cloudflare Pages.
