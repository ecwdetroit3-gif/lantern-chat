import type { AppCategory, GameCategory } from '../types';

// Deterministic, self-contained thumbnails: a gradient derived from the id plus
// a category glyph. No network images, so thumbnails are always consistent and
// never fail to load.

const PALETTES: [string, string][] = [
  ['#a855f7', '#6366f1'],
  ['#2563eb', '#06b6d4'],
  ['#059669', '#10b981'],
  ['#db2777', '#f43f5e'],
  ['#ea580c', '#f59e0b'],
  ['#7c3aed', '#2563eb'],
  ['#0891b2', '#22d3ee'],
  ['#4f46e5', '#a855f7'],
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function gradientFor(id: string): string {
  const [a, b] = PALETTES[hash(id) % PALETTES.length];
  const angle = hash(id + 'angle') % 360;
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}

const GAME_GLYPH: Record<GameCategory, string> = {
  Action: '⚔️',
  Puzzle: '🧩',
  Platformer: '🏃',
  Racing: '🏎️',
  Sports: '⚽',
  Multiplayer: '🌐',
  Strategy: '♟️',
  Classic: '🕹️',
  Casual: '🎲',
};

const APP_GLYPH: Record<AppCategory, string> = {
  Media: '🎬',
  Social: '💬',
  Productivity: '🗂️',
  Creative: '🎨',
  Reference: '📚',
  Developer: '🛠️',
  Other: '🔗',
};

export function gameGlyph(c: GameCategory): string {
  return GAME_GLYPH[c] ?? '🎮';
}

export function appGlyph(c: AppCategory): string {
  return APP_GLYPH[c] ?? '🔗';
}
