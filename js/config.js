/* ════════════════════════════════════════════════════════════════
   CONFIG — all profile content lives here. Edit this file only.
   ════════════════════════════════════════════════════════════════ */

export const CONFIG = {
  handle: 'hoppcx',
  name: 'HOPPCX',
  role: 'COMPETITIVE FPS PLAYER',
  location: 'THE WASTELAND (RANKED QUEUE)',

  // Short bio shown on the STATS page.
  blurb: [
    'Competitive FPS player and aim grinder.',
    'CS2 · Valorant · Overwatch · Deadlock · Marvel Rivals.',
    'This terminal is the .nfo from hoppcx.top, rebuilt',
    'for the wasteland — same energy, more radiation.',
  ],

  // S.P.E.C.I.A.L. — values 1..10.
  special: [
    { k: 'S', label: 'STRENGTH',     value: 6, note: 'carries the team' },
    { k: 'P', label: 'PERCEPTION',   value: 9, note: 'crosshair placement' },
    { k: 'E', label: 'ENDURANCE',    value: 8, note: 'one more game' },
    { k: 'C', label: 'CHARISMA',     value: 5, note: 'comms discipline' },
    { k: 'I', label: 'INTELLIGENCE', value: 7, note: 'macro brain' },
    { k: 'A', label: 'AGILITY',      value: 9, note: 'counter-strafing' },
    { k: 'L', label: 'LUCK',         value: 3, note: 'spray transfers' },
  ],

  // LINKS page. `tail` is the visible address text.
  links: [
    { label: 'FACEIT',    url: 'https://www.faceit.com/en/players/HoppCX',                  tail: 'faceit.com/en/players/HoppCX' },
    { label: 'LEETIFY',   url: 'https://leetify.com/app/profile/76561198198305361',         tail: 'leetify.com · cs2 stats' },
    { label: 'VALORANT',  url: 'https://tracker.gg/valorant/profile/riot/HoppCX%23000/',    tail: 'tracker.gg · HoppCX#000' },
    { label: 'OVERWATCH', url: 'https://www.overbuff.com/players/HoppCX-1509',              tail: 'overbuff.com · HoppCX-1509' },
    { label: 'DEADLOCK',  url: 'https://tracklock.gg/players/238039633',                    tail: 'tracklock.gg/players/238039633' },
    { label: 'RIVALS',    url: 'https://tracker.gg/marvel-rivals/profile/ign/HoppCX/',      tail: 'tracker.gg · marvel rivals' },
    { label: 'YOUTUBE',   url: 'https://www.youtube.com/@HoppCX',                           tail: 'youtube.com/@HoppCX' },
  ],

  // LOADOUT page — current gear.
  loadout: [
    { k: 'SYS',  v: '9800X3D @ 5.7GHz',
      note: 'thermal paste status: classified' },
    { k: 'AIM',  v: 'OP1we + Obsidian dots @ 50cm on glass pad',
      note: 'friction is a skill issue' },
    { k: 'KEYS', v: 'Fun60ProHE + 480Hz OLED',
      note: 'rapid trigger, zero excuses' },
  ],

  // Shown on the hidden VAULT page once the hacking minigame is won.
  vault: [
    'OVERSEER EYES ONLY — DO NOT DISTRIBUTE',
    '',
    'Congratulations, wanderer. You breached the partition.',
    '',
    'Rewards issued:',
    '  · OVERSEER phosphor theme unlocked  →  THEME OVERSEER',
    '  · +50 caps (redeemable nowhere)',
    '  · the quiet satisfaction of a guessed password',
    '',
    'Fun fact: every sound on this terminal is synthesized',
    'live by an oscillator — there are no audio files here.',
  ],
};

export const THEMES = ['green', 'amber', 'blue'];
export const SECRET_THEME = 'overseer';
