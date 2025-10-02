/* ═══════════════════════════════════════════════════════════════
   IMMERSIVE CRT EFFECTS SYSTEM
   ═══════════════════════════════════════════════════════════════ */

class CRTEffects {
  constructor() {
    this.bootOverlay = document.getElementById('boot-overlay');
    this.bootContent = document.querySelector('.boot-content');

    this.isBooted = false;
    this.flickerInterval = null;
    this.audioContext = null;
    this.oscillator = null;

    this.init();
  }

  init() {
    // Start boot sequence
    this.startBootSequence();

    // Setup continuous effects after boot
    setTimeout(() => {
      this.setupContinuousEffects();
      this.setupAmbientSound();
    }, 8000);
  }

  async startBootSequence() {
    const messages = [
      { text: '', delay: 0 },
      { text: 'TERMINAL SYSTEMS v2.1', delay: 200, class: 'boot-title' },
      { text: 'Copyright (C) 1987-2025 Terminal Corp.', delay: 400, class: 'boot-copyright' },
      { text: '', delay: 600 },
      { text: 'Performing POST...', delay: 800 },
      { text: 'Memory Test: 640K OK', delay: 1200 },
      { text: 'Checking NVRAM...OK', delay: 1600 },
      { text: '', delay: 1800 },
      { text: 'Loading CONFIG.SYS...', delay: 2000 },
      { text: 'Loading AUTOEXEC.BAT...', delay: 2400 },
      { text: '', delay: 2600 },
      { text: 'Initializing CRT Display Driver...', delay: 2800 },
      { text: '  Phosphor: P3 Green', delay: 3200 },
      { text: '  Refresh: 60Hz', delay: 3400 },
      { text: '  Resolution: 640x480', delay: 3600 },
      { text: '', delay: 3800 },
      { text: 'Starting Network Services...', delay: 4000 },
      { text: '  TCP/IP Stack...OK', delay: 4400 },
      { text: '  DNS Resolution...OK', delay: 4800 },
      { text: '', delay: 5000 },
      { text: 'Loading Window Manager...', delay: 5200 },
      { text: '', delay: 5800 },
      { text: 'READY.', delay: 6400, class: 'boot-ready' },
      { text: '', delay: 7000 }
    ];

    // CRT warmup effect
    this.bootOverlay.style.opacity = '0';
    this.bootOverlay.style.display = 'flex';

    await this.sleep(100);

    // Power on with screen flicker
    this.bootOverlay.style.transition = 'opacity 0.1s ease';
    this.bootOverlay.style.opacity = '1';

    // Initial brightness surge
    this.bootOverlay.style.filter = 'brightness(3)';
    await this.sleep(50);
    this.bootOverlay.style.filter = 'brightness(0.3)';
    await this.sleep(100);
    this.bootOverlay.style.transition = 'filter 1s ease';
    this.bootOverlay.style.filter = 'brightness(1)';

    // Type out boot messages
    for (const msg of messages) {
      await this.sleep(msg.delay - (messages[messages.indexOf(msg) - 1]?.delay || 0));
      await this.typeMessage(msg.text, msg.class);
    }

    // Fade out boot screen
    await this.sleep(600);
    this.bootOverlay.classList.add('hidden');

    await this.sleep(500);
    this.bootOverlay.style.display = 'none';
    this.isBooted = true;

    // Signal that boot is complete
    window.dispatchEvent(new Event('boot-complete'));
  }

  async typeMessage(text, className = '') {
    if (!text) {
      this.bootContent.innerHTML += '<br>';
      return;
    }

    const line = document.createElement('div');
    line.className = `boot-line ${className}`;
    this.bootContent.appendChild(line);

    // Typing effect
    for (let i = 0; i < text.length; i++) {
      line.textContent += text[i];

      // Random typing speed for realism
      const delay = Math.random() * 30 + 10;
      await this.sleep(delay);

      // Occasional pause (like someone typing)
      if (Math.random() < 0.05) {
        await this.sleep(100);
      }
    }

    // Scroll to bottom
    this.bootContent.scrollTop = this.bootContent.scrollHeight;
  }

  setupContinuousEffects() {
    // CRT effects will be handled by WebGL shader
    // This is just for boot sequence
    console.log('[CRT Effects] Boot sequence complete');
  }

  setupAmbientSound() {
    // Create Web Audio context for CRT hum
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create oscillator for 60Hz hum
      this.oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime); // 60Hz hum
      gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime); // Very quiet

      this.oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Add click sound option
      document.addEventListener('click', () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
          this.oscillator.start();
        }
        this.playClickSound();
      });

    } catch (e) {
      console.log('Web Audio not available');
    }
  }

  playClickSound() {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.05);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Effects] DOM ready, starting boot sequence');
  try {
    window.crtEffects = new CRTEffects();
    console.log('[Effects] Boot sequence initialized');
  } catch (error) {
    console.error('[Effects] Failed to initialize:', error);
  }
});
