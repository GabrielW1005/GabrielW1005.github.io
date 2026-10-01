# Motion Lab

A full-window physics playground built with HTML, CSS, JavaScript, and Canvas 2D. Drive, fire thrusters, and learn from live distance–time and speed–time graphs. No dependencies, accounts, build step, remote fonts, tracking, or student data storage.

Play at **https://gabrielw1005.github.io/motion-lab/**, open `index.html`, or serve this directory with a static web host.

## Controls and activities

- **Left / Right arrows:** hold to drive the wheels. **Down arrow:** brake. Release to coast.
- **J / L:** hold to smoothly decrease / increase motor acceleration, including while driving. The rate is 0.5 m/s² per simulated second, with limits 0.25–6 m/s². While paused, strength changes with real time. The slider also works during a run.
- **W / A / S / D:** hold for up / left / down / right thrust in fixed screen directions. Four nozzles show flames opposite the applied force. Simultaneous jets add as vectors; opposing jets cancel. The **Thrusters** switch enables or hides all four modules.
- **Space:** pause/resume. **R:** reset. **Step:** advance 0.1 simulated seconds while paused. On-screen controls support touch and keyboard activation.

**Explore** includes a repeating adventure course with bumps, ramps, dips, gaps, and jumps. Course & forces offers other terrain, initial track velocity, gravity, and thrust force. The car's mass is 100 kg. Thrusters automatically enable airborne motion; disable them before selecting the optional ideal track guide. Course changes reset the experiment; motor and thrust adjustments work during a run. Drag the car before starting an exploration to change its starting point.

**Graph challenges** has 28 levels in two sets. The first level in each set is immediately available. All starting motor strengths, velocities, gravity, and thruster forces load automatically. The Track & thrusters set drives left to right along flat roads and downhill ramps using A/D. The wheel motor remains available, with some phases requiring a combination of Right arrow and a jet. W/S are disabled in these challenges and remain available in Explore. Gold dashes show an attainable example; exact graph heights need not match. **Park the car** asks students to stop in the marked zone for two seconds.

The desktop view fills the window, with **Time vs. distance** above **Time vs. speed** on the right. Time is the horizontal axis on both graphs. The gravity panel stays outside the play area above the graphs and shows the current gravity name, acceleration, mass, and thrust. On narrow phones, the graphs move below the controls. Full screen uses the browser's full-screen mode where available.

## Scoring

The unlock percentage is adjustable only from **90% to 100%**, default **90%**. Previous saved values below 90% are clamped to 90%. The selected percentage is remembered on this device when local browser storage is available. A completed attempt is regraded immediately if the threshold changes.

Every completed attempt displays its percentage, including 0%, in the challenge header. **Minimize** keeps the score and Next challenge button visible while freeing canvas space. Reset preserves the last score until another attempt finishes. The collapsed state persists when switching challenges. Unlocks and attempt results last for the current open page.

Scoring examines rising/falling speed, moving at steady speed, stopping, and concavity. Phase boundaries are trimmed to tolerate small timing errors; amplitudes are flexible. Every phase needs an attempt, so a flat stationary trace cannot pass a moving challenge. Specified phases also require the correct jet, wheel motor, or combination for most of the scored interval. The Track & thrusters set also requires forward travel; sustained reversing does not pass. Feedback identifies a weak phase.

### Motor graphs, 1–14

Speed up/coast; slow down/coast; rise/coast/fall; concave-up distance; concave-down distance; concave-up speed; concave-down speed; cruise/boost/cruise; slow/cruise/accelerate; stop/wait/go; straight/curved/straight distance; switching distance concavity; curved speed/coast; switching speed concavity.

### Track & thrusters, 15–28

15. Thrust right with D, coast, then slow with A while continuing right.
16. Moon flat road: cruise, boost with D, cruise faster.
17. Mars flat road: slow using A, then coast.
18. Distance: D makes the graph concave up; release to draw a straight line.
19. Distance: A makes the graph concave down; D bends it upward.
20. Wheel motor, wheel motor plus D, then coast.
21. Wheel motor, wheel motor balanced by A, then A alone to slow down.
22. Right arrow + D + L: increase motor strength for concave-up speed.
23. Right arrow + A + J: reduce motor strength for concave-down speed while still accelerating.
24. Moon ramp: coast downhill under gravity, then boost with D.
25. Mars ramp: D accelerates downhill; A slows the car while it still moves right.
26. Ramp gravity switches Moon → Mars → Earth: fixed A thrust gives falling, flat, then rising speed.
27. Ramp with increasing gravity: fixed motor plus D makes speed concave up.
28. Ramp with decreasing gravity: fixed D makes rising speed concave down.

All 14 reference runs start on the road and continue rightward. Gravity ramps use a straight 1-in-5 downhill slope so its influence is visible in the driving graphs. Targets are generated with the same motor ramping, horizontal forces, and gravity as the live run.

