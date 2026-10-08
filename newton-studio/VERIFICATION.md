# Verification — 2026-10-08

## Numerical checks

`node tests/physics.test.cjs`: **77 checks passed** (38 retained + 39 engineering/rendering).

Retained checks cover F = ma, constant-acceleration integration error and step convergence, mass-independent gravity, hovering, coasting, quadratic terminal drag, off-center torque, support forces, old challenge/report solutions, mapped motor/thruster keys and gear geometry. Collision checks cover rotated polygon contact, a rotating rectangle against a 0.06 m wall, 100 m/s projectiles against fixed and moving walls, elastic collision momentum/energy, terrain seams/slopes, moving launcher muzzle inheritance and carrier recoil, and mount/terrain validation.

New checks:

- All 15 engineering missions have passing designs and nonpassing starting designs. Their generated scenes pass scene validation.
- Part budgets, hull/tank/engine limits and integer wheel/tooth counts reject invalid designs.
- Low tire friction fails the hill challenge; sufficient grip passes.
- An attached gearbox multiplies torque and divides target rpm. A remote unattached box is inactive.
- Tank consumption reduces fuel, oxygen, chemical energy and body mass. Depletion stops thrust. Fuel can remain when oxygen runs out.
- Engines cannot draw from unconnected tanks. Multiple engines cannot consume negative resources.
- Exhaust kinetic energy does not exceed consumed fuel energy times efficiency, including energy-limited exhaust speeds.
- A variable-mass vacuum rocket agrees with vₑ ln(mstart/mfinal): measured 65.60549 m/s versus 65.59107 m/s, within 0.03 m/s at the fixed step.
- Central Earth gravity has the correct direction and 1/r² dependence.
- Unpowered orbital-speed flight conserves specific orbital energy within the tested finite-step tolerance over 20 s, with velocity above 11 km/s rather than the old engine's translation clamp.
- Launcher aiming keys (including uppercase mappings) change the next shot direction.
- Settled bodies sleep, show correct support and wake for thrust.
- Authored distant bodies remain simulated; explicitly removed transient shots free the 100-shot live limit.
- Invalid resources and aiming settings are rejected.

## Browser checks

`tests/browser-engineering.test.cjs`, run in headless Chromium:

- All 15 missions entered through highlighted numeric controls; tests advanced the live physics and recorded completion.
- Full teacher report replay, design values, CSV, portable save/download/import and autosave.
- Original curriculum progress remains separate and viewable; old report results reproduce.
- Launcher car's launcher attaches to and moves with its dynamic chassis, not terrain.
- Distinct default fire keys for new launchers.
- Keyboard aiming and a repeated-keydown test: one held fire key produces one shot; a fresh press produces the next.
- Fuel/oxygen consumption with keyboard-controlled spacecraft; resource HUD and Earth mode.
- Equipment mounting and rectangle rotation via pointer interaction.
- The follow camera keeps high-speed rockets in view; vehicle follow works beyond the initial window.
- Offline standalone loaded the new missions with no HTTP requests.
- Dark and 390 px mobile layouts had no horizontal overflow. No browser JavaScript errors.
- Separate layout regression checks passed fullscreen entry/exit, independent sidebar collapse/persistence, running physics/graphs preservation and restore controls at 1920, 1024 and 390 px.

## Equipment attachment and resource display

Direct equipment mount chains are valid rigid assemblies. Numerical checks verify that a fuel → oxygen → engine chain shares propellant, retains its hardware/contents mass, consumes both resources under keyboard thrust and stops producing force after losing its fuel connection. Direct/indirect mount cycles and fixed supports are rejected.

`tests/browser-attachments.test.cjs` uses pointer drops to snap a hull → fuel → oxygen → engine chain, moves the hull and verifies nested parts follow, burns the engine with its mapped key and checks resource consumption, then verifies releasing the key stops the active flame/force. Detach cuts off fuel supply; Attach nearby restores it. Selecting a different parent preserves child connections. Fuel/oxygen display toggles persist across reloads. The 390 px layout has no horizontal overflow. Desktop, burning and mobile screenshots were inspected.

