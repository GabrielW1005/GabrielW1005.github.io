# Machine Lab — Work, Force & Motion

A static grade-8 physics app deployed at `/machine-lab/`. No accounts, dependencies, tracking or student-data uploads. The two-page `worksheet.pdf` is independent of the larger app curriculum; its worked teacher key is provided separately.

## Use

- **Practice:** enter one force, balancing mass, work distance or acceleration. Ideal mechanical advantage remains part of the visual explanation, not a second answer field. Mixed practice develops all four skills. An incorrect numerical answer immediately reveals the correct value while simulating the submitted value; the correction remains until the student chooses another problem. Each correct answer advances that skill through the machine's stages; two misses generate another problem at the same or an easier stage. Complete all four skills to advance to the next machine. Automatic advancement can be switched off.
- **Goals:** exact balancing mass; smallest whole-number input force that starts lifting from rest; input distance for a specified rise; or initial acceleration. The exact force threshold only balances—the minimum whole-number force is the next larger integer. Next/Different setup varies dimensions, ramp slope, gear teeth/drum radii, and pulley systems, not just load mass.
- **Auto balance:** resizing a mass or changing geometry adjusts its counterpart to balance. Run stays active at equilibrium or a travel stop, ready for another live pull. The friction / drag slider starts at zero (ideal); Light, Medium and Strong provide increasing viscous resistance. Its setting persists across problems, machines and modes for the current visit. Changing it live preserves position, velocity and the energy ledger. The comparison animation changes between separately balanced setups; it does not model a machine changing shape without external work.
- **Clean numbers:** mass resizing snaps to 0.5 kg; dimension dragging follows each Settings increment; horizontal ramp run snaps to 0.1 m. Generated practice uses compatible givens: whole-number lifting force, 0.5 kg balancing mass, 0.1 m/s² acceleration, and 0.01 m distance pairs (0.001 m only when the stroke cannot fit a two-decimal pair). Physical motion stays continuous. Rounded custom answers are explicitly labeled and accepted; correct balance/distance tests use their exact physical target. Approximation marks distinguish rounded computed masses from exact model values.
- **Manipulation:** drag a mass face to grip/pull it. Drag its sides or corners to change mass, or type an exact value. Drawn square area is proportional to mass. Mass changes and geometry edits start a fresh energy experiment. Edits that change a challenge's givens must be restored to earn progress.
- **Comparison:** foreground trajectories have adjustable thickness. Compare paths & weights pauses motion and captures a snapshot with three manually selected stages. Identical path bars and separate force-aligned work-distance bars stay on one fixed physical scale and at fixed positions through every stage. Mass-square areas and product rectangles are added without resizing the paths. No timer or SVG animation advances the comparison. Products are only labeled equal when they actually match. At rest, a clearly labeled reference movement avoids claiming that any work has been done. Applied-force setups use force products rather than mass alone.
- **Workspace:** a compact menu places modes, machines and tools together. The main question, single answer, test, correction and navigation fit a Chromebook-sized viewport. Question, settings, hints, plot, comparison and mass/motion panels have draggable handles and a Reset layout control. Compare is off initially.
- **Pulley / syringe variety:** fixed guides and one/two/three moving-pulley stages show 1/2/4/6 numbered supporting strands. The sheaves use actual, larger radii with constant rope length throughout motion. Syringe bores use a fixed screen scale proportional to the square root of piston area, so absolute size changes remain visible even at equal area ratios.
- **Ramp:** drag the horizontal run handle or enter horizontal run directly. Height stays fixed and slope length is calculated with the Pythagorean theorem, within the 5 m ramp limit.
- **View:** wheel/pinch or buttons zoom; dragging the background pans. Independently toggle trajectories, force vectors, mass/acceleration, comparisons and plots. Compare actual path length, work displacement, or forces. Plot work displacement, cumulative path length, acceleration, or force against its corresponding work displacement.

Progress and theme are saved on the current browser. Both the stage and interface support light and dark themes. Free play and loose weight tokens have been removed.

## Newtonian simulation

`physics.js` numerically integrates a single generalized coordinate constrained by each machine. Newton's second law, or its rotational equivalent, determines acceleration from the actual connected mass inertia and applied forces. Undamped motion uses velocity-Verlet substeps at most 1/240 s (1/1200 s for levers). With viscous settling, linear machines use the exact piecewise exponential solution and levers use fourth-order Runge–Kutta at 1/1200 s or smaller. Frame dt is bounded, and travel-stop collisions account for lost kinetic energy. This is a constrained ideal-machine simulator, not a general collision sandbox.