Changing-gravity challenges are explicitly artificial experiments, not instantaneous journeys between planets. Their target traces come from the same physical simulation, preset forces, gravity schedules, and controls as the student's run. Moon/Mars/Earth values are representative near-surface accelerations, treated as spatially uniform.

## Physics and units

The car is an ideal point mass on a fixed two-dimensional road. Wheels and tilt are decorative. The model omits air drag, rolling resistance, suspension, wheel inertia, fuel depletion, torque, and bounce. Motor strength means tangential force per unit mass in m/s². Jets are ideal stabilized actuators with force in newtons.

For net directional thrust `(Fx,Fy)`, mass `m`, and downward gravity `g`, free flight uses:

```text
ax = Fx/m
ay = Fy/m - g
x(t+dt) = x(t) + vx*dt + ax*dt²/2
vx(t+dt) = vx(t) + ax*dt
```

The same position/velocity equations apply to y. Wheels cannot drive or brake in the air. For example, 1200 N / 100 kg gives 12 m/s² upward thrust acceleration; on Earth the resulting vertical acceleration is 12 − 9.81 = 2.19 m/s² upward. A 981 N jet balances Earth gravity without changing vertical velocity.

On the ground, let `T` be the unit tangent, `N` the upward unit normal, `k` signed curvature, and `v` signed speed along the road:

```text
ds/dt = v
at = motor_direction*motor_strength + (Fx/m, Fy/m - g)·T + braking
acceleration = at*T + v²*k*N
normal_support/m = v²*k - (Fx/m, Fy/m - g)·N
```

The car leaves the road at a gap or when contact would require negative normal support. Upward thrust exceeding weight lifts the car from level ground. The brake opposes velocity without reversing it; at rest it balances tangential forces up to its capacity. Explore uses 6 m/s² braking; challenges preset their own values.

Landings remove velocity into the surface and retain the tangential component, representing an ideal inelastic impact. A pit wall removes inward horizontal velocity and supports inward forces. Vertical motion and outward thrust remain possible, so a missed jump can be recovered using thrusters. The camera follows falling motion until y < −24 m. With jets disabled and zero gravity, a missed jump ends after three seconds. All runs end by 120 simulated seconds. Impulses at impacts are not displayed as finite acceleration values.

**Distance (m)** accumulates the entire path on the ground and in the air, including both legs of a reversal. It never decreases. **Speed (m/s)** is `sqrt(vx² + vy²)`. Horizontal and vertical velocity retain their signs. **Acceleration size (m/s²)** is the full vector magnitude, including acceleration caused by turning along the road. Time is simulated seconds. Thus distance's slope equals speed, and the area under speed equals distance.

Smooth quintic terrain has continuous slope and curvature. The challenge-only long downhill uses an exact straight 1-in-5 slope with analytical arc coordinates at every position. A Simpson-integrated arc-length table with 0.01 m horizontal spacing maps x to signed road distance. Ground motion uses fourth-order Runge–Kutta at a fixed 1/240 s step. Stops, reversals, launches, and contacts are located within the step. Flight uses constant-acceleration steps and integrated vector speed; gravity ramps and motor changes use midpoint acceleration. Graphs sample at 20 Hz with a live endpoint. Brief frame stalls are capped instead of creating large, inaccurate steps. Playback speed changes the viewing rate, not physics or units. Both spatial axes use the same scale.

References: [OpenStax forces](https://openstax.org/books/university-physics-volume-1/pages/5-6-common-forces), [NASA planet comparison](https://solarsystem.nasa.gov/planet-compare/), and [NASA Moon data](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html).

## Development and publication

- `index.html`, `styles.css`: accessible interface and responsive layout.
- `physics.js`: independent browser/Node physics engine.
- `challenges.js`: 28 challenges, presets, reference traces, and shape assessment.
- `app.js`: controls, progression, animation, and graphs.
- `tests/*.test.cjs`: analytical physics and scoring regression checks.
- `preview.cjs`: optional dependency-free development server.

Run `npm test` or `npm run dev` with Node.js. Node is not required to play or publish. The 46 tests cover acceleration, braking, reversals, energy conservation, road geometry, flight, landings, missed jumps, forces, support/lift-off, motor ramps, changing gravity, wall recovery, scoring limits, forward-only driving, combined motor/thruster phases, exact downhill gravity ramps, and reference challenges. The valley energy test limits absolute energy-per-mass error to 0.0002 J/kg over 45 simulated seconds.

Optional feature-detected WebMCP tools read, run, pause, reset, and step the experiment through the same actions as the UI. Browsers without WebMCP work normally.

Publish all five web files together to `motion-lab/` in `GabrielW1005/GabrielW1005.github.io`. GitHub Pages deploys the repository's `main` branch. Documentation and tests accompany the source.
