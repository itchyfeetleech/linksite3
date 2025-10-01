/* ═══════════════════════════════════════════════════════════════
   WINDOW MANAGER
   ═══════════════════════════════════════════════════════════════ */

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.focusedWindow = null;
    this.zIndexCounter = 1000;
    this.desktop = document.getElementById('desktop');
    this.taskbarWindows = document.querySelector('.taskbar-windows');

    this.initializeWindows();
    this.setupEventListeners();
  }

  initializeWindows() {
    // Create default windows
    this.createWindow('console', {
      title: 'Analog Console',
      icon: '📟',
      x: 50,
      y: 50,
      width: 600,
      height: 400,
      content: this.generateConsoleContent(),
      showInStart: true
    });

    this.createWindow('links', {
      title: 'Links',
      icon: '🔗',
      x: 100,
      y: 100,
      width: 700,
      height: 500,
      content: this.generateLinksContent(),
      showInStart: true
    });

    this.createWindow('status', {
      title: 'Status Monitor',
      icon: '📊',
      x: 150,
      y: 150,
      width: 500,
      height: 450,
      content: this.generateStatusContent(),
      showInStart: true
    });

    // Load persisted state
    this.loadState();
  }

  createWindow(id, config) {
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    windowEl.id = `window-${id}`;
    windowEl.tabIndex = 0;
    windowEl.setAttribute('role', 'dialog');
    windowEl.setAttribute('aria-labelledby', `window-title-${id}`);

    // Set initial position and size
    windowEl.style.left = `${config.x}px`;
    windowEl.style.top = `${config.y}px`;
    windowEl.style.width = `${config.width}px`;
    windowEl.style.height = `${config.height}px`;

    // Create window structure
    windowEl.innerHTML = `
      <div class="resize-handle resize-n"></div>
      <div class="resize-handle resize-s"></div>
      <div class="resize-handle resize-e"></div>
      <div class="resize-handle resize-w"></div>
      <div class="resize-handle resize-ne"></div>
      <div class="resize-handle resize-nw"></div>
      <div class="resize-handle resize-se"></div>
      <div class="resize-handle resize-sw"></div>

      <div class="window-header">
        <span class="window-title" id="window-title-${id}">${config.title}</span>
        <div class="window-controls">
          <button class="window-btn window-btn-minimize" aria-label="Minimize" title="Minimize">_</button>
          <button class="window-btn window-btn-maximize" aria-label="Maximize" title="Maximize">□</button>
          <button class="window-btn window-btn-close" aria-label="Close" title="Close">×</button>
        </div>
      </div>

      <div class="window-body">${config.content}</div>
    `;

    this.desktop.appendChild(windowEl);

    // Store window data
    this.windows.set(id, {
      id,
      element: windowEl,
      config,
      state: {
        x: config.x,
        y: config.y,
        width: config.width,
        height: config.height,
        maximized: false,
        minimized: false,
        closed: false
      }
    });

    // Setup window interactions
    this.setupWindowDrag(id);
    this.setupWindowResize(id);
    this.setupWindowButtons(id);
    this.setupWindowFocus(id);
    this.setupWindowKeyboard(id);

    // Create taskbar indicator
    this.createTaskbarIndicator(id, config);

    // Clamp to viewport
    this.clampToViewport(id);

    return id;
  }

  setupWindowDrag(id) {
    const window = this.windows.get(id);
    const header = window.element.querySelector('.window-header');

    let isDragging = false;
    let startX, startY, initialX, initialY;

    const onMouseDown = (e) => {
      if (e.target.closest('.window-controls') || e.target.closest('.window-btn')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = window.state.x;
      initialY = window.state.y;

      document.body.style.cursor = 'move';
      window.element.style.userSelect = 'none';

      this.focusWindow(id);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      window.state.x = initialX + dx;
      window.state.y = initialY + dy;

      if (!window.state.maximized) {
        window.element.style.left = `${window.state.x}px`;
        window.element.style.top = `${window.state.y}px`;
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        window.element.style.userSelect = '';
        this.clampToViewport(id);
        this.saveState();
      }
    };

    // Double-click to maximize
    header.addEventListener('dblclick', () => {
      this.toggleMaximize(id);
    });

    header.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  setupWindowResize(id) {
    const window = this.windows.get(id);
    const handles = window.element.querySelectorAll('.resize-handle');

    let isResizing = false;
    let resizeHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    const onMouseDown = (e, handle) => {
      isResizing = true;
      resizeHandle = handle;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = window.element.offsetWidth;
      startHeight = window.element.offsetHeight;
      startLeft = window.state.x;
      startTop = window.state.y;

      window.element.style.userSelect = 'none';
      this.focusWindow(id);
      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e) => {
      if (!isResizing || window.state.maximized) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const classes = resizeHandle.className;

      if (classes.includes('resize-e')) {
        window.element.style.width = `${Math.max(280, startWidth + dx)}px`;
      }
      if (classes.includes('resize-w')) {
        const newWidth = Math.max(280, startWidth - dx);
        window.element.style.width = `${newWidth}px`;
        window.element.style.left = `${startLeft + (startWidth - newWidth)}px`;
      }
      if (classes.includes('resize-s')) {
        window.element.style.height = `${Math.max(180, startHeight + dy)}px`;
      }
      if (classes.includes('resize-n')) {
        const newHeight = Math.max(180, startHeight - dy);
        window.element.style.height = `${newHeight}px`;
        window.element.style.top = `${startTop + (startHeight - newHeight)}px`;
      }

      // Update state
      window.state.width = window.element.offsetWidth;
      window.state.height = window.element.offsetHeight;
      window.state.x = parseInt(window.element.style.left);
      window.state.y = parseInt(window.element.style.top);
    };

    const onMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        resizeHandle = null;
        window.element.style.userSelect = '';
        this.clampToViewport(id);
        this.saveState();
      }
    };

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => onMouseDown(e, handle));
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  setupWindowButtons(id) {
    const window = this.windows.get(id);

    const minimizeBtn = window.element.querySelector('.window-btn-minimize');
    const maximizeBtn = window.element.querySelector('.window-btn-maximize');
    const closeBtn = window.element.querySelector('.window-btn-close');

    minimizeBtn.addEventListener('click', () => this.minimizeWindow(id));
    maximizeBtn.addEventListener('click', () => this.toggleMaximize(id));
    closeBtn.addEventListener('click', () => this.closeWindow(id));
  }

  setupWindowFocus(id) {
    const window = this.windows.get(id);

    window.element.addEventListener('mousedown', () => {
      this.focusWindow(id);
    });

    window.element.addEventListener('focus', () => {
      this.focusWindow(id);
    });
  }

  setupWindowKeyboard(id) {
    const window = this.windows.get(id);

    window.element.addEventListener('keydown', (e) => {
      const moveSpeed = e.shiftKey ? 1 : e.altKey ? 20 : 10;
      const isResize = e.ctrlKey || e.metaKey;

      if (window.state.maximized) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (isResize) {
            window.state.width = Math.max(280, window.state.width - moveSpeed);
            window.element.style.width = `${window.state.width}px`;
          } else {
            window.state.x -= moveSpeed;
            window.element.style.left = `${window.state.x}px`;
          }
          e.preventDefault();
          break;

        case 'ArrowRight':
          if (isResize) {
            window.state.width += moveSpeed;
            window.element.style.width = `${window.state.width}px`;
          } else {
            window.state.x += moveSpeed;
            window.element.style.left = `${window.state.x}px`;
          }
          e.preventDefault();
          break;

        case 'ArrowUp':
          if (isResize) {
            window.state.height = Math.max(180, window.state.height - moveSpeed);
            window.element.style.height = `${window.state.height}px`;
          } else {
            window.state.y -= moveSpeed;
            window.element.style.top = `${window.state.y}px`;
          }
          e.preventDefault();
          break;

        case 'ArrowDown':
          if (isResize) {
            window.state.height += moveSpeed;
            window.element.style.height = `${window.state.height}px`;
          } else {
            window.state.y += moveSpeed;
            window.element.style.top = `${window.state.y}px`;
          }
          e.preventDefault();
          break;

        case 'Enter':
          // Activate primary action (focus first interactive element)
          const firstButton = window.element.querySelector('button:not(.window-btn), a, input, select, textarea');
          if (firstButton) firstButton.focus();
          e.preventDefault();
          break;

        case 'Escape':
          this.closeWindow(id);
          e.preventDefault();
          break;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        this.clampToViewport(id);
        this.saveState();
      }
    });
  }

  focusWindow(id) {
    if (this.focusedWindow === id) return;

    this.focusedWindow = id;

    // Update z-index
    this.windows.forEach((win, winId) => {
      if (winId === id) {
        win.element.style.zIndex = ++this.zIndexCounter;
      }
    });

    // Update taskbar indicators
    this.updateTaskbarIndicators();

    // Update debug overlay
    this.updateDebugOverlay();
  }

  minimizeWindow(id) {
    const window = this.windows.get(id);
    window.state.minimized = true;
    window.element.classList.add('minimized');
    this.updateTaskbarIndicators();
    this.saveState();
  }

  restoreWindow(id) {
    const window = this.windows.get(id);
    window.state.minimized = false;
    window.element.classList.remove('minimized');
    this.focusWindow(id);
    this.updateTaskbarIndicators();
    this.saveState();
  }

  toggleMaximize(id) {
    const window = this.windows.get(id);
    window.state.maximized = !window.state.maximized;
    window.element.classList.toggle('maximized');

    if (!window.state.maximized) {
      // Restore previous size
      window.element.style.left = `${window.state.x}px`;
      window.element.style.top = `${window.state.y}px`;
      window.element.style.width = `${window.state.width}px`;
      window.element.style.height = `${window.state.height}px`;
    }

    this.saveState();
  }

  closeWindow(id) {
    const window = this.windows.get(id);
    window.state.closed = true;
    window.element.style.display = 'none';
    this.updateTaskbarIndicators();
    this.saveState();
  }

  openWindow(id) {
    const window = this.windows.get(id);
    if (!window) return;

    window.state.closed = false;
    window.state.minimized = false;
    window.element.style.display = 'flex';
    window.element.classList.remove('minimized');
    this.focusWindow(id);
    window.element.focus();
    this.updateTaskbarIndicators();
    this.saveState();
  }

  clampToViewport(id) {
    const window = this.windows.get(id);
    if (window.state.maximized) return;

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'))
    };

    const el = window.element;
    const minVisible = 40; // Minimum pixels that must be visible

    window.state.x = Math.max(-el.offsetWidth + minVisible, Math.min(viewport.width - minVisible, window.state.x));
    window.state.y = Math.max(0, Math.min(viewport.height - minVisible, window.state.y));

    el.style.left = `${window.state.x}px`;
    el.style.top = `${window.state.y}px`;
  }

  clampAllWindows() {
    this.windows.forEach((_, id) => this.clampToViewport(id));
  }

  createTaskbarIndicator(id, config) {
    const indicator = document.createElement('button');
    indicator.className = 'window-indicator';
    indicator.dataset.windowId = id;
    indicator.setAttribute('role', 'button');
    indicator.setAttribute('aria-label', `Switch to ${config.title}`);

    indicator.innerHTML = `
      <span class="window-indicator-icon">${config.icon}</span>
      <span class="window-indicator-text">${config.title}</span>
      <span class="window-indicator-badge"></span>
    `;

    indicator.addEventListener('click', () => {
      const window = this.windows.get(id);
      if (window.state.minimized) {
        this.restoreWindow(id);
      } else if (this.focusedWindow === id) {
        this.minimizeWindow(id);
      } else {
        this.focusWindow(id);
        window.element.focus();
      }
    });

    this.taskbarWindows.appendChild(indicator);
  }

  updateTaskbarIndicators() {
    const indicators = this.taskbarWindows.querySelectorAll('.window-indicator');

    indicators.forEach(indicator => {
      const id = indicator.dataset.windowId;
      const window = this.windows.get(id);

      if (window.state.closed) {
        indicator.style.display = 'none';
        return;
      }

      indicator.style.display = 'flex';
      indicator.classList.toggle('active', this.focusedWindow === id && !window.state.minimized);

      const badge = indicator.querySelector('.window-indicator-badge');
      badge.classList.toggle('minimized', window.state.minimized);
    });
  }

  saveState() {
    const state = {};
    this.windows.forEach((window, id) => {
      state[id] = window.state;
    });
    localStorage.setItem('windowState', JSON.stringify(state));
  }

  loadState() {
    const saved = localStorage.getItem('windowState');
    if (!saved) return;

    try {
      const state = JSON.parse(saved);

      this.windows.forEach((window, id) => {
        if (state[id]) {
          Object.assign(window.state, state[id]);

          window.element.style.left = `${window.state.x}px`;
          window.element.style.top = `${window.state.y}px`;
          window.element.style.width = `${window.state.width}px`;
          window.element.style.height = `${window.state.height}px`;

          if (window.state.maximized) {
            window.element.classList.add('maximized');
          }
          if (window.state.minimized) {
            window.element.classList.add('minimized');
          }
          if (window.state.closed) {
            window.element.style.display = 'none';
          }

          this.clampToViewport(id);
        }
      });

      this.updateTaskbarIndicators();
    } catch (e) {
      console.error('Failed to load window state:', e);
    }
  }

  setupEventListeners() {
    // Handle viewport resize
    window.addEventListener('resize', () => {
      this.clampAllWindows();
    });
  }

  // Content generators
  generateConsoleContent() {
    const bootMessages = [
      { prompt: '[SYSTEM]', text: 'Initializing terminal environment...', delay: 0 },
      { prompt: '[SYSTEM]', text: 'Loading kernel modules... OK', delay: 100 },
      { prompt: '[SYSTEM]', text: 'Mounting filesystems... OK', delay: 200 },
      { prompt: '[SYSTEM]', text: 'Starting network services... OK', delay: 300 },
      { prompt: '[SYSTEM]', text: 'System ready.', delay: 400 },
      { prompt: '', text: '', delay: 500 },
      { prompt: '[INFO]', text: 'Welcome to Terminal Desktop v1.0', delay: 600 },
      { prompt: '[INFO]', text: 'CRT phosphor rendering: ENABLED', delay: 700 },
      { prompt: '[INFO]', text: 'Desktop environment loaded', delay: 800 },
      { prompt: '', text: '', delay: 900 },
      { prompt: 'user@terminal:~$', text: '<span class="console-cursor"></span>', delay: 1000 }
    ];

    let html = '<div class="console-output">';
    bootMessages.forEach(msg => {
      const dimClass = msg.prompt === '[SYSTEM]' ? ' dim' : '';
      html += `<div class="console-line" style="animation: fadeIn 0.3s ease ${msg.delay}ms both">`;
      if (msg.prompt) html += `<span class="console-prompt">${msg.prompt}</span>`;
      html += `<span class="console-text${dimClass}">${msg.text}</span>`;
      html += `</div>`;
    });
    html += '</div>';

    return html;
  }

  generateLinksContent() {
    const links = [
      { icon: '🐙', title: 'GitHub', desc: 'Open source projects & code', url: 'https://github.com' },
      { icon: '🐦', title: 'Twitter', desc: 'Thoughts and updates', url: 'https://twitter.com' },
      { icon: '💼', title: 'LinkedIn', desc: 'Professional network', url: 'https://linkedin.com' },
      { icon: '📧', title: 'Email', desc: 'Get in touch directly', url: 'mailto:hello@example.com' },
      { icon: '🌐', title: 'Website', desc: 'Personal portfolio', url: 'https://example.com' },
      { icon: '📝', title: 'Blog', desc: 'Technical writing', url: 'https://example.com/blog' }
    ];

    let html = '<div class="links-grid">';
    links.forEach(link => {
      html += `
        <a href="${link.url}" class="link-card" target="_blank" rel="noopener noreferrer">
          <div class="link-card-icon">${link.icon}</div>
          <div class="link-card-title">${link.title}</div>
          <div class="link-card-desc">${link.desc}</div>
        </a>
      `;
    });
    html += '</div>';

    return html;
  }

  generateStatusContent() {
    return `
      <div class="status-grid">
        <div class="status-section">
          <div class="status-section-title">System Health</div>
          <div class="status-metric">
            <span class="status-metric-label">CPU Usage</span>
            <span class="status-metric-value">12%</span>
          </div>
          <div class="status-bar"><div class="status-bar-fill" style="width: 12%"></div></div>

          <div class="status-metric">
            <span class="status-metric-label">Memory</span>
            <span class="status-metric-value">34%</span>
          </div>
          <div class="status-bar"><div class="status-bar-fill" style="width: 34%"></div></div>

          <div class="status-metric">
            <span class="status-metric-label">Disk Usage</span>
            <span class="status-metric-value">67%</span>
          </div>
          <div class="status-bar"><div class="status-bar-fill" style="width: 67%"></div></div>
        </div>

        <div class="status-section">
          <div class="status-section-title">Display</div>
          <div class="status-metric">
            <span class="status-metric-label">Phosphor Type</span>
            <span class="status-metric-value" id="status-phosphor">P3 Green</span>
          </div>
          <div class="status-metric">
            <span class="status-metric-label">Refresh Rate</span>
            <span class="status-metric-value">60 Hz</span>
          </div>
          <div class="status-metric">
            <span class="status-metric-label">Scanlines</span>
            <span class="status-metric-value">Enabled</span>
          </div>
        </div>

        <div class="status-section">
          <div class="status-section-title">Network</div>
          <div class="status-metric">
            <span class="status-metric-label">Status</span>
            <span class="status-metric-value">Connected</span>
          </div>
          <div class="status-metric">
            <span class="status-metric-label">Latency</span>
            <span class="status-metric-value">23ms</span>
          </div>
          <div class="status-metric">
            <span class="status-metric-label">Uptime</span>
            <span class="status-metric-value" id="status-uptime">00:00:00</span>
          </div>
        </div>
      </div>
    `;
  }

  updateDebugOverlay() {
    document.getElementById('debug-windows').textContent = this.windows.size;
    document.getElementById('debug-focused').textContent = this.focusedWindow || '—';
    document.getElementById('debug-viewport').textContent = `${window.innerWidth}×${window.innerHeight}`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   START MENU
   ═══════════════════════════════════════════════════════════════ */

class StartMenu {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.startButton = document.querySelector('.taskbar-start');
    this.menu = document.querySelector('.start-menu');
    this.menuItems = document.querySelector('.start-menu-items');
    this.isOpen = false;
    this.focusedIndex = -1;

    this.init();
  }

  init() {
    this.populateMenu();
    this.setupEventListeners();
  }

  populateMenu() {
    const apps = [];

    this.windowManager.windows.forEach((window, id) => {
      if (window.config.showInStart) {
        apps.push({
          id,
          icon: window.config.icon,
          label: window.config.title
        });
      }
    });

    this.menuItems.innerHTML = apps.map(app => `
      <button class="start-menu-item" data-app-id="${app.id}" role="menuitem">
        <span class="start-menu-item-icon">${app.icon}</span>
        <span class="start-menu-item-label">${app.label}</span>
      </button>
    `).join('');

    // Setup item click handlers
    this.menuItems.querySelectorAll('.start-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const appId = item.dataset.appId;
        this.windowManager.openWindow(appId);
        this.close();
      });
    });
  }

  setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      this.toggle();
    });

    // Keyboard navigation
    this.menu.addEventListener('keydown', (e) => {
      const items = Array.from(this.menuItems.querySelectorAll('.start-menu-item'));

      switch (e.key) {
        case 'ArrowDown':
          this.focusedIndex = Math.min(items.length - 1, this.focusedIndex + 1);
          items[this.focusedIndex].focus();
          e.preventDefault();
          break;

        case 'ArrowUp':
          this.focusedIndex = Math.max(0, this.focusedIndex - 1);
          items[this.focusedIndex].focus();
          e.preventDefault();
          break;

        case 'Home':
          this.focusedIndex = 0;
          items[0].focus();
          e.preventDefault();
          break;

        case 'End':
          this.focusedIndex = items.length - 1;
          items[items.length - 1].focus();
          e.preventDefault();
          break;

        case 'Escape':
          this.close();
          e.preventDefault();
          break;
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen &&
          !this.menu.contains(e.target) &&
          !this.startButton.contains(e.target)) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.hidden = false;
    this.startButton.setAttribute('aria-expanded', 'true');

    // Focus first item
    const firstItem = this.menuItems.querySelector('.start-menu-item');
    if (firstItem) {
      this.focusedIndex = 0;
      firstItem.focus();
    }
  }

  close() {
    this.isOpen = false;
    this.menu.hidden = true;
    this.startButton.setAttribute('aria-expanded', 'false');
    this.startButton.focus();
    this.focusedIndex = -1;
  }
}

