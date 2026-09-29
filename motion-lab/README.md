# Motion Lab

A browser-based physics game for exploring distance–time and speed–time graphs. Built with HTML, CSS, JavaScript, and Canvas 2D. No dependencies, accounts, build step, remote fonts, tracking, or student data storage.

## Play

Open `index.html` directly, or serve this directory from any static web host. The files use relative paths and work in a GitHub Pages subdirectory.

- **Explore:** choose flat ground, downhill, a valley, or a hill. Adjust gravity, height, initial track velocity, and motor acceleration.
- **Park the car:** stop in the marked zone for two seconds.
- **Match the graph:** reproduce a seven-second target speed curve. Settings are fixed to make the target attainable; the motor and brake each supply 2 m/s². The score is `max(0, 100 × (1 − RMSE / 4 m/s))` over the full seven seconds. An 85% match completes the challenge successfully.

Hold **A / Left Arrow** or **D / Right Arrow** to drive. Hold **S / Down Arrow** to brake. Release to coast. **Space** pauses or resumes, **R** resets, and **Step** advances 0.1 simulated seconds while paused. On-screen buttons support touch and keyboard activation. Drag the car before starting to change its starting point. Changes to track, height, gravity, and initial velocity reset the experiment; motor acceleration can change during a run. Playback speed changes the viewing rate, not the equations or graph time units.

Runs stop after 120 simulated seconds. Moving away from the page automatically pauses the experiment and releases controls.

## Physics and interpretation

The car is a point-mass ideal cart constrained to a smooth, fixed 2D track. The constraint keeps it on the road: this is not a jumping, collision, or suspension simulation. Rotating wheels are decorative; their moment of inertia is not modeled. Air drag and rolling friction are omitted. Mass cancels because motor and braking controls specify force per unit mass.

Position is integrated in signed arc length `s` along the road. Increasing `s` points to the right. For local slope angle `theta`:

```text
ds/dt = v
dv/dt = motor_direction * motor_acceleration - g*sin(theta) + brake_acceleration
```

The brake opposes the velocity at up to 6 m/s² (2 m/s² in the graph challenge). It stops at zero instead of pushing the car backward; at rest it balances the other tangential forces if they do not exceed its capacity. Reversal/stop events are located within each timestep by bisection. The remaining portion of the step is then integrated separately.

Tracks use smooth quintic transitions, with continuous slope and curvature. A Simpson-integrated arc-length lookup table at 0.01 m horizontal spacing maps between `x` and `s`. Fourth-order Runge–Kutta integrates motion in fixed 1/240 s steps. Graphs sample at 20 Hz; the live endpoint is rendered between samples. Simulated time advances only by integrated steps. Brief frame stalls are capped rather than allowing large, inaccurate integration steps.

**Distance** sums absolute path increments, splitting increments at reversals. It starts at zero regardless of starting position, follows slopes, and never decreases. **Speed** is `abs(v)`. **Track velocity** is signed along-track velocity; **track acceleration** is its signed time derivative. These are clearly distinguished from horizontal distance and full vector acceleration.

The full Cartesian velocity and acceleration are also calculated by `Simulation.snapshot()`:

```text
velocity = v * tangent
acceleration = tangential_acceleration * tangent + v² * curvature * normal
```

The road's printed meter markers indicate horizontal `x`, while the graphs show distance along the road. Both canvas spatial axes use the same scale. The road extends horizontally beyond the ramps rather than bouncing or teleporting at a screen edge.

The incline model follows the gravity component described in [OpenStax Physics, Inclined Planes](https://openstax.org/books/physics/pages/5-4-inclined-planes).

## Files

- `index.html` — interface, labels, accessibility, model explanation
- `styles.css` — responsive layout
- `physics.js` — independent physics engine, usable in a browser or Node
- `app.js` — controls, challenges, animation, and graphs
- `tests/physics.test.cjs` — numerical checks against analytical results and energy conservation
- `preview.cjs` — optional dependency-free local development server

## Development

With a current Node.js installed:

```sh
npm test
npm run dev
```

Visit `http://localhost:4173` for local development. Node is not required to play or publish the game.

The numerical tests check constant acceleration, coasting, stopping distance, direction reversals, local incline acceleration, downhill terminal energy conversion, valley energy conservation, brake holding, zero-gravity motion, arc-length mapping, and the graph challenge's exact solution. The valley test limits absolute energy-per-mass error to 0.0002 J/kg over 45 simulated seconds.

Optional, feature-detected WebMCP tools read the experiment or run, pause, reset, and step it through the same UI actions. Browsers without WebMCP work normally.

## GitHub Pages

This project is intended for `motion-lab/` within `GabrielW1005/GabrielW1005.github.io`. Commit all four web files together. If the repository publishes from the root of `main`, the game is available at `https://gabrielw1005.github.io/motion-lab/`.

For a separate repository, put the files at its root, then choose **Settings → Pages → Deploy from a branch → main → / (root)**. See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
