# Motion Lab — physical science packet companion

A dependency-free web app for the revised 32-question grade 8 packet plus 18 numerical online extensions (problems 33–50). The printed packet is unchanged. It runs from a static web server, with no student account or installation.

## Classroom use

Choose a numbered packet problem, adjust the values, and test an idea in one experiment workspace. The student test is on the left and the reference is on the right; both use the same physical scales. Complete, larger questions and current graph data stay above the workspace. The graph, test controls, and Explanation & steps panel remain on screen on laptop displays. Editable givens open in a drawer; math warm-ups and printable materials remain available.

- **Packet values** restores the printed scenario.
- **Test prediction** runs a physical trial implied by the entered answer beside the given situation. Both runs use the same time and coordinate scales. Feedback explains the difference and confirms a matching prediction.
- Conceptual questions use continuous controls and observable experiment goals. There are no multiple-choice answers.
- **More practice** chooses from 24 deterministic versions of each problem type (1,200 total) with varied realistic values and appropriate units. Every numeric type has at least 18 distinct answers in both SI and displayed units. The problem URL identifies the selected variant, so packet and simulation stay synchronized. Its question, tables, goal, and explanation use those values. **Packet original** restores the printed scenario.
- Results explicitly say **Correct** or **Try again**, with a specific explanation and an available hint.
- Trial explanations identify which assumption changes when testing an answer, so a proposed value is never substituted into an inconsistent physical model.
- Changing the scenario measurements clears the previous trial. Packet values restores the printed conditions.
- Play, pause, restart, and the timeline let students inspect the same model at any instant.
- Graphs and numerical readings come from the same physical state as the animation.
- Fullscreen and light/dark themes support classroom displays.
- The packet and both review guides are available under Help.

## Saved packet workspace

`packet.html#P01/original` opens the original printed question; `packet.html#all` displays the original 32 problem types grouped into eight packet pages, followed by four online extension sections, using each problem’s current selection. Large **Go To Packet** and **Go To Simulation** buttons navigate in the same tab. Both views share the current practice variant, measurements, answer units, and primary numeric answer. Each original and each practice variant keeps its own responses. Browser Back/Forward also reloads the latest saved work.

Students can enter answers directly, open an optional hint, or reveal step-by-step explanations and the physical reasoning. Numerical questions check all requested parts, including direction and both before/after momentum in question 30. Written conceptual answers are saved for self-review against a model answer and a short checklist; the application does not claim to automatically grade free-form reasoning. Merely opening a solution does not complete a question. All 24 math warm-ups are available in their page groups.

Progress is stored in this browser on this device. It includes drafts, submissions, numerical checks, and conceptual self-review. It is not sent to a teacher or synchronized to an account. Save / share downloads a complete version-2 JSON backup of answers, current question selections, custom measurements, and simulation settings. Legacy version-1 backups still load. A separate readable TXT progress report (with an optional printable HTML version) includes the student’s optional name, exact questions and variants, answers, and recorded check status; students can attach it through Classroom or email. No report is sent automatically. Per-question storage keys avoid overwriting unrelated work when multiple packet tabs are open. Editing an answer clears its previous checked/reviewed status.

## Numerical extensions and safeguards

Problems 33–50 add contact force pairs, boats and buoyancy, planetary rover and lander motion, spacecraft acceleration, and momentum in a stated astronomical reference frame. All new answers are numerical. Practice rotates the unknown within each suitable family: F = ma, m = F/a, a = F/m; p = mv, m = p/v, v = p/m. Both online views include math-only warm-ups showing division of BOTH sides.

New question inputs start with an incorrect guess, which does not count as saved/submitted work until edited or tested. Valid saved answers are preserved. Finite, problem-appropriate min/max bounds are enforced on predictions and experiment controls. Signed motion and net force can remain negative; mass and other positive magnitudes cannot. Top navigation stays visible for both views, including the all-problems view.

## Physics models and assumptions

Practice questions use an appropriate mix of m/cm/km, s/min/h, m/s/km/h/cm/s/km/s, m/s²/cm/s², kg/g, N/kN, and momentum units. Worked solutions show conversions, while graphs identify their SI measurement units. Calculations use SI units. Constant-force and collision cases use analytic models; buoyancy uses deterministic, fixed-step RK4 integration. Frame rate does not change the physical results. Illustrations are schematic; visible labels identify enlargements and compressed timescales.

