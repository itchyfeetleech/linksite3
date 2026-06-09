/* ════════════════════════════════════════════════════════════════
   UI — tabs, page renderers, keyboard row navigation, themes,
   the vault unlock flow, footer chips and the clock.
   ════════════════════════════════════════════════════════════════ */

import { CONFIG, THEMES, SECRET_THEME } from './config.js';
import { el, revealLines } from './dom.js';
import { sfx } from './audio.js';
import { HackGame } from './hack.js';

const LS_THEME = 'termlink.theme';
const LS_VAULT = 'termlink.vault';

export const state = {
  tab: 'stats',
  mode: 'pages',          // 'pages' | 'hack' | 'lockout'
  unlocked: localStorage.getItem(LS_VAULT) === 'open',
  hack: null,
  navIdx: -1,
};

const TABS = [
  { id: 'stats',    label: 'STATS' },
  { id: 'links',    label: 'LINKS' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'term',     label: 'TERMINAL' },
  { id: 'vault',    label: '▒▒▒▒▒' },
];

export const ui = {
  els: {},
  termLog: null,   // persistent scrollback, re-attached on every TERM visit

  init() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      page: $('page'), tabs: $('tabs'), clock: $('clock'),
      hdrFile: $('hdr-file'), chipSound: $('chip-sound'),
      chipTheme: $('chip-theme'), screen: $('screen'),
    };

    this.els.hdrFile.textContent =
      `PERSONNEL FILE // "${CONFIG.name}" — AUTHORIZED PERSONNEL ONLY`;

    this.termLog = el('div');
    this.termLog.id = 'term-log';
    this.termLog.setAttribute('aria-live', 'polite');

    // tabs
    TABS.forEach((t, i) => {
      const b = el('button', 'tab', `[${i + 1}] ${this.tabLabel(t)}`);
      b.dataset.tab = t.id;
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { sfx.unlock(); this.switchTab(t.id); });
      this.els.tabs.append(b);
    });

    // footer chips
    this.els.chipSound.addEventListener('click', () => {
      sfx.unlock();
      this.paintChips(sfx.toggle());
      sfx.nav();
    });
    this.els.chipTheme.addEventListener('click', () => {
      sfx.unlock(); sfx.nav();
      this.cycleTheme();
    });

    this.setTheme(localStorage.getItem(LS_THEME) || 'green', false);
    this.paintChips(sfx.enabled);
    this.refreshTabs();
    this.startClock();
    this.switchTab('stats', { silent: true });
  },

  tabLabel(t) {
    return t.id === 'vault' ? (state.unlocked ? 'VAULT' : '▒▒▒▒▒') : t.label;
  },

  /* ── themes ────────────────────────────────────────────────── */
  themeList() { return state.unlocked ? [...THEMES, SECRET_THEME] : [...THEMES]; },

  setTheme(name, save = true) {
    if (!this.themeList().includes(name)) name = 'green';
    document.body.dataset.theme = name;
    if (save) localStorage.setItem(LS_THEME, name);
    this.paintChips(sfx.enabled);
  },

  cycleTheme() {
    const list = this.themeList();
    const cur = document.body.dataset.theme;
    this.setTheme(list[(list.indexOf(cur) + 1) % list.length]);
  },

  paintChips(soundOn) {
    this.els.chipSound.textContent = `SND ${soundOn ? 'ON' : 'OFF'}`;
    this.els.chipTheme.textContent = `THM ${document.body.dataset.theme.toUpperCase()}`;
  },

  /* ── clock (the wasteland runs 51 years ahead) ─────────────── */
  startClock() {
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      this.els.clock.textContent =
        `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${d.getFullYear() + 51} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  },

  /* ── tab switching ─────────────────────────────────────────── */
  switchTab(id, { silent = false } = {}) {
    if (state.mode === 'lockout') return;
    if (id === 'vault' && !state.unlocked) return this.startHack();

    state.mode = 'pages';
    state.hack = null;
    state.tab = id;
    state.navIdx = -1;
    if (!silent) sfx.nav();

    for (const b of this.els.tabs.children) {
      b.setAttribute('aria-selected', b.dataset.tab === id ? 'true' : 'false');
    }

    const page = this.els.page;
    page.replaceChildren();
    ({
      stats:    () => this.renderStats(page),
      links:    () => this.renderLinks(page),
      projects: () => this.renderProjects(page),
      term:     () => this.renderTerm(page),
      vault:    () => this.renderVault(page),
    })[id]();
    page.scrollTop = 0;
  },

  refreshTabs() {
    [...this.els.tabs.children].forEach((b, i) => {
      b.textContent = `[${i + 1}] ${this.tabLabel(TABS[i])}`;
      b.classList.toggle('locked', TABS[i].id === 'vault' && !state.unlocked);
    });
  },

  /* ── pages ─────────────────────────────────────────────────── */
  renderStats(page) {
    const specs = [
      { text: `NAME ....... ${CONFIG.name}` },
      { text: `ROLE ....... ${CONFIG.role}` },
      { text: `LOC ........ ${CONFIG.location}` },
      { text: ' ' },
      ...CONFIG.blurb.map((t) => ({ text: t, cls: 'dim' })),
      { text: ' ' },
      { text: '── S.P.E.C.I.A.L. ──────────────────────', cls: 'bright' },
    ];
    const start = specs.length;
    const nodes = revealLines(page, specs);

    const barSpecs = CONFIG.special.map((s) => {
      const node = el('div');
      node.append(
        document.createTextNode(`${s.k}  ${s.label.padEnd(11, ' ')} `),
        el('span', 'bar-fill', '█'.repeat(s.value)),
        el('span', 'bar-rest', '░'.repeat(10 - s.value)),
        document.createTextNode(`  ${String(s.value).padStart(2, ' ')}  `),
        el('span', 'dim', s.note),
      );
      return { node };
    });
    revealLines(page, barSpecs, start);
    revealLines(page, [
      { text: ' ' },
      { text: 'RADS ▂▂▁▁▁  ·  HUNGER OK  ·  CAFFEINE LOW', cls: 'faint' },
    ], start + barSpecs.length);
    return nodes;
  },

  renderLinks(page) {
    revealLines(page, [
      { text: 'REGISTERED FREQUENCIES — CLICK OR [↑↓ + ENTER] TO TUNE', cls: 'dim' },
      { text: ' ' },
    ]);
    const rows = CONFIG.links.map((l, i) => {
      const a = el('a', 'row nav-item');
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(
        document.createTextNode(`[${String(i + 1).padStart(2, '0')}] ${l.label.padEnd(9, ' ')} `),
        el('span', 'tail', '·'.repeat(Math.max(3, 16 - l.label.length)) + ' ' + l.tail),
      );
      a.addEventListener('click', () => sfx.open());
      return { node: a };
    });
    revealLines(page, rows, 2);
    revealLines(page, [
      { text: ' ' },
      { text: 'TIP: "OPEN <N>" FROM THE PROMPT WORKS TOO.', cls: 'faint' },
    ], 2 + rows.length);
  },

  renderProjects(page) {
    revealLines(page, [
      { text: 'FIELD NOTES — SELECTED WORK', cls: 'dim' },
      { text: ' ' },
    ]);
    let i = 2;
    CONFIG.projects.forEach((p, n) => {
      const a = el('a', 'row nav-item');
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(
        document.createTextNode(`[${String(n + 1).padStart(2, '0')}] ${p.name} `),
        el('span', 'tail', '↗'),
      );
      a.addEventListener('click', () => sfx.open());
      revealLines(page, [
        { node: a },
        { text: `     ${p.desc}`, cls: 'dim' },
        { text: `     ${p.tech}`, cls: 'faint' },
        { text: ' ' },
      ], i);
      i += 4;
    });
  },

  renderTerm(page) {
    page.append(this.termLog);
    if (!this.termLog.childElementCount) {
      this.print([
        { text: `TERMLINK READY. TYPE "HELP" FOR COMMANDS.`, cls: 'dim' },
      ]);
    }
    page.scrollTop = page.scrollHeight;
  },

  renderVault(page) {
    revealLines(page, [
      { text: '██ VAULT — ENCRYPTED PARTITION ██', cls: 'bright' },
      { text: ' ' },
      ...CONFIG.vault.map((t) => ({ text: t, cls: t.startsWith('OVERSEER') ? 'alert' : undefined })),
    ]);
  },

  /* terminal scrollback */
  print(specs) {
    for (const s of specs) {
      this.termLog.append(el('div', 'line' + (s.cls ? ' ' + s.cls : ''), s.text ?? ''));
    }
    if (state.tab === 'term') this.els.page.scrollTop = this.els.page.scrollHeight;
  },

  /* ── row navigation (links / projects) ─────────────────────── */
  navItems() { return [...this.els.page.querySelectorAll('.nav-item')]; },

  nav(dir) {
    const items = this.navItems();
    if (!items.length) return false;
    items[state.navIdx]?.classList.remove('sel');
    state.navIdx = (state.navIdx + dir + items.length) % items.length;
    const it = items[state.navIdx];
    it.classList.add('sel');
    it.scrollIntoView({ block: 'nearest' });
    sfx.nav();
    return true;
  },

  activateNav() {
    const it = this.navItems()[state.navIdx];
    if (it) { it.click(); return true; }
    return false;
  },

  /* ── hack / vault flow ─────────────────────────────────────── */
  startHack() {
    if (state.unlocked) return this.switchTab('vault');
    state.mode = 'hack';
    state.tab = 'vault';
    for (const b of this.els.tabs.children) {
      b.setAttribute('aria-selected', b.dataset.tab === 'vault' ? 'true' : 'false');
    }
    this.els.page.replaceChildren();
    state.hack = new HackGame(this.els.page, {
      onWin: () => this.unlockVault(),
      onLose: () => this.lockout(),
    });
    this.els.page.scrollTop = 0;
  },

  unlockVault() {
    state.unlocked = true;
    localStorage.setItem(LS_VAULT, 'open');
    state.mode = 'pages';
    state.hack = null;
    this.refreshTabs();
    this.switchTab('vault', { silent: true });
  },

  lockout() {
    state.mode = 'lockout';
    state.hack = null;
    const page = this.els.page;
    page.replaceChildren();
    const box = el('div', 'hack-lock');
    box.append(
      el('div', 'line alert', 'TERMINAL LOCKED'),
      el('div', 'line', ' '),
      el('div', 'line dim', 'PLEASE CONTACT AN ADMINISTRATOR'),
    );
    const timer = el('div', 'line dim', '');
    box.append(el('div', 'line', ' '), timer);
    page.append(box);

    let left = 15;
    const iv = setInterval(() => {
      timer.textContent = `SYSTEM RESET IN ${left}s`;
      if (left-- <= 0) {
        clearInterval(iv);
        state.mode = 'pages';
        this.switchTab('stats', { silent: true });
      }
    }, 1000);
  },
};
