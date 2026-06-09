/* ════════════════════════════════════════════════════════════════
   HACK — the classic RobCo password-guessing minigame.
   · 10 candidate words hidden in a hex dump, 4 attempts
   · wrong guesses report "likeness" (matching letters by position)
   · clicking matched bracket pairs in the junk removes a dud
     or resets your attempts
   ════════════════════════════════════════════════════════════════ */

import { el } from './dom.js';
import { sfx } from './audio.js';

const ROWS = 16, COLS = 12, PANELS = 2;
const TOTAL = ROWS * COLS * PANELS;
const WORD_LEN = 6;
const WORD_COUNT = 10;
const JUNK = `!@#$%^&*()_-+=[]{}<>?/\\|;:'".,`;
const OPEN = '([{<', CLOSE = ')]}>';
const PAIR = { '(': ')', '[': ']', '{': '}', '<': '>' };

const POOL = [
  'SCRIPT', 'SHADER', 'KERNEL', 'SOCKET', 'BRANCH', 'COMMIT', 'MEMORY',
  'BUFFER', 'RENDER', 'PIXELS', 'VECTOR', 'MATRIX', 'SERVER', 'CLIENT',
  'PYTHON', 'BINARY', 'CIPHER', 'DAEMON', 'THREAD', 'MODULE', 'OBJECT',
  'STATIC', 'SWITCH', 'RETURN', 'STRING', 'LAMBDA', 'CURSOR', 'ESCAPE',
  'INSERT', 'DELETE', 'UPLOAD', 'SIGNAL', 'PACKET', 'ROUTER', 'ACCESS',
  'LOCKED', 'SECRET', 'HIDDEN', 'FUSION', 'ATOMIC', 'VAULTS', 'WASTES',
];

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

export class HackGame {
  constructor(host, { onWin, onLose }) {
    this.host = host;
    this.onWin = onWin;
    this.onLose = onLose;
    this.tries = 4;
    this.over = false;
    this.kbIdx = -1;
    this.feed = ['ENTER PASSWORD NOW', ''];
    this.#generate();
    this.#render();
  }

  /* ── board generation ──────────────────────────────────────── */
  #generate() {
    const shuffled = [...POOL].sort(() => Math.random() - 0.5);
    const texts = shuffled.slice(0, WORD_COUNT);
    this.passwordIdx = rand(WORD_COUNT);

    this.cells = Array.from({ length: TOTAL }, () => ({ ch: pick(JUNK), w: -1 }));
    this.words = [];

    texts.forEach((text, wi) => {
      // place each word with a 1-char junk margin on both sides
      for (let attempt = 0; attempt < 200; attempt++) {
        const start = rand(TOTAL - WORD_LEN);
        let ok = true;
        for (let i = start - 1; i <= start + WORD_LEN; i++) {
          if (i >= 0 && i < TOTAL && this.cells[i].w !== -1) { ok = false; break; }
        }
        if (!ok) continue;
        for (let i = 0; i < WORD_LEN; i++) {
          this.cells[start + i] = { ch: text[i], w: wi };
        }
        this.words.push({ text, start, dead: false });
        return;
      }
      // extremely unlikely fallback: drop the word
      this.words.push({ text, start: -1, dead: true });
    });