The attachment update originally retained rectangular equipment hulls. The subsequent workshop update replaces engine hulls with three convex fixtures matching the nozzle/chamber/cap; tanks retain nominal rectangular hulls. Existing dry masses are preserved, and new size edits use material density. The physics step remains fixed. Tank fill and meters use live remaining contents divided by each tank’s starting contents. The renderer changes no solver state.

## Example loading and browser cache regression

All 17 examples load in a fresh browser. Reusing the pre-interpolation physics file with the current renderer reproduces `sim.interpolate is not a function`, stopping the animation loop so subsequent example selections cannot redraw the canvas. Hosted CSS/scripts now use one content-derived release version in their URLs, bypassing earlier cache entries. The build script updates those URLs and embeds all assets into the standalone edition. Two builds without source edits produce identical files.

`tests/browser-examples.test.cjs` serves deliberately incompatible content at the old unversioned asset URLs. The current page bypasses all of those URLs, loads, displays and runs all 17 examples, loads all 7 tutorial examples, preserves challenge progress and runs an offline catapult without network requests.

## Rapid-jitter regression

The previous follow camera switched between easing and snapping as the distance to its target crossed a threshold. A freely moving rectangle at 80 m/s produced 105.6 px jumps in a 1440 × 900 browser window. Tracking the interpolated drawing pose directly eliminated these jumps: the same reproduction measured 0 px movement of the followed object on screen.

`tests/browser-jitter.test.cjs` checks horizontal, vertical and diagonal motion over 100 real animation frames each, and verifies paused camera panning remains available. Numerical checks verify drawing interpolation does not change the solver state and mounted parts remain aligned. Collision settings, friction, solver iterations and the 1/240 s physics step remain unchanged.

## Allocation, editing and memory checks

The solver step, 12/8 iterations, continuous collision detection, friction, force models and body limits are unchanged. Each welded component now shares one assembly record and one membership set. Dynamic bodies, launchers, motors and engines use cached work lists; force/point/gravity/state outputs reuse storage. Removing a projectile removes it from the world and cached lists.

Six additional numerical checks verify shared assembly separation/filtering after weld release, complete projectile removal, paused editor previews with accurate resized fixtures after commit, chronological/reused graph rows with constant acceleration, and reusable state output when switching away from a launcher, and fixed-launcher aiming interpolation.

`tests/browser-optimization.test.cjs` passed in Chromium:

- 25 actual pointer moves create zero new worlds; pointer release creates one committed world.
- 200 simulation seconds fill/wrap the fixed 3,600-row buffer while preserving analytic velocity and chronological CSV export.
- Undo retains at most 30 snapshots and respects its estimated 8 MiB serialized-text budget.
- Unchanged paused measurements/resource HUD/zoom readouts produce zero DOM mutations during the observation.
- 100 scene rebuilds create and explicitly remove 10,000 projectiles. Body/work-list counts return to baseline. Post-GC used heap after the three measured batches was 4,316,204 / 4,332,624 / 4,337,452 bytes (about 21 KiB growth). This short stress check does not prove the absence of every possible leak.

All existing mission, attachment, example/cache/offline and camera regression browser suites passed again. The 180-body browser observation during concurrent regression runs measured 23 frames and a 66.6 ms median frame interval over approximately two seconds; that loaded run is not a controlled comparison or a frame-rate guarantee.

The optional benchmark compares the pre-optimization release with the update in equivalent isolated contexts, warms both physics paths and alternates order across five trials. Measured medians on this execution machine:

| Work | Before | Updated |
| --- | ---: | ---: |
| Cache one 30-part welded assembly | 35.77 ms | 0.57 ms |
| Cache one 90-part welded assembly | 390.72 ms | 0.65 ms |
| Cache one 180-part welded assembly | 2,581.14 ms | 0.95 ms |
| Rover: 600 fixed steps, 36 bodies | 155.34 ms | 99.51 ms |
| Dense contacts: 600 fixed steps, 180 bodies | 695.37 ms | 685.56 ms |

Assembly membership entries for 180 connected bodies fall from 32,400 to 180. Physics timings are noisy: the individual 180-body trials span approximately 434–1,192 ms before and 475–1,493 ms after, and an earlier sequential comparison favored the old version. The overlapping ranges do not establish a reliable dense-collision speedup. The strongest confirmed gains are connected-part setup, avoiding per-pointer-move world construction and bounded/reused display storage. Real classroom devices remain untested.

