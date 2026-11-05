# Machine Lab — Physics Playground

An original grade-8 playground for work, force, mechanical advantage and balance. Static GitHub Pages app at `/machine-lab/`; no dependencies, accounts, tracking or student data uploads.

## Activities

- **Challenges:** find one force or balancing mass plus mechanical advantage. Each machine progresses from MA = 1 to greater advantage. New practice generates different values. Hints give algebra and substitution, leaving the final arithmetic to students.
- **Free play:** drag weights onto either side, transfer weights, and drag geometry handles or use exact controls. Masses are labelled in kg and their drawn area scales with mass. Output retains a 1 kg base load.
- **Auto balance:** change masses or geometry and keep an exact balance. Animate a sequence of balanced configurations to see the tradeoff; this changes setups, rather than depicting an unpowered machine changing shape.

Input/output paths, force arrows, distance bars and a motion graph are independently switchable. Dark mode covers the entire stage. Quarter-speed, half-speed and real-time playback are available. Progress is saved locally on the current browser.

`worksheet.pdf` is a standalone two-page student sheet with eight diagrams and short value-finding questions. It intentionally contains fewer problems than the app. The teacher key is supplied separately. Run `source/build_worksheet.py` after installing `source/requirements.txt` to regenerate both PDFs.

## Physics

`physics.js` integrates constrained Newtonian motion with velocity-Verlet substeps of at most 1/240 second. Connected mass inertia and machine geometry determine acceleration. A weak input lets the load descend; an exact balance remains still from rest. A force just above the threshold lifts the load. Correct threshold answers unlock a clearly labelled 2% extra-force test.

All mechanisms are ideal: no friction, massless machine parts and inextensible ropes, with rounded Earth gravity g = 10 N/kg. At balance or steady speed, F1*d1 = F2*d2 and MA = F2/F1 = d1/d2. During acceleration, net work changes kinetic energy. Travel stops absorb remaining kinetic energy and the energy display accounts for this loss.

- Lever: vertical forces and constrained endpoint loads; gravitational torque varies with the beam angle. Work distance is vertical rise/fall, distinct from the endpoint's circular path. Loads do not swing independently.
- Ramp: the box and counterweight have equal rope travel. The relevant output work distance against gravity is vertical rise, not distance along the ramp.
- Pulley: one fixed pulley or one movable pulley with two supporting rope segments.
- Wheel/axle and geared winch: separate rope travel and circular rim trajectories. Gear MA includes both tooth ratio and input/output drum radii.
- Screw: axially fixed rotating screw and nonrotating translating load; ideal effort is represented by an input drum/handle.
- Wedge: ideal constrained horizontal input and vertical load; its rise/run determines the ratio.
- Syringes: incompressible hydraulic connection; area ratio sets displacement and force ratios. Fluid inertia and pressure-height differences are neglected.

Forces are bounded from 0–1000 N and each mass is capped at 200 kg. Geometry bounds keep mechanisms finite. Changing masses or geometry resets motion and energy bookkeeping; these edits are not treated as physical motion.

## Development and checks

Serve the folder over HTTP and open `index.html`. `app.js` coordinates the UI, `challenges.js` generates practice, `scene.js` renders vector mechanisms, and `physics.js` advances their dynamics.

Engine validation covers exact balance, under/overpowered motion, geometry ratios, finite states, travel limits, energy accounting and generated challenges. Browser checks cover all eight machines, force/balance answers, drag/drop, auto balance, paths, bars, graph and theme. Both worksheet pages and worked-key pages were visually inspected.

## References

- https://openstax.org/books/physics/pages/9-3-simple-machines
- https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics
- https://fab.cba.mit.edu/classes/863.15/doc/tutorials/mechanical_design/index.html

Uploaded lessons informed grade-level content and terminology only. Problems, layout and app are original.
