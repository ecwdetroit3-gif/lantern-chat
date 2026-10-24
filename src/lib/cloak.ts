import type { ShortcutKey } from '../types';

const ORIGINAL_TITLE = 'ORBIT';
const FAVICON_ID = 'favicon';
const ORIGINAL_FAVICON = './favicon.svg';

/** Render an emoji to a favicon data URL via canvas. Returns null if canvas
 *  is unavailable; callers then leave the icon unchanged. */
export function emojiFavicon(emoji: string): string | null {
  try {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '📄', size / 2, size / 2 + 4);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function faviconLink(): HTMLLinkElement {
  let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FAVICON_ID;
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function applyCloakChrome(title: string, faviconEmoji: string): void {
  document.title = title || 'New Tab';
  const data = emojiFavicon(faviconEmoji);
  if (data) faviconLink().href = data;
}

export function restoreChrome(): void {
  document.title = ORIGINAL_TITLE;
  faviconLink().href = ORIGINAL_FAVICON;
}

export function matchesShortcut(e: KeyboardEvent, s: ShortcutKey): boolean {
  if (!s.key) return false;
  return (
    e.key.toLowerCase() === s.key.toLowerCase() &&
    e.ctrlKey === s.ctrl &&
    e.altKey === s.alt &&
    e.shiftKey === s.shift
  );
}

export function shortcutLabel(s: ShortcutKey): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push('Ctrl');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  const key = s.key === ' ' ? 'Space' : s.key.length === 1 ? s.key.toUpperCase() : s.key;
  parts.push(key || '—');
  return parts.join(' + ');
}
