/* ═══════════════════════════════════════════════════════════════
   TERMINAL CONTENT - DATA-DRIVEN SCREEN DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

const TERMINAL_CONTENT = {
  // Main menu screen
  main: {
    type: 'menu',
    lines: [
      '┌─ TERMINAL OS v2.1 ────────────────────────────────────────┐',
      '│                                                           │',
      '│  ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗   │',
      '│  ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║   │',
      '│  ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║   │',
      '│  ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║   │',
      '│  ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║   │',
      '│  ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝   │',
      '│                                                           │',
      '└───────────────────────────────────────────────────────────┘',
      '',
      '┌─ MAIN MENU ───────────────────────────────────────────────┐',
      '│                                                           │',
      '│  [1] LINKS        ──── Social & Contact Links           │',
      '│  [2] PROJECTS     ──── Portfolio & Work                 │',
      '│  [3] ABOUT        ──── Bio & Information                │',
      '│  [4] SYSTEM       ──── Diagnostics & Settings           │',
      '│  [5] FLOW         ──── Interactive Phosphor Field       │',
      '│                                                           │',
      '└───────────────────────────────────────────────────────────┘',
      '',
      '> SELECT: _'
    ],
    options: [
      { key: '1', command: 'links', label: 'LINKS' },
      { key: '2', command: 'projects', label: 'PROJECTS' },
      { key: '3', command: 'about', label: 'ABOUT' },
      { key: '4', command: 'system', label: 'SYSTEM' },
      { key: '5', command: 'flow', label: 'FLOW' }
    ]
  },

  // Links screen
  links: {
    type: 'list',
    lines: [
      '┌─ LINKS ───────────────────────────────────────────────────┐',
      '│                                                           │',
      '│  > GITHUB .................. github.com/yourusername     │',
      '│  > TWITTER ................. twitter.com/yourusername    │',
      '│  > LINKEDIN ................ linkedin.com/in/you         │',
      '│  > EMAIL ................... hello@yourdomain.com        │',
      '│  > WEBSITE ................. yourdomain.com              │',
      '│  > PORTFOLIO ............... work.yourdomain.com         │',
      '│                                                           │',
      '│  [CLICK LINKS TO OPEN]                                   │',
      '│                                                           │',
      '└───────────────────────────────────────────────────────────┘',
      '',
      '┌─ STATUS ───────────────────────────────────────────────────┐',
      '│  ● CONNECTION READY           [ESC] RETURN TO MENU        │',
      '└───────────────────────────────────────────────────────────┘'
    ],
    links: [
      { text: 'GITHUB', url: 'https://github.com', line: 3 },
      { text: 'TWITTER', url: 'https://twitter.com', line: 4 },
      { text: 'LINKEDIN', url: 'https://linkedin.com', line: 5 },
      { text: 'EMAIL', url: 'mailto:hello@example.com', line: 6 },
      { text: 'WEBSITE', url: 'https://example.com', line: 7 },
      { text: 'PORTFOLIO', url: 'https://portfolio.example.com', line: 8 }
    ]
  },

  // Projects screen
  projects: {
    type: 'list',
    lines: [
      '┌─ PROJECTS ─────────────────────────────────────────────────┐',
      '│                                                            │',
      '│  [01] WebGL Terminal ........... This interface           │',
      '│       └─ Tech: WebGL2, GLSL, Fluid Dynamics               │',
      '│                                                            │',
      '│  [02] Neural Network Viz ....... Real-time 3D brain       │',
      '│       └─ Tech: Three.js, TensorFlow.js                    │',
      '│                                                            │',
      '│  [03] Shader Playground ........ Interactive GLSL editor  │',
      '│       └─ Tech: WebGL, Monaco Editor                       │',
      '│                                                            │',
      '│  [04] Particle System .......... GPU compute particles    │',
      '│       └─ Tech: Transform Feedback, Physics                │',
      '│                                                            │',
      '└────────────────────────────────────────────────────────────┘',
      '',
      '┌─ CONTROLS ─────────────────────────────────────────────────┐',
      '│  [↑↓] Navigate    [ENTER] View    [ESC] Back              │',
      '└────────────────────────────────────────────────────────────┘'
    ],
    projects: [
      { id: 1, name: 'WebGL Terminal', tech: 'WebGL2, GLSL, Fluid Dynamics' },
      { id: 2, name: 'Neural Network Viz', tech: 'Three.js, TensorFlow.js' },
      { id: 3, name: 'Shader Playground', tech: 'WebGL, Monaco Editor' },
      { id: 4, name: 'Particle System', tech: 'Transform Feedback, Physics' }
    ]
  },

  // About screen
  about: {
    type: 'info',
    lines: [
      '┌─ ABOUT ────────────────────────────────────────────────────┐',
      '│                                                            │',
      '│  ┌─ PERSONAL ─────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  NAME:     Your Name                               │   │',
      '│  │  ROLE:     Creative Developer / Visual Engineer    │   │',
      '│  │  LOCATION: Your City, Country                      │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '│  ┌─ SKILLS ───────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  WEBGL/GLSL ....... [████████████████████] 95%    │   │',
      '│  │  JAVASCRIPT ....... [███████████████████░] 90%    │   │',
      '│  │  CREATIVE CODE .... [████████████████░░░] 85%    │   │',
      '│  │  UI/UX ............ [████████████░░░░░░░] 75%    │   │',
      '│  │  3D/GRAPHICS ...... [██████████████████░] 92%    │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '│  ┌─ BIO ──────────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  Passionate about pushing the boundaries of        │   │',
      '│  │  web technology through experimental interfaces,   │   │',
      '│  │  real-time graphics, and creative coding.          │   │',
      '│  │                                                     │   │',
      '│  │  Specializing in WebGL, shaders, and creating      │   │',
      '│  │  immersive digital experiences.                    │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '└────────────────────────────────────────────────────────────┘',
      '',
      '[ESC] RETURN TO MENU'
    ]
  },

  // System diagnostics screen (VATS-style)
  system: {
    type: 'diagnostic',
    lines: [
      '┌─ SYSTEM DIAGNOSTICS ───────────────────────────────────────┐',
      '│                                                            │',
      '│  ┌─ HARDWARE ─────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  > CPU USAGE ........ [████████░░░░░░░░] 42%      │   │',
      '│  │  > MEMORY ........... [██████░░░░░░░░░░] 34%      │   │',
      '│  │  > GPU LOAD ......... [███████████░░░░░] 68%      │   │',
      '│  │  > FRAME RATE ....... 60 FPS                       │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '│  ┌─ DISPLAY ──────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  > PHOSPHOR TYPE .... P3 Green                     │   │',
      '│  │  > REFRESH RATE ..... 60 Hz                        │   │',
      '│  │  > SCANLINES ........ [ACTIVE]                     │   │',
      '│  │  > BLOOM EFFECT ..... [ACTIVE]                     │   │',
      '│  │  > DISTORTION ....... [ENABLED]                    │   │',
      '│  │  > PERSISTENCE ...... [ENABLED]                    │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '│  ┌─ NETWORK ──────────────────────────────────────────┐   │',
      '│  │                                                     │   │',
      '│  │  > STATUS ........... [CONNECTED]                  │   │',
      '│  │  > LATENCY .......... 23ms                         │   │',
      '│  │  > PROTOCOL ......... TCP/IP                       │   │',
      '│  │  > UPTIME ........... 00:05:42                     │   │',
      '│  │                                                     │   │',
      '│  └─────────────────────────────────────────────────────┘   │',
      '│                                                            │',
      '│  [T] TOGGLE THEME  [R] RESET  [ESC] BACK                  │',
      '│                                                            │',
      '└────────────────────────────────────────────────────────────┘',
      '',
      '● ALL SYSTEMS NOMINAL'
    ],
    realtime: true  // This screen updates stats in real-time
  },

  // Interactive flow field screen
  flow: {
    type: 'interactive',
    lines: [
      '┌─ INTERACTIVE PHOSPHOR FLOW ────────────────────────────────┐',
      '│                                                            │',
      '│                                                            │',
      '│                                                            │',
      '│                                                            │',
      '│                  [FLOW FIELD RENDERS HERE]                │',
      '│                                                            │',
      '│                                                            │',
      '│                                                            │',
      '│                                                            │',
      '└────────────────────────────────────────────────────────────┘',
      '',
      '┌─ CONTROLS ─────────────────────────────────────────────────┐',
      '│  [DRAG] Create Flow    [CLICK] Vortex    [SPACE] Clear    │',
      '│  [↑↓←→] Directional Force    [ESC] Return to Menu         │',
      '└────────────────────────────────────────────────────────────┘'
    ],
    interactive: 'flow'  // Signal to activate flow simulator
  }
};

// Export for use in other modules
window.TERMINAL_CONTENT = TERMINAL_CONTENT;
