/* ═══════════════════════════════════════════════════════════════
   TERMINAL RENDERER - Canvas 2D Version (WebGL text coming soon)
   For now using Canvas 2D for quick implementation
   ═══════════════════════════════════════════════════════════════ */

class TerminalRenderer {
  constructor(canvas) {
    console.log('[Renderer] Initializing with canvas:', canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    console.log('[Renderer] Got 2D context:', this.ctx ? 'YES' : 'NO');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.fontSize = 16;
    this.lineHeight = 24;
    this.charWidth = 9.6; // Monospace char width

    this.theme = document.body.dataset.theme || 'green';
    this.colors = {
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

    this.cursorBlink = 0;
    this.time = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Listen for theme changes
    window.addEventListener('theme-change', (e) => {
      this.theme = e.detail.theme;
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);

    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  render(currentScreen, selectedIndex) {
    if (!this.ctx) {
      console.error('[Renderer] No context in render!');
      return;
    }

    this.time += 0.016;
    this.cursorBlink = Math.sin(this.time * 3) > 0 ? 1 : 0;

    const color = this.colors[this.theme];

    // Clear
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Setup text rendering
    this.ctx.font = `${this.fontSize}px 'IBM Plex Mono', monospace`;
    this.ctx.textBaseline = 'top';

    const screen = TERMINAL_CONTENT[currentScreen];
    if (!screen) return;

    // Render lines
    const startY = 40;
    screen.lines.forEach((line, i) => {
      const y = startY + i * this.lineHeight;

      // Check if this is a selected menu item
      let isSelected = false;
      if (screen.options && screen.options[selectedIndex]) {
        const option = screen.options[selectedIndex];
        if (line.includes(`[${option.key}]`)) {
          isSelected = true;
        }
      }

      // Render line with glow effect
      if (isSelected) {
        // Selected item glows
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = color.glow;
        this.ctx.fillStyle = color.bright;
      } else if (line.includes('┌') || line.includes('└') || line.includes('│')) {
        // Box drawing characters
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = color.glow;
        this.ctx.fillStyle = color.primary;
      } else if (line.includes('>') || line.includes('[') || line.includes('●')) {
        // Indicators
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color.glow;
        this.ctx.fillStyle = color.primary;
      } else {
        // Normal text
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = color.glow;
        this.ctx.fillStyle = color.dim;
      }

      this.ctx.fillText(line, 40, y);

      // Reset shadow
      this.ctx.shadowBlur = 0;

      // Render cursor on last line if it has underscore
      if (line.includes('_') && this.cursorBlink) {
        const cursorX = 40 + line.indexOf('_') * this.charWidth;
        this.ctx.fillStyle = color.bright;
        this.ctx.fillRect(cursorX, y, this.charWidth, this.lineHeight - 4);
      }
    });

    // Render link hover indicators
    if (screen.links && window.terminalInput) {
      const mousePos = window.terminalInput.getMousePos();
      screen.links.forEach(link => {
        const y = startY + link.line * this.lineHeight;
        const linkY = y / this.height;

        if (Math.abs(mousePos.y - linkY) < 0.02) {
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = color.glow;
          this.ctx.fillStyle = color.bright;
          const linkX = 40 + screen.lines[link.line].indexOf(link.text) * this.charWidth;
          this.ctx.fillRect(linkX - 5, y - 2, link.text.length * this.charWidth + 10, this.lineHeight);
        }
      });
    }

    // Status bar at bottom
    this.renderStatusBar(color);
  }

  renderStatusBar(color) {
    const barHeight = 30;
    const y = this.height - barHeight;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, y, this.width, barHeight);

    this.ctx.fillStyle = color.primary;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = color.glow;
    this.ctx.font = `12px 'IBM Plex Mono', monospace`;

    // System stats
    const time = new Date().toLocaleTimeString();
    const fps = Math.round(1 / 0.016);
    const screen = window.terminalInput?.getCurrentScreen() || 'main';

    this.ctx.fillText(`[SCREEN: ${screen.toUpperCase()}]`, 20, y + 8);
    this.ctx.fillText(`[FPS: ${fps}]`, this.width - 200, y + 8);
    this.ctx.fillText(`[${this.theme.toUpperCase()}]`, this.width - 100, y + 8);
    this.ctx.fillText(`[${time}]`, this.width - 300, y + 8);

    this.ctx.shadowBlur = 0;
  }
}

window.TerminalRenderer = TerminalRenderer;
