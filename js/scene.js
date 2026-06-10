/* ════════════════════════════════════════════════════════════════
   SCENE — the desk + CRT shell around the terminal.

   The room is drawn on a fixed 2400×1500 design canvas (#scene)
   and the "camera" is a single translate+scale transform:
     · DESK view  — frame the whole desk, monitor as focal point
     · FOCUS view — dolly in until the glass fills the viewport
   A parallax tilt (#tilt) adds gentle depth in desk view.

   "Plain" mode drops the scenery and stretches the screen over the
   viewport — used for the FX OFF toggle and for FOCUS view on
   small screens (where a 4:3 tube wastes too much space).
   ════════════════════════════════════════════════════════════════ */

import { sfx } from './audio.js';
import { REDUCED_MOTION, powerOn, powerOff } from './fx.js';

const LS_VIEW = 'termlink.view';
const LS_FX = 'termlink.fx';

/* design-canvas geometry (must match styles.css) */
const SCENE_W = 2400, SCENE_H = 1500;
const GLASS = { x: 580, y: 158, w: 1240, h: 930 };          // #screen rect
const FOCUS_DESK = { x: SCENE_W / 2, y: 750 };
const FOCUS_ZOOM = { x: GLASS.x + GLASS.w / 2, y: GLASS.y + GLASS.h / 2 };
const MOBILE = '(max-width: 720px)';

