# Apex Afterhours — experiment 05

**An original, unofficial ADE-inspired dance-floor rendition of the 2024 Dutch GP.** No festival logo, artist recording, sampled commercial track or driver endorsement is implied.


## Festival Set / version 2.4

The new **Sound system** rack remixes any of the 20 drivers into **Uplifting trance, Psytrance, Acid techno, Disco house, Melodic techno, Hardgroove or Drum & bass**. “Driver signature” retains the curated per-driver identity. These are original generative arrangements, not licensed ADE playlists or artist recordings. Presets change rhythm, bass patterns, harmony treatment, timbre, swing and tempo—not just colors. Driver roots/motifs remain identifiable, with small per-driver tempo offsets.

### Performance controls

- **Auto VJ (on by default):** crossfades through a genre-specific pattern family every four bars. Tunnels, kaleidoscopes, checkerboard floors, auroras, vortexes, orbital shapes and laser grids evolve on the musical clock. Spectrum bands add movement/brightness; the radial meter reflects actual output.
- **LED track sequencer:** sixteen gates around the recorded circuit follow the score's sixteenth-note grid. Bass ripples and spark trails originate near the focused car. Gear changes add quantized percussion accents; car motion is never sped up to fake a musical drop.
- **DRS DROP / B:** schedules a noise-riser build to an upcoming bar, followed by four bars of boosted musical energy. “DRS” is a playful musical effect, not a command to a car or a claim about observed DRS activation. A visible countdown and drop banner follow the same audio timeline.
- **Lap drops (on by default):** when the focused recorded lap loop wraps, it may queue a musical drop at the next suitable bar. It does not invent a race event. A pending driver/genre cue or existing boost takes priority.
- **Auto DJ:** changes driver every eight musical bars, following the recorded fastest-lap order (NOR → HAM → RUS → …). It keeps the chosen genre; lap playback continues. The silent rehearsal also cycles correctly without creating an AudioContext.
- **Flash accents:** OFF by default. Enabling requires a separate warning/confirmation. Accents are restricted to track/corner lighting, gated to every other beat and additionally limited by a 750 ms cooldown. There is no full-screen white-out. This is not a universal photosensitivity-safety guarantee.
- **Calm lights / C:** immediately disables flash accents and reduces pattern/spectral/laser motion. OS reduced-motion preferences also disable flashing. Normal mode still contains rhythmic glow; use Calm or pause if light/motion-sensitive.
- **Keyboard:** Space = play/pause (outside inputs/buttons), M = music mute, B = musical drop, F = performance theatre, C = emergency Calm. Driver and genre selectors remain available in theatre/mobile.

### What “synced” means

When music is playing, beat/bar/step timing comes from **AudioContext.currentTime**, not a separate visual timer. Scheduled kick/hat/shift events drive accents; the output analyser supplies low/mid/high energy. Genre/driver changes activate on bar boundaries and crossfade. Scheduler recovery realigns to the audio grid after a delay. Muted music can retain score-clock choreography while the real spectrum is silent; “Visuals only” uses a labeled preview clock instead. Recorded car trajectories keep their own historical lap times.

The render loop is display-frame dependent, so sample-perfect audiovisual latency or a fixed frame rate is not promised. Pause holds the visual phase; returning to playback begins a new musical phrase while the recorded car clock continues.

### A short showcase

Pick **Psytrance**, enter the floor, and expand. Let Auto VJ morph the scene. Trigger **DRS DROP**, then try **Disco house** to hear the swung rhythm/chord stabs or **Drum & bass** for a genuinely different broken-beat pattern. Enable Auto DJ for an unattended fastest-lap lineup. Flash accents are optional; the energetic default does not require them.

## Enter the floor

Open **Apex Afterhours** in Experiments, the fifth Overview card, the desktop **Afterhours / NEW** shortcut, or `#afterhours` on the app URL.

