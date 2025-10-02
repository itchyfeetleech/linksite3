/* ═══════════════════════════════════════════════════════════════
   MODERN WINDOW MANAGER WITH POINTER CAPTURE
   ═══════════════════════════════════════════════════════════════ */

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.focusedWindow = null;
    this.zIndexCounter = 1000;
    this.desktop = document.getElementById('desktop');
    this.taskbarWindows = document.querySelector('.taskbar-windows');

    // Pointer capture state
    this.dragState = null;
    this.resizeState = null;

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

    // Create window structure with .NFO style
    windowEl.innerHTML = `
      <div class="resize-handle resize-n" data-direction="n"></div>
      <div class="resize-handle resize-s" data-direction="s"></div>
      <div class="resize-handle resize-e" data-direction="e"></div>
      <div class="resize-handle resize-w" data-direction="w"></div>
      <div class="resize-handle resize-ne" data-direction="ne"></div>
      <div class="resize-handle resize-nw" data-direction="nw"></div>
      <div class="resize-handle resize-se" data-direction="se"></div>
      <div class="resize-handle resize-sw" data-direction="sw"></div>

      <div class="window-header" data-window-id="${id}">
        <div class="window-title-wrapper">
          <span class="window-corner">╔</span>
          <span class="window-title" id="window-title-${id}">═══ ${config.title.toUpperCase()} ═══</span>
          <span class="window-corner">╗</span>
        </div>
        <div class="window-controls">
          <button class="window-btn window-btn-minimize" aria-label="Minimize" title="Minimize">[ _ ]</button>
          <button class="window-btn window-btn-maximize" aria-label="Maximize" title="Maximize">[ □ ]</button>
          <button class="window-btn window-btn-close" aria-label="Close" title="Close">[ X ]</button>
        </div>
      </div>

      <div class="window-body">${config.content}</div>

      <div class="window-footer">
        <span class="window-corner">╚</span>
        <span class="window-footer-line">═══════════════════════════════════════════════════</span>
        <span class="window-corner">╝</span>
      </div>
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
      },
      // Animation state
      animation: {
        targetX: config.x,
        targetY: config.y,
        targetWidth: config.width,
        targetHeight: config.height
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

    // Add entrance animation
    this.animateWindowEntrance(windowEl);

    return id;
  }

  animateWindowEntrance(windowEl) {
    windowEl.style.opacity = '0';
    windowEl.style.transform = 'scale(0.95) translateY(-10px)';

    requestAnimationFrame(() => {
      windowEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      windowEl.style.opacity = '1';
      windowEl.style.transform = 'scale(1) translateY(0)';

      setTimeout(() => {
        windowEl.style.transition = '';
      }, 300);
    });
  }

  setupWindowDrag(id) {
    const window = this.windows.get(id);
    const header = window.element.querySelector('.window-header');

    const onPointerDown = (e) => {
      // Ignore if clicking on buttons
      if (e.target.closest('.window-controls') || e.target.closest('.window-btn')) return;
      if (window.state.maximized) return;

      e.preventDefault();

      // Set pointer capture
      header.setPointerCapture(e.pointerId);

      this.dragState = {
        id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialX: window.state.x,
        initialY: window.state.y
      };

      header.style.cursor = 'grabbing';
      this.focusWindow(id);
    };

    const onPointerMove = (e) => {
      if (!this.dragState || this.dragState.id !== id || this.dragState.pointerId !== e.pointerId) return;

      e.preventDefault();

      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;

      const newX = this.dragState.initialX + dx;
      const newY = this.dragState.initialY + dy;

      // Update position directly for smooth dragging
      window.element.style.left = `${newX}px`;
      window.element.style.top = `${newY}px`;

      window.state.x = newX;
      window.state.y = newY;
    };

    const onPointerUp = (e) => {
      if (!this.dragState || this.dragState.id !== id || this.dragState.pointerId !== e.pointerId) return;

      e.preventDefault();

      // Release pointer capture
      if (header.hasPointerCapture(e.pointerId)) {
        header.releasePointerCapture(e.pointerId);
      }

      header.style.cursor = '';
      this.dragState = null;

      this.clampToViewport(id);
      this.saveState();
    };

    // Double-click to maximize
    header.addEventListener('dblclick', () => {
      this.toggleMaximize(id);
    });

    header.addEventListener('pointerdown', onPointerDown);
    header.addEventListener('pointermove', onPointerMove);
    header.addEventListener('pointerup', onPointerUp);
    header.addEventListener('pointercancel', onPointerUp);
  }

  setupWindowResize(id) {
    const window = this.windows.get(id);
    const handles = window.element.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
      const direction = handle.dataset.direction;

      const onPointerDown = (e) => {
        if (window.state.maximized) return;

        e.preventDefault();
        e.stopPropagation();

        // Set pointer capture
        handle.setPointerCapture(e.pointerId);

        this.resizeState = {
          id,
          pointerId: e.pointerId,
          direction,
          startX: e.clientX,
          startY: e.clientY,
          initialX: window.state.x,
          initialY: window.state.y,
          initialWidth: window.element.offsetWidth,
          initialHeight: window.element.offsetHeight,
          element: handle
        };

        this.focusWindow(id);
      };

      const onPointerMove = (e) => {
        if (!this.resizeState || this.resizeState.id !== id) return;

        e.preventDefault();

        const dx = e.clientX - this.resizeState.startX;
        const dy = e.clientY - this.resizeState.startY;

        let newWidth = this.resizeState.initialWidth;
        let newHeight = this.resizeState.initialHeight;
        let newX = this.resizeState.initialX;
        let newY = this.resizeState.initialY;

        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) newWidth = Math.max(280, this.resizeState.initialWidth + dx);
        if (direction.includes('w')) {
          newWidth = Math.max(280, this.resizeState.initialWidth - dx);
          newX = this.resizeState.initialX + (this.resizeState.initialWidth - newWidth);
        }
        if (direction.includes('s')) newHeight = Math.max(180, this.resizeState.initialHeight + dy);
        if (direction.includes('n')) {
          newHeight = Math.max(180, this.resizeState.initialHeight - dy);
          newY = this.resizeState.initialY + (this.resizeState.initialHeight - newHeight);
        }

        // Apply new dimensions
        window.element.style.width = `${newWidth}px`;
        window.element.style.height = `${newHeight}px`;
        window.element.style.left = `${newX}px`;
        window.element.style.top = `${newY}px`;

        window.state.width = newWidth;
        window.state.height = newHeight;
        window.state.x = newX;
        window.state.y = newY;
      };

      const onPointerUp = (e) => {
        if (!this.resizeState || this.resizeState.id !== id) return;

        e.preventDefault();

        // Release pointer capture
        if (handle.hasPointerCapture(e.pointerId)) {
          handle.releasePointerCapture(e.pointerId);
        }

        this.resizeState = null;

        this.clampToViewport(id);
        this.saveState();
      };

      handle.addEventListener('pointerdown', onPointerDown);
      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    });
  }

  setupWindowButtons(id) {
    const window = this.windows.get(id);

    const minimizeBtn = window.element.querySelector('.window-btn-minimize');
    const maximizeBtn = window.element.querySelector('.window-btn-maximize');
    const closeBtn = window.element.querySelector('.window-btn-close');

    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeWindow(id);
    });

    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(id);
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(id);
    });
  }

  setupWindowFocus(id) {
    const window = this.windows.get(id);

    window.element.addEventListener('pointerdown', () => {
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
          const firstInteractive = window.element.querySelector('button:not(.window-btn), a, input, select, textarea');
          if (firstInteractive) firstInteractive.focus();
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

    // Update z-index with animation
    this.windows.forEach((win, winId) => {
      if (winId === id) {
        win.element.style.zIndex = ++this.zIndexCounter;
        win.element.style.filter = 'brightness(1.05)';
        setTimeout(() => {
          win.element.style.filter = '';
        }, 150);
      }
    });

    this.updateTaskbarIndicators();
    this.updateDebugOverlay();
  }

  minimizeWindow(id) {
    const window = this.windows.get(id);

    // Animate minimization
    const indicator = this.taskbarWindows.querySelector(`[data-window-id="${id}"]`);
    if (indicator) {
      const rect = indicator.getBoundingClientRect();
      const winRect = window.element.getBoundingClientRect();

      window.element.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease';
      window.element.style.transformOrigin = 'center bottom';

      const scaleX = rect.width / winRect.width;
      const scaleY = rect.height / winRect.height;
      const translateX = rect.left - winRect.left + (rect.width - winRect.width) / 2;
      const translateY = rect.top - winRect.top + (rect.height - winRect.height) / 2;

      window.element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      window.element.style.opacity = '0';

      setTimeout(() => {
        window.state.minimized = true;
        window.element.classList.add('minimized');
        window.element.style.transition = '';
        window.element.style.transform = '';
        window.element.style.opacity = '';
        this.updateTaskbarIndicators();
        this.saveState();
      }, 300);
    } else {
      window.state.minimized = true;
      window.element.classList.add('minimized');
      this.updateTaskbarIndicators();
      this.saveState();
    }
  }

  restoreWindow(id) {
    const window = this.windows.get(id);
    window.state.minimized = false;
    window.element.classList.remove('minimized');

    // Animate restoration
    window.element.style.opacity = '0';
    window.element.style.transform = 'scale(0.95)';

    requestAnimationFrame(() => {
      window.element.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      window.element.style.opacity = '1';
      window.element.style.transform = 'scale(1)';

      setTimeout(() => {
        window.element.style.transition = '';
        window.element.style.transform = '';
      }, 300);
    });

    this.focusWindow(id);
    this.updateTaskbarIndicators();
    this.saveState();
  }

  toggleMaximize(id) {
    const window = this.windows.get(id);
    window.state.maximized = !window.state.maximized;

    window.element.style.transition = 'all 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)';
    window.element.classList.toggle('maximized');

    if (!window.state.maximized) {
      window.element.style.left = `${window.state.x}px`;
      window.element.style.top = `${window.state.y}px`;
      window.element.style.width = `${window.state.width}px`;
      window.element.style.height = `${window.state.height}px`;
    }

    setTimeout(() => {
      window.element.style.transition = '';
    }, 250);

    this.saveState();
  }

  closeWindow(id) {
    const window = this.windows.get(id);

    // Animate close
    window.element.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    window.element.style.transform = 'scale(0.9)';
    window.element.style.opacity = '0';

    setTimeout(() => {
      window.state.closed = true;
      window.element.style.display = 'none';
      window.element.style.transition = '';
      window.element.style.transform = '';
      window.element.style.opacity = '';
      this.updateTaskbarIndicators();
      this.saveState();
    }, 200);
  }

  openWindow(id) {
    const window = this.windows.get(id);
    if (!window) return;

    window.state.closed = false;
    window.state.minimized = false;
    window.element.style.display = 'flex';
    window.element.classList.remove('minimized');

    this.animateWindowEntrance(window.element);

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
    const minVisible = 40;

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

  createParticleEffect(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    document.getElementById('particles').appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
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
    window.addEventListener('resize', () => {
      this.clampAllWindows();
    });
  }

  generateConsoleContent() {
    return `
      <div class="console-output">
        <div class="console-header">
