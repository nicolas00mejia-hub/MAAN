# Maan Studio

Agencia de marketing digital. Servicios: páginas web, Meta Ads, Google Ads y TikTok Ads.
Mercados iniciales: Colombia y Estados Unidos (español e inglés).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `web/` | Sitio web de la agencia (Astro, bilingüe ES/EN) |
| `clientes/` | Una carpeta por cliente. Copia `clientes/_plantilla/` para empezar |
| `marca/` | Identidad de Maan Studio: logo, colores, tipografías |

## Sitio web

```bash
cd web
npm install
npm run dev      # desarrollo en http://localhost:4321
npm run build    # genera el sitio estático en web/dist
```

- Español en `/`, inglés en `/en/`.
- Textos: `web/src/i18n/es.ts` y `web/src/i18n/en.ts`.
- Correo, redes, WhatsApp, dominio y formulario: `web/src/config/site.ts`.
- Colores y tipografías: variables al inicio de `web/src/styles/global.css`.
- Secciones: `web/src/components/`.

`web/dist` es un sitio estático: se puede publicar en Vercel, Netlify o Cloudflare Pages.
