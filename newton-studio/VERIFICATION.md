# Verification record

Verified 2026-10-05.

## Numerical checks

`node tests/physics.test.cjs`: **28 checks passed**.

- Constant force: analytic acceleration and velocity; expected finite-step position error.
- Uniform gravity independent of mass.
- Balanced vertical forces: hover.
- No external force: conserved velocity, correct displacement and path distance.
- Quadratic air drag: predicted terminal speed.
- Off-center force: torque and angular acceleration from the computed inertia.
- A 100 m/s projectile colliding with a 0.1 m fixed wall: no translational tunneling in this test.
- Invalid scene rejection.
- Resting contact: support force equals weight and net force is zero.
- Halved time step: halved constant-acceleration position error.
- All 15 levels pass when tested with their analytic solutions.

These are representative verification checks, not a proof of accuracy for arbitrary scenes.

## Browser workflow checks

Automated in headless Chromium at 1440×900; responsive layout inspected at 390×844.

Passed:

- Load with all engine/script/style assets local and no JavaScript errors.
- Draw a circle, inspect it, and change its mass.
- Run/pause a scene; graph selected motion; download measurements CSV.
- Load the car example; hold its mapped motor key; observe forward movement.
- Challenge gravity settings locked and later levels locked until completion or an explicit skip.
- An incorrect value produces feedback without awarding completion.
- Complete all 15 challenges through the visible inputs and buttons.
- Reload restores 15 completed levels automatically.
- Encode/decode progress with a student name containing special characters.
- Review a report and reproduce its passing results.
- Download a full save, clear local storage, import the file, and recover the scene/progress.
- Open a report URL in a separate teacher browser profile; display the student results without replacing the teacher's own progress.
- Mobile Explore and Challenges layouts: no horizontal document overflow.
- Single-file edition: open directly with `file://`, run physics, complete a challenge, and export a save without external assets.

Screenshots were visually inspected for the sandbox, graph, desktop challenge, and mobile challenge surfaces.

Optional experimental WebMCP integration is feature-detected. The test browser does not provide a native supported WebMCP context; native integration validation is unavailable. Mock-registry verification checks schemas, replacement/read actions, and failure on invalid or locked scenes. Normal app operation does not require this API.

## Practical limits

Browser behavior was verified in Chromium, not on every possible Chromebook, Safari, or Firefox version. Automatic persistence requires usable local storage; use the downloaded save as a backup. Reports replay the numeric outcomes but do not authenticate the student. Ideal gears and rigid-body contacts are numerical models; read the included Physics notes for assumptions and limits.

## Layout update — 2026-10-06

Verified native fullscreen entry/exit and controls synchronized after an external exit. Verified independent sidebar collapse/restore, visible restore buttons, remembered layout after reload, a larger canvas, continued running physics/graphs during panel changes, and the challenge level panel. Checked 1920, 1440, 1024, and 390 pixel viewport widths without horizontal document overflow. No browser JavaScript errors. Physics code was unchanged.


## Learning and control update — 2026-10-06

- All 28 numerical checks pass, including held/released keyboard thrust, reversible motor drive, and neighboring gear geometry/ratio enforcement.
- All 15 missions completed through browser controls with their analytic solutions. Existing completion saves and reports still replay successfully.
- Dark/light preference survives reload; dark desktop/mobile panels, controls and world were visually inspected.
- Five tutorials open, and their example loader works. Mission walkthroughs and progressive hints display correctly.
- Skipping unlocks the next level without awarding completion. Tested skips through the final level, noncontiguous completion recovery, portable save/import, teacher report review, and completion of a previously skipped mission.
- Car motor keys, thruster keys, release and window blur tested in Chromium. Camera followed the chassis at x=250 m while a wheel was selected for inspection.
- Nearby gears snap/connect; distant gear constraints are inactive; dragging away disconnects the mesh while preserving axles.
- Fullscreen and collapsible panels remain operational; desktop and mobile layouts have no horizontal document overflow.
- Updated single-file edition runs offline, completes a mission, and downloads a save with no network requests or browser script errors.


## Rotation, terrain and launcher update — 2026-10-06

`node tests/physics.test.cjs`: **38 checks passed**. Added checks for rotated floor contact, a fast rotated rectangle against a thin wall, fast projectile versus a moving dynamic target, elastic momentum/energy conservation, terrain seam traversal without speed loss, analytic frictionless slope acceleration, fast-shot terrain contact, terrain geometry validation, muzzle point velocity and recoil, and weld-mounted recoil momentum.

Chromium workflows passed: rotation handle with Shift snapping and Undo; ground-to-terrain conversion; raising/lowering and whole-stroke Undo; custom keyboard fire key; inherited projectile velocity; host rotation, launcher detach/remount; catapult swing, keyboard release and airborne motion; Reset reloading the payload; terrain and mounted-launcher save/import; desktop/mobile layout without horizontal overflow. Seven tutorials cover the new workflows. Existing 15 challenges all completed through browser controls; reports, save/import and teacher report URLs passed again. Fullscreen/sidebar layout checks still pass. The updated single-file edition runs offline and exports saves without external requests.

Collision tests use supported classroom scales and nonoverlapping starting objects. Terrain is a chain boundary around a height profile, so overhangs/caves and initial interior penetration are not supported. Recoil tests include the externally supplied projectile's inherited momentum in the initial system; vehicle mass does not deplete. Numerical contact slop is accounted for explicitly in the tests.
