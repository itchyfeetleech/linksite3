/* ════════════════════════════════════════════════════════════════
   MAIN — boots the tube, wires the global keyboard router.

   Key routing rules:
     · during boot: any key skips
     · hack mode:   arrows/enter go to the minigame, ESC bails out
     · lockout:     nothing responds (that's the point)
     · digits 1-5:  switch tabs (when the prompt is empty)
     · arrows:      history on TERMINAL, row selection elsewhere
     · printable:   lands in the prompt, wherever you are
   ════════════════════════════════════════════════════════════════ */

import { sfx } from './audio.js';
import { startNoise, startJolts, powerOn } from './fx.js';
import { runBoot } from './boot.js';
import { ui, state } from './ui.js';
import { terminal } from './terminal.js';

const $ = (id) => document.getElementById(id);

const screen = $('screen');
const phosphor = $('phosphor');
const bootEl = $('boot');
const uiEl = $('ui');
const cli = $('cli');

let ready = false;

/* wake the audio context on the first gesture of any kind */
window.addEventListener('pointerdown', () => sfx.unlock(), { capture: true });
window.addEventListener('keydown', () => sfx.unlock(), { capture: true });

window.addEventListener('keydown', (e) => {
  if (!ready || e.metaKey || e.ctrlKey || e.altKey) return;

  // audible feedback for "real" keys
  if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') sfx.key();

  if (state.mode === 'lockout') { e.preventDefault(); return; }

  if (state.mode === 'hack') {
    if (e.key === 'Escape') { ui.switchTab('stats'); e.preventDefault(); return; }
    if (state.hack?.handleKey(e)) { e.preventDefault(); return; }
    return; // ignore typing during a breach
  }

  // let focused buttons/links activate natively (Tab + Enter/Space)
  const active = document.activeElement;
  const onWidget = active && active !== cli && (active.tagName === 'BUTTON' || active.tagName === 'A');
  if (onWidget && (e.key === 'Enter' || e.key === ' ')) return;

  switch (e.key) {
    case 'Escape':
      if (cli.value) terminal.setValue('');
      else ui.switchTab('stats');
      return;

    case 'Enter':
      if (cli.value.trim()) { terminal.submit(); }
      else if (!ui.activateNav() && state.tab !== 'term') ui.switchTab('term');
      e.preventDefault();
      return;

    case 'ArrowUp':
    case 'ArrowDown': {
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      if (state.tab === 'term') terminal.historyMove(dir);
      else ui.nav(dir);
      e.preventDefault();
      return;
    }

    default:
      if (/^[1-5]$/.test(e.key) && !cli.value) {
        ui.switchTab(['stats', 'links', 'loadout', 'term', 'vault'][+e.key - 1]);
        e.preventDefault();
        return;
      }
      // funnel printable characters into the prompt
      if ((e.key.length === 1 || e.key === 'Backspace') && document.activeElement !== cli) {
        terminal.focus();
      }
  }
});

/* ── boot ──────────────────────────────────────────────────────── */
(async function init() {
  startNoise($('noise'));
  powerOn(screen);
  await runBoot(bootEl);

  bootEl.remove();
  uiEl.hidden = false;
  ui.init();
  terminal.init();
  startJolts(phosphor);
  ready = true;

  // desktop: park focus in the prompt (mobile keeps its keyboard closed)
  if (matchMedia('(pointer: fine)').matches) terminal.focus();
})();