1. Click **Enter the floor** to start the lap loops and create the browser audio engine. Nothing plays before your click.
2. Select a driver from the lineup, the on-deck dropdown or a car on the map.
3. While music plays, switches are queued to the **next bar** and crossfaded. The driver's palette, pattern, title, key and tempo change with the musical cue; car playback does not restart.
4. Try NOR → GAS → RIC → LEC for markedly different melodic trance, psychedelic trance and house signatures.
5. Use **Drums / Bass / Lead / Pads** to mute individual layers, adjust **Mix energy**, or mute the whole mix. Volume starts at 25%, with a conservative UI ceiling.
6. Expand the floor for a larger presentation. The driver selector, play/pause, mute and volume stay available. Escape exits.

**Visuals only** lets you run the floor without creating an AudioContext. The same experiment works on a mobile-sized layout. Leave the page or hide the browser tab and the music is stopped/paused; leaving disposes the audio context.

## Which laps are used?

One **official fastest race lap for each of all 20 drivers**, not their all-time personal best and not qualifying. The endpoint joins the Jolpica classification's fastest lap number/time to the corresponding OpenF1 lap and requires the durations to agree exactly. It extracts actual location/car-data records from the already bundled shared-clock archive, including the observations that bracket each lap's start and end.

All 20 best laps have complete bracketing coverage in this release. The data remains recorded historical data, while the art/music is deliberately generative.

- NOR: lap 72 / 1:13.817
- VER: lap 30 / 1:14.752
- LEC: lap 62 / 1:14.585
- PIA: lap 36 / 1:14.237
- HAM and RUS use their actual soft-tyre best laps; compounds and lap numbers are not forced to match the four comparison ghosts.
- Every driver's selected lap number, time and compound are shown in the lineup or focused lap card.

## What the moving cars mean

**Dance formation** intentionally offsets each driver's lap phase to spread the cars around the circuit. It is a visual arrangement, not race order or a synchronized actual race replay.

**Aligned starts** removes the offsets. Restart brings all best laps to their own lap time zero; they then loop at their individually recorded durations. Different lap conditions remain different.

Positions use the recorded XY, with the existing short-gap interpolation/outlier rules. The decorative lights and background patterns never move a car away from its data path. The optional map labels and selected-car highlight make every driver accessible; the dropdown/lineup provide keyboard alternatives to the canvas.

## Twenty original musical signatures

Each driver has a deliberately assigned title, genre family, tempo, key/mode, chord progression, lead motif, bass rhythm, timbre, palette and patterned background. These are **creative profiles**, not inferred personality, actual musical tastes or recorded driver soundtracks.

The browser composes the music with native Web Audio:

- Four-on-the-floor synthesized kicks, noise-based hats/claps and rhythmic bass.
- Pitched melodic/arpeggiated lead voices and sustained harmonic pads.
- Delay, reverb, kick-sidechain-style ducking and a master dynamics compressor.
- A 32-bar arrangement moving through DRIVE, LIFT, BREAK and DROP.
- One managed audio context; only the selected musical identity is active, with a brief crossfade when switching. It does not play 20 full mixes simultaneously.

The original driver-signature families are melodic/uplifting trance, driving dance, acid, psychedelic trance and house/progressive dance. The explicit genre rack adds the seven remix arrangements described above. Each of the 20 profiles has a distinct score/tempo/palette fingerprint. These are original generative instrumental grooves, not prerecorded studio releases.

### Telemetry modulation

The creative score is structured musically; measured values modulate it without turning raw RPM into an out-of-tune melody:

| Observation | Musical/visual response |
|---|---|
| Speed | Opens the lead filter |
| Throttle | Adds filter brightness |
| Gear | Chooses a higher/lower arpeggio register |
| RPM | Changes resonance and widens trance voices |
| Braking | Adds delay/echo presence |
| Selected identity and musical clock | Chooses the palette/pattern and controls gentle rhythmic glow |

