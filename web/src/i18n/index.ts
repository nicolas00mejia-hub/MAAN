import { es, type Dict } from './es';
import { en } from './en';

export type Locale = 'es' | 'en';
export type PageKey = 'home' | 'services' | 'work' | 'about' | 'contact';

export const dictionaries: Record<Locale, Dict> = { es, en };

// Dirección de cada página en cada idioma.
export const routes: Record<PageKey, Record<Locale, string>> = {
  home: { es: '/', en: '/en/' },
  services: { es: '/servicios/', en: '/en/services/' },
  work: { es: '/trabajo/', en: '/en/work/' },
  about: { es: '/nosotros/', en: '/en/about/' },
  contact: { es: '/contacto/', en: '/en/contact/' },
};

export const otherLocale = (l: Locale): Locale => (l === 'es' ? 'en' : 'es');
export type { Dict };
