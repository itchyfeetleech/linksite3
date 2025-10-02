/* ═══════════════════════════════════════════════════════════════
   MAIN - Integration & Render Loop
   ═══════════════════════════════════════════════════════════════ */

class TerminalOS {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.bootOverlay = document.getElementById('boot-overlay');
    this.noWebGL = document.getElementById('no-webgl');

    this.renderer = null;
    this.particleSystem = null;
    this.fluidSimulator = null;
    this.raymarcher = null;
    this.crtShader = null;

    this.isBooted = false;
    this.lastTime = performance.now();

    this.init();
  }

  async init() {
    console.log('[Terminal OS] Initializing...');

    // Wait for boot sequence to complete
    window.addEventListener('boot-complete', () => {
      this.onBootComplete();
    });

    // Initialize systems (placeholders for now)
    this.renderer = new TerminalRenderer(this.canvas);
    this.particleSystem = new ParticleSystem();
    this.fluidSimulator = new FluidSimulator();
    this.raymarcher = new Raymarcher();

    // Make systems globally accessible
    window.particleSystem = this.particleSystem;
    window.fluidSimulator = this.fluidSimulator;
    window.raymarcher = this.raymarcher;

    // Listen for screen changes
    window.addEventListener('screen-change', (e) => {
      this.onScreenChange(e.detail.screen);
    });

    console.log('[Terminal OS] Systems initialized');
  }

  onBootComplete() {
    this.isBooted = true;
    console.log('[Terminal OS] Boot complete, starting render loop');

    // Start render loop
    this.startRenderLoop();
  }

  onScreenChange(screen) {
    console.log('[Terminal OS] Screen changed to:', screen);

    // Activate/deactivate systems based on screen
    this.fluidSimulator.setActive(screen === 'flow');
    this.raymarcher.setActive(screen === 'main'); // Logo on main screen

    // Trigger particle burst on navigation
    if (this.particleSystem) {
      this.particleSystem.emit(0.5, 0.5, 200);
    }
  }

  startRenderLoop() {
    const render = (currentTime) => {
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.update(deltaTime);
      this.render();

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  update(deltaTime) {
    // Update all systems
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    if (this.fluidSimulator) {
      this.fluidSimulator.update(deltaTime);
    }

    if (this.raymarcher) {
      this.raymarcher.update(deltaTime);
    }
  }

  render() {
    if (!this.isBooted || !this.renderer) return;

    const currentScreen = window.terminalInput?.getCurrentScreen() || 'main';
    const selectedIndex = window.terminalInput?.getSelectedIndex() || 0;

    // Clear and render terminal
    this.renderer.render(currentScreen, selectedIndex);

    // Get theme colors
    const theme = document.body.dataset.theme || 'green';
    const colors = {
      green: {
        primary: '#00ff41',
        dim: '#00aa2e',
        bright: '#66ff88',
        glow: 'rgba(0, 255, 65, 0.6)'
      },
      amber: {
        primary: '#ffb000',
        dim: '#cc8c00',
        bright: '#ffd966',
        glow: 'rgba(255, 176, 0, 0.6)'
      }
    };

    const color = colors[theme];

    // Render systems on top
    const ctx = this.renderer.ctx;
    const width = this.renderer.width;
    const height = this.renderer.height;

    // Render fluid simulator
    if (this.fluidSimulator) {
      this.fluidSimulator.render(ctx, width, height, color);
    }

    // Render raymarcher
    if (this.raymarcher) {
      this.raymarcher.render(ctx, width, height, color);
    }

    // Render particles
    if (this.particleSystem) {
      this.particleSystem.render(ctx, width, height, color);
    }
  }
}

// Initialize Terminal OS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Main] DOM ready, creating Terminal OS');

  // Check if required classes exist
  if (typeof TerminalRenderer === 'undefined') {
    console.error('[Main] TerminalRenderer not loaded!');
    document.getElementById('no-webgl').hidden = false;
    document.getElementById('no-webgl').querySelector('h1').textContent = '[ SYSTEM ERROR ]';
    document.getElementById('no-webgl').querySelector('p').textContent = 'Failed to load terminal renderer';
    return;
  }

  if (typeof ParticleSystem === 'undefined') {
    console.error('[Main] ParticleSystem not loaded!');
    return;
  }

  if (typeof TERMINAL_CONTENT === 'undefined') {
    console.error('[Main] TERMINAL_CONTENT not loaded!');
    return;
  }

  console.log('[Main] All systems loaded, initializing...');
  window.terminalOS = new TerminalOS();
});