Missing required telemetry uses neutral musical modulation, not invented instrument readings. The lap card continues to show only recorded/interpolated supported values. The circular spectrum display uses actual analyser output; the 16-step strip is a score sequencer, not a fabricated audio meter.

## Visual signatures and accessibility

The floor combines a neon circuit, 20 top-down car markers, short light trails, a decorative mirrorball, restrained moving light cones and families of aurora, tunnel, petal, orbit, grid, wave and radial patterns. Seeds and palettes differentiate drivers within each family.

- There is no full-screen strobe or rapid white flash.
- **Calm lights** reduces decorative motion, trails and spectral motion. OS reduced-motion preferences are respected initially and when they change.
- Cars still move when the user explicitly plays the lap visualization.
- Patterns are not certified safe for every light/motion sensitivity. Pause or use Calm lights if needed.
- User consent, mute, volume zero, pause, background visibility and navigation cleanup are tested using actual browser audio output.

## Architecture and offline operation

- `GET /api/afterhours`: approximately 160 KB of best-lap slices, metadata, notes and a circuit reference. It performs **no network requests** and checks source-file hashes.
- `src/afterhours.py`: official-best-lap matching and observed bracketing slices.
- `frontend/src/afterhours/profiles.js`: the 20 original musical/visual profiles and score definitions.
- `MusicEngine.js`: audio-clock scheduling, synthesis, effects, transitions, quantized drops/gear accents and lifecycle management.
- `genres.js`: seven genre recipes, identity-preserving remixes, VJ morph plans, spectral-band helpers and flash gating.
- `model.js`: recorded lap looping and visual phase arrangement.
- `DanceFloor.jsx`: 2D canvas rendering, palettes, pattern families and car picking.
- `Afterhours.jsx` / `afterhours.css`: UI, transport, lineup, theatre and responsive controls.

The credential-free `demo.py` profile supports this experiment. It does not need Elastic/Hopsworks keys, a music service, remote fonts or external media assets. Existing dashboard/cloud integrations and the original four ML/strategy experiments retain their previous scopes.

For a future GitHub Pages conversion, export `/api/afterhours` as static JSON and route this component's fetch through the static adapter. Music, visuals and playback already execute in the browser. Do not publish cloud credentials or describe the static edition as connected to cloud providers.

## Verification

Integration verification on **2026-10-20**:

- The full Python suite passed **322 tests**. This includes the 23 Afterhours lap/API tests and the credential-free demo endpoint check. The separate focused Afterhours + Vercel-runtime run passed **30 tests**.
- `tests/afterhours-model.mjs` passed **88** checks, including 12,000 recorded-driver frames.
- `tests/afterhours-genres-model.mjs` passed **172** genre, score, visual-plan and flash-gating checks.
- `tests/afterhours-browser.mjs` passed **50** browser checks, including genre-preset selection before consent, synthesized playback, pause silence, driver selection, responsive layout and cleanup. The measured peak was below 0.14 at the tested volume; this is not a speaker-loudness guarantee.
- `npm run build` emitted the lazy Afterhours JavaScript and CSS bundles. It reports the existing Three.js scene chunk above 500 kB.

The tests were run locally with Python 3.13 because Python 3.12 was not installed in the environment; deployment metadata still targets Python 3.12. Browser audio measurements establish functioning synthesis/control paths, not subjective musical preference or festival/artist acoustic fidelity.

To reproduce, start `python demo.py --host 127.0.0.1 --port 8000`, then run `python -m pytest tests/test_afterhours.py` from the project root and `npm run test:afterhours-model` / `npm run test:afterhours-browser` from `frontend/`. The model and browser scripts use `PITLANE_TEST_URL` if the local server runs on another port.

`qa/afterhours-festival-browser-results.json` and the `afterhours-festival-cli-*.js` scripts are supplied with the source folder; the 79-check managed-arena run they document was not repeated during this integration. The local 48-check result above is the browser evidence for this integration.
