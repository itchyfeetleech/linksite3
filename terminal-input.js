/* ═══════════════════════════════════════════════════════════════
   TERMINAL INPUT HANDLER
   Manages keyboard and mouse interaction
   ═══════════════════════════════════════════════════════════════ */

class TerminalInput {
  constructor() {
    this.currentScreen = 'main';
    this.selectedIndex = 0;
    this.mousePos = { x: 0, y: 0 };
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };

    this.canvas = document.getElementById('main-canvas');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Mouse/touch events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown(e) {
    const screen = TERMINAL_CONTENT[this.currentScreen];

    switch (e.key) {
      case 'Escape':
        if (this.currentScreen !== 'main') {
          this.navigateTo('main');
          e.preventDefault();
        }
        break;

      case 'ArrowUp':
        if (screen.options) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.onSelectionChange();
        }
        e.preventDefault();
        break;

      case 'ArrowDown':
        if (screen.options) {
          this.selectedIndex = Math.min(screen.options.length - 1, this.selectedIndex + 1);
          this.onSelectionChange();
        }
        e.preventDefault();
        break;

      case 'Enter':
        if (screen.options && screen.options[this.selectedIndex]) {
          this.navigateTo(screen.options[this.selectedIndex].command);
        }
        e.preventDefault();
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        if (screen.options) {
          const option = screen.options.find(opt => opt.key === e.key);
          if (option) {
            this.navigateTo(option.command);
          }
        }
        break;

      case ' ':
        // Space key - used for clearing flow field
        if (this.currentScreen === 'flow' && window.fluidSimulator) {
          window.fluidSimulator.clear();
        }
        e.preventDefault();
        break;

      case 't':
      case 'T':
        // Toggle theme
        this.toggleTheme();
        break;

      case 'r':
      case 'R':
        // Reset (in system screen)
        if (this.currentScreen === 'system') {
          // Reset could reload or reset settings
          console.log('Reset triggered');
        }
        break;
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const newX = (e.clientX - rect.left) / rect.width;
    const newY = (e.clientY - rect.top) / rect.height;

    this.mouseDelta.x = newX - this.mousePos.x;
    this.mouseDelta.y = newY - this.mousePos.y;
    this.mousePos.x = newX;
    this.mousePos.y = newY;

    // Update flow simulator if active
    if (this.currentScreen === 'flow' && window.fluidSimulator && this.mouseDown) {
      window.fluidSimulator.addForce(this.mousePos.x, this.mousePos.y, this.mouseDelta.x, this.mouseDelta.y);
    }

    this.onMouseMove();
  }

  handleMouseDown(e) {
    this.mouseDown = true;
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = (e.clientX - rect.left) / rect.width;
    this.mousePos.y = (e.clientY - rect.top) / rect.height;

    this.onMouseDown();
  }

  handleMouseUp(e) {
    this.mouseDown = false;
    this.onMouseUp();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Check if clicking on a link or menu item
    this.checkClickTarget(x, y);

    // Trigger particle burst
    if (window.particleSystem) {
      window.particleSystem.emit(x, y, 1000);
    }

    // Add vortex in flow field
    if (this.currentScreen === 'flow' && window.fluidSimulator) {
      window.fluidSimulator.addVortex(x, y);
    }

    this.onClick();
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = (touch.clientX - rect.left) / rect.width;
    this.mousePos.y = (touch.clientY - rect.top) / rect.height;
    this.mouseDown = true;
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const newX = (touch.clientX - rect.left) / rect.width;
    const newY = (touch.clientY - rect.top) / rect.height;

    this.mouseDelta.x = newX - this.mousePos.x;
    this.mouseDelta.y = newY - this.mousePos.y;
    this.mousePos.x = newX;
    this.mousePos.y = newY;

    if (this.currentScreen === 'flow' && window.fluidSimulator) {
      window.fluidSimulator.addForce(this.mousePos.x, this.mousePos.y, this.mouseDelta.x, this.mouseDelta.y);
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.mouseDown = false;
  }

  checkClickTarget(x, y) {
    const screen = TERMINAL_CONTENT[this.currentScreen];

    // Simple grid-based hit detection (this will be refined with actual text rendering)
    // For now, just handle menu clicks in main screen
    if (screen.options) {
      const optionHeight = 0.05; // Approximate height per option
      const startY = 0.45; // Approximate start of menu

      const index = Math.floor((y - startY) / optionHeight);
      if (index >= 0 && index < screen.options.length) {
        this.navigateTo(screen.options[index].command);
      }
    }

    // Handle link clicks
    if (screen.links) {
      // This will be properly implemented with actual text bounds
      screen.links.forEach((link, i) => {
        // Placeholder - will be replaced with actual hit detection
        const linkY = 0.15 + i * 0.04;
        if (Math.abs(y - linkY) < 0.02) {
          window.open(link.url, '_blank');
        }
      });
    }
  }

  navigateTo(screenName) {
    if (TERMINAL_CONTENT[screenName]) {
      this.currentScreen = screenName;
      this.selectedIndex = 0;

      // Dispatch navigation event
      window.dispatchEvent(new CustomEvent('screen-change', {
        detail: { screen: screenName }
      }));

      console.log('Navigated to:', screenName);
    }
  }

  toggleTheme() {
    const body = document.body;
    const currentTheme = body.dataset.theme;
    const newTheme = currentTheme === 'green' ? 'amber' : 'green';
    body.dataset.theme = newTheme;

    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { theme: newTheme }
    }));

    localStorage.setItem('theme', newTheme);
  }

  // Callbacks that can be overridden by renderer
  onSelectionChange() {
    window.dispatchEvent(new CustomEvent('selection-change', {
      detail: { index: this.selectedIndex }
    }));
  }

  onMouseMove() {
    window.dispatchEvent(new CustomEvent('mouse-move', {
      detail: { x: this.mousePos.x, y: this.mousePos.y }
    }));
  }

  onMouseDown() {
    window.dispatchEvent(new CustomEvent('mouse-down', {
      detail: { x: this.mousePos.x, y: this.mousePos.y }
    }));
  }

  onMouseUp() {
    window.dispatchEvent(new CustomEvent('mouse-up', {
      detail: { x: this.mousePos.x, y: this.mousePos.y }
    }));
  }

  onClick() {
    window.dispatchEvent(new CustomEvent('mouse-click', {
      detail: { x: this.mousePos.x, y: this.mousePos.y }
    }));
  }

  getCurrentScreen() {
    return this.currentScreen;
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  getMousePos() {
    return this.mousePos;
  }

  getMouseDelta() {
    return this.mouseDelta;
  }

  isMouseDown() {
    return this.mouseDown;
  }
}

// Initialize on DOM ready
window.terminalInput = null;
document.addEventListener('DOMContentLoaded', () => {
  window.terminalInput = new TerminalInput();

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'green';
  document.body.dataset.theme = savedTheme;
});
