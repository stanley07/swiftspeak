import { items } from './db';
import type { Item } from '@swiftspeak/shared';

export function getItems(lang: 'en'|'yo'|'ig'|'ha', limit = 10): Item[] {
  return (items[lang] || []).slice(0, limit);
}
