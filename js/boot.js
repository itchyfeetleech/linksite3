/* ════════════════════════════════════════════════════════════════
   BOOT — character-by-character POST sequence. Any key or click
   skips to the end. Resolves when finished.
   ════════════════════════════════════════════════════════════════ */

import { el } from './dom.js';
import { sfx } from './audio.js';
import { REDUCED_MOTION } from './fx.js';
import { CONFIG } from './config.js';

/* [text, css-class, pause-after-ms, chars-per-second] */
const SCRIPT = [
  ['ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL', '', 350, 90],
  ['INITIALIZING UNIFIED OPERATING SYSTEM v7.7.7', '', 200, 90],
  ['', '', 60],
  ['64KB RAM DETECTED ... 38911 BYTES FREE', 'dim', 120, 140],
  ['CRT PHOSPHOR ........................ WARM', 'dim', 90, 140],
  ['APERTURE GRILLE ..................... OK', 'dim', 90, 160],
  ['SCANLINE GENERATOR .................. OK', 'dim', 90, 160],
  ['RADIATION SHIELDING ................. MARGINAL', 'warn', 160, 140],
  ['COFFEE RESERVES ..................... CRITICAL', 'warn', 160, 140],
  ['MORALE SUBROUTINE ................... LOADED', 'dim', 200, 140],
  ['', '', 80],
  ['> SET TERMINAL/INQUIRE', '', 120, 70],
  ['RIT-V300', 'dim', 160, 110],
  [`> RUN DEBUG/PERSONNEL/${CONFIG.handle.toUpperCase()}.F`, '', 260, 70],
  ['', '', 100],
  ['ACCESS GRANTED — WELCOME, WANDERER', 'ok', 500, 60],
];

export function runBoot(bootEl) {
  return new Promise((resolve) => {
    let skipped = REDUCED_MOTION;
    const skip = () => { skipped = true; };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    const finish = () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      setTimeout(resolve, skipped ? 250 : 400);
    };

    (async () => {
      for (const [text, cls, pause = 100, cps = 100] of SCRIPT) {
        const lineEl = el('div', cls || undefined, '');
        bootEl.append(lineEl);
        if (skipped) {
          lineEl.textContent = text;
          continue;
        }
        for (const ch of text) {
          if (skipped) { lineEl.textContent = text; break; }
          lineEl.textContent += ch;
          if (ch !== ' ') sfx.type();
          await sleep(1000 / cps);
        }
        if (!skipped) await sleep(pause);
      }
      finish();
    })();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