export const scene = {
  view: 'desk',
  fxOn: true,
  powered: true,    // false while the power button is mid-cycle
  cycling: false,

  init() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      tilt: $('tilt'), scene: $('scene'), screen: $('screen'),
      chipView: $('chip-view'), chipFx: $('chip-fx'), power: $('power'),
    };

    this.view = localStorage.getItem(LS_VIEW) === 'zoom' ? 'zoom' : 'desk';
    this.fxOn = localStorage.getItem(LS_FX) !== 'off';

    this.els.chipView.addEventListener('click', () => {
      sfx.unlock(); sfx.nav();
      this.toggleView();
    });
    this.els.chipFx.addEventListener('click', () => {
      sfx.unlock(); sfx.nav();
      this.setFx(!this.fxOn);
    });
    this.els.power.addEventListener('click', () => {
      sfx.unlock();
      this.powerCycle();
    });

    // clicking the glass: interactive bits behave normally; dead glass
    // dollies the camera in and parks focus in the prompt
    this.els.screen.addEventListener('click', (e) => {
      if (!this.powered) return;
      if (document.getElementById('ui').hidden) return;   // boot-skip taps shouldn't dolly
      if (this.view !== 'desk' || this.plain()) return;
      if (e.target.closest('a, button, input, .hack-cell.word')) return;
      this.setView('zoom');
      document.getElementById('cli')?.focus({ preventScroll: true });
    });

    window.addEventListener('resize', () => this.layout());
    this.initParallax();

    this.apply(false);
    document.body.classList.add('booted');
  },

  isMobile() { return window.matchMedia(MOBILE).matches; },

  /* plain = no scenery, screen stretched over the viewport */
  plain() { return !this.fxOn || (this.view === 'zoom' && this.isMobile()); },

  apply(animate = true) {
    const body = document.body;
    if (!animate || REDUCED_MOTION) {
      this.els.scene.classList.add('no-anim');
      requestAnimationFrame(() => this.els.scene.classList.remove('no-anim'));
    }
    body.classList.toggle('plain', this.plain());
    body.classList.toggle('fx-off', !this.fxOn);
    this.layout();
    this.els.chipView.textContent = `VIEW ${this.view === 'zoom' ? 'FOCUS' : 'DESK'}`;
    this.els.chipFx.textContent = `FX ${this.fxOn ? 'ON' : 'OFF'}`;
  },

  /* the camera: map a focus point in canvas space to viewport center */
  layout() {
    const s = this.els.scene;
    if (this.plain()) {
      s.style.transform = '';
      s.style.transformOrigin = '';
      return;
    }
    const vw = window.innerWidth, vh = window.innerHeight;
    let k, f;
    if (this.view === 'zoom') {
      f = FOCUS_ZOOM;
      k = Math.min(vw / GLASS.w, vh / GLASS.h) * 1.03;
    } else {
      f = FOCUS_DESK;
      k = this.isMobile()
        ? Math.min(vw / 1600, vh / SCENE_H)   // crop in on the monitor
        : Math.min(vw / SCENE_W, vh / SCENE_H);
    }
    s.style.transformOrigin = `${f.x}px ${f.y}px`;
    s.style.transform =
      `translate(${SCENE_W / 2 - f.x}px, ${SCENE_H / 2 - f.y}px) scale(${k})`;
  },

  setView(v, save = true) {
    if (this.view === v) return;
    this.view = v;
    if (save) localStorage.setItem(LS_VIEW, v);
    this.resetTilt?.();
    // mobile zoom switches layout mode entirely — don't animate across it
    this.apply(!this.isMobile());
  },

  toggleView() { this.setView(this.view === 'desk' ? 'zoom' : 'desk'); },

  setFx(on) {
    this.fxOn = on;
    localStorage.setItem(LS_FX, on ? 'on' : 'off');
    this.apply(false);
  },

  /* ── power ─────────────────────────────────────────────────── */

  /* first-load sequence: click on → tube collapse-in → degauss.
     Resolves fast, and any key/click skips the padding. */
  powerUp() {
    return new Promise((resolve) => {
      const body = document.body;
      const screen = this.els.screen;
      const go = () => {
        body.classList.remove('cold');
        powerOn(screen);
        this.degauss();
        resolve();
      };
      if (REDUCED_MOTION) return go();
      let t = setTimeout(go, 380);
      const skip = () => { clearTimeout(t); go(); };
      window.addEventListener('keydown', skip, { once: true });
      window.addEventListener('pointerdown', skip, { once: true });
    });
  },

  degauss() {
    if (REDUCED_MOTION) return;
    const screen = this.els.screen;
    screen.classList.remove('degauss');
    void screen.offsetWidth;
    screen.classList.add('degauss');
    setTimeout(() => screen.classList.remove('degauss'), 800);
  },

  /* the physical power button: picture collapses, room goes dark,
     then the tube warms back up */
  powerCycle() {
    if (this.cycling || !this.powered) return;
    this.cycling = true;
    this.powered = false;
    const body = document.body;
    body.classList.add('dark');
    powerOff(this.els.screen, () => {
      setTimeout(() => {
        body.classList.remove('dark');
        powerOn(this.els.screen);
        this.degauss();
        this.powered = true;
        this.cycling = false;
      }, REDUCED_MOTION ? 250 : 950);
    });
  },

  /* ── parallax (desk view only) ─────────────────────────────── */
  initParallax() {
    if (REDUCED_MOTION) return;
    const tilt = this.els.tilt;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    const step = () => {
      raf = null;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      tilt.style.transform = `rotateX(${cy.toFixed(3)}deg) rotateY(${cx.toFixed(3)}deg)`;
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
        raf = requestAnimationFrame(step);
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const active = () => this.view === 'desk' && !this.plain();

    window.addEventListener('pointermove', (e) => {
      if (!active()) { tx = ty = 0; kick(); return; }
      tx = (e.clientX / window.innerWidth - 0.5) * 2.4;
      ty = (0.5 - e.clientY / window.innerHeight) * 1.6;
      kick();
    }, { passive: true });

    // device tilt where the platform exposes it without a permission dance
    window.addEventListener('deviceorientation', (e) => {
      if (!active() || e.gamma == null) return;
      tx = Math.max(-2.4, Math.min(2.4, e.gamma / 14));
      ty = Math.max(-1.6, Math.min(1.6, (45 - e.beta) / 24));
      kick();
    }, { passive: true });

    this.resetTilt = () => { tx = ty = 0; kick(); };
  },
};
