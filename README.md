# Aaryash Bhagankar — Cyberpunk Portfolio

A dependency-light, Vercel-ready portfolio focused on cybersecurity, DFIR, local AI and evidence-first systems.

## What changed in this pass

- the main name lockup now uses a **MagicUI HyperText-style scramble interaction** without changing the existing typography
- social links use the supplied **fanned glass-card interaction** for GitHub, LinkedIn and email
- the first four core builds stay as deliberate product cards: **RadixOS, RED Justice, VisionTrace and LOWKIE**
- the remaining eight systems now live in a **3D dossier constellation** instead of a generic card grid
- the previous “Codebase Index” block and topology diagram were removed
- project-logo scanner bars were removed from cards and dossier media
- every constellation node still opens the same full engineering dossier with source surface, architecture, capabilities and trust boundaries
- responsive fallback turns the 3D orbit into a horizontal snap rail on tablets/mobile
- GitHub Actions + Vercel static build config are included

## Cyberpunk visual additions

- **Sentinel–09**: an original procedural 3D drone exhibit below the hero, with armored/wireframe materials, mouse dragging, keyboard-accessible rotation buttons, and an optical scan animation.
- A terminal signal link leads into the exhibit; custom skyline, uplink, waveform, and transmission artwork extends the existing yellow/cyan visual language.
- The hero name scales to its available column to avoid overlapping the terminal.
- The new renderer is dependency-free, caps drawing at 30 FPS and device pixel ratio at 2, and stops animation when offscreen or in a hidden tab. Reduced-motion mode uses static renders and manual rotation; a local SVG supplies the no-JavaScript fallback.
- The additive implementation lives in `assets/ui/cyberpunk.css` and `assets/ui/cyberpunk.js`; the static build includes these with the other assets.

## FM.09 soundtrack and cursor

- Custom acid-yellow pointer artwork with an interactive targeting reticle on mouse/pen devices. Touch keeps native behavior; reduced-motion mode disables the trailing reticle.
- The original geometric **Frequency Architecture** visualizer uses the playing MP3's Web Audio frequency and waveform data. A persistent dock provides now-playing details and play/pause from anywhere; the full player near Contact includes seeking, volume, visual hold, and all three tracks.
- **Cyberpunk Metaverse Event by IKOLIKS_AJ always loads first and loops.** The other tracks are manual alternatives, and no last-track preference overrides the default. Initial volume is 12%. Pausing disarms gesture-based playback, so subsequent navigation does not restart music.
- Browsers may block audible autoplay until a click/tap. The site attempts playback and then uses the first eligible interaction or Play button to unlock it. Track files are hosted locally under `assets/audio/`; no streaming account or API key is needed.
- Geometry draws at up to 24 FPS only while music plays and the document is visible. The full sculpture skips drawing offscreen; reduced-motion mode keeps it static. No microphone access is used.
- Vercel uses the existing `npm run build` command and `dist` output directory (Framework Preset: **Other**). The build copies the audio, cursor artwork, and visualizer with all site assets.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

You can also run it with any static server because the live site has no runtime package dependency.

## Validate and build

```bash
npm run check
npm run build
```

The production output is written to `dist/`.

## Vercel

Import the repository into Vercel. `vercel.json` already points Vercel at:

- build command: `npm run build`
- output directory: `dist`

## GitHub

`.github/workflows/ci.yml` validates the JS/assets and builds the site on pushes and pull requests.

## MagicUI / shadcn note

The live hero uses a dependency-free port of the HyperText scramble interaction so the site stays fast and works as a static deploy. A React/shadcn-compatible source version is included at:

`components/ui/hyper-text.tsx`

To replace it with the registry version in a React migration, the requested command is already available as an npm script:

```bash
npm run ui:add:hyper-text
```

which runs:

```bash
npx shadcn@latest add @magicui/hyper-text
```

## Interaction map

- hero name: scramble/reveal on load and hover
- social fan: expands and straightens on hover/focus
- terminal: simulated authorized-lab recon sequence
- core projects: click to inspect
- 3D project orbit: hover to pause, click a node to inspect, manual pause/resume control
- command palette: `Ctrl/Cmd + K`
- OVERDRIVE easter eggs remain intact
- reduced-motion users get a static accessible version of the effects
