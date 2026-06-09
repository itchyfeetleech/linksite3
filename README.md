# ☢ TERMLINK — CRT Bioprofile

A Fallout-style RobCo terminal as a personal bio/link site. Vanilla HTML/CSS/JS —
no frameworks, no build step, no dependencies, no audio files. Made for GitHub Pages.

```
ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL
PERSONNEL FILE // "ITCHYFEETLEECH" — AUTHORIZED PERSONNEL ONLY
[1] STATS  [2] LINKS  [3] PROJECTS  [4] TERMINAL  [5] ▒▒▒▒▒
```

## Features

**CRT, in layers.** The picture is composited from a phosphor text layer plus
stacked overlays: RGB aperture grille, scanlines, a slow vertical sweep, animated
static (a tiny canvas painted at ~24 fps), glass glare, vignette, and tube-edge
shadowing. Add a power-on tube collapse, phosphor flicker, random horizontal sync
jolts, and a glowing block cursor.

**A real command line.** Typing anywhere lands in the prompt. `HELP`, `THEME`,
`OPEN <n>`, `SOUND`, `WHOAMI`, `MOTD`, `REBOOT` (power-cycles the tube),
plus a few commands that are better discovered than documented. Command history
with ↑/↓, tab switching with keys 1–5, row selection with arrows + Enter.

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

**The boring-but-important parts.** Keyboard accessible (real buttons/links,
focus styles, native Tab/Enter preserved), `prefers-reduced-motion` support
(skips typing, static, and flicker), responsive down to phones, state persisted
in `localStorage` (theme, sound, vault unlock), and a `<noscript>` fallback.

## Files

```
index.html        markup shell + effect overlay layers
styles.css        themes, layout, and the entire CRT effect stack
js/config.js      ← ALL profile content: name, bio, links, projects
js/main.js        boot orchestration + global keyboard router
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
projects, and the vault page text all live there.

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
| `Esc` | clear prompt / back to STATS / abort hack |
| any typing | goes to the prompt |

## License

MIT.
