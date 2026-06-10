/* ════════════════════════════════════════════════════════════════
   FX — animated static, random screen jolts, power transitions.
   ════════════════════════════════════════════════════════════════ */

export const REDUCED_MOTION =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Paint white noise into the small overlay canvas (~24 fps). */
export function startNoise(canvas) {
  if (REDUCED_MOTION) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const { width: w, height: h } = canvas;
  const img = ctx.createImageData(w, h);
  const px = img.data;
  let last = 0;

  function frame(t) {
    if (t - last > 42 && !document.hidden) {
      last = t;
      for (let i = 0; i < px.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        px[i] = px[i + 1] = px[i + 2] = v;
        px[i + 3] = 28;
      }
      ctx.putImageData(img, 0, 0);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* Occasionally jolt the phosphor layer sideways, like a sync hiccup. */
export function startJolts(phosphor) {
  if (REDUCED_MOTION) return;
  (function schedule() {
    setTimeout(() => {
      phosphor.classList.remove('jolt');
      void phosphor.offsetWidth; // restart the animation
      phosphor.classList.add('jolt');
      schedule();
    }, 6000 + Math.random() * 12000);
  })();
}

export function powerOn(screen) {
  screen.classList.remove('off');
  screen.classList.add('on');
}

/* Collapse the picture to a dot, then run the callback. */
export function powerOff(screen, done) {
  screen.classList.remove('on');
  screen.classList.add('off');
  setTimeout(done, REDUCED_MOTION ? 0 : 450);
}
