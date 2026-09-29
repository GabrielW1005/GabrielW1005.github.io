# Motion Lab

A full-window physics playground for exploring distance–time and speed–time graphs. Built with HTML, CSS, JavaScript, and Canvas 2D. No dependencies, accounts, build step, remote fonts, tracking, or student data storage.

## Play

Open `index.html` directly, or serve this directory from a static web host. Relative asset paths work in a GitHub Pages subdirectory.

- **Explore:** drive a repeating adventure course with bumps, ramps, dips, gaps, and jumps. Choose rolling terrain or the simpler flat road, downhill, valley, and hill tracks in **Course & forces**. Adjust gravity, terrain height, initial velocity, and airborne motion.
- **Graph challenges:** 14 short challenges progress from speeding up, coasting, and slowing down to concave-up and concave-down distance and speed graphs. Gold dashes show an example shape; the live trace stays visible beside the car.
- **Park the car:** stop in the marked zone for two seconds.

The desktop layout fills the window, with **Time vs. distance** and **Time vs. speed** stacked on the right. Time remains on the horizontal axis of both graphs. **Full screen** uses the browser's native full-screen mode where supported. On narrow phones, the graphs move below the driving controls.

Hold **Left Arrow** or **Right Arrow** to drive. Hold **S / Down Arrow** to brake. Release to coast. **Space** pauses or resumes, **R** resets, and **Step** advances 0.1 simulated seconds while paused. On-screen buttons support touch and keyboard activation. Drag the car before starting an exploration to change its starting point.

The **Motor strength** slider works during a run. Use **A** and **D** to decrease or increase strength while holding a driving key. This lets students bend a speed graph by gradually changing acceleration. Settings that change the course reset the experiment. Playback speed changes the viewing rate, not the equations or graph time units.

Runs stop after 120 simulated seconds. Graph challenges stop at their prescribed duration. Moving away from the page automatically pauses the experiment and releases controls.

## Forgiving challenge progression

The **Unlock score** slider sets the required shape score from **1% to 100%**, with **65%** as the default. Adjust it before, during, or after an attempt; a finished attempt is reassessed immediately without rerunning it. The chosen percentage is remembered on this device when local browser storage is available. Exact heights, distances, and peak speeds do not have to match the target. The scorer trims phase boundaries to allow slightly early or late transitions and looks for the intended rising, falling, or moving-at-steady-speed behavior. Stopped phases require speed to be near zero. Each phase must still be attempted; a stationary car cannot pass by drawing a flat line. Feedback identifies what to try again.

The sequence is:

1. Speed up, then coast.
2. Slow down, then coast.
3. Speed up, coast, then slow down.
4. Make a distance graph concave up by increasing speed.
5. Make a distance graph concave down while still moving forward by decreasing speed.
6. Make a speed graph concave up by gradually increasing motor acceleration.
7. Make a speed graph concave down, while speed still rises, by gradually decreasing motor acceleration.
8. Cruise, boost, then cruise at a higher speed.
9. Slow down, cruise, then speed up again.
10. Stop, wait, then start moving again.
11. Make a distance graph straight, concave up, then straight again.
12. Switch a distance graph from concave up to concave down.
13. Bend a speed graph upward, then coast.
14. Switch a rising speed graph from concave up to concave down.

Completed challenges stay unlocked while the page remains open, even if the required percentage is raised afterward. Reloading the page starts a new session. Challenge roads are flat so students can isolate the relationship between acceleration, speed, and distance.

## Physics and interpretation

The car is an ideal point-mass cart on a smooth, fixed two-dimensional track. Rotating wheels are decorative; their moment of inertia, suspension, air drag, and rolling friction are omitted. Motor and braking controls specify force per unit mass.

Grounded position is integrated in signed arc length `s`. Increasing `s` points to the right. For local slope angle `theta`:

```text
ds/dt = v
dv/dt = motor_direction * motor_acceleration - g*sin(theta) + brake_acceleration
```

