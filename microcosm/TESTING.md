# Verification — Microcosm 2.3

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


## 2.2 feeding and combat verification

All 28 model tests and both native Canvas geometry tests pass. The app harness passes, including clicking a food particle to issue a targeted feeding order and a full-world save-link round trip.

The new checks verify that prey stays outside until the cup closes, resources are not awarded before ingestion, saved captures resume, living ciliate prey is retained until closure, damage cues expire and respect invulnerability, digestion signals nutrient absorption, and new optional vacuole fields remain compatible with older saves. Across six headings and all three supported prey shapes, Canvas path containment confirms that food centers are outside the open cup and inside the sealed outline. Repeated rendering does not alter model state or create particles.

A native Canvas contact sheet was visually inspected at reach, wrap, closure, sealed-vacuole, inward-motion, digestion, dissolution and damage stages. The ordinary habitat and a deliberately crowded scene with 24 simultaneous captures and damage flashes were timed at 1366 × 768:

| Native draw workload | 2.1 | 2.2 |
| --- | ---: | ---: |
| Typical opening habitat, median of three batches | 0.91 ms/frame | 0.89 ms/frame |
| 24 simultaneous captures and damage cues | 4.26 ms/frame | 6.52 ms/frame |

These are local draw-only measurements, not Chromebook frame rates or a guarantee of hardware performance. The crowded case adds work for the more readable outline, while the ordinary habitat is essentially unchanged within measurement noise. The 30 Hz frame cap, coarse distant simulation and existing particle cap remain unchanged. No browser automation or physical Chromebook test was available.

## 2.3 organic engulfment and defense verification

All 41 model cases and all three native Canvas geometry tests pass. Added checks cover diet and relative size restrictions, small living bacteria entering the oral groove, reaching that groove from an approach order, open-cup escape swimming, automatic prey defense and cooldowns, exhausted versus motile prey, the sealed-cup and Didinium exceptions, capture interruption, injection resistance, bacterial threat avoidance, bounded mixed populations, and older saved captures without new fields.

Geometry checks verify asymmetric pseudopods without circular arc construction, prey-oriented elongated cups, containment only after closure at six headings for three prey shapes, and rendering that does not change model state. A native Canvas contact sheet was visually inspected through extension, closure, inward movement and digestion. The app harness passes, including blocked-target feedback, the captured Paramecium escape button, and full-world save links (about 15 KB in this run); it does not establish actual DOM layout or touch behavior.

Local native Canvas measurements at 1366 × 768 (median of three batches):

| Draw workload | 2.2 | 2.3 |
| --- | ---: | ---: |
| Typical opening habitat | 0.85 ms/frame | 1.15 ms/frame |
| 24 simultaneous captures and damage cues | 5.16 ms/frame | 6.37 ms/frame |

These are draw-only measurements, not Chromebook FPS. Starting ecosystem composition changed, so the opening scenes are not identical. The new splines and small escape indicators add some draw work but no particle system, physics solver or extra simulation loop. Existing caps remain. Actual classroom hardware performance and long-term ecological balance still need playtesting.


## 2.4 organism animation verification

52 checks pass (46 model tests, five native Canvas checks and the app wiring harness). New checks cover side-groove feeding, staged anterior ingestion, surface-based injector contact, bacterial absorption without food vacuoles, prey identity and legacy saves. All species action stages render without mutating model state or allocating simulation particles. A 16-panel native Canvas contact sheet was visually inspected.

A local 1366 × 768 draw benchmark measured opening scenes at 0.73–1.62 ms/frame; a crowded 24-actor scene changed from 3.27 to 4.40 ms/frame. These are noisy local native-Canvas measurements, not browser FPS or Chromebook results. Effects add drawing work but no fluid solver or extra particle simulation. Actual browser layout, input and classroom hardware remain unverified.

## 2.5 collision and survival verification

All 60 automated checks pass: the prior model/render checks, eight survival/contact tests, and the app harness extended to Guide tabs, environment readout and rendered FPS. New cases cover touching and coincident cell separation, food displacement, elongated rock contact, stationary prey anchors including save round trips, starvation and feeding recovery, thermal demand, hypoxia, salinity, depleted reserves, oxygen competition and legacy environment migration.

A native Canvas six-stage contact sheet was inspected for capture at encounter position, closure, internalization, cell separation and solid-food pushing. Thirty simulated seconds were run for all five lineages and their saves reloaded. Following broad-phase optimization, an amoeba-world run averaged 1.38 ms per simulation tick on the local runtime. This is not a browser FPS measurement or a Chromebook guarantee. Actual browser layout/input and classroom hardware remain untested. Contact constraints approximate deforming outlines; dense packing and prolonged ecosystem balance still need playtesting.


## 2.6 combat and live upgrade checks

All 67 checks pass, including timed live expression, saved progress, inheritance, trait eligibility/caps, resource costs, burst cooldown, interrupted recovery, actual mitigated damage cues, and higher-reserve rival attacks. The app harness checks that simulation runs with the upgrade panel open, a choice starts expression, and pause/resume works in that panel.

Native Canvas inspection covers health numbers, damage feedback, recovery and upgrades. A local opening-world simulation measured 1.80 ms per 30 Hz step over 30 simulated seconds; an isolated action scene drew in 0.68 ms/frame. These are workload measurements, not device FPS. Cloud-browser inspection confirmed the side-panel layout, upgrade purchase and energy cost, G close and F cooldown feedback; a readout overlap was corrected afterward. Cloud-browser rendering was throttled, so no smooth-play or physical Chromebook performance claim is made.
