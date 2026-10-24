import type { GameEntry } from '../types';

// ─────────────────────────────────────────────────────────────────────────
// Game catalog. Add or edit entries here — no UI changes needed.
//
//   launch: 'local'    → bundled game, played in-portal. url is a path under
//                        the site base (public/games/<id>.html).
//   launch: 'external' → opens the official website in a new tab. url is the
//                        canonical https address.
//
// External entries only use addresses where the domain IS the game (e.g.
// slither.io) plus two verified publisher pages (Cookie Clicker on its
// official dashnet host, Moto X3M on its Poki listing). No embedding rights,
// ratings, or player counts are claimed anywhere.
// ─────────────────────────────────────────────────────────────────────────

const local = (
  id: string,
  title: string,
  category: GameEntry['category'],
  description: string,
  controls: string,
): GameEntry => ({ id, title, category, launch: 'local', url: `games/${id}.html`, description, controls });

const ext = (
  id: string,
  title: string,
  category: GameEntry['category'],
  url: string,
  description: string,
): GameEntry => ({
  id,
  title,
  category,
  launch: 'external',
  url,
  description,
  controls: 'Opens the official website in a new tab. Controls are shown on the game’s own site.',
});

export const GAMES: GameEntry[] = [
  // ── Local, playable in-portal ────────────────────────────────────────────
  local('snake', 'Snake', 'Classic', 'Grow the snake by eating; don’t hit the walls or yourself.', 'Arrow keys or WASD to steer. On touch, swipe.'),
  local('2048', '2048', 'Puzzle', 'Slide and merge tiles to reach 2048.', 'Arrow keys or swipe to slide all tiles.'),
  local('tetris', 'Block Drop', 'Puzzle', 'Stack falling blocks and clear full lines.', '←/→ move, ↑ or X rotate, ↓ soft drop, Space hard drop, P pause.'),
  local('minesweeper', 'Minesweeper', 'Puzzle', 'Clear the field without detonating a mine.', 'Left-click reveals, right-click flags. On touch, tap reveals, long-press flags.'),
  local('breakout', 'Breakout', 'Classic', 'Bounce the ball to break every brick.', 'Move the paddle with the mouse or ←/→.'),
  local('pong', 'Pong', 'Classic', 'The original paddle duel against the computer.', 'W/S or ↑/↓ to move your paddle.'),
  local('connect4', 'Connect Four', 'Strategy', 'Line up four in a row before your opponent.', 'Click a column to drop a disc. Two players or vs computer.'),
  local('flappy', 'Flap', 'Casual', 'Tap to fly between the pipes.', 'Click, tap, Space or ↑ to flap.'),
  local('tictactoe', 'Tic-Tac-Toe', 'Classic', 'Classic noughts and crosses.', 'Click a cell. Two players or vs computer.'),
  local('memory', 'Memory Match', 'Casual', 'Flip cards and find all the pairs.', 'Click two cards to compare them.'),
  local('simon', 'Simon', 'Casual', 'Repeat the growing colour sequence.', 'Click the pads in the shown order.'),
  local('sudoku', 'Sudoku', 'Puzzle', 'Fill the grid so every row, column and box has 1–9.', 'Click a cell then a number. N toggles pencil marks.'),
  local('solitaire', 'Solitaire', 'Classic', 'Klondike solitaire — build the four foundations.', 'Click to flip the stock; click a card to auto-move, or drag.'),
  local('chess', 'Chess', 'Strategy', 'Two-player chess with full legal moves and check.', 'Click a piece, then a highlighted square.'),
  local('checkers', 'Checkers', 'Strategy', 'Two-player draughts with forced captures and kings.', 'Click a piece, then a highlighted square.'),
  local('fifteen', '15 Puzzle', 'Puzzle', 'Slide the tiles into numerical order.', 'Click a tile next to the gap, or use arrow keys.'),
  local('lightsout', 'Lights Out', 'Puzzle', 'Switch every light off — each press flips its neighbours.', 'Click a light to toggle it and the four around it.'),
  local('whack', 'Whack-a-Mole', 'Casual', 'Bop the moles before they duck away.', 'Click or tap a mole as it pops up.'),
  local('asteroids', 'Asteroids', 'Action', 'Blast the rocks and don’t get hit.', '←/→ rotate, ↑ thrust, Space fire.'),
  local('reaction', 'Reaction Test', 'Casual', 'Measure your reflexes in milliseconds.', 'Click the moment the screen turns green.'),
  local('hangman', 'Hangman', 'Classic', 'Guess the hidden word letter by letter.', 'Click a letter or type it on your keyboard.'),
  local('racer', 'Road Racer', 'Racing', 'Weave through traffic as long as you can.', '←/→ or A/D to change lanes.'),

  // ── External official websites (open in a new tab) ────────────────────────
  ext('slither', 'Slither.io', 'Multiplayer', 'https://slither.io', 'Grow the longest snake in a shared arena.'),
  ext('agar', 'Agar.io', 'Multiplayer', 'https://agar.io', 'Eat cells to grow, avoid being eaten.'),
  ext('diep', 'Diep.io', 'Multiplayer', 'https://diep.io', 'Upgrade your tank and battle in an open arena.'),
  ext('krunker', 'Krunker', 'Action', 'https://krunker.io', 'Fast browser first-person shooter.'),
  ext('shellshockers', 'Shell Shockers', 'Action', 'https://shellshock.io', 'Egg-themed multiplayer first-person shooter.'),
  ext('onevone', '1v1.LOL', 'Action', 'https://1v1.lol', 'Build-and-shoot competitive arena.'),
  ext('cookieclicker', 'Cookie Clicker', 'Casual', 'https://orteil.dashnet.org/cookieclicker/', 'The classic incremental cookie game by Orteil.'),
  ext('motox3m', 'Moto X3M', 'Racing', 'https://poki.com/en/g/moto-x3m', 'Stunt dirt-bike racing across timed levels.'),
  ext('moomoo', 'MooMoo.io', 'Multiplayer', 'https://moomoo.io', 'Gather resources, build and defend a base.'),
  ext('zombs', 'Zombs.io', 'Multiplayer', 'https://zombs.io', 'Build towers and survive waves of zombies.'),
  ext('skribbl', 'Skribbl.io', 'Multiplayer', 'https://skribbl.io', 'Draw-and-guess party game with friends.'),
  ext('starblast', 'Starblast.io', 'Action', 'https://starblast.io', 'Mine asteroids and upgrade your ship in space.'),
  ext('deeeep', 'Deeeep.io', 'Multiplayer', 'https://deeeep.io', 'Evolve through an ocean food chain.'),
  ext('smashkarts', 'Smash Karts', 'Racing', 'https://smashkarts.io', 'Kart battles with power-ups.'),
  ext('powerline', 'Powerline.io', 'Multiplayer', 'https://powerline.io', 'A neon take on competitive snake.'),
  ext('hextris', 'Hextris', 'Puzzle', 'https://hextris.io', 'Open-source hexagonal spin on falling blocks.'),
  ext('tetrio', 'TETR.IO', 'Puzzle', 'https://tetr.io', 'Competitive modern stacker.'),
  ext('voxiom', 'Voxiom.io', 'Action', 'https://voxiom.io', 'Voxel shooter with building and survival modes.'),
  ext('kirka', 'Kirka.io', 'Action', 'https://kirka.io', 'Blocky multiplayer first-person shooter.'),
  ext('bloxd', 'Bloxd.io', 'Multiplayer', 'https://bloxd.io', 'Sandbox and mini-games in a blocky world.'),
  ext('taming', 'Taming.io', 'Multiplayer', 'https://taming.io', 'Survival with tamed pets and base-building.'),
  ext('digdig', 'Digdig.io', 'Multiplayer', 'https://digdig.io', 'Dig, grow and knock out rivals underground.'),
  ext('gats', 'Gats.io', 'Action', 'https://gats.io', 'Top-down multiplayer shooter.'),
  ext('wings', 'Wings.io', 'Multiplayer', 'https://wings.io', 'Dogfight other planes in the sky.'),
  ext('lordz', 'Lordz.io', 'Strategy', 'https://lordz.io', 'Raise an army and conquer the map.'),
  ext('yohoho', 'Yohoho.io', 'Multiplayer', 'https://yohoho.io', 'Pirate battle-royale brawler.'),
];