The brake opposes velocity at up to 6 m/s² in Explore; each graph challenge specifies its own braking acceleration. It stops at zero instead of pushing the car backward. At rest, it balances other tangential forces if they do not exceed its capacity. Reversal and stop events are located within each timestep by bisection.

Tracks use smooth quintic transitions with continuous slope and curvature. A Simpson-integrated arc-length lookup table at 0.01 m horizontal spacing maps between `x` and `s`. Fourth-order Runge–Kutta integrates grounded motion in fixed 1/240 s steps. Graphs sample at 20 Hz, with the live endpoint rendered between samples. Simulated time advances only by integrated steps. Brief frame stalls are capped instead of allowing inaccurate large timesteps.

With **Allow airborne jumps** enabled, the car leaves the road at a gap or when staying on a crest would require a negative normal support force. It retains its instantaneous tangent velocity. During flight, horizontal velocity is constant and vertical acceleration is `-g`; the motor and brake have no effect in the air. Ballistic position and velocity use the constant-acceleration equations. Landings remove velocity into the road and retain its tangential component: an ideal inelastic landing with no bounce. If the car hits a gap's far wall below the landing, the ideal inelastic wall impact removes horizontal velocity and retains vertical velocity. The car then falls under gravity into the pit while the camera and graphs follow its motion. The run ends only after the car falls below -24 m, allowing time to see the failed jump. With zero gravity, the car drifts for three seconds after a wall impact before the run ends. Cosmetic car tilt does not alter the physics. Disabling jumps keeps the car constrained to the track, including the dashed guide spanning a gap.

**Distance** accumulates the length of the traveled path on the ground and in the air. It starts at zero, counts reversals, and never decreases. **Speed** is the magnitude of velocity. Horizontal and vertical velocity readouts show the signed components. **Acceleration size** is the full vector magnitude, including the acceleration required to turn along a curve. The instantaneous landing or wall-impact impulse is not represented as a finite acceleration readout.

On the ground:

```text
velocity = v * tangent
acceleration = tangential_acceleration * tangent + v² * curvature * normal
```

Road markers indicate horizontal `x`; the distance graph measures the traveled path. Both canvas spatial axes use the same scale. Adventure and rolling terrain repeat seamlessly; the other tracks extend horizontally at their ends.

References: [OpenStax inclined planes](https://openstax.org/books/physics/pages/5-4-inclined-planes) and [projectile motion](https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion).

## Files and development

- `index.html` — interface, accessible controls, and model explanation
- `styles.css` — full-window responsive layout
- `physics.js` — independent physics engine, usable in a browser or Node
- `challenges.js` — 14 target curves and forgiving shape assessment
- `app.js` — controls, progression, animation, and live graphs
- `tests/*.test.cjs` — numerical physics and challenge-scoring checks
- `preview.cjs` — optional dependency-free local development server

With Node.js installed:

```sh
npm test
npm run dev
```

Visit `http://localhost:4173`. Node is not required to play or publish the game.

The 30 tests cover analytical acceleration, coasting, braking, reversals, inclines, energy conservation, arc mapping, periodic courses, loss of contact, ballistic flight, landings, missed jumps, rough graph matches, incorrect graph shapes, adjustable thresholds, stop-and-go behavior, and physical reachability of every new challenge. The valley test limits absolute energy-per-mass error to 0.0002 J/kg over 45 simulated seconds.

Optional, feature-detected WebMCP tools read the experiment or run, pause, reset, and step it through the same UI actions. Browsers without WebMCP work normally.

## GitHub Pages

This project is published from `motion-lab/` within `GabrielW1005/GabrielW1005.github.io` at **https://gabrielw1005.github.io/motion-lab/**.

Commit all five web files together: `index.html`, `styles.css`, `physics.js`, `challenges.js`, and `app.js`. GitHub Pages publishes the repository's `main` branch. The remaining files provide documentation, tests, and optional local development support.
