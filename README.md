# Terminal Desktop - CRT Biolink Site

A fully-featured desktop environment with authentic CRT aesthetics, designed for GitHub Pages deployment.

## Features

### Visual Identity
- **CRT Effects**: Authentic phosphor glow, scanlines, slot mask, vignette, and subtle static
- **Dual Themes**: Green phosphor (default) and amber alternative
- **Typography**: Space Grotesk for body/display, IBM Plex Mono for monospace elements
- **Atmospheric Background**: Deep blacks with glassy panels and noise texture

### Desktop Window System
- **Full Window Management**: Drag, resize, maximize, minimize, close
- **Keyboard Controls**:
  - Arrow keys: Move window (10px)
  - Shift + Arrows: Fine movement (1px)
  - Alt + Arrows: Fast movement (20px)
  - Ctrl/Cmd + Arrows: Resize window
  - Enter: Focus primary action
  - Esc: Close window
- **State Persistence**: Window positions, sizes, and states saved to localStorage
- **Viewport Clamping**: Windows stay within bounds on load and resize
- **Focus Management**: Click or focus brings window to foreground
- **Resize Handles**: All 8 edges and corners
- **Double-click Header**: Toggle maximize

### Taskbar & Navigation
- **Bottom-centered Glass Design**: Rounded housing with neon borders
- **Start Button**: Opens application menu (▤ glyph + "Start" label)
- **Pinned Apps**: Quick-launch with emoji icons and tooltips
- **Open Windows List**: Shows all open windows with state badges
- **Status Capsule**: Theme switcher (GRN/AMB)
- **Live Clock**: Updates every second in `<time>` element
- **Responsive**: Wraps cleanly on narrow screens

### Start Menu
- Lists all applications marked `showInStart`
- Keyboard navigation with arrow keys, Home, End
- Closes on Escape or outside click
- Returns focus to Start button on close

### Application Windows

#### Analog Console
- Terminal-style boot sequence with animated messages
- Blinking cursor effect
- System status messages with phosphor glow

#### Links
- Grid layout of biolink cards
- Customizable icons, titles, descriptions, URLs
- Hover effects with neon glow
- Responsive single-column on mobile

#### Status Monitor
- Real-time system diagnostics
- CPU, Memory, Disk usage bars
- Display settings (phosphor type, refresh rate, scanlines)
- Network status and uptime counter
- Updates dynamically

### Debug Overlay
- Toggle with Alt+D or long-press taskbar (800ms)
- Shows: window count, focused window, viewport size, theme, FPS
- Positioned top-right with semi-transparent black background

## Deployment to GitHub Pages

### Option 1: Manual Upload
1. Copy `index.html`, `styles.css`, and `app.js` to your repository
2. Go to Settings → Pages
3. Select branch (main/master) and root directory
4. Save and wait for deployment

### Option 2: GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### Custom Domain (Optional)
1. Add a `CNAME` file with your domain
2. Configure DNS with your provider:
   - A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Or CNAME: `username.github.io`

## Customization

### Edit Links
In `app.js`, find `generateLinksContent()` and modify the `links` array:

```javascript
const links = [
  { icon: '🐙', title: 'GitHub', desc: 'Your description', url: 'https://github.com/username' },
  // Add more links...
];
```

### Change Theme Colors
In `styles.css`, edit the `:root` variables:

```css
:root {
  --phosphor-primary: #00ff41;  /* Main green */
  --phosphor-dim: #00cc33;      /* Dimmer green */
  --phosphor-bright: #66ff88;   /* Brighter green */
  /* ... */
}
```

### Add New Windows
In `app.js`, add to `initializeWindows()`:

```javascript
this.createWindow('myapp', {
  title: 'My App',
  icon: '🚀',
  x: 200,
  y: 200,
  width: 500,
  height: 400,
  content: '<div>Your HTML content</div>',
  showInStart: true
});
```

### Adjust CRT Effects
In `styles.css`, modify CRT parameters:

```css
:root {
  --crt-intensity: 0.85;      /* Overall effect strength */
  --scanline-opacity: 0.15;   /* Scanline visibility */
  --slotmask-opacity: 0.08;   /* Slot mask strength */
  --vignette-strength: 0.4;   /* Edge darkening */
  --static-opacity: 0.03;     /* Noise intensity */
}
```

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License
MIT - Feel free to use and modify for your projects.

## Credits
Built with vanilla JavaScript, CSS Grid, and custom animations. No frameworks required.
