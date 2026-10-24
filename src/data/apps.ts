import type { AppEntry } from '../types';

// ─────────────────────────────────────────────────────────────────────────
// App catalog. Add or edit entries here — no UI changes needed.
//
// Every entry opens the service's official website (in a new tab, or inside
// the ORBIT Browser if a proxy backend is configured). Sign-in always happens
// on the service's own site. No embedding is claimed: most of these services
// block being framed, so the portal links out rather than pretending to embed.
// Users can also add their own shortcuts from the Apps page.
// ─────────────────────────────────────────────────────────────────────────

const app = (
  id: string,
  title: string,
  category: AppEntry['category'],
  url: string,
  description: string,
): AppEntry => ({ id, title, category, url, description });

export const APPS: AppEntry[] = [
  app('youtube', 'YouTube', 'Media', 'https://www.youtube.com', 'Videos, music and live streams.'),
  app('spotify', 'Spotify', 'Media', 'https://open.spotify.com', 'Music and podcast streaming (web player).'),
  app('soundcloud', 'SoundCloud', 'Media', 'https://soundcloud.com', 'Streaming for independent audio and music.'),
  app('twitch', 'Twitch', 'Media', 'https://www.twitch.tv', 'Live game streaming and chat.'),
  app('discord', 'Discord', 'Social', 'https://discord.com/app', 'Voice, video and text chat communities.'),
  app('reddit', 'Reddit', 'Social', 'https://www.reddit.com', 'Community discussion across every topic.'),
  app('wikipedia', 'Wikipedia', 'Reference', 'https://www.wikipedia.org', 'The free online encyclopedia.'),
  app('wolfram', 'Wolfram Alpha', 'Reference', 'https://www.wolframalpha.com', 'Computational answers and step-by-step math.'),
  app('desmos', 'Desmos', 'Reference', 'https://www.desmos.com/calculator', 'Free online graphing calculator.'),
  app('translate', 'Google Translate', 'Reference', 'https://translate.google.com', 'Translate text between languages.'),
  app('maps', 'Google Maps', 'Reference', 'https://maps.google.com', 'Maps, directions and local search.'),
  app('gdocs', 'Google Docs', 'Productivity', 'https://docs.google.com', 'Create and edit documents online.'),
  app('gdrive', 'Google Drive', 'Productivity', 'https://drive.google.com', 'Cloud file storage and sharing.'),
  app('gmail', 'Gmail', 'Productivity', 'https://mail.google.com', 'Google’s web email client.'),
  app('notion', 'Notion', 'Productivity', 'https://www.notion.so', 'Notes, docs and wikis in one place.'),
  app('canva', 'Canva', 'Creative', 'https://www.canva.com', 'Drag-and-drop graphic design in the browser.'),
  app('photopea', 'Photopea', 'Creative', 'https://www.photopea.com', 'Free Photoshop-style image editor.'),
  app('figma', 'Figma', 'Creative', 'https://www.figma.com', 'Collaborative interface design.'),
  app('github', 'GitHub', 'Developer', 'https://github.com', 'Code hosting and collaboration.'),
  app('codepen', 'CodePen', 'Developer', 'https://codepen.io', 'Front-end code playground.'),
  app('stackoverflow', 'Stack Overflow', 'Developer', 'https://stackoverflow.com', 'Programming Q&A community.'),
  app('replit', 'Replit', 'Developer', 'https://replit.com', 'In-browser IDE for many languages.'),
];
