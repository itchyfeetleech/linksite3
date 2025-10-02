/* ═══════════════════════════════════════════════════════════════
   GPU PARTICLE SYSTEM - Placeholder
   Will be implemented with WebGL Transform Feedback
   ═══════════════════════════════════════════════════════════════ */

class ParticleSystem {
  constructor() {
    this.particles = [];
    console.log('[Particle System] Initialized (placeholder)');
  }

  emit(x, y, count = 100) {
    // Placeholder: just log for now
    console.log(`[Particle System] Emit ${count} particles at (${x}, ${y})`);

    // Create simple particles (will be replaced with GPU version)
    for (let i = 0; i < Math.min(count, 50); i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.01,
        vy: (Math.random() - 0.5) * 0.01,
        life: 1.0
      });
    }
  }

  update(deltaTime) {
    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.0001; // gravity
      p.life -= deltaTime;
      return p.life > 0;
    });
  }

  render(ctx, width, height, color) {
    // Simple canvas rendering (will be replaced with WebGL)
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color.glow;

    this.particles.forEach(p => {
      const alpha = p.life;
      ctx.fillStyle = `rgba(${this.hexToRgb(color.bright)}, ${alpha})`;
      ctx.fillRect(p.x * width - 2, p.y * height - 2, 4, 4);
    });

    ctx.restore();
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
}

window.ParticleSystem = ParticleSystem;
