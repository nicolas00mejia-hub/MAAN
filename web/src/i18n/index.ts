import { es, type Dict } from './es';
import { en } from './en';

export type Locale = 'es' | 'en';
export const dictionaries: Record<Locale, Dict> = { es, en };
export const paths: Record<Locale, string> = { es: '/', en: '/en/' };
export const otherLocale = (l: Locale): Locale => (l === 'es' ? 'en' : 'es');
export type { Dict };
