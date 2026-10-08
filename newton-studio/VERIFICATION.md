# Verification — 2026-10-08

## Numerical checks

`node tests/physics.test.cjs`: **71 checks passed** (38 retained + 33 engineering/rendering).

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

The new art and animation retain existing rectangular equipment collision hulls, masses, inertia calculations and the fixed physics step. Tank fill and meters use live remaining contents divided by each tank’s starting contents. The renderer changes no solver state.

## Example loading and browser cache regression

All 15 examples load in a fresh browser. Reusing the pre-interpolation physics file with the current renderer reproduces `sim.interpolate is not a function`, stopping the animation loop so subsequent example selections cannot redraw the canvas. Hosted CSS/scripts now use one content-derived release version in their URLs, bypassing earlier cache entries. The build script updates those URLs and embeds all assets into the standalone edition. Two builds without source edits produce identical files.

`tests/browser-examples.test.cjs` serves deliberately incompatible content at the old unversioned asset URLs. The current page bypasses all of those URLs, loads, displays and runs all 15 examples, loads all 7 tutorial examples, preserves challenge progress and runs an offline catapult without network requests.

## Rapid-jitter regression

The previous follow camera switched between easing and snapping as the distance to its target crossed a threshold. A freely moving rectangle at 80 m/s produced 105.6 px jumps in a 1440 × 900 browser window. Tracking the interpolated drawing pose directly eliminated these jumps: the same reproduction measured 0 px movement of the followed object on screen.

`tests/browser-jitter.test.cjs` checks horizontal, vertical and diagonal motion over 100 real animation frames each, and verifies paused camera panning remains available. Numerical checks verify drawing interpolation does not change the solver state and mounted parts remain aligned. Collision settings, friction, solver iterations and the 1/240 s physics step remain unchanged.

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