## Performance observations

The original observation below was recorded on 2026-10-07. During the equipment update, a fresh-browser control comparison on the current execution machine measured 11 frames / 200 ms median interval before the change and 12 frames / 183.4 ms median after it, with 180 bodies in both and 1.40 versus 1.43 s of physics over roughly 2 s wall time. Both versions were slower than the original run. This control comparison did not show a slowdown from the equipment changes; timings remain machine/load dependent.

Chromium on the execution machine, 180 bodies including a floor and 179 colliding circles, default fixed step, normal vectors/rendering, two seconds of wall time:

- 121 measured animation frames.
- Median frame interval: 16.7 ms; 95th percentile: 16.8 ms.
- Simulation advanced 2.0125 s.
- No authored bodies were removed for the camera/performance optimization.

This is one representative benchmark, not a Chromebook or worst-case performance guarantee. Complex terrain, constraints and dense contacts cost more. Solver iterations, CCD, mass and friction were preserved. Offscreen rendering culling, reusable bookkeeping vectors, cached geometry/resource connectivity, sleeping and reduced graph redraws lower costs. The default leaves all physics bodies intact. Optional distant-shot recycling is explicitly destructive and disabled by default.

## Limits

These checks verify representative teaching-scale scenes and selected vacuum spaceflight cases. They do not make every arbitrary configuration exact. Fixed steps and iterative constraints produce error, especially with initial penetration, extreme mass ratios/forces, fast angular motion and long chains. Earth-flight examples omit atmosphere and a full planet surface. Engines are ideal momentum/energy-budget models, with uniformly distributed tank contents. Gearboxes omit rotor inertia/losses. Launchers use externally supplied ammunition. These limits are documented in the app and README.

## Workshop expansion — 2026-10-08

The 77 existing numerical checks pass, including all 15 mission solutions/starting-design failures, rocket energy/mass, CCD walls, elastic collisions, terrain seams/slopes, launcher recoil and drawing interpolation. `tests/workshop-physics.test.cjs` adds 13 passing checks: density/thickness scaling with legacy mass preservation, fourfold engine mass/force scaling with three matching fixtures, tank mass/load/capacity scaling, fixed/free terrain and mounted assemblies, motor housing mass/torque scaling, inverse-square/core gravity, equal/opposite force on a free planet, vacuum orbit energy, finite refueling capacity/range/speed, moving-donor linear momentum, both new example scenes, bounded fading/forever traces, and malformed import rejection.

`tests/browser-workshop.test.cjs` covers both Connect window placements, independent hide/minimize and reload persistence; default-off vector/numbers controls; real pointer movement and Inspector rotation of a welded assembly; connected fix/unfix; automatic mass and named materials; inspected physical Add thruster parts and size scaling; a second engine's body-relative firing direction; scaled motor hardware; attached trajectory points and line settings; both new example runs; finite proximity refueling; challenge locks and 390 px layout. Desktop engine/planet/course/trajectory and mobile screenshots were reviewed.

All 17 examples and the seven tutorial examples load, draw and run with a shared asset version, including the standalone edition with no network requests. Saved challenge results replay in bounded asynchronous batches, retaining the same 1/240 s steps and locked designs. The final browser run passed replay of all 15 results, CSV export, save/import, legacy progress viewing, mounted launchers and distinct firing keys. Camera-follow and bounded graph/undo/cleanup tests pass; three post-GC cleanup samples were 4,412,384, 4,427,640 and 4,439,572 bytes. A separate 180-body observation advanced 2.079 s over roughly 2 s wall time, with 64 frames, median 16.8 ms and p95 83.3 ms: frame pacing remains load-dependent.

These are representative teaching-scale checks, not a guarantee of exact arbitrary mechanisms. The spacecraft visits fictional miniature worlds with explicit Newtonian masses and fields, not a scale-accurate solar system. The actuator size/rating rule and externally powered refueling pump are idealized as described in README and the in-app notes. Long forever paths retain their whole span with progressively coarser sampling. Motor housings contribute mass, but rotor/electrical models are absent.
