# Machine Lab — Work, Force & Motion

A static grade-8 physics app deployed at `/machine-lab/`. No accounts, dependencies, tracking or student-data uploads. The two-page `worksheet.pdf` is independent of the larger app curriculum; its worked teacher key is provided separately.

## Use

- **Practice:** solve one force, balancing mass, work distance or acceleration, plus ideal mechanical advantage. Mixed practice develops all four skills. Each correct answer advances that skill through the machine's stages; two misses generate another problem at the same or an easier stage. Complete all four skills to advance to the next machine. Automatic advancement can be switched off.
- **Auto balance:** resizing a mass or changing geometry adjusts its counterpart to balance. Run to test, or apply a live pull. The comparison animation changes between separately balanced setups; it does not model a machine changing shape without external work.
- **Manipulation:** drag a mass face to grip/pull it. Drag its sides or corners to change mass, or type an exact value. Drawn square area is proportional to mass. Mass changes and geometry edits start a fresh energy experiment. Edits that change a challenge's givens must be restored to earn progress.
- **View:** wheel/pinch or buttons zoom; dragging the background pans. Independently toggle trajectories, force vectors, mass/acceleration, comparisons and plots. Compare actual path length, work displacement, or forces. Plot work displacement, cumulative path length, acceleration, or force against its corresponding work displacement.

Progress and theme are saved on the current browser. Both the stage and interface support light and dark themes. Free play and loose weight tokens have been removed.

## Newtonian simulation

`physics.js` numerically integrates a single generalized coordinate constrained by each machine. Newton's second law, or its rotational equivalent, determines acceleration from the actual connected mass inertia and applied forces. Velocity-Verlet substeps are at most 1/240 s (1/1200 s for levers). Frame dt is bounded, and travel-stop collisions account for lost kinetic energy. This is a constrained ideal-machine simulator, not a general collision sandbox.

Gravity is rounded to g = 10 m/s². Machine parts and ropes are massless; ropes are inextensible; friction is absent. Lever endpoint loads are secured and do not swing independently. Hydraulic fluid inertia and hydrostatic pressure-height differences are neglected.

At balance or steady motion, F1*d1 = F2*d2. Weight is m*g; the shared g cancels from the balancing equation m1*g*d1 = m2*g*d2. Actual moving-body acceleration a does not generally cancel. During acceleration:

`input work + pointer work − load gravitational energy = change in kinetic energy + energy absorbed at stops`.

The ratio shown is **ideal mechanical advantage from geometry**, not a claim that instantaneous dynamic force gain equals the equilibrium ratio.

### Live grip

Pointer dragging applies a bounded active grip: a force that supports the load plus a spring and relative-velocity damping term. It never teleports or directly imposes a body position. The resulting signed tangential force is mapped through the correct path Jacobian into the Newtonian equation. Lever tangent forces act through arc distance, distinct from the vertical forces and work distances used by the textbook balance problem.

Forces are capped at 1000 N; each mass is capped at 200 kg. The engine further scales pointer forces when needed to prevent negative rope tension or loss of supported contact. Its actual applied forces, not the requested values, enter both dynamics and pointer-work accounting. This keeps the model within its stated taut-rope/contact assumptions; it does not simulate slack ropes.

### Distance and acceleration distinctions

- Lever: path lengths are circular arcs r*dθ; vertical work distances are r*d(sin θ). Initial vertical-acceleration problems start horizontal and at rest.
- Ramp: the input weight and box have equal actual path travel. The output work against gravity uses the smaller vertical rise. Acceleration questions ask along the slope.
- Pulley: one or two supporting strands, with the corresponding rope-travel ratio.
- Wheel and geared winch: rim paths and hanging-mass paths are separate. Gear MA includes tooth count and input/output drum radius.
- Screw: the screw rotates without axial translation; its guided load cannot rotate. Input drum circumference and thread lead set the ratio.
- Wedge: horizontal input and guided vertical load, with an ideal supported contact.
- Syringes: incompressible volume conservation determines displacement; piston areas determine force ratio.

Distance demonstrations begin with a known nonzero speed and account for their initial kinetic energy. They pause at the exact target rise. No collision energy is fabricated at that paused snapshot.

## Performance and validation

Physics runs only while needed. Hidden tabs pause motion and comparisons. SVG rendering is limited to 30 frames/s, graph history is bounded to 360 samples, and canvases cap device-pixel ratio at 2. Static gear geometry is cached with a size limit. Input events are batched through animation frames; only one advance timer and one active physical animation are retained.

`source/test-challenges.mjs` checks generated ratios, balance, motion limits, initial accelerations, determinism and value variety. Physics tests cover signed pointer forces, spring-driven motion, reversals, contact/tension limits and energy accounting. Browser QA covers answer feedback, adaptive progression, zoom, resizing, pulling, numerical controls, all machines and display toggles.

Serve this folder over HTTP. `app.js` owns interaction/adaptation, `challenges.js` owns problem generation, `scene.js` renders SVG, and `physics.js` advances the model. `source/build_worksheet.py` regenerates the unchanged student PDF and worked key after installing `source/requirements.txt`.

## References

- https://openstax.org/books/physics/pages/9-3-simple-machines
- https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- https://openstax.org/books/university-physics-volume-1/pages/7-3-work-energy-theorem
- https://openstax.org/books/university-physics-volume-1/pages/10-7-newtons-second-law-for-rotation
- https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics

Original problems and graphics. Uploaded lessons informed grade-level content and terminology only.