Gravity is rounded to g = 10 m/s². Machine parts and ropes are massless; ropes are inextensible; friction is absent during free motion when Friction / drag is zero. Increasing the slider applies an output-side viscous force with a requested decay rate from 0 to 3 s⁻¹ in steps of 0.05 s⁻¹, reduced if needed to keep the rope taut. This models speed-dependent drag, not Coulomb surface friction; it is zero at rest and supplies no centering force. Lever endpoint loads are secured and do not swing independently. Hydraulic fluid inertia and hydrostatic pressure-height differences are neglected.

At balance, or steady motion without resistance, F1*d1 = F2*d2. Weight is m*g; the shared g cancels from the balancing equation m1*g*d1 = m2*g*d2. Actual moving-body acceleration a does not generally cancel. During acceleration:

`input work + extra actuator/pointer work − load gravitational energy = change in kinetic energy + heat from settling + energy absorbed at stops`.

A balanced system is neutrally stable: without resistance, a moving release keeps its generalized speed until a stop; a release from rest stays at that position. Optional resistance brings motion to rest at the displaced position. There is no invisible centering spring. An unbalanced system continues toward a physical travel stop. Stops remain inelastic; independent pendulum swinging and elastic impact rebound are not modeled.

The ratio shown is **ideal mechanical advantage from geometry**, not a claim that instantaneous dynamic force gain equals the equilibrium ratio.

### Live grip

Pointer dragging applies a bounded active grip: a force that supports the load plus a spring and relative-velocity damping term. It never teleports or directly imposes a body position. The resulting signed tangential force is mapped through the correct path Jacobian into the Newtonian equation. Lever tangent forces act through arc distance, distinct from the vertical forces and work distances used by the textbook balance problem.

Forces are capped at 1000 N; each mass is capped at 200 kg. The engine further scales pointer forces when needed to prevent negative rope tension or loss of supported contact. Its actual applied forces, not the requested values, enter both dynamics and pointer-work accounting. This keeps the model within its stated taut-rope/contact assumptions; it does not simulate slack ropes.

### Distance and acceleration distinctions

- Lever: path lengths are circular arcs r*dθ; vertical work distances are r*d(sin θ). Initial vertical-acceleration problems start horizontal and at rest.
- Ramp: the input weight and box have equal actual path travel. The output work against gravity uses the smaller vertical rise. Acceleration questions ask along the slope.
- Pulley: 1, 2, 4 or 6 supporting strands, with the corresponding rope-travel ratio. Radius and stroke vary independently; rope count is a discrete control.
- Wheel and geared winch: rim paths and hanging-mass paths are separate. Gear MA includes tooth count and input/output drum radius.
- Screw: the screw rotates without axial translation; its guided load cannot rotate. Input drum circumference and thread lead set the ratio.
- Wedge: horizontal input and guided vertical load, with an ideal supported contact.
- Syringes: incompressible volume conservation determines displacement; piston areas determine force ratio.

Distance tests use a force-limited, critically damped position actuator. The entered input work distance sets its target; a wrong answer therefore causes the wrong output rise. Its actual accepted force enters the same Newtonian model and extra-work accounting as pointer forces. The actuator holds the new position while the simulation remains running.

## Performance and validation

Physics advances while Run is active, including at equilibrium and travel stops. Hidden tabs pause motion and comparisons. SVG rendering is limited to 30 frames/s, graph history is bounded to 360 samples, and canvases cap device-pixel ratio at 2. Static gear geometry is cached with a size limit. Input events are batched through animation frames; only one advance timer and one active physical animation are retained.

`source/test-challenges.mjs` checks generated ratios, balance, motion limits, initial accelerations, determinism geometry diversity and value variety. `source/test-actuator.mjs` checks correct and wrong distance entries with both damping settings. `source/test-comparison.mjs` checks path measurements, reference movements, product scaling, inequality and rendering. Physics tests cover signed pointer forces, spring-driven motion, reversals, contact/tension limits and energy accounting. Browser QA covers answer feedback, adaptive progression, zoom, resizing, pulling, numerical controls, all machines and display toggles.

Serve this folder over HTTP. `app.js` owns interaction/adaptation, `challenges.js` owns problem generation, `scene.js` renders SVG, `comparison.js` produces animated snapshot comparisons, and `physics.js` advances the model. `source/build_worksheet.py` regenerates the unchanged student PDF and worked key after installing `source/requirements.txt`.

## References

- https://openstax.org/books/physics/pages/9-3-simple-machines
- https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- https://openstax.org/books/university-physics-volume-1/pages/7-3-work-energy-theorem
- https://openstax.org/books/university-physics-volume-1/pages/10-7-newtons-second-law-for-rotation
- https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics

Original problems and graphics. Uploaded lessons informed grade-level content and terminology only.
