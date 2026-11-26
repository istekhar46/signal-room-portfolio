# Design System — Signal Room

Documented from the built implementation of Istekhar Khan's Voice AI Engineer portfolio (`src/app/globals.css`, `src/app/layout.tsx`, and `src/components/*`).

## Visual World
**Signal Room** — Japanese broadcast studio instrumentation fused with stark anime-inspired editorial motion design. Every color, line, and animation carries operational state rather than decoration.

## Color Tokens

| Role | Token | Hex | Usage |
|---|---|---|---|
| Ground | `--color-ground` | `#0B0D10` | Primary page canvas, inner technical schematic surfaces |
| Surface | `--color-surface` | `#12161C` | Anodized slate containers, Stage Panel drawer, Voice Lab, timeline chassis |
| Elevated | `--color-elevated` | `#171C24` | Active selections, notice strips, hover states |
| Hairline Border | `--color-hairline` | `#232934` | Structural 1px grid rules, dividers, schematic borders |
| Strong Border | `--color-hairline-strong` | `#323B49` | Interactive button outlines, Stage Panel edge, Agent Dock border |
| Primary Ink | `--color-ink` | `#F2EFE9` | Warm broadcast white for headlines, active labels, primary copy |
| Secondary Ink | `--color-ink-secondary` | `#B8BFC9` | Body prose and descriptions (≥4.5:1 on ground and surface) |
| Muted Ink | `--color-ink-muted` | `#8B939E` | Coordinates, timestamps, inactive states |
| Active Signal | `--color-signal` | `#FF5A1F` | International vermilion-amber: primary CTA, speaking/executing state, playhead, RPC trace |
| Acoustic Mint | `--color-mint` | `#38D9A9` | Oscilloscope phosphor mint: live listening mic state, active/online status, selected clip |

## Typography

Loaded via `next/font/google` in `src/app/layout.tsx`:
- **Display & UI Sans:** `Archivo` (`--font-archivo`, weights 400–800). Hero display at `clamp(2.25rem, 5vw, 4.75rem)`, line-height `0.98`, tracking `-0.03em`. Three deliberate lines retain their intended grouping on desktop and mobile.
- **Editorial Chapter Titles:** `Shippori Mincho` (`--font-mincho`, weights 400–700). Section headings, philosophy statement, and OpenCalls/project Stage Panel headers.
- **Technical Telemetry Only:** `JetBrains Mono` (`--font-mono`, weights 400–600) with `font-variant-numeric: tabular-nums` (`.telemetry-nums`). Used strictly for real measurements (`ms`), RPC action signatures, state labels, timeline ruler years, and stack identifiers.

## Component Grammar
- **Opening hierarchy:** Explicit identity follows the headline. The primary action opens the available call lab; guided tour and resume are secondary. When live voice is unavailable, the acoustic core opens the lab and explains the unavailable voice state. Configured voice sessions retain their persona and input controls.
- **Call model (`src/components/voice-systems-lab.tsx`):** A control plane shows the published prompt beside an immutable call snapshot. The execution plane exposes a timed turn and interruption; an adjacent event trace shows keyed event deduplication. Mint identifies execution and accepted events; amber identifies intervention and cancellation. The model and its timings/signal are explicitly labelled illustrative. A scoped GSAP clock updates the playhead without rendering the page on every animation frame; reduced motion keeps discrete states and controls usable with a static playhead.
- **Progressive audio workbench:** The original STFT, barge-in, and latency instruments remain inside a native expandable workbench under the call model. Instruments mount only when opened. The expansion affordance uses the existing Lucide icon language.
- **Page navigation:** Ordinary header links follow page sections with real hash anchors. Explicit project, architecture, and writing inspection actions open the Stage Panel. The section rail follows the page's order.
- **Zero rounded-card template grids:** Projects use a flagship feature + horizontal index rows; Stack uses a 1px hairline architectural grid; Experience uses a DAW-inspired multitrack timeline on desktop (vertical list on mobile).
- **3D Acoustic Iris (`src/components/acoustic-iris.tsx`):** Single WebGL canvas via React Three Fiber (`dpr={[1, 2]}`) with brushed metallic aperture rings, 72 radial calibration ticks, tactical crosshairs, and dual FFT-driven harmonic waveform rings (`#38D9A9` mic, `#FF5A1F` agent speech). Automatic SVG fallback when WebGL is unavailable.
- **Stage Panel (`src/components/stage-panel.tsx`):** Single active right-docked drawer (`60%` desktop, full sheet mobile) opened with a GSAP diagonal clip-path shutter wipe (`power4.out`). Focus-managed, `Esc` closes and notifies the LiveKit agent.
- **Agent Dock (`src/components/agent-dock.tsx`):** Full-width bottom strip (never a corner chatbot bubble) housing `<MiniAcousticIris />`, `aria-live` captions, mute/text/log/end controls, and the collapsible **Signal Trace** telemetry bar (visible by default).
- **Tactical Target Lock (`.target-locked`):** Vermilion-amber corner brackets + hairline inset triggered by `highlight_content` RPC actions.

## Browser Surface & Accessibility Rules
- Custom dark scrollbars, `#FF5A1F` caret and `:focus-visible` outlines, translucent vermilion text selection, `4px` link underline offset.
- Full `prefers-reduced-motion: reduce` support: disables WebGL spin/drift, scan sweeps, signal beam, and shutter clip-path transitions in favor of clean cross-fades.
