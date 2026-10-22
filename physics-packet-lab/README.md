# Motion Lab — physical science packet companion

A dependency-free web app for the revised 32-question grade 8 packet. It runs from a static web server, with no student account or installation.

## Classroom use

Choose a numbered packet problem, adjust the values, and test an idea in one experiment workspace. The given situation and student test use left and right comparison panels. Complete, larger questions and current graph data stay above the workspace. The graph, test controls, and Explanation & steps panel remain on screen on laptop displays. Editable givens open in a drawer; math warm-ups and printable materials remain available.

- **Packet values** restores the printed scenario.
- **Test prediction** runs a physical trial implied by the entered answer beside the given situation. Both runs use the same time and coordinate scales. Feedback explains the difference and confirms a matching prediction.
- Conceptual questions use continuous controls and observable experiment goals. There are no multiple-choice answers.
- **More practice** makes a new version of the same problem type with realistic, coordinated values. Its question, tables, goal, and explanation use those values. **Packet original** restores the printed scenario.
- Results explicitly say **Correct** or **Try again**, with a specific explanation and an available hint.
- Trial explanations identify which assumption changes when testing an answer, so a proposed value is never substituted into an inconsistent physical model.
- Changing the scenario measurements clears the previous trial. Packet values restores the printed conditions.
- Play, pause, restart, and the timeline let students inspect the same model at any instant.
- Graphs and numerical readings come from the same physical state as the animation.
- Fullscreen and light/dark themes support classroom displays.
- The packet and both review guides are available under Help.

## Physics models and assumptions

Calculations use SI units and analytic models: frame rate does not change results. Illustrations are schematic; visible labels identify enlargements and compressed timescales.

- Straight routes distinguish signed displacement from total path length. Turns and the transitions in tabulated motion are idealized; they do not represent a resolved finite acceleration.
- Constant acceleration uses v = v₀ + at and x = v₀t + ½at². Net force uses Fnet = ma.
- A seated passenger moves with the train. A platform observer and a train observer measure different velocities; the display identifies both reference frames.
- Weight is mg, measured in newtons. Mass remains in kilograms. The packet uses g = 10 m/s² as an Earth classroom approximation and 3.7 m/s² on Mars. Supported spring-scale models show balanced upward support and downward weight.
- Static friction adjusts to match the applied force up to its maximum. A maximum static friction is not automatically the actual friction.
- Airborne models combine upward and downward forces on the same object. Net force determines acceleration, which need not point in the direction of the current velocity. Constant forces model only the stated short interval; omitted air resistance is identified.
- Airplanes move in two dimensions: ax = (thrust − drag)/mass and ay = (lift − weight)/mass. Horizontal and vertical position and velocity follow those accelerations independently. Default packet forces produce level flight. Independent controls allow climbs and descents; a descending plane can accelerate upward. The four forces are held constant over each short run, with lift vertically upward and drag leftward during forward flight. This is an idealized force lesson, without speed-dependent aerodynamics, stall, fuel burn, aircraft rotation, or general rigid-body contacts.
- Two model airplanes under the same horizontal net force accelerate inversely with mass. Each has its own lift and weight. Their starting altitudes differ so the drawings represent separate aircraft.
- Circular-motion models show tangential velocity and inward acceleration. The Earth orbit is an explicitly simplified circular model with a compressed timescale, not a scale drawing of the solar system.
- Total system momentum is the signed sum m₁v₁ + m₂v₂. The bowling question concerns the instant before impact. Clay sticks in an ideal perfectly inelastic collision. Marbles and curling stones use an ideal collision to explain equal and opposite contact forces and momentum transfer. The app identifies idealizations rather than claiming to reproduce all real material behavior.
- Contact forces act on different objects only during contact. A resolved contact interval makes the action–reaction pair visible; momentum is conserved when external horizontal forces are neglected.

## Performance and memory

The animation runs only during playback or a pending redraw; pausing or hiding the tab cancels animation callbacks. Scene bounds and graph samples are cached and invalidated when values or trials change. Cache capacity is fixed, leaving a trial releases its retained data, resize requests are coalesced, and input listeners are installed once.

A 240-frame comparison benchmark with an instrumented mock canvas reduced physical-state evaluations from 71,040 to 786 for a walking-speed trial and a plane trial, and from 97,920 to 892 for a collision trial. This measures repeated computation, not Chromebook frame rates. A retained-heap check after two consecutive batches of 1,000 replacement trials differed by about 8.4 KB, with cache counts unchanged; it is a regression check, not a proof against every possible browser leak.

## Source files

The local development project serves `dist/`. On GitHub Pages, its contents are published directly in `physics-packet-lab/`.

- `dist/data.js`: revised packet text, adjustable experiment values, and goals.
- `dist/physics.js`: deterministic physical state and calculations.
- `dist/rendering.js`: scene, shared-scale prediction comparison, and graph drawing.
- `dist/experiments.js`: physical prediction trials and conceptual exploration tasks.
- `dist/practice.js`: value-aware question wording, hints, tables, and additional practice variants.
- `dist/app.js`, `index.html`, `styles.css`: interface.
- `dist/downloads/`: the three current student PDFs.
- `maintainer/`: printable source content and PDF generator.
- `tests/verify-models.mjs`: packet-answer checks and physical invariants.
- `tests/verify-experiments.mjs`: entered-answer trials and conceptual goal checks.
- `tests/verify-practice.mjs`: generated practice consistency and model validity.
- `tests/verify-rendering.mjs`: finite drawing coordinates, compact/large scenes, control endpoints, and bounded caches.

Run `node tests/verify-models.mjs`, `node tests/verify-experiments.mjs`, `node tests/verify-practice.mjs`, and `node tests/verify-rendering.mjs` in either the development project or the published source. The publication copy uses imports for its flat file layout.

The model checks cover all 16 packet numerical answers, collision momentum and contact forces, vertical force signs, spring scales, train reference frames, orbital vectors, and edited measurements. Experiment checks cover correct and incorrect proposed values and the conceptual goals. Browser QA covers the prediction interaction and the side-by-side stage/graph layout.

No CDN, analytics, login, or network service is used after page assets load. Progress stays in the current browser and can be reset. Explanations are intentionally available for learning.

## Physics references

The force model follows Newton’s second law and the component method described by [OpenStax](https://openstax.org/books/college-physics-2e/pages/4-3-newtons-second-law-of-motion-concept-of-a-system). Its aircraft assumptions follow the classroom simplification described by [NASA Glenn](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/simplified-aircraft-motion/). Net force determines acceleration; the object’s existing velocity can point in another direction.
