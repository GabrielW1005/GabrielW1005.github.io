# Newton Studio

A self-contained 2D Newtonian physics sandbox and a 15-level calculation challenge sequence for a classroom. No account, server, paid service, build step, or CDN is required. The Planck.js physics engine is included locally.

## Open and play

Unzip the package, then open `index.html` in Chrome, Edge, Firefox, or Safari. Keep the accompanying files and `vendor` folder beside it. Alternatively, open the included **Newton_Studio_Standalone.html** file, which contains the entire app in one file.

Browser storage can behave differently for local files. For reliable automatic saving across sessions, use the published GitHub Pages URL. Students should also use **Save file** at the end of class.

## Publish with GitHub Pages

1. Create a new GitHub repository, or use an existing repository for this app.
2. Upload the contents of this folder so `index.html`, `style.css`, `app.js`, `physics.js`, `challenges.js`, and `vendor/` are at the repository root. Preserve folder names.
3. In the repository, open **Settings → Pages**. Under the build/deployment source, choose **Deploy from a branch**. Choose your main branch and **/(root)**, then Save.
4. Once GitHub finishes publishing, use the URL shown on the Pages settings screen. Share that URL with your students. Repository paths work without code changes.

You can instead upload the standalone file alone and rename it to `index.html`; it contains all required assets. Do not rename it without its `.html` extension.

Live app: https://gabrielw1005.github.io/newton-studio/

Source: https://github.com/GabrielW1005/GabrielW1005.github.io/tree/main/newton-studio

Official publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Sandbox features

- Circles, rectangles, triangles, fixed ground, gears, and anchored projectile launchers.
- Drag to place/move shapes; drag the selected corner handle to resize; use the Inspector for precise dimensions, rotation, and mass.
- An unrestricted pan/zoom camera, origin and fit controls, optional camera follow.
- Earth/Moon/Mars/zero/custom gravity; global air resistance switch; per-object quadratic drag coefficient.
- Initial linear/angular velocity, constant x/y forces, friction, and restitution.
- Fixed axles, axles between bodies, rods, welds, motorized axles, ideal gear connections.
- Motor rpm and maximum torque, two configurable direction keys, and optional automatic running.
- Up to eight key-controlled or always-on thrusters per body; body-relative directions and force offsets for torque.
- Projectile speed, direction, mass, radius, drag, and fire key. Launchers are fixed supports.
- Velocity, acceleration, gravity, drag, applied, contact/joint, and net-force vectors, independently toggled numbers, and live SI-unit measurements.
- Selected-object graphs versus simulation time: speed, x/y velocity, x/y position, magnitude/x/y acceleration, path distance, displacement, angular velocity, x/y net force. CSV export.
- Falling-shape, car, gear, pendulum, projectile, and empty-world examples; undo; simulation step; pause/reset; time-scale controls.

### Controls

Click **Run** after building. Hold the mapped motor/thruster keys while the simulation is running. The car example uses A/D for left/right and W for its upward thruster. The launcher example uses F to fire. Challenge details can be hidden to expose the motion; small screens hide them while testing. Challenge camera follow keeps the tracked object visible. Choose **Pan**, or hold Space and drag, to move the camera. Scroll to zoom. Delete removes the selected authored object while paused. Inputs consume keystrokes, so click the canvas before controlling a mechanism.

Editing after a run starts a new simulation from the current authored object positions. Initial velocity fields still define the next run's starting velocities. Reset restores the last edited scene. Fired projectiles belong to the current run and are not part of the saved starting scene.

## Challenges and student progress

The 15 sequential levels cover F = ma, force balance, opposing forces, displacement, coasting, braking, Moon gravity, projectile speed/angle, terminal speed, motor rotation, gear ratios, restitution, and inelastic collisions.

The setup and controls are locked; students change one numeric value. **Test my value** reconstructs the locked setup and measures the simulated outcome. Most tasks accept a 2.5% measurement tolerance, with absolute tolerances for zero-velocity and hover tasks. Success unlocks the next level; completed levels can be repeated. Each level offers a formula hint without the numeric solution.

Progress saves in the browser's local storage. It is specific to the device, browser profile, and app address; it does not sync across devices. Clearing browser data removes it. Save file includes the authored sandbox scene, completed challenge values/results, attempt counts, and student name. Open file restores both, after validating the scene and replaying passing results.

### Teacher review