- Straight routes distinguish signed displacement from total path length. Turns and the transitions in tabulated motion are idealized; they do not represent a resolved finite acceleration.
- Constant acceleration uses v = v₀ + at and x = v₀t + ½at². Net force uses Fnet = ma.
- A seated passenger moves with the train. A platform observer and a train observer measure different velocities; the display identifies both reference frames.
- Weight is mg, measured in newtons. Mass remains in kilograms. The packet uses g = 10 m/s² as an Earth classroom approximation and 3.7 m/s² on Mars. Supported spring-scale models settle under gravity, spring force, and damping; both Run and Test use the same model. Equilibrium scale force balances weight.
- Static friction adjusts to match the applied force up to its maximum. A maximum static friction is not automatically the actual friction.
- Airborne models combine upward and downward forces on the same object. Net force determines acceleration, which need not point in the direction of the current velocity. Constant forces model only the stated short interval; omitted air resistance is identified.
- Airplanes move in two dimensions: ax = (thrust − drag)/mass and ay = (lift − weight)/mass. Horizontal and vertical position and velocity follow those accelerations independently. Default packet forces produce level flight. Independent controls allow climbs and descents; a descending plane can accelerate upward. The four forces are held constant over each short run, with lift vertically upward and drag leftward during forward flight. This is an idealized force lesson, without speed-dependent aerodynamics, stall, fuel burn, aircraft rotation, or general rigid-body contacts.
- Two model airplanes under the same horizontal net force accelerate inversely with mass. Each has its own lift and weight. Their starting altitudes differ so the drawings represent separate aircraft.
- Circular-motion models show tangential velocity and inward acceleration. The Earth orbit is an explicitly simplified circular model with a compressed timescale, not a scale drawing of the solar system.
- Total system momentum is the signed sum m₁v₁ + m₂v₂. The bowling question concerns the instant before impact. Clay sticks in an ideal perfectly inelastic collision. Marbles and curling stones use an ideal collision to explain equal and opposite contact forces and momentum transfer. The app identifies idealizations rather than claiming to reproduce all real material behavior.
- Water models use fully submerged buoyancy at the initial instant, then reduce buoyancy as the hull emerges. Linear water resistance damps motion; a finite seabed provides support. Excess mass sinks when weight exceeds maximum buoyancy. This is a one-dimensional force lesson, not a fluid-flow or boat-stability solver.
- In the drone mass trial, rotor lift is held fixed at the reference value; a sufficiently large mass descends.
- Contact forces act on different objects only during contact. A resolved contact interval makes the action–reaction pair visible; momentum is conserved when external horizontal forces are neglected.

## Performance and memory

The animation runs only during playback or a pending redraw; pausing or hiding the tab cancels animation callbacks. Scene bounds and graph samples are cached and invalidated when values or trials change. Cache capacity is fixed, leaving a trial releases its retained data, resize requests are coalesced, and input listeners are installed once.

A 240-frame comparison benchmark with an instrumented mock canvas reduced physical-state evaluations from 71,040 to 786 for a walking-speed trial and a plane trial, and from 97,920 to 892 for a collision trial. This measures repeated computation, not Chromebook frame rates. A retained-heap check after two consecutive batches of 1,000 replacement trials differed by about 8.4 KB, with cache counts unchanged; it is a regression check, not a proof against every possible browser leak.

## Source files

The local development project serves `dist/`. On GitHub Pages, its contents are published directly in `physics-packet-lab/`.

- `dist/data.js`: revised packet text, adjustable experiment values, and goals.
- `dist/extensions.js`: 18 online extension problems, 432 practice variants, equation warm-ups, units, and worked solutions.
- `dist/extension-physics.js`: force-pair, buoyancy, F=ma, and momentum extension models.
- `dist/progress-export.js`: plain-text and safely escaped HTML teacher progress reports.
- `dist/physics.js`: deterministic physical state and calculations.
- `dist/rendering.js`: scene, shared-scale prediction comparison, and graph drawing.
- `dist/experiments.js`: physical prediction trials and conceptual exploration tasks.
- `dist/practice.js`: value-aware question wording, hints, tables, and additional practice variants.
- `dist/app.js`, `index.html`, `styles.css`: simulation interface.
- `dist/packet.html`, `packet.css`, `packet-app.js`: original packet questions, answers, and saved progress.
- `dist/packet-lessons.js`: worked solutions, reasoning, and answer requirements.
- `dist/packet-core.js`: answer checking and bounded per-question progress storage.
- `dist/workspace-state.js`: validated shared selections, explicit practice routes, separate response keys, and saved simulation controls.
- `dist/practice-lessons.js`: current-value worked solutions, conceptual explanations, and displayed-unit answer keys.
- `maintainer/TEACHING_PREFERENCES.md`: the teacher’s persistent preference for varied values, answers, and realistic units.
- `dist/downloads/`: the three current student PDFs.
- `maintainer/`: printable source content and PDF generator.
- `tests/verify-models.mjs`: packet-answer checks and physical invariants.
- `tests/verify-experiments.mjs`: entered-answer trials and conceptual goal checks.
- `tests/verify-practice.mjs`: generated practice consistency and model validity.
- `tests/verify-rendering.mjs`: finite drawing coordinates, compact/large scenes, control endpoints, bounded caches, and test/reference placement.
- `tests/verify-packet.mjs`: numerical answer checks, multipart answers, and progress persistence/validation.

Additional synchronization checks: `node tests/verify-workspace.mjs` and `node tests/verify-practice-lessons.mjs`.

Run `node tests/verify-models.mjs`, `node tests/verify-experiments.mjs`, `node tests/verify-practice.mjs`, `node tests/verify-rendering.mjs`, and `node tests/verify-packet.mjs` in either the development project or the published source. The publication copy uses imports for its flat file layout.

The model checks cover all 16 packet numerical answers, collision momentum and contact forces, vertical force signs, spring scales, train reference frames, orbital vectors, and edited measurements. Experiment checks cover correct and incorrect proposed values and the conceptual goals. Browser QA covers the prediction interaction and the side-by-side stage/graph layout.

No CDN, analytics, login, or network service is used after page assets load. Progress stays in the current browser and can be reset. Explanations are intentionally available for learning.

## Physics references

The force model follows Newton’s second law and the component method described by [OpenStax](https://openstax.org/books/college-physics-2e/pages/4-3-newtons-second-law-of-motion-concept-of-a-system). Its aircraft assumptions follow the classroom simplification described by [NASA Glenn](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/simplified-aircraft-motion/). Net force determines acceleration; the object’s existing velocity can point in another direction.

The extension and storage checks also run `verify-extension-physics.mjs`, `verify-extensions-content.mjs`, `verify-extended-audit.mjs`, `verify-backup.mjs`, `verify-progress-export.mjs`, and `verify-packet-defaults.mjs` when present.
