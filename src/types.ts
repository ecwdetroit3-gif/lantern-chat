// Catalog + preference types. Catalogs live in src/data/*.ts so new entries
// can be added without touching any UI component.

export type GameCategory =
  | 'Action'
  | 'Puzzle'
  | 'Platformer'
  | 'Racing'
  | 'Sports'
  | 'Multiplayer'
  | 'Strategy'
  | 'Classic'
  | 'Casual';

export type LaunchType = 'local' | 'external';

export interface GameEntry {
  /** Stable unique id, also used for favorites/recents and thumbnail colour. */
  id: string;
  title: string;
  category: GameCategory;
  /** 'local' games are bundled and playable in-portal ("Play here").
   *  'external' games open their official website in a new tab. */
  launch: LaunchType;
  /** local: path relative to the site base (e.g. "games/snake.html").
   *  external: absolute https URL of the official site. */
  url: string;
  /** Short blurb shown on the card / player. */
  description: string;
  /** Controls / how to play, shown in the player's instructions panel. */
  controls: string;
}

export type AppCategory =
  | 'Media'
  | 'Social'
  | 'Productivity'
  | 'Creative'
  | 'Reference'
  | 'Developer'
  | 'Other';

export interface AppEntry {
  id: string;
  title: string;
  category: AppCategory;
  /** Absolute https URL of the official destination. */
  url: string;
  description: string;
  /** User-added shortcuts are flagged so they can be edited/removed. */
  custom?: boolean;
}

export type Accent = 'purple' | 'blue' | 'green';

export interface CloakSettings {
  /** Tab title shown while cloaked. */
  title: string;
  /** Emoji used to generate the cloaked favicon. */
  faviconEmoji: string;
  /** Keyboard shortcut descriptor, e.g. { key: "`", alt: false, ctrl: false, shift: false }. */
  shortcut: ShortcutKey;
  /** Optional panic redirect target (absolute URL). Empty = disabled. */
  redirectUrl: string;
}

export interface ShortcutKey {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

export interface BackendConfig {
  /** Base URL of the proxy backend, e.g. https://my-proxy.example.com. Empty = not configured. */
  url: string;
  /** Access token the user set on their backend (ACCESS_TOKEN). */
  token: string;
}

export interface RecentEntry {
  id: string;
  at: number;
}

export interface Prefs {
  accent: Accent;
  reducedMotion: boolean;
  favorites: string[];
  recents: RecentEntry[];
  cloak: CloakSettings;
  backend: BackendConfig;
  customApps: AppEntry[];
  cloakNote: string;
}
