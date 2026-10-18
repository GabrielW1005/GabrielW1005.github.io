# Microcosm 2 — Living worlds

A dependency-free Canvas game at https://gabrielw1005.github.io/microcosm/.

## This release

- Full-screen, colorful habitat with compact icon controls, optional labels and an optional biology panel.
- Five organism models: amoeba, Paramecium, Didinium, Bacillus-like bacterium, and a separate composite T6SS bacterium.
- Damped deformable membranes, visible pseudopod enclosure, internal food vacuoles, gradual digestion, current advection, Brownian particle motion, dissolution, and diffusing toxin fields.
- A 6000 × 4200 schematic world with algal gardens, silt passages, saline margins and bacterial blooms. These are connected habitats, not separate levels. A new run can begin in any habitat.
- Colony selection by click, drag rectangle, Shift-click, Q, Tab, number keys or the cell row. Click destinations or prey to issue orders. WASD / arrows override orders.
- Up to 24 controllable colony cells. Division animates, partitions resources and retains both daughters. Losing the focused cell transfers control to another surviving cell.
- Opponents use local resource/threat searches, obstacle-aware A* routes, avoidance, feeding, species-specific combat, and resource-dependent division. Population caps and replenishment keep the open ecosystem bounded.
- Eleven available variant categories, limited by organism, with levels and tradeoffs. Selected mutations become heritable at division. Compatible bacterial DNA can be collected during competence and integrated after a delay, with a chance of degradation.
- Simplified Paramecium conjugation exchanges existing variants without increasing the population.
- Local autosave every eight seconds and on page leave, separate organism slots, previous-snapshot recovery, JSON backup/import, and compressed save links.

## Controls

| Control | Action |
| --- | --- |
| Click your cell / Shift-click | Select / add to selection |
| Drag empty world | Rectangle-select a group |
| Click destination or prey | Navigate / pursue |
| Right-click | Issue an order, even on a friendly cell |
| WASD / arrows | Direct movement of selected cells |
| Space | Organism-specific ability |
| R | Divide ready selected cells |
| Q / Tab / 1–9 | All cells / cycle / numbered cell |
| G | Mutation and DNA variants |
| E | Bacterial competence |
| Z | Pair two nearby selected Paramecia |
| P / Escape | Pause / close a panel |
| Scroll / + / − | Zoom |
| Map click / double-click | Look / send selected cells |

Touch supports tapping to select or move, dragging a selection box, and the bottom action controls. Forage/Hold toggles autonomous colony behavior. Auto toggles automatic abilities; manual actions remain available. Speed cycles through 0.75×, 1×, 1.35× and 2×. Movement is also faster than in v1.

## Persistence and compatibility

New local slots use `microcosm.v2.<organism>`. Old `microcosm.v1.*` slots are never overwritten. A v1 lineage can migrate its resources, generation, progress, integrated variants and up to 23 siblings into a fresh large world. Old world geometry and transient effects cannot map exactly to the new simulation. `classic.html` retains the original game.

JSON saves retain the complete world and cell state. Save links use gzip + URL-safe Base64 in the URL fragment. They preserve the world, colony, progress and processes, rounding non-integer values to three decimals and reconstructing transient membrane/organellar motion on load. A full initial-world link measured about 32 KB in local checks. Some messaging services truncate long links: JSON is the reliable fallback. No cloud service or account stores these saves. There is no progress while the page is closed.

Imported snapshots are validated before replacement. A linked snapshot opens with an explicit load action. A living previous snapshot remains available if a colony dies. Clearing browser storage removes local progress; changing browsers/devices requires a link or JSON import.

## Files and verification

- `engine.js`: deterministic fixed-step model, AI, physiology, progression, save validation.
- `render.js`: procedural Canvas rendering.
- `app.js`: UI, input, persistence and link codec.
- `style.css`, `index.html`: responsive interface.
- `classic.html`: retained original standalone version.
- `BIOLOGY.md`: research grounding and scientific limitations.
- `TESTING.md`: checks actually performed and unverified areas.

No build or install is required for the game. Serve the directory as static files. Run the core tests with `node --test tests/model.test.cjs`. The DOM/canvas smoke harness additionally requires `@napi-rs/canvas` and uses `CODEX_PRIMARY_RUNTIME_NODE_MODULES` to locate it in the authoring environment.

This is a biologically informed game, not a quantitative cellular or fluid simulation. The optional in-game guide distinguishes mechanisms from gameplay abstractions.