1. Student opens **Share progress**, enters a name or classroom ID, then copies a report code/link or downloads a report JSON file.
2. Student submits it through your normal classroom workflow (email, LMS, etc.). The app sends nothing automatically.
3. Teacher opens the app and pastes the code/link into **Share progress → Teacher: review a report**, opens the report link, or loads the report JSON with **Open file**.
4. The app reruns the recorded challenge values against the locked setups and displays the results. Reviewing reports does not overwrite the teacher's own progress. The teacher can export results as CSV.

Codes contain the report directly; links put the code in the URL fragment. No central database stores it. Reports validate the recorded simulation outcomes, **not identity, authorship, or independent work**. They are editable client-side records, not tamper-proof certification. A student login/backend would be required for authenticated tracking.

## Physics model and limits

Planck.js **1.5.0**, based on Box2D, solves 2D rigid-body translation/rotation and collision/joint constraints. SI units: m, kg, s, N, N·m, rad; UI launch angles use degrees and motor speeds use rpm. +x right; +y up; positive rotation counterclockwise.

- Fixed physics step **1/240 s**, semi-implicit Euler integration, 12 velocity and 8 position constraint iterations.
- Uniform shape density gives the selected mass and its moment of inertia. Off-center forces apply torque. There is no artificial linear/angular damping, and sleeping is disabled to make measurements consistent.
- Broad-phase spatial collision detection, convex narrow-phase shapes, and time-of-impact continuous collision detection; all dynamic bodies have the bullet flag.
- Friction combines as the geometric mean; restitution uses the larger coefficient. The engine suppresses bounce for low-speed contact.
- Translational air drag is **F = −k |v| v**, with k = ½ρCᴅA in kg/m. Still air, no rotational drag or fluid simulation. k is an editable physical parameter rather than a generic damping slider.
- Ideal motor velocity targets with finite torque. Ideal fixed-axle gear constraints: **ω₁ + (N₂/N₁)ω₂ = 0**. Teeth are visual; there are no separate tooth contacts, backlash, slip, or breakage. Fixed-axle gears can be connected regardless of spacing.
- Ground and launchers are infinite-mass supports. The launcher absorbs recoil through its support. Rods connect centers at a fixed length; rods do not have a collision shape or mass.
- Live acceleration is Δv/Δt over a physics step; net force is mΔv/Δt including joint/contact impulses. The contact/joint resultant is the difference between net force and explicitly applied forces, so support balances weight at rest. During impact this is a step-averaged force, not an instantaneous force. Graph acceleration and force use consecutive samples at about 20 Hz.
- Distance is accumulated path length. Displacement is straight-line distance from the initial center position.

A rigid-body solver is a **numerical approximation**, not an exact solution to differential equations. Constant-acceleration velocity matches the analytic result closely; position has the expected finite-step error. Extreme forces, high mass ratios, tiny shapes, fast rotations, or long chains reduce accuracy. Use typical classroom scales of about 0.1–20 m and speeds below 100 m/s. The editor limits authored bodies to 180 and each run to 100 projectiles. It does not model soft bodies, fuel consumption, aerodynamic lift, mutual gravity, rolling resistance, or deformable gear teeth.

The interface's **Physics notes** repeats the model and limitations for users. Vector lengths use separate visual scales and cap at 160 screen pixels; the numbers, not relative arrow lengths across quantities, are the physical values.

## Verification

Run with Node.js:

```sh
node tests/physics.test.cjs
```

The included checks compare forces, gravity, hover, coasting, quadratic terminal drag, off-center torque, high-speed collision detection, and every challenge with analytic solutions. Additional browser workflow testing is recorded in `VERIFICATION.md`.

## Files and license

- `index.html`, `style.css`, `app.js`: interface, editor, graphs, progress/report handling.
- `physics.js`: SI-unit engine adapter and scene validation.
- `challenges.js`: locked challenge setups, targets, and tolerance checks.
- `vendor/planck.min.js`: vendored engine; its MIT license is in `vendor/PLANCK-LICENSE.txt`.
- `tests/physics.test.cjs`: numerical regression checks.
- `Newton_Studio_Standalone.html`: portable single-file version of the same app.

After editing source, rebuild the standalone edition with `python3 build_standalone.py`. The normal `index.html` edition uses your source files directly and needs no build.

The original app code is MIT licensed. Planck retains its own included copyright/license notice.
