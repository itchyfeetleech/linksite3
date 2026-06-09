/* ════════════════════════════════════════════════════════════════
   TERMINAL — the always-on prompt line and its command set.
   Typing anywhere on the page lands here; output goes to the
   TERMINAL tab's scrollback.
   ════════════════════════════════════════════════════════════════ */

import { CONFIG, THEMES, SECRET_THEME } from './config.js';
import { sfx } from './audio.js';
import { ui, state } from './ui.js';
import { powerOff } from './fx.js';

const DOGMEAT = String.raw`
      __
 (___()'\`;   *sniff*
 /,    /\`
 \\"--\\
`;

const HELP = [
  ['HELP',            'this list'],
  ['STATS / LINKS / PROJECTS / TERMINAL', 'switch tabs (or keys 1-5)'],
  ['OPEN <N>',        'open link number N'],
  ['THEME <NAME>',    'phosphor: ' + THEMES.join(' / ') + ' / ?????'],
  ['SOUND ON|OFF',    'toggle synthesized audio'],
  ['HACK',            'breach the encrypted partition'],
  ['WHOAMI / DATE / MOTD / CLEAR', 'the classics'],
  ['REBOOT',          'power-cycle the tube'],
  ['SUDO <CMD>',      'absolutely try it'],
  ['NUKE',            'do not use'],
];

