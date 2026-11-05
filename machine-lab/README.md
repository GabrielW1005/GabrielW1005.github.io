# Machine Lab

An original grade-8 work and simple-machines simulator with 12 problems and a standalone two-page worksheet. Deployed as a static GitHub Pages folder at `/machine-lab/`.

## Use

Open `index.html` through an HTTP server. Select a numbered problem; answer the missing quantity, mechanical advantage, work-distance comparison, and force comparison. Play or scrub the motion, toggle trajectories, and open worked steps. "Change the machine" explores geometry and load separately from worksheet answers. Progress is stored only in the current browser. No accounts, external scripts, or tracking.

The app is dependency-free ES modules, CSS, JSON, and SVG. `problems.json` is the shared numerical source for the simulator and printed worksheet. `worksheet.pdf` contains the student sheet. The teacher answer key is supplied separately.

## Physics model

Ideal quasi-static machines with negligible machine mass and no friction: F1*d1 = F2*d2, MA = F2/F1 = d1/d2. All forces are positive input/output magnitudes. Work distances follow force direction; lever endpoint arcs are visualized separately from vertical work distances. At rest a balanced seesaw does zero work. Gear force ratios are defined at equal-radius input crank and output drum, not at meshing teeth. The screw is axially fixed and the nut/load cannot rotate. Hydraulics use incompressible water and negligible hydrostatic head.

Classical simple machines: lever, inclined plane, pulley, wheel and axle, screw, wedge. A geared winch and linked syringes extend the same relationship. Real-world energy losses are explained in the guide and teacher notes.

## Validation

Every problem checked for energy equality and its applicable lever/radius/gear/area geometry ratio. PDF worksheet and teacher key visually inspected at two pages each. Browser QA covers answer validation, decimal and fraction entry, worked solutions, saved progress, model navigation, trajectories, playback, geometry changes, and theme.

## References

- https://openstax.org/books/physics/pages/9-3-simple-machines
- https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics
- https://fab.cba.mit.edu/classes/863.15/doc/tutorials/mechanical_design/index.html

Original content. Uploaded Glencoe lessons informed only grade-level content and terminology.