/* ═══════════════════════════════════════════════════════════════
   TASKBAR
   ═══════════════════════════════════════════════════════════════ */

class Taskbar {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.themeButton = document.querySelector('.status-capsule');
    this.clock = document.querySelector('.taskbar-clock');
    this.taskbar = document.querySelector('.taskbar');
    this.debugOverlay = document.querySelector('.debug-overlay');
    this.longPressTimer = null;

    this.init();
  }

  init() {
    this.setupThemeSwitcher();
    this.setupClock();
    this.setupPinnedApps();
    this.setupDebugToggle();
    this.setupStatusMonitor();
  }

  setupThemeSwitcher() {
    this.themeButton.addEventListener('click', () => {
      const body = document.body;
      const currentTheme = body.dataset.theme;
      const newTheme = currentTheme === 'green' ? 'amber' : 'green';

      body.dataset.theme = newTheme;
      localStorage.setItem('theme', newTheme);

      const themeLabel = this.themeButton.querySelector('.status-theme');
      themeLabel.textContent = newTheme === 'green' ? 'GRN' : 'AMB';

      // Update status monitor
      const statusPhosphor = document.getElementById('status-phosphor');
      if (statusPhosphor) {
        statusPhosphor.textContent = newTheme === 'green' ? 'P3 Green' : 'P22 Amber';
      }

      // Update debug overlay
      document.getElementById('debug-theme').textContent = newTheme;
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'green';
    document.body.dataset.theme = savedTheme;
    const themeLabel = this.themeButton.querySelector('.status-theme');
    themeLabel.textContent = savedTheme === 'green' ? 'GRN' : 'AMB';
  }

  setupClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      this.clock.textContent = timeString;
      this.clock.setAttribute('datetime', now.toISOString());
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  setupPinnedApps() {
    const pinnedApps = document.querySelectorAll('.pinned-app');

    pinnedApps.forEach(app => {
      app.addEventListener('click', () => {
        const appId = app.dataset.app;
        this.windowManager.openWindow(appId);
      });
    });
  }

  setupDebugToggle() {
    // Alt+D keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'd') {
        this.toggleDebug();
        e.preventDefault();
      }
    });

    // Long-press on taskbar
    this.taskbar.addEventListener('mousedown', (e) => {
      if (e.target === this.taskbar || e.target.closest('.taskbar')) {
        this.longPressTimer = setTimeout(() => {
          this.toggleDebug();
        }, 800);
      }
    });

    this.taskbar.addEventListener('mouseup', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    this.taskbar.addEventListener('mouseleave', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    // Touch long-press
    this.taskbar.addEventListener('touchstart', (e) => {
      this.longPressTimer = setTimeout(() => {
        this.toggleDebug();
      }, 800);
    });

    this.taskbar.addEventListener('touchend', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });
  }

  toggleDebug() {
    this.debugOverlay.hidden = !this.debugOverlay.hidden;
    if (!this.debugOverlay.hidden) {
      this.updateDebugFPS();
    }
  }

  updateDebugFPS() {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        document.getElementById('debug-fps').textContent = `${fps} fps`;
        frames = 0;
        lastTime = currentTime;
      }

      if (!this.debugOverlay.hidden) {
        requestAnimationFrame(measureFPS);
      }
    };

    measureFPS();
  }

  setupStatusMonitor() {
    // Update uptime counter
    const startTime = Date.now();

    setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = String(Math.floor(uptime / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
      const seconds = String(uptime % 60).padStart(2, '0');

      const uptimeEl = document.getElementById('status-uptime');
      if (uptimeEl) {
        uptimeEl.textContent = `${hours}:${minutes}:${seconds}`;
      }
    }, 1000);
  }
}

/* ═══════════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const windowManager = new WindowManager();
  const startMenu = new StartMenu(windowManager);
  const taskbar = new Taskbar(windowManager);

  // Focus first visible window
  const firstWindow = Array.from(windowManager.windows.values()).find(w => !w.state.closed);
  if (firstWindow) {
    windowManager.focusWindow(firstWindow.id);
  }

  // Add CSS animation for fade-in
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
});