export const terminal = {
  history: [],
  histIdx: -1,

  init() {
    this.cli = document.getElementById('cli');
    this.mirror = document.getElementById('cli-mirror');
    this.promptline = document.getElementById('promptline');

    this.cli.addEventListener('input', () => {
      this.mirror.textContent = this.cli.value.toUpperCase();
    });
    this.promptline.addEventListener('click', () => { sfx.unlock(); this.cli.focus(); });
  },

  focus() { this.cli.focus({ preventScroll: true }); },

  setValue(v) {
    this.cli.value = v;
    this.mirror.textContent = v.toUpperCase();
  },

  historyMove(dir) {
    if (!this.history.length) return;
    if (this.histIdx === -1 && dir < 0) this.histIdx = this.history.length;
    this.histIdx = Math.min(Math.max(this.histIdx + dir, 0), this.history.length);
    this.setValue(this.history[this.histIdx] ?? '');
    if (this.histIdx === this.history.length) this.histIdx = -1;
  },

  submit() {
    const raw = this.cli.value.trim();
    this.setValue('');
    this.histIdx = -1;
    if (!raw) return;
    this.history.push(raw);
    sfx.enter();
    this.run(raw);
  },

  run(raw) {
    if (state.tab !== 'term' && !this.isNavCommand(raw)) ui.switchTab('term', { silent: true });
    ui.print([{ text: '> ' + raw.toUpperCase(), cls: 'echo' }]);

    const [cmd, ...args] = raw.toUpperCase().split(/\s+/);
    const fn = this.commands[cmd];
    if (fn) {
      fn.call(this, args);
    } else {
      sfx.deny();
      ui.print([
        { text: `COMMAND NOT RECOGNIZED: "${cmd}"`, cls: 'alert' },
        { text: 'TYPE "HELP" FOR AVAILABLE COMMANDS.', cls: 'dim' },
      ]);
    }
  },

  isNavCommand(raw) {
    return /^(stats|links|projects|terminal|term|vault|hack|reboot)\b/i.test(raw.trim());
  },

  commands: {
    HELP() {
      ui.print([
        { text: 'ROBCO TERMLINK — COMMAND REFERENCE', cls: 'bright' },
        ...HELP.map(([c, d]) => ({ text: `  ${c.padEnd(38, ' ')} ${d}`, cls: undefined })),
        { text: ' ' },
      ]);
    },

    STATS()    { ui.switchTab('stats'); },
    LINKS()    { ui.switchTab('links'); },
    PROJECTS() { ui.switchTab('projects'); },
    TERMINAL() { ui.switchTab('term'); },
    TERM()     { ui.switchTab('term'); },
    VAULT()    { ui.switchTab('vault'); },
    HACK()     { ui.startHack(); },

    OPEN(args) {
      const n = parseInt(args[0], 10);
      const link = CONFIG.links[n - 1];
      if (!link) {
        sfx.deny();
        ui.print([{ text: `NO SUCH FREQUENCY. VALID: 1-${CONFIG.links.length}`, cls: 'alert' }]);
        return;
      }
      sfx.open();
      ui.print([{ text: `TUNING ${link.label} → ${link.tail}`, cls: 'dim' }]);
      window.open(link.url, '_blank', 'noopener');
    },

    THEME(args) {
      const name = (args[0] || '').toLowerCase();
      if (!name) {
        ui.print([{ text: 'AVAILABLE: ' + ui.themeList().join(' / ').toUpperCase(), cls: 'dim' }]);
        return;
      }
      if (name === SECRET_THEME && !state.unlocked) {
        sfx.deny();
        ui.print([{ text: 'OVERSEER CLEARANCE REQUIRED. TRY "HACK".', cls: 'alert' }]);
        return;
      }
      if (!ui.themeList().includes(name)) {
        sfx.deny();
        ui.print([{ text: 'UNKNOWN PHOSPHOR. ' + ui.themeList().join(' / ').toUpperCase(), cls: 'alert' }]);
        return;
      }
      ui.setTheme(name);
      sfx.nav();
      ui.print([{ text: `PHOSPHOR RECALIBRATED: ${name.toUpperCase()}`, cls: 'dim' }]);
    },

    SOUND(args) {
      const want = (args[0] || '').toLowerCase();
      if ((want === 'on') !== sfx.enabled || !want) sfx.toggle();
      ui.paintChips(sfx.enabled);
      ui.print([{ text: `AUDIO ${sfx.enabled ? 'ENABLED — all sounds are live-synthesized' : 'DISABLED'}`, cls: 'dim' }]);
    },

    CLEAR()  { ui.termLog.replaceChildren(); },
    WHOAMI() { ui.print([{ text: CONFIG.handle }]); },

    DATE() {
      ui.print([{ text: document.getElementById('clock').textContent + ' (WASTELAND STANDARD TIME)', cls: 'dim' }]);
    },

    MOTD() {
      ui.print([
        { text: 'MESSAGE OF THE DAY:', cls: 'bright' },
        { text: '  "War. War never changes. Browsers, however,', cls: 'dim' },
        { text: '   change constantly. Test accordingly."', cls: 'dim' },
      ]);
    },

    REBOOT() {
      ui.print([{ text: 'POWER CYCLING…', cls: 'dim' }]);
      setTimeout(() => powerOff(document.getElementById('screen'), () => location.reload()), 350);
    },

    SUDO(args) {
      sfx.deny();
      ui.print([
        { text: `${CONFIG.handle} IS NOT IN THE SUDOERS FILE.`, cls: 'alert' },
        { text: 'THIS INCIDENT WILL BE REPORTED TO THE OVERSEER.', cls: 'dim' },
        ...(args[0] === 'HACK' ? [{ text: '(nice try though.)', cls: 'faint' }] : []),
      ]);
    },

    NUKE() {
      const screen = document.getElementById('screen');
      screen.classList.remove('nuked');
      void screen.offsetWidth;
      screen.classList.add('nuked');
      sfx.boom();
      ui.print([
        { text: '☢ LAUNCH SEQUENCE INITIATED…', cls: 'alert' },
        { text: '☢ …ABORTED. MUTUALLY ASSURED DESTRUCTION IS', cls: 'alert' },
        { text: '  DISABLED IN THE BROWSER BUILD.', cls: 'dim' },
      ]);
    },

    DOGMEAT() {
      sfx.granted();
      ui.print([
        ...DOGMEAT.split('\n').map((t) => ({ text: t, cls: 'bright' })),
        { text: 'DOGMEAT HAS JOINED YOUR PARTY.', cls: 'dim' },
      ]);
    },

    EXIT() {
      ui.print([{ text: 'THERE IS NO EXIT. ONLY THE WASTELAND.', cls: 'dim' }]);
    },
  },
};