╔═══════════════════════════════════════════════════════════════╗
║  TERMINAL SYSTEMS v2.1 - ANALOG INTERFACE                    ║
║  Copyright (C) 1987-2025 Terminal Corp.                      ║
╚═══════════════════════════════════════════════════════════════╝
        </div>
        <div class="console-line"><span class="console-text dim">Last login: ${new Date().toLocaleString()}</span></div>
        <div class="console-line"></div>
        <div class="console-line"><span class="console-prompt">root@TERMINAL:~#</span> <span class="console-text">neofetch</span></div>
        <div class="console-line"><span class="console-text">        <span class="console-logo">
                   -\`
                  .o+\`             OS: Terminal Linux v2.1
                 \`ooo/             Host: CRT Monitor 1987
                \`+oooo:            Kernel: 5.15.0-terminal
               \`+oooooo:           Uptime: ${this.getUptime()}
               -+oooooo+:          Shell: bash 5.1.16
             \`/:-:++oooo+:        Resolution: 640x480
            \`/++++/+++++++:       DE: Terminal Desktop
           \`/++++++++++++++:      WM: TerminalWM
          \`/+++ooooooooooooo/\`    Theme: P3-Green [GTK2/3]
         ./ooosssso++osssssso+\`   Icons: Phosphor [GTK2/3]
        .oossssso-\`\`\`\`/ossssss+\`  Terminal: analog-console
       -osssssso.      :ssssssso. CPU: Intel 8086 (1) @ 4.77MHz
      :osssssss/        osssso+++. GPU: CGA Compatible
     /ossssssss/        +ssssooo/- Memory: 64K / 640K
   \`/ossssso+/:-        -:/+osssso+-
  \`+sso+:-\`                 \`.-/+oso:
 \`++:.                           \`-/+/
 .\`                                 \`/
        </span></span></div>
        <div class="console-line"></div>
        <div class="console-line"><span class="console-prompt">root@TERMINAL:~#</span> <span class="console-text">ls -la</span></div>
        <div class="console-line"><span class="console-text dim">total 42</span></div>
        <div class="console-line"><span class="console-text dim">drwxr-xr-x  5 root root  4096 Oct  1 19:87 .</span></div>
        <div class="console-line"><span class="console-text dim">drwxr-xr-x  3 root root  4096 Oct  1 19:87 ..</span></div>
        <div class="console-line"><span class="console-text dim">-rw-r--r--  1 root root   220 Oct  1 19:87 .bash_logout</span></div>
        <div class="console-line"><span class="console-text dim">-rw-r--r--  1 root root  3526 Oct  1 19:87 .bashrc</span></div>
        <div class="console-line"><span class="console-text dim">drwxr-xr-x  2 root root  4096 Oct  1 19:87 Documents</span></div>
        <div class="console-line"><span class="console-text dim">-rwxr-xr-x  1 root root  8192 Oct  1 19:87 LINKS.EXE</span></div>
        <div class="console-line"><span class="console-text dim">-rw-r--r--  1 root root  1337 Oct  1 19:87 README.NFO</span></div>
        <div class="console-line"></div>
        <div class="console-line"><span class="console-prompt">root@TERMINAL:~#</span> <span class="console-cursor"></span></div>
      </div>
    `;
  }

  getUptime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}h ${minutes}m`;
  }

  generateLinksContent() {
    const links = [
      { key: '1', title: 'GITHUB', desc: 'SOURCE CODE REPOSITORY', url: 'https://github.com', tag: '[DEV]' },
      { key: '2', title: 'TWITTER', desc: 'REAL-TIME UPDATES', url: 'https://twitter.com', tag: '[SOCIAL]' },
      { key: '3', title: 'LINKEDIN', desc: 'PROFESSIONAL NETWORK', url: 'https://linkedin.com', tag: '[WORK]' },
      { key: '4', title: 'EMAIL', desc: 'DIRECT COMMUNICATION', url: 'mailto:hello@example.com', tag: '[MAIL]' },
      { key: '5', title: 'WEBSITE', desc: 'PERSONAL DOMAIN', url: 'https://example.com', tag: '[WEB]' },
      { key: '6', title: 'BLOG', desc: 'TECHNICAL ARTICLES', url: 'https://example.com/blog', tag: '[DOCS]' }
    ];

    let html = `
      <div class="links-terminal">
        <div class="links-header">
