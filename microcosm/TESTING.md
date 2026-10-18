# Verification — Microcosm 2.1

Performed with Node 24 and native Canvas rendering. **No actual browser or Chromebook interaction/layout test was available for this release.** The DOM harness is a wiring check, not a browser substitute. Previous v1 browser-verification claims do not apply to v2.

## Automated model checks

Run `node --test tests/model.test.cjs`.

1. Amoeba prey persists during enclosure; biomass arrives during digestion afterward.
2. A dying captor releases unconsumed prey.
3. Division conserves stored biomass, retains both daughters, selects both, and transmits a queued variant.
4. Loss of the focused colony cell transfers control to a survivor.
5. Didinium and T6SS attacks require contact-range targets; the injector does not attack its faction.
6. Chemical fields spread and spare their producer's faction while affecting a rival.
7. Incompatible DNA does not grant a trait; compatible DNA can be collected and integrated.
8. A* finds a route around a blocking obstacle with segment clearance.
9. Movement rapidly damps after propulsion stops.
10. Conjugation shares modeled variants without increasing cell count.
11. Saline exposure causes negative water balance; osmoregulation reduces the imbalance.
12. The same food yields less energy under hypoxia.
13. Competitors acquire resources and divide.
14. Save validation accepts all five lineages and mid-division state; corrupted membrane data is rejected.
15. v1 migration preserves selected progress and kin without changing the old input.
16. Compressed link snapshots round-trip and malformed tokens are rejected.
17. Concurrent division requests reserve slots and respect the 24-cell colony cap.

## App and rendering checks

- JavaScript syntax checks for all three scripts.
- DOM wiring harness: startup, Enter action, animation frame, variants/saves/help panels, local save, pause/resume, and a full-world compressed link round-trip.
- A native Canvas frame at 1366 × 768 was generated and visually inspected, including an amoeba enclosing an alga, internal organelles, neighboring cells, particles and rocks.
- Full-population simulations for all five organisms ran for ten simulated seconds and produced valid save snapshots. These are brief stability checks, not a long-term balance study.
- Link snapshots reconstruct transient membrane and organelle positions. An initial world compressed to approximately 32 KB of URL characters in the local app harness; length varies with world state.

## Remaining limits

Actual browser rendering, DOM layout at mobile/Chromebook sizes, browser clipboard permissions, actual download dialogs, hardware performance and prolonged game balance require playtesting. The responsive CSS and browser API fallbacks are implemented but are not claimed to be verified on physical devices. Biological parameters and effects remain schematic, as described in BIOLOGY.md and the in-game guide.


## 2.1 control and performance verification

All 23 model checks pass, including six additional regressions: selected cells do not forage on their own; releasing keys stops autonomous movement; click destinations finish and remain settled; unselected cells can forage independently; old v2 saves migrate to calm controls without losing the player; and new runs have a quiet opening buffer. The app harness also exercises Stop and X and verifies that a delayed frame cannot trigger unbounded simulation catch-up.

Local Node/native-Canvas measurements (1366 × 768, single run, not physical Chromebook FPS):

| Measurement | Previous build | 2.1, same initial saved world | 2.1, new lighter world |
| --- | ---: | ---: | ---: |
| CPU time for 5 simulated seconds | 1,819 ms | 269 ms | 72 ms |
| Native canvas draw time/frame | 4.02 ms | 2.41 ms | 0.84 ms |
| Route searches over 5 simulated seconds | 629 | 65 | 44 |

The measured existing-world simulation used about 85% less CPU time. Simulation frequency changed from 60 to 30 Hz; distant cells also update less often. Gameplay behavior differs intentionally, so these are workload measurements, not a controlled hardware benchmark. Rendering now targets 30 frames/s and uses a 1× pixel ratio. Full browser UI, GPU/compositor behavior and actual Chromebook performance remain unverified. The simplified canvas scene was rendered and visually inspected locally. Full-world save-link and local-save smoke checks pass.
