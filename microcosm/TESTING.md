# Verification for Microcosm v1.0

Verified in a Chromium browser with real canvas rendering and browser interactions. Screens were inspected at desktop, Chromebook-like 1366 × 768, and mobile 390 × 844 sizes. Other browser engines and an actual managed Chromebook were not separately tested.

## Passed checks

1. Keyboard movement changes position; velocity falls quickly after propulsion stops.
2. Pause freezes simulation time.
3. Amoeba engulfment creates a food vacuole; biomass increases after digestion rather than immediately.
4. Paramecium feeds on bacteria rather than algae.
5. Trichocyst discharge interrupts the modeled amoeba and does not grant immunity to Didinium.
6. Didinium cannot shoot at distant prey; contact capture creates a tether, ingestion, and a food vacuole.
7. Bacteria absorb dissolved nutrients, with growth suspended during modeled competence.
8. Compatible DNA is collected; unrelated DNA does not grant a trait.
9. Recombination completes after a delay and records success or failure.
10. Bacteriocin fields expand and affect susceptible targets while sparing immune producers.
11. Division requires resources, produces a sibling, shares resources, and retains the controlled lineage's traits.
12. A saved run restores after a page reload.
13. Downloaded JSON is valid and imports with matching organism and resources.
14. Invalid save files do not replace the active run.
15. Periodic autosave writes live progress.
16. Switching organisms preserves separate save slots.
17. All field-guide tabs and the Genome panel open.
18. Desktop and mobile layouts do not overflow horizontally.
19. No JavaScript runtime errors were observed during these checks.
20. The standalone HTML runs from a local file without a web server.
21. When browser storage is blocked, the game warns and retains temporary in-session slots.

This is functional verification of the game mechanics and persistence paths, not validation of a quantitative biological simulation or a classroom play-balance study.