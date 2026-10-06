# Verification record

Verified 2026-10-05.

## Numerical checks

`node tests/physics.test.cjs`: **25 checks passed**.

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
- Challenge gravity settings locked and later levels locked until completion.
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