    this.usedBrackets = new Set();
    this.addrBase = 0xC000 + rand(0x2000) & 0xfff0;
  }

  /* ── rendering ─────────────────────────────────────────────── */
  #render() {
    this.host.replaceChildren();

    this.host.append(
      el('div', 'line hack-top dim', 'ROBCO INDUSTRIES (TM) TERMLINK — ENCRYPTED PARTITION'),
      el('div', 'line hack-top dim', '!!! WARNING: LOCKOUT IMMINENT !!!'),
    );
    this.triesEl = el('div', 'line hack-tries');
    this.host.append(this.triesEl);
    this.#paintTries();
    this.host.append(el('div', 'line', ' '));

    const grid = el('div', 'hack-grid');
    this.cellEls = new Array(TOTAL);

    for (let p = 0; p < PANELS; p++) {
      const panel = el('div', 'hack-panel');
      for (let r = 0; r < ROWS; r++) {
        const row = el('span', 'hack-row');
        const base = (p * ROWS + r) * COLS;
        row.append(el('span', 'hack-addr', '0x' + (this.addrBase + base).toString(16).toUpperCase().padStart(4, '0')));
        for (let c = 0; c < COLS; c++) {
          const i = base + c;
          const cell = this.cells[i];
          const span = el('span', 'hack-cell' + (cell.w >= 0 ? ' word' : ''), cell.ch);
          span.dataset.i = i;
          if (cell.w >= 0) span.dataset.w = cell.w;
          this.cellEls[i] = span;
          row.append(span);
        }
        panel.append(row);
      }
      grid.append(panel);
    }

    this.feedEl = el('div', 'hack-feed');
    grid.append(this.feedEl);
    this.host.append(grid);
    this.#paintFeed();

    grid.addEventListener('mouseover', (e) => this.#hover(e.target, true));
    grid.addEventListener('mouseout', (e) => this.#hover(e.target, false));
    grid.addEventListener('click', (e) => this.#click(e.target));
  }

  #paintTries() {
    this.triesEl.replaceChildren(
      document.createTextNode((this.tries > 1 ? 'ATTEMPTS REMAINING: ' : 'LOCKOUT WARNING — ATTEMPTS REMAINING: ')),
      el('span', 'blk', '▎'.repeat(this.tries) || '—'),
    );
    this.triesEl.classList.toggle('alert', this.tries <= 1);
  }

  #paintFeed(preview = '') {
    const lines = this.feed.slice(-13).map((t) => el('div', 'line', t ? '> ' + t : ' '));
    if (preview) lines.push(el('div', 'line bright', '> ' + preview));
    this.feedEl.replaceChildren(...lines);
  }

  #say(...msgs) {
    this.feed.push(...msgs);
    this.#paintFeed();
  }

  /* ── interaction ───────────────────────────────────────────── */
  #wordCells(wi) {
    const w = this.words[wi];
    return this.cellEls.slice(w.start, w.start + WORD_LEN);
  }

  #setHot(wi, on) {
    if (wi < 0 || this.words[wi].dead) return;
    this.#wordCells(wi).forEach((c) => c.classList.toggle('hot', on));
    this.#paintFeed(on ? this.words[wi].text : '');
  }

  #hover(target, on) {
    if (this.over || !target.classList?.contains('hack-cell')) return;
    const wi = target.dataset.w;
    if (wi !== undefined) this.#setHot(+wi, on);
  }

  #click(target) {
    if (this.over || !target.classList?.contains('hack-cell')) return;
    const wi = target.dataset.w;
    if (wi !== undefined) return this.#guess(+wi);
    this.#tryBracket(+target.dataset.i);
  }

  #guess(wi) {
    const word = this.words[wi];
    if (this.over || word.dead) return;

    if (wi === this.passwordIdx) {
      this.over = true;
      sfx.granted();
      this.#say(word.text, 'Exact match!', 'Please wait', 'while system', 'is accessed.');
      setTimeout(() => this.onWin(), 1400);
      return;
    }

    word.dead = true;
    this.#wordCells(wi).forEach((c) => { c.classList.remove('hot'); c.classList.add('dud'); });
    const pw = this.words[this.passwordIdx].text;
    let likeness = 0;
    for (let i = 0; i < WORD_LEN; i++) if (word.text[i] === pw[i]) likeness++;

    this.tries--;
    this.#paintTries();

    if (this.tries <= 0) {
      this.over = true;
      sfx.alarm();
      this.#say(word.text, 'Entry denied.', 'TERMINAL LOCKED');
      setTimeout(() => this.onLose(), 900);
    } else {
      sfx.deny();
      this.#say(word.text, 'Entry denied.', `Likeness=${likeness}`);
    }
  }

  /* Matched bracket pair on one row → remove a dud or reset tries. */
  #tryBracket(i) {
    const open = this.cells[i].ch;
    if (!OPEN.includes(open) || this.usedBrackets.has(i)) return;
    const rowEnd = Math.floor(i / COLS) * COLS + COLS;
    for (let j = i + 1; j < rowEnd; j++) {
      if (this.cells[j].w !== -1) return;             // words break the pair
      if (this.cells[j].ch === PAIR[open]) {
        this.usedBrackets.add(i);
        for (let k = i; k <= j; k++) this.cellEls[k].classList.add('gone');
        sfx.open();
        const duds = this.words
          .map((w, wi) => ({ w, wi }))
          .filter(({ w, wi }) => !w.dead && wi !== this.passwordIdx);
        if (duds.length && Math.random() < 0.75) {
          const { w, wi } = pick(duds);
          w.dead = true;
          this.#wordCells(wi).forEach((c) => {
            c.textContent = '.';
            c.classList.remove('word', 'hot');
            c.classList.add('dud');
          });
          this.#say('Dud removed.');
        } else {
          this.tries = 4;
          this.#paintTries();
          this.#say('Allowance', 'replenished.');
        }
        return;
      }
    }
  }

  /* Arrow keys cycle live words; Enter guesses. Returns true if consumed. */
  handleKey(e) {
    if (this.over) return false;
    const alive = this.words.map((w, i) => (!w.dead ? i : -1)).filter((i) => i >= 0);
    if (!alive.length) return false;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const pos = alive.indexOf(this.kbIdx);
      this.#setHot(this.kbIdx, false);
      this.kbIdx = alive[(pos + dir + alive.length) % alive.length];
      this.#setHot(this.kbIdx, true);
      sfx.nav();
      return true;
    }
    if (e.key === 'Enter' && this.kbIdx >= 0 && !this.words[this.kbIdx].dead) {
      this.#guess(this.kbIdx);
      return true;
    }
    return false;
  }
}