╔═══════════════════════════════════════════════════════════════╗
║                    >>> LINK DATABASE <<<                      ║
║                                                               ║
║  Select an option to establish connection...                 ║
╚═══════════════════════════════════════════════════════════════╝
        </div>
        <div class="links-menu">
    `;

    links.forEach(link => {
      html += `
          <a href="${link.url}" class="link-item" target="_blank" rel="noopener noreferrer">
            <span class="link-key">[${link.key}]</span>
            <span class="link-tag">${link.tag}</span>
            <span class="link-title">${link.title}</span>
            <span class="link-separator">................</span>
            <span class="link-desc">${link.desc}</span>
          </a>
      `;
    });

    html += `
        </div>
        <div class="links-footer">
          <div class="links-status">
            <span class="status-indicator">●</span> CONNECTION READY
            <span class="links-prompt">SELECT_</span>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  generateStatusContent() {
    return `
      <div class="status-terminal">
        <div class="status-header">
╔═══════════════════════════════════════════════════════════════╗
║            >>> SYSTEM DIAGNOSTICS MODULE <<<                  ║
║                                                               ║
║  Real-time monitoring and analysis                           ║
╚═══════════════════════════════════════════════════════════════╝
        </div>

        <div class="status-panel">
          <div class="status-block">
            <div class="status-block-title">┌─ SYSTEM RESOURCES ─────────────────┐</div>
            <div class="status-line">
              <span class="status-label">CPU:</span>
              <span class="status-bar-wrapper">[████████░░░░░░░░░░░░]</span>
              <span class="status-value">12%</span>
            </div>
            <div class="status-line">
              <span class="status-label">MEM:</span>
              <span class="status-bar-wrapper">[███████████░░░░░░░░░]</span>
              <span class="status-value">34%</span>
            </div>
            <div class="status-line">
              <span class="status-label">GPU:</span>
              <span class="status-bar-wrapper">[██████████░░░░░░░░░░]</span>
              <span class="status-value">28%</span>
            </div>
            <div class="status-block-title">└────────────────────────────────────┘</div>
          </div>

          <div class="status-block">
            <div class="status-block-title">┌─ DISPLAY SUBSYSTEM ────────────────┐</div>
            <div class="status-line">
              <span class="status-label">PHOSPHOR:</span>
              <span class="status-value" id="status-phosphor">P3-GREEN</span>
            </div>
            <div class="status-line">
              <span class="status-label">REFRESH:</span>
              <span class="status-value">60 Hz</span>
            </div>
            <div class="status-line">
              <span class="status-label">SCANLINES:</span>
              <span class="status-value status-ok">[ACTIVE]</span>
            </div>
            <div class="status-line">
              <span class="status-label">BLOOM:</span>
              <span class="status-value status-ok">[ACTIVE]</span>
            </div>
            <div class="status-line">
              <span class="status-label">CURVATURE:</span>
              <span class="status-value status-ok">[ENABLED]</span>
            </div>
            <div class="status-block-title">└────────────────────────────────────┘</div>
          </div>

          <div class="status-block">
            <div class="status-block-title">┌─ NETWORK STATUS ───────────────────┐</div>
            <div class="status-line">
              <span class="status-label">LINK:</span>
              <span class="status-value status-ok">[CONNECTED]</span>
            </div>
            <div class="status-line">
              <span class="status-label">LATENCY:</span>
              <span class="status-value">23ms</span>
            </div>
            <div class="status-line">
              <span class="status-label">PROTOCOL:</span>
              <span class="status-value">TCP/IP</span>
            </div>
            <div class="status-line">
              <span class="status-label">UPTIME:</span>
              <span class="status-value" id="status-uptime">00:00:00</span>
            </div>
            <div class="status-block-title">└────────────────────────────────────┘</div>
          </div>
        </div>

        <div class="status-footer">
          <span class="status-indicator blink">●</span> ALL SYSTEMS NOMINAL
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

    // Animate entrance
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(10px)';

    requestAnimationFrame(() => {
      this.menu.style.transition = 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.menu.style.opacity = '1';
      this.menu.style.transform = 'translateY(0)';

      setTimeout(() => {
        this.menu.style.transition = '';
      }, 200);
    });

    const firstItem = this.menuItems.querySelector('.start-menu-item');
    if (firstItem) {
      this.focusedIndex = 0;
      firstItem.focus();
    }
  }

  close() {
    this.menu.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(10px)';

    setTimeout(() => {
      this.isOpen = false;
      this.menu.hidden = true;
      this.menu.style.transition = '';
      this.menu.style.transform = '';
      this.startButton.setAttribute('aria-expanded', 'false');
      this.startButton.focus();
      this.focusedIndex = -1;
    }, 150);
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

      const statusPhosphor = document.getElementById('status-phosphor');
      if (statusPhosphor) {
        statusPhosphor.textContent = newTheme === 'green' ? 'P3 Green' : 'P22 Amber';
      }

      document.getElementById('debug-theme').textContent = newTheme;
    });

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

      // Update clock-time span if it exists, otherwise fallback to clock element
      const clockTime = this.clock.querySelector('.clock-time');
      if (clockTime) {
        clockTime.textContent = timeString;
      } else {
        this.clock.textContent = timeString;
      }
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
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'd') {
        this.toggleDebug();
        e.preventDefault();
      }
    });

    this.taskbar.addEventListener('pointerdown', (e) => {
      if (e.target === this.taskbar || e.target.closest('.taskbar')) {
        this.longPressTimer = setTimeout(() => {
          this.toggleDebug();
        }, 800);
      }
    });

    this.taskbar.addEventListener('pointerup', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    this.taskbar.addEventListener('pointercancel', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });
  }

  toggleDebug() {
    const isHidden = this.debugOverlay.hidden;
    this.debugOverlay.hidden = !isHidden;

    if (!this.debugOverlay.hidden) {
      // Animate entrance
      this.debugOverlay.style.opacity = '0';
      this.debugOverlay.style.transform = 'translateX(20px)';

      requestAnimationFrame(() => {
        this.debugOverlay.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        this.debugOverlay.style.opacity = '1';
        this.debugOverlay.style.transform = 'translateX(0)';

        setTimeout(() => {
          this.debugOverlay.style.transition = '';
        }, 200);
      });

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

  const firstWindow = Array.from(windowManager.windows.values()).find(w => !w.state.closed);
  if (firstWindow) {
    windowManager.focusWindow(firstWindow.id);
  }

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
});
