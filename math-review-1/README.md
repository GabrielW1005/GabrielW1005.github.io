# 8th Grade - Math Review 1

A traditional printable review and matching interactive app for eighth graders reviewing foundational and seventh-grade mathematics. The packet has **462 practice problems on 43 pages**: 398 retained core problems and 64 additional problems integrated into the appropriate skill sections. The **43-page answer key uses the same sheets**, with answers and worked solutions in red beside the exercises.

The packet and app contain concise topic headings and practice problems, without the former page-top explanations or worked examples. Triangular-pyramid and cross-section sections have been removed. Cartesian coordinates, one-step equations, triangular prisms, and square pyramids remain.

The app follows the printed packet's pages, numbering, and order. Printed exercises offer optional general method guidance; their specific steps and solutions are not revealed in the app. Students can generate additional versions of any exercise, with matching step-by-step help, solutions, and visual labs. Numbers vary while the requested skill is preserved; supported arithmetic families also offer single-skill, two-skill, and mixed practice.

L-shaped diagrams use clear outer boundaries, readable dimensions, and restrained construction lines. L-shaped solids have an upright front face and clearly visible notch. Net animations unfold faces around shared edges, with consistent face colors and controls for playback and scrubbing.

Answer entry supports negatives, fractions, mixed numbers, coordinates, lists, expressions, equations, inequalities, and written explanations. Math keys, fraction and point builders, and a formatted preview make notation easier to enter. The interface includes light and neutral dark themes, with traditional serif mathematics and aligned fractions.

Answers, checks, generated practice, plotted points, and the selected problem save automatically in the current browser. The Progress screen shows completion, evidence of skill readiness, and recommended practice. Students can manually download a JSON backup, restore it on another device, download a CSV report, or copy a progress link for their teacher. Shared links contain a read-only snapshot of the optional student label and skill totals; they do not update automatically or send anything to a teacher. No account or server-side storage is required.

Saved work for retained problems keeps its original identifiers when pages change. Work from removed topics remains in backups but is omitted from the current packet, extra-practice list, and mastery totals.

## Source

- `dist/`: static app and downloadable PDFs.
- `dist/data/packet.json`: 462 problems across 75 section fragments from 70 retained topics, including the 64 integrated additions.
- `dist/data/print-layout.json`: version-2 mapping from retained section numbers to 43 printed pages.
- `dist/data/packet-supplement.json`: empty compatibility manifest with `integrated: true`; its former exercises now live in `packet.json` and retain their `P<page>-<index>` identifiers.
- `dist/practice.js`: deterministic generation and restricted mathematical answer parsing.
- `dist/progress.js`: local progress records, readiness summaries, backups, CSV reports, and shareable snapshots.
- `scripts/`: content generation, PDF authoring, and validation. Older source-generation scripts must preserve the current exclusions and integrated additions before replacing the canonical packet.

Serve `dist/` with a static web server. It has no server-side dependencies.

## Validation

```sh
node scripts/test-practice.mjs
node scripts/test-practice-v4.mjs
node scripts/test-labs.mjs
node scripts/test-lshapes-v5.mjs
node scripts/test-net-unfold.mjs
node scripts/test-net-controls.mjs
```

The practice suites check printed answers, generated variants, independent mathematical results, geometry, notation entry, safe parsing, and variety. PDF builds also require visual review of the student sheets and matching red-answer sheets. Check the net animation's shared-edge hinges and flat endpoints after changes to solid geometry.

## Design requirements

Use traditional Times serif mathematics, stacked fractions, plain headings, and compact workspace for numerical exercises. Preserve room for constructions and geometry. Progress from isolated skills through gradual variation to combinations of two, then three or more methods. Vary operands, answers, signs, units, and sizes. Keep diagrams geometrically accurate, with equal horizontal and vertical scale and consistent parallel projection for solids. Preserve the selected problem and saved work when switching between the packet and visual lab.
