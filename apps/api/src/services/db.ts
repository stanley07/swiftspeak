import fs from 'node:fs';
import path from 'node:path';
import type { Item } from '@swiftspeak/shared';

const ROOT = process.cwd(); // container working dir: /app

function load(name: string): Item[] {
  try {
    const p = path.join(ROOT, 'seed', name);
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw) as Item[];
  } catch {
    return [];
  }
}

export const items: Record<string, Item[]> = {
  en: load('items-en.json'),
  yo: load('items-yo.json'),
  ig: load('items-ig.json'),
  ha: load('items-ha.json'),
};
