/* ════════════════════════════════════════════════════════════════
   CONFIG — all profile content lives here. Edit this file only.
   ════════════════════════════════════════════════════════════════ */

export const CONFIG = {
  handle: 'itchyfeetleech',
  name: 'ITCHYFEETLEECH',
  role: 'CREATIVE DEVELOPER',
  location: 'THE WASTELAND (REMOTE)',

  // Short bio shown on the STATS page.
  blurb: [
    'Builder of small, strange, glowing things for the web.',
    'Equal parts engineer and tinkerer: happiest somewhere',
    'between a debugger and a synthesizer. This terminal is',
    'hand-rolled — no frameworks, no build step, no mercy.',
  ],

  // S.P.E.C.I.A.L. — values 1..10.
  special: [
    { k: 'S', label: 'SYSTEMS',     value: 8, note: 'backend & infra' },
    { k: 'P', label: 'PIXELS',      value: 7, note: 'ui & graphics' },
    { k: 'E', label: 'ENDURANCE',   value: 9, note: 'debugging stamina' },
    { k: 'C', label: 'CREATIVITY',  value: 8, note: 'weird ideas/min' },
    { k: 'I', label: 'INTELLECT',   value: 7, note: 'algorithms' },
    { k: 'A', label: 'AGILITY',     value: 6, note: 'ship speed' },
    { k: 'L', label: 'LUCK',        value: 3, note: 'prod deploys' },
  ],

  // LINKS page. `tail` is the visible address text.
  links: [
    { label: 'GITHUB',   url: 'https://github.com/itchyfeetleech',  tail: 'github.com/itchyfeetleech' },
    { label: 'EMAIL',    url: 'mailto:hello@example.com',           tail: 'hello@example.com' },
    { label: 'BLUESKY',  url: 'https://bsky.app/',                  tail: 'bsky.app/you' },
    { label: 'LINKEDIN', url: 'https://linkedin.com/',              tail: 'linkedin.com/in/you' },
    { label: 'WEBSITE',  url: 'https://example.com',                tail: 'example.com' },
  ],

  // PROJECTS page.
  projects: [
    {
      name: 'TERMLINK BIOPROFILE',
      desc: 'This site. A Fallout-style CRT terminal in vanilla JS.',
      tech: 'css compositing · web audio · zero deps',
      url: 'https://github.com/itchyfeetleech/linksite3',
    },
    {
      name: 'PROJECT WANDERER',
      desc: 'Procedural wasteland map generator.',
      tech: 'canvas · simplex noise',
      url: 'https://github.com/itchyfeetleech',
    },
    {
      name: 'PIP-SYNTH',
      desc: 'Browser synthesizer with a 50s radio voice.',
      tech: 'web audio · worklets',
      url: 'https://github.com/itchyfeetleech',
    },
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
