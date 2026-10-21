# Motion Lab — physical science packet companion

A dependency-free, static web app for the original 32-question grade 8 physical science packet. Open the deployed `index.html` through a web server. It uses browser ES modules and requires no student account or installation.

## Classroom use

- Choose a packet page, then its matching P01–P32 problem.
- **Demonstrate** uses the packet's exact values and shows results.
- **Explore & solve** makes a separate experiment. Adjust the known values; choose the unknown for supported calculations. The printed question remains the original, and the explanation identifies the custom values.
- **Challenge** checks the original numerical answer or conceptual reasoning. Completing a question saves a checkmark only in the current browser.
- Run, pause, restart, or scrub the simulation. Playback-speed controls are available for long trips. Fullscreen and light/dark controls support smartboards and Chromebooks.
- Position, velocity, speed, acceleration, and total-distance plots are computed from the same state as the animation. Each plot has labeled axes. Graphs start collapsed on shorter desktop screens except when the packet question asks students to interpret a graph.
- The Math warm-up button presents the pure arithmetic from that packet page. Help contains the printable packet and guides.

## Physics models and assumptions

All model positions, velocities, forces, masses, and times use SI units. State is evaluated analytically at each chosen instant; changing frame rate does not change an answer. Drawings are schematic, and the view autoscales while displaying a position axis in meters.

- Routes use signed 1-D coordinates and add absolute leg lengths for distance. Turns between route legs are idealized as brief.
- Uniform motion uses x = vt. Reference-frame problems use relative velocity; opposite-direction comparisons display both objects.
- Piecewise motion uses the supplied time-position samples, with linear motion or rest in each interval. Ideal instantaneous transitions are not resolved in acceleration plots.
- Uniform acceleration uses v = v0 + at and x = v0 t + 0.5 at². The algebra solver supports initial/final velocity, acceleration, and elapsed time. Physically inconsistent inverse inputs do not produce a displayed solution.
- Supported objects have balanced weight and support forces. The packet uses g = 10 m/s² for Earth as a stated classroom approximation and 1.6 m/s² for the Moon.
- Applied horizontal forces are combined as signed quantities. Static friction matches the pull up to the specified threshold; above it, kinetic friction has the given magnitude. Friction never accelerates a stopped object backward. Vertical forces are balanced in ground-motion examples and are omitted from the horizontal force diagram.
- Newton's second law uses net force, not merely an applied force. Two-cart comparisons apply the same net force to different masses.
- Constant-speed circular motion has tangential velocity and inward acceleration. Component graphs are explicitly labeled horizontal.
- Momentum uses signed velocity. Coupling carts undergo an instantaneous perfectly inelastic collision and conserve total momentum; the instantaneous collision force/acceleration is not resolved. The bowling-ball case is a single steady roll.
- Third-law pairs act on separate bodies during a finite contact interval and disappear after release. The pool wall is effectively fixed to Earth; its supporting constraint is outside the two-body diagram. Skaters coast after their push.

## Source files

- `data.js` — original packet text and model parameters, synchronized from the shared `maintainer/content/packet.json` before publication.
- `physics.js` — deterministic model state, derived quantities, and algebra.
- `rendering.js` — scaled schematic scenes and graphs.
- `app.js`, `index.html`, `styles.css` — accessible responsive interface.
- `downloads/` — three student PDF files. The teacher key is deliberately distributed separately.

No external CDN, analytics, login, or network service is used after the page assets load. Progress uses `localStorage` and can be reset inside the app. The app is not an assessment-security system; explanations are intentionally available on request.

## Maintaining the materials

Run `node tests/verify-models.mjs` to check the model invariants. The original packet data is in `maintainer/content/packet.json`. To regenerate printable files, install Python reportlab and the Liberation Serif, Liberation Sans Narrow, and Liberation Mono fonts, then run `python maintainer/build_pdfs.py`; PDFs are written under `maintainer/output/pdf`. Set `PHYSICS_PACKET_FONT_DIR` if the fonts are in a custom folder. The printable pages use plain worksheet typography, blank answer space, and page-specific formulas. Keep data.js and the PDFs synchronized when editing problem content.

## Verification

32 models and 16 numerical answers checked; 468 endpoint samples plus conservation, friction, reference-frame, braking and circular-motion invariants pass. Browser checks covered navigation, keyboard edits, inverse solving, numerical/conceptual answer checking, playback scrubbing, graphs, theme and materials links. Classroom Chromebook hardware has not been tested directly.
