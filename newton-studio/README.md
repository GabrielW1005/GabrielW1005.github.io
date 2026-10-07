# Newton Studio

A browser-based 2D physics workshop with 15 engineering missions, editable examples, graphs and portable student progress. Vanilla JavaScript and vendored Planck.js 1.5.0; no accounts, backend, CDN or build step required.

[Open the app](https://gabrielw1005.github.io/newton-studio/) · [Source](https://github.com/GabrielW1005/GabrielW1005.github.io/tree/main/newton-studio)

Open `index.html` with its accompanying files, or open `Newton_Studio_Standalone.html` for the complete offline edition. For consistent autosave behavior, use the hosted app. Students should also download **Save file**.

## Engineering missions

Each card clearly separates **YOU CAN ADJUST** controls from **LOCKED** quantities. Tests reconstruct the selected design and run scripted controls in the same physics engine as Explore. Students predict, test and revise; success and skipping both unlock the next mission, but skips never count as completion. Walkthroughs, progressive hints and tutorials are included.

| Level | Design task | Adjustable variables |
| --- | --- | --- |
| 1 | Drive a rover up a hill | Motor torque |
| 2 | Choose gearing to climb the hill before the deadline | Gear reduction |
| 3 | Deliver cargo 100 m down a road | Gear reduction |
| 4 | Find tires that grip the hillside | Tire friction |
| 5 | Raise a rescue crate with a rigid lifting arm | Motor torque |
| 6 | Slow an observatory gear to 24 rpm | Driven teeth |
| 7 | Speed a scanner up to 160 rpm | Driven teeth |
| 8 | Hit a target-height crossing at 25 m | Launcher angle |
| 9 | Send a supply pod 60 m | Launch speed |
| 10 | Build a catapult that lands its payload in a target zone | Motor torque, release time |
| 11 | Carry enough fuel for a delivery flight | Fuel load; oxygen follows mixture ratio |
| 12 | Lift a spacecraft off the launch pad | Thruster force |
| 13 | Reach Earth escape energy | Thruster force |
| 14 | Win tug-of-war within a parts budget | Wheel count, ballast, torque |
| 15 | Build an escaping spacecraft within size constraints | Hull width/height, fuel load, thrust |

Vehicle roads extend over 2 km. The follow camera has no boundaries and keeps fast-moving rockets visible. Explore includes matching hill rovers, geared cars, a long-road car, lifting arm, fueled spacecraft, escape rocket and tug-of-war, plus gears, terrain, projectiles, catapult and launcher car. Explore values remain editable.

## Building and controls

- Add circles, rectangles, triangles, ground, gears, launchers, thruster hardware, fuel/oxygen tanks and gearboxes. Mass, dimensions, starting velocity, applied forces, friction and restitution are editable.
- Pause and select a shape. Drag to move, drag the square handle to resize, and drag the round handle to rotate. Shift snaps rotation to 15°. Numeric angles are also available.
- Raise/lower terrain paints hills and valleys. A stroke on ground converts it to a sampled terrain surface. Undo restores one stroke. Terrain is a finite height profile, without caves or overhangs.
- Add fixed or body-to-body axles, motors, welds and rigid center-to-center rods. Rods are massless constraints, not ropes. Welds and rods can have a release key.
- Motors have target rpm, maximum torque, two configurable direction keys and optional automatic operation. Tire contact friction can limit the force actually transmitted to the road.
- Gear teeth are visual; adjacent, pitch-matched gears snap and connect through ideal fixed-axle constraints. A gearbox is an attachable body with mass and an ideal reduction. Attach/weld it to the chassis and select it for the chassis's wheel motors. Output torque multiplies and output rpm divides by the reduction. An unattached box does not drive a remote motor.
- Thrusters have force, body-relative direction, offsets, key and always-on control. Off-center forces generate torque. New thrusters default to finite fuel mode; turn off **Use attached fuel + oxygen** for a simple unlimited external-force experiment. Existing saved unlimited thrusters retain their behavior.
- Fuel tanks, oxygen tanks and thruster hardware attach through an Inspector mount menu or rigid welds. They contribute mass and inertia. Tank **Mass** is empty hardware; **contents** add mass. Fuel has chemical energy in MJ/kg. Engines can only draw from tanks in their own welded assembly.
- Launchers can be fixed, free moving or mounted to a dynamic shape. Set fire, aim-up and aim-down keys and aim rate. New launchers get distinct default fire keys. Repeated keydown events do not fire repeated shots; release and press again for another shot. Duplicate fire-key assignments are corrected or rejected. Other shared controls are allowed for intentionally synchronized motors/thrusters.
- Expand **Keyboard controls** on the canvas to see device mappings. Typical car controls: A/D. Rocket: W. Launcher: F to fire, I/K to aim. Catapult: L swing, F release, J return; Reset reloads the payload. Inputs and dialogs consume keystrokes. Run focuses the canvas; release, pause and window blur clear held controls.
- Pan with Pan or Space+drag, scroll to zoom, and choose a separate camera-follow target. Fullscreen and both sidebar collapse controls remain available; layout and theme are remembered.
- Toggle velocity, acceleration and force arrows, numbers and graphs. Export selected-body measurements as CSV. Graphs use simulation time, not wall-clock time.

Editing after a run uses current authored body positions and starts a fresh simulation. Reset restores the edited starting scene, including full tanks. Shots are transient and are not saved as authored starting bodies.

## Physics and scientific limits

SI units, x right/y up, positive rotation counterclockwise. Translation follows ΣF = ma; rotation follows Στ = Iα. Planck/Box2D advances at a fixed **1/240 s** with semi-implicit Euler and **12 velocity / 8 position iterations**. Broad-phase collision detection, convex shapes, contact friction, restitution and continuous time-of-impact collision detection stay enabled. Settled bodies can sleep; applied forces and motor changes wake them. Support measurements remain valid at rest.

Drawing interpolates between consecutive fixed-step poses, with at most one step (1/240 s of simulation time) of visual delay. Shapes, attached parts, joint anchors, vector origins and the follow camera use the same displayed pose. Camera follow tracks this pose continuously; measurements and graphs use the authoritative physics state. Rendering does not change forces, friction, collisions or numerical integration.

Friction combines as √(μ₁μ₂). Restitution uses the larger coefficient; very slow contacts suppress bounce. Motors are speed targets constrained by available torque. Gearboxes conserve ideal mechanical power at the torque limit; input rotor inertia and gear losses are not separately modeled. Fixed gear meshes impose ω₁ + (N₂/N₁)ω₂ = 0. No deformable teeth, backlash or slip.

Uniform gravity is the default. **Earth inverse-square** uses central gravity toward (0, −6,371,000 m), with GM = 9.81R². Escape tasks require outward flight and nonnegative specific orbital energy, equivalent to speed ≥ √(2GM/r). These are vacuum, nonrotating Earth point-mass flight models; there is no atmosphere, spherical planet collision surface, mutual body gravity or orbital autopilot. The launch pad is a local flat surface. Liftoff is distinct from escape.

Fueled engines use the ideal rocket relation **F = ṁvₑ**. Hydrogen fuel and oxygen leave in a configurable mass ratio (default 8 kg oxygen / kg fuel). Fuel chemical energy defaults to 120 MJ/kg; efficiency limits exhaust kinetic energy. Effective exhaust speed is bounded by both the selected speed and √(2ηq/(1+oxygen ratio)). Removed propellant carries its previous vehicle motion; exhaust recoil supplies thrust. Both tanks lose mass; chemical energy falls with fuel mass. Engines stop when either required supply empties. Multiple engines share tanks without negative contents. There is no thermal/chamber/nozzle simulation, and unburned dry hardware remains attached. Tank contents are modeled as uniformly distributed density, without fluid slosh.

Moving launcher shots inherit the muzzle-point velocity, including rotation, plus the specified relative launch velocity immediately before firing. An opposite impulse recoils the carrier. The muzzle clears its housing. Ammunition is externally supplied; shot mass is not subtracted from the carrier. Fixed launchers have noncolliding housings and absorb recoil through their support. Catapult release instead removes a weld; payload velocity comes from beam motion.

With air on, translational drag is **−k|v|v** in still air; k combines ½ρCᴅA. It has units kg/m. No lift, rotational air drag, weather or altitude-dependent atmosphere. Earth escape missions keep air off.

Live acceleration is Δv/Δt; net force is mΔv/Δt, including averaged contact/joint impulses. Individual-body measurements are not whole-vehicle totals. Graph acceleration and net force average consecutive samples roughly 0.05 s apart. Distance integrates the traveled path; displacement is the straight-line change. Arrow scales differ and lengths are capped; read their numbers for comparisons.

This is a finite-step numerical approximation. Extreme forces, mass ratios, tiny shapes, starting overlaps, long joint chains and fast rotations can reduce accuracy. Classroom scenes should generally use 0.1–20 m shapes and speeds below 100 m/s; verified vacuum space examples support higher speeds. The engine safety translation cap permits up to 24 km/s at the default step; it is still a cap, not an unlimited relativistic model. No deformation, rope simulation, fluid flow, rolling resistance or relativistic physics.

## Performance

Up to **180 authored bodies**, **250 joints** and **100 live projectiles**. The engine retains offscreen authored bodies, so camera movement does not change an experiment's forces or collisions. Offscreen drawing is culled; terrain vertices/bounds and resource connectivity are cached. Velocity/force bookkeeping reuses vectors instead of allocating a velocity map each step. Graph history is bounded at 3,600 samples and graph drawing is limited to 10 Hz. Fixed physics steps are never enlarged to recover frame rate; overloaded devices run simulation time more slowly.

Optional **Recycle distant old shots** in Explore deletes unconnected shots older than 30 simulation seconds more than 100 m beyond the current view. Selected/followed shots are protected. It frees live projectile slots, but changes the world by removing those shots; leave it off for experiments that depend on their later motion. Default is off. There is no promise that every scene will run at 60 fps on every Chromebook; densely interacting mechanisms and complex terrain cost more.

## Progress and teacher review

Progress saves automatically in this browser/profile/app origin. Save file preserves the starting Explore scene, student name, completed designs/results, skips and attempt counts. Open file validates scenes and replays passing results. Switching devices requires the downloaded save file.

Students use **Share progress** to enter a name/ID and copy a report code/link or download JSON. Teachers paste it into Share progress's review field, open the link, or load report JSON; the app reproduces the locked simulations and can export CSV. Reviewing does not overwrite the teacher's own work. No messages or reports are sent automatically. Reports verify simulation results, not student identity or independent work.

The new curriculum is `engineering-v2`. Original 15-mission progress is preserved separately in saves and can be reviewed with **View saved original challenge progress**. Original report links still open. Old completion marks never silently count as new engineering missions.

## Run checks / rebuild

```sh
node tests/physics.test.cjs
python3 build_standalone.py
```

For browser checks, install Playwright locally (`npm install --no-save playwright`, then `npx playwright install chromium`) and run:

```sh
node tests/browser-engineering.test.cjs
node tests/browser-jitter.test.cjs
```

Optionally set `NEWTON_CHROMIUM` to an existing Chromium executable. Browser tests serve the app locally, run all missions, check controls/saves/reports and exercise a 180-body scene. See `VERIFICATION.md` for measured checks and limits.

To publish elsewhere, keep `index.html`, CSS/JS files (including `legacy-challenges.js`) and `vendor/` together in a GitHub Pages folder. Or upload the standalone file as `index.html`. No server-side code is needed.

Original code: MIT license. Vendored Planck copyright/license: `vendor/PLANCK-LICENSE.txt`.
