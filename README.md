# ☢ TERMLINK — CRT Bioprofile

A Fallout-style RobCo terminal as a personal bio/link site. Vanilla HTML/CSS/JS —
no frameworks, no build step, no dependencies, no audio files. Made for GitHub Pages.

```
ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL
PERSONNEL FILE // "HOPPCX" — AUTHORIZED PERSONNEL ONLY
[1] STATS  [2] LINKS  [3] LOADOUT  [4] TERMINAL  [5] ▒▒▒▒▒
```

## Features

**A desk, not just a screen.** On load you're looking at a RobCo RT-3000 sitting
on a worn desk in a dark room — keyboard, coffee mug, sticky note, holotape,
cable off-frame — with the live terminal glowing on the curved glass. The whole
room is CSS on a fixed design canvas; a single transform is the "camera".
Click the glass (or `FOCUS`) to dolly in until the screen fills the viewport,
`ESC` (or `DESK`) to pull back; your last view is remembered. The screen's
phosphor light spills onto the desk, keyboard and bezel and follows the theme
color. Gentle pointer/tilt parallax sells the depth, and the physical power
button on the chin does exactly what you hope it does.

**CRT, in layers.** The picture is composited from a phosphor text layer plus
stacked overlays: RGB aperture grille, scanlines, a slow vertical sweep, animated
static (a tiny canvas painted at ~24 fps), glass glare, vignette, and tube-edge
shadowing. Add a power-on tube collapse with degauss wobble, phosphor flicker,
random horizontal sync jolts, and a glowing block cursor. `FX OFF` drops the
whole production down to a plain, full-viewport terminal.

**A real command line.** Typing anywhere lands in the prompt — even from the
desk view. `HELP`, `THEME`, `OPEN <n>`, `SOUND`, `FOCUS` / `DESK` (camera),
`FX ON|OFF`, `WHOAMI`, `MOTD`, `REBOOT` (power-cycles the tube), plus a few
commands that are better discovered than documented. Command history with ↑/↓,
tab switching with keys 1–5, row selection with arrows + Enter.

**The hacking minigame.** Tab 5 is an encrypted partition. `HACK` drops you into
the classic RobCo password game: ten candidate words hidden in a hex dump, four
attempts, likeness feedback, and matched bracket pairs that remove duds or
replenish your allowance. Fail and the terminal locks you out; win and you
permanently unlock the VAULT page and the `OVERSEER` phosphor theme.

**Synthesized audio.** Every sound — key clicks, navigation blips, denial buzzes,
the access-granted chime, the mains hum, the (aborted) nuclear detonation — is
generated live by the Web Audio API. There are no audio files in this repo.

**Four phosphor themes.** `GREEN`, `AMBER`, `BLUE`, and the unlockable
`OVERSEER`, all driven by CSS custom properties.

**The boring-but-important parts.** The terminal stays real, accessible DOM in
every view — selectable text, working inputs, screen readers. Keyboard
accessible (real buttons/links, focus styles, native Tab/Enter preserved),
`prefers-reduced-motion` support (skips typing, static, flicker, parallax and
the power-on theatrics), responsive down to phones (the desk crops in close;
zoomed view goes full-screen), state persisted in `localStorage` (theme, sound,
view, FX, vault unlock), and a `<noscript>` fallback. No images, no 3D
libraries — the entire scene is CSS gradients and one inline SVG cable.

## Files

```
index.html        markup shell: room → desk → monitor → effect layers
styles.css        themes, the desk scene, and the entire CRT effect stack
js/config.js      ← ALL profile content: name, bio, links, loadout
js/main.js        boot orchestration + global keyboard router
js/scene.js       the camera: desk/focus views, parallax, power button
js/ui.js          tabs, page renderers, themes, vault flow
js/terminal.js    prompt line + command set
js/hack.js        the password minigame
js/boot.js        POST/boot typing sequence
js/audio.js       Web Audio synthesizer
js/fx.js          static, jolts, power transitions
js/dom.js         tiny DOM helpers
```

## Customizing

Edit **`js/config.js`** only — name, role, bio, S.P.E.C.I.A.L. values, links,
loadout, and the vault page text all live there.

Theme colors live at the top of `styles.css` (`body[data-theme="…"]` blocks).
Add a block + add its name to `THEMES` in `js/config.js` to ship a new phosphor.

## Running

It's ES modules, so it needs to be served over HTTP (opening `index.html` via
`file://` won't work):

```sh
npx http-server .        # or: python3 -m http.server
```

### GitHub Pages

Push to `main`, then Settings → Pages → deploy from branch → `main` / root.
Nothing to build.

## Controls

| Input | Action |
| --- | --- |
| `1`–`5` | switch tabs |
| `↑` `↓` | select rows / command history |
| `Enter` | activate selection / run command |
| `Esc` | clear prompt / back to STATS / back to the desk / abort hack |
| click the glass | dolly in (interactive rows/buttons still work in desk view) |
| power button | power-cycle the tube |
| any typing | goes to the prompt |

## License

MIT.
