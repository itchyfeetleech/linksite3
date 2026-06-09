/* ════════════════════════════════════════════════════════════════
   AUDIO — every sound is synthesized live with the Web Audio API.
   No samples, no files. The context is created lazily on the first
   user gesture (browser autoplay policy).
   ════════════════════════════════════════════════════════════════ */

const LS_KEY = 'termlink.sound';

class SFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.humNodes = null;
    this.enabled = localStorage.getItem(LS_KEY) !== 'off';
  }

  /* Create the context inside a user gesture. Safe to call often. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 1 : 0;
    this.master.connect(this.ctx.destination);
    this.#startHum();
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(LS_KEY, this.enabled ? 'on' : 'off');
    if (this.master) {
      this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.02);
    }
    return this.enabled;
  }

  /* Faint mains hum + filtered noise floor: the "tube is warm" bed. */
  #startHum() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.006, t + 2);

    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.004, t + 2);

    osc.connect(oscGain).connect(this.master);
    noise.connect(lp).connect(noiseGain).connect(this.master);
    osc.start();
    noise.start();
    this.humNodes = { osc, noise };
  }

  /* Internal helper: one enveloped oscillator blip. */
  #blip({ type = 'square', f0 = 1200, f1 = f0, dur = 0.05, gain = 0.05, delay = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /* Short bandpassed noise burst — mechanical key click. */
  key() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.015);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + Math.random() * 1200;
    bp.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.value = 0.16;
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
  }

  type()    { this.#blip({ f0: 1900 + Math.random() * 500, dur: 0.012, gain: 0.012 }); }
  enter()   { this.#blip({ f0: 880, f1: 440, dur: 0.07, gain: 0.05 }); }
  nav()     { this.#blip({ f0: 1320, dur: 0.025, gain: 0.03 }); }
  open()    { this.#blip({ f0: 660, f1: 1320, dur: 0.1, gain: 0.05 }); }
  deny()    { this.#blip({ type: 'sawtooth', f0: 160, f1: 90, dur: 0.22, gain: 0.07 }); }

  granted() {
    this.#blip({ f0: 660,  dur: 0.09, gain: 0.06 });
    this.#blip({ f0: 990,  dur: 0.09, gain: 0.06, delay: 0.1 });
    this.#blip({ f0: 1320, dur: 0.16, gain: 0.06, delay: 0.2 });
  }

  alarm() {
    for (let i = 0; i < 3; i++) {
      this.#blip({ type: 'sawtooth', f0: 220, f1: 140, dur: 0.25, gain: 0.07, delay: i * 0.3 });
    }
  }

  boom() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(80, t + 1);
    const g = this.ctx.createGain();
    g.gain.value = 0.25;
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
  }
}

export const sfx = new SFX();
