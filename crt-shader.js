/* ═══════════════════════════════════════════════════════════════
   ADVANCED CRT SHADER RENDERER
   WebGL-based realistic CRT simulation with:
   - Barrel distortion & screen curvature
   - Chromatic aberration
   - Phosphor glow & persistence
   - Scanlines & shadowmask
   - Bloom & halation
   - Dynamic refresh simulation
   ═══════════════════════════════════════════════════════════════ */

class CRTShader {
  constructor() {
    this.canvas = document.getElementById('crt-canvas');
    this.contentLayer = document.getElementById('content-layer');

    this.setupCanvas();
    this.initWebGL();

    if (this.gl) {
      this.setupShaders();
      this.setupBuffers();
      this.setupTextures();
      this.startRenderLoop();
    } else {
      // Fallback to CSS-only effects
      console.warn('WebGL not available, using CSS fallback');
      this.canvas.style.display = 'none';
    }

    this.setupEventListeners();
  }

  setupCanvas() {
    this.updateCanvasSize();
  }

  updateCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
  }

  initWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });

      if (!this.gl) {
        this.gl = this.canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        });
      }
    } catch (e) {
      console.error('WebGL initialization failed:', e);
      this.gl = null;
    }
  }

  setupShaders() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_phosphorColor;
      uniform float u_curvature;
      uniform float u_scanlineIntensity;
      uniform float u_vignetteIntensity;
      uniform float u_bloomIntensity;
      uniform float u_chromaticAberration;

      varying vec2 v_texCoord;

      // CRT screen curvature distortion
      vec2 curveRemapUV(vec2 uv) {
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / vec2(u_curvature, u_curvature);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
        return uv;
      }

      // Vignette effect
      float vignette(vec2 uv) {
        uv *= 1.0 - uv.yx;
        float vig = uv.x * uv.y * 15.0;
        return pow(vig, u_vignetteIntensity);
      }

      // Scanline effect
      float scanline(vec2 uv, float time) {
        float scanline = sin((uv.y + time * 0.00002) * u_resolution.y * 2.0);
        return mix(1.0, scanline, u_scanlineIntensity);
      }

      // Phosphor mask (Aperture grille simulation)
      float phosphorMask(vec2 uv) {
        vec2 pos = floor(uv * u_resolution.xy);
        float mask = 1.0;

        // Tricolor phosphor pattern
        mask -= 0.08 * (1.0 - step(mod(pos.x, 3.0), 0.5));
        mask -= 0.08 * (1.0 - step(mod(pos.x, 3.0), 1.5));
        mask -= 0.05 * (1.0 - step(mod(pos.y, 2.0), 0.5));

        return mask;
      }

      // Chromatic aberration
      vec3 chromaticAberration(sampler2D tex, vec2 uv) {
        vec2 direction = uv - 0.5;
        float r = texture2D(tex, uv - direction * u_chromaticAberration).r;
        float g = texture2D(tex, uv).g;
        float b = texture2D(tex, uv + direction * u_chromaticAberration).b;
        return vec3(r, g, b);
      }

      // Simple bloom
      vec3 bloom(sampler2D tex, vec2 uv) {
        vec3 color = vec3(0.0);
        float total = 0.0;

        for (float x = -2.0; x <= 2.0; x += 1.0) {
          for (float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 offset = vec2(x, y) * (1.0 / u_resolution);
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            color += texture2D(tex, uv + offset).rgb * weight;
            total += weight;
          }
        }

        return color / total;
      }

      void main() {
        // Apply CRT curvature
        vec2 uv = curveRemapUV(v_texCoord);

        // Discard pixels outside the curved screen
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Get base color with chromatic aberration
        vec3 color = chromaticAberration(u_texture, uv);

        // Apply bloom/glow
        vec3 bloomColor = bloom(u_texture, uv);
        color = mix(color, bloomColor, u_bloomIntensity);

        // Apply phosphor color tint
        color *= u_phosphorColor;

        // Add phosphor persistence glow
        color += u_phosphorColor * 0.1 * smoothstep(0.0, 1.0, length(color));

        // Apply scanlines
        color *= scanline(uv, u_time);

        // Apply phosphor mask
        color *= phosphorMask(uv);

        // Apply vignette
        color *= vignette(uv);

        // Add slight noise/grain
        float noise = fract(sin(dot(uv * u_time * 0.001, vec2(12.9898, 78.233))) * 43758.5453);
        color += (noise - 0.5) * 0.02;

        // Subtle screen flicker
        color *= 0.97 + 0.03 * sin(u_time * 0.01);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create and link program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Shader program failed to link:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    // Get attribute and uniform locations
    this.locations = {
      position: this.gl.getAttribLocation(this.program, 'a_position'),
      texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord'),
      texture: this.gl.getUniformLocation(this.program, 'u_texture'),
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      time: this.gl.getUniformLocation(this.program, 'u_time'),
      phosphorColor: this.gl.getUniformLocation(this.program, 'u_phosphorColor'),
      curvature: this.gl.getUniformLocation(this.program, 'u_curvature'),
      scanlineIntensity: this.gl.getUniformLocation(this.program, 'u_scanlineIntensity'),
      vignetteIntensity: this.gl.getUniformLocation(this.program, 'u_vignetteIntensity'),
      bloomIntensity: this.gl.getUniformLocation(this.program, 'u_bloomIntensity'),
      chromaticAberration: this.gl.getUniformLocation(this.program, 'u_chromaticAberration')
    };
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  setupBuffers() {
    // Create a quad that covers the entire canvas
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const texCoords = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]);

    // Position buffer
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Texture coordinate buffer
    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
  }

  setupTextures() {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Create a black texture initially
    const pixel = new Uint8Array([0, 0, 0, 255]);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
  }

  captureContentLayer() {
    // This is where we'd capture the DOM content
    // For now, we'll just use the canvas background
    // In a more advanced version, we could use html2canvas or similar
  }

  render(time) {
    if (!this.gl) return;

    const gl = this.gl;

    // Update canvas size if needed
    if (this.canvas.width !== window.innerWidth * window.devicePixelRatio ||
        this.canvas.height !== window.innerHeight * window.devicePixelRatio) {
      this.updateCanvasSize();
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // Use shader program
    gl.useProgram(this.program);

    // Set up position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

    // Set up texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.locations.texCoord);
    gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locations.time, time);

    // Get theme-based phosphor color
    const theme = document.body.dataset.theme;
    const phosphorColor = theme === 'amber'
      ? [1.0, 0.69, 0.0]  // Amber
      : [0.0, 1.0, 0.25]; // Green

    gl.uniform3fv(this.locations.phosphorColor, phosphorColor);

    // CRT effect parameters
    gl.uniform1f(this.locations.curvature, 6.0);
    gl.uniform1f(this.locations.scanlineIntensity, 0.15);
    gl.uniform1f(this.locations.vignetteIntensity, 0.35);
    gl.uniform1f(this.locations.bloomIntensity, 0.25);
    gl.uniform1f(this.locations.chromaticAberration, 0.002);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locations.texture, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  startRenderLoop() {
    const loop = (time) => {
      this.render(time);
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.updateCanvasSize();
      if (this.gl) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
    });
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.gl) {
      this.gl.deleteProgram(this.program);
      this.gl.deleteBuffer(this.positionBuffer);
      this.gl.deleteBuffer(this.texCoordBuffer);
      this.gl.deleteTexture(this.texture);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.crtShader = new CRTShader();
});
