# Interactive systems experience

## A. Original Requirements

- Analyze the portfolio, research ideas, and implement improvements that make visitors feel awe while demonstrating technical ability and creativity.
- Confirmed focus: **Voice AI and distributed systems, demonstrated interactively**.
- Preserve the established Signal Room identity and verified professional facts. Agent deployment remains deferred.
- Acceptance: a compelling, usable first viewport; a functioning interactive systems demonstration; desktop/mobile/keyboard/reduced-motion verification; type/build checks; no invented production measurements or provider calls.

## B. Technical Assessment

- Existing Next.js 16 / React 19 site uses GSAP, Motion, Three.js, and a shared allowlisted UI action contract. Reuse these; add no dependencies.
- Live browser audit at 1440x1000: more than 30 first-screen controls; hero 804px high; About 820px high before the 1361px Voice Lab. Primary voice CTA is unavailable while agent deployment is deferred. Hero heading wraps its intended middle line again at desktop widths.
- Existing strengths to preserve: interactive WebGL core, audio spectrogram, latency playground, OpenCalls topology, project drawers, writing, timeline, and guided tour.
- Research: [Bruno Simon](https://bruno-simon.com/) makes creative development directly explorable; [Bartosz Ciechanowski, Sound](https://ciechanow.ski/sound/) teaches mechanisms through direct manipulation. Inference for this portfolio: make system guarantees something a visitor can exercise immediately, with explanations beside the result.
- Design approach: simplify the hero, foreground identity and an available call-lab action, make the existing Voice Lab lead with a new systems model, and progressively disclose its advanced audio tools. Reduce About spacing. Retain live voice controls when configured and preserve offline browseability.
- New model contracts: a turn captures the current prompt version at start; publishing changes the next version without mutating the active snapshot; interruption cancels pending work; stale callbacks cannot modify another run; duplicate completion deliveries apply one local side effect per run.
- This is an explicit browser model, not a simulated claim of live AI, actual backend fault injection, billing behavior, or measured production latency. Model events and timings must be labelled.
- GSAP React Context7 documentation verifies scoped `useGSAP`, context-safe event handlers, and cleanup. Official skill guidance is loaded for React/timeline animation. React performance guidance favors contained state and no whole-page updates on animation frames.
- Impeccable launcher is unavailable because its engine cannot install in the sandbox. Read PRODUCT.md, DESIGN.md, the new-work guidance, and craft floor directly; verify with Playwright instead.
- Existing lint command is blocked by missing ESLint flat config; disclose it unless resolved within scope.

## Direction contract

- **THESIS:** Visitors operate a small voice system and discover its guarantees. The artifact earns attention through consequences they can understand.
- **OWN-WORLD:** Preserve graphite, vermilion, mint, Archivo, Shippori Mincho, and JetBrains Mono for real event data. Extend the broadcast instrument language with a call recorder and two clearly named system planes.
- **STORY:** Recognize Istekhar and his work, start a call model, interrupt it or alter its configuration, then inspect the projects behind those decisions.
- **FIRST VIEWPORT:** Three deliberate headline lines and clear identity on the left; existing acoustic core on the right. One primary call-lab action, a guided-tour alternative, and resume access. Unavailable voice configuration stops dominating the opening.
- **FORM:** Extend the existing surface and component vocabulary; seed: none (pinned), "keeping the existing Signal Room style" and confirmed focus on interactive Voice AI/distributed systems.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## C. Implementation Checklist

- ISE-1 DONE: Inspect the live experience and repository, research primary references, confirm visitor focus, and record direction.
- ISE-2 DONE: Implement and test the isolated call model and interactive recorder.
- ISE-3 DONE: Integrate it into Voice Lab; simplify hero/offline presentation; preserve advanced tools and tour behavior.
- ISE-4 DONE: Verify model invariants, production build/types, desktop/mobile/keyboard/reduced-motion behavior, and final visual hierarchy.
- ISE-5 DONE: Record evidence and publish the updated frontend through the established GitHub/Render flow.

## D. Work Evidence

- Initial live screenshots captured under ignored `.playwright-mcp/before-experience-desktop.png`.
- Browser audit confirmed the existing production site has no console errors and an existing Three.js Clock deprecation warning.
- Added `src/lib/call-lab.ts` and four meaningful Node invariant tests (`node --test src/lib/call-lab.test.mjs`), all passing. No dependencies added.
- Added `VoiceSystemsLab`: scoped GSAP turn clock, immutable prompt snapshots, cancellable generation, stale-run guards, keyed event deduplication, and a visible bounded event trace. Timings and signal are explicitly illustrative; no network/provider calls.
- Voice Lab now follows the hero and leads with the systems model. Original spectrogram, barge-in simulation, and latency tools are preserved in a native expandable workbench and mount only when opened. A direct architecture inspection action connects the model to the existing OpenCalls case study.
- Simplified hero controls and headline wrapping, foregrounded identity, provided an available primary lab action while live voice is unavailable, and retained configured voice-session controls. Sound/terminal utilities remain in the command launcher and mobile menu.
- Ordinary desktop/mobile navigation now uses hash links and scrolls to the page content rather than opening an unsolicited drawer. Explicit inspection controls still open drawers. Navigation rail order follows page order; acoustic core activation has a real keyboard-accessible button.
- First browser pass verified prompt publishing while the original snapshot stays pinned. Found an SSR/client floating-point difference in generated waveform coordinates; rounded these visual coordinates to integers to resolve the actual hydration mismatch.
- TypeScript and initial production build passed. Final build and complete browser interaction matrix are in progress.
- Production browser matrix passed: model snapshot pinning, interruption remaining cancelled beyond the original turn deadline, next-call prompt capture, four completion deliveries producing one side effect, advanced latency workbench, architecture drawer/Escape, ordinary navigation without drawers, mobile menu, and keyboard activation.
- Verified desktop 1440x1000, mobile 390x844, and tablet 768x1024 without horizontal document overflow. Reduced-motion test confirmed the playhead remains unchanged while stage transitions and cancellation still work. Production browser has zero errors; only the preexisting Three.js Clock deprecation warning remains.
- Visual inspection found double scroll offsets (global scroll padding plus new section margins); removed the redundant section margins before final capture. No design-system tokens, typefaces, factual portfolio data, or agent implementation were changed.
- Final production build passes. Additional browser checks passed for interruption during the speaking stage (remaining cancelled after the original deadline), guided-tour startup of the new model, preserved terminal shortcut, command launcher, and configured voice UI with all three personas. Configured UI was tested by stubbing status only; no live voice connection was attempted.
- Final desktop/mobile/tablet captures are `.playwright-mcp/ise-desktop.png`, `ise-lab-desktop.png`, `ise-mobile.png`, `ise-lab-mobile.png`, and `ise-tablet-reduced-motion.png`. Component crop excludes the sticky page header; full viewport captures retain it.
- Independent Impeccable finish review is running in a fresh agent, as explicitly required by the skill. Automatic detector is unavailable with the missing engine; the reviewer has the craft-floor reference and all capture paths.
- Independent review accepted the technical thesis, material, typography, established identity, honest lab labels, and visitor story. Requested a Lucide workbench expansion icon, visitor-facing offline-core guidance, and documentation updates. Applied both UI fixes and documented this task's hero sizing, call model, navigation, and workbench in DESIGN.md.
- Pre-existing drift: DESIGN.md's older palette table differs from the baseline CSS values. This task changes no palette tokens; preserved that table and reported the discrepancy, following the skill's explicit instruction not to repair pre-existing drift during an ordinary extension.
- Final independent verdict: `ship` for the scored correction batch. Reviewer scored all three requested fixes resolved, accepted all final captures, and observed no regression from that batch. This is not a claim of whole-surface certification or an award-level aesthetic result.
- Final production build/type checking and diff whitespace checks pass. No provider secrets, new packages, hosting configuration files, or agent worker changes were introduced.
- Reviewed source changes pushed as `2bc42457bd72df86b670aa7f77c96d6aa14f03ee` on `feat/interactive-acoustic-upgrades`. Render automatically started `dep-dc4782i9lscs73dvpskg` from that exact commit (`trigger: new_commit`).
- Render CLI confirms `dep-dc4782i9lscs73dvpskg` finished with `status: live` for that exact source revision.
- Public browser verification at https://signal-room-portfolio.onrender.com passed: homepage 200, new lab heading and visitor-facing core caption, active snapshot pinning after prompt publication, interruption during speaking, repeated completion delivery (2 deliveries / 1 side effect), correct public social-image origin, mobile menu/hash navigation without a drawer, no horizontal mobile overflow, and zero console errors. The existing Three.js Clock warning remains.
- Agent deployment remains deferred. Lint remains blocked by the pre-existing missing ESLint configuration; no full-application lint pass is claimed. No real voice/provider session was exercised.

## E. Recovery State

- Complete: source `2bc42457bd72df86b670aa7f77c96d6aa14f03ee` is live and publicly verified. The final documentation-only update records the evidence; ignored `docs/**` does not trigger a rebuild.
- All changes from the prior deployment are committed; current starting source branch is `feat/interactive-acoustic-upgrades` at `607c7d4`.
- Existing frontend: https://signal-room-portfolio.onrender.com, Render service `srv-dc46p4vf3r2c73af9060`.
- No agent worker changes or secret transfers are required.
- The pre-existing user dev server on port 3000 was left untouched. Local production verification used port 3100 with empty voice variables; that temporary server has been stopped. Public production verification used no status stubs.
