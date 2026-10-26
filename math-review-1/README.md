# 8th Grade - Math Review 1

A traditional printable review and matching interactive app for eighth graders reviewing foundational and seventh-grade mathematics. The final packet has **474 practice problems on 52 pages**: 410 core problems plus 64 additional problems placed in available page space. The **52-page answer key uses the same sheets**, with answers and worked solutions in red beside the exercises.

The app follows the printed packet's pages, numbering, and order. Printed exercises offer method guidance; their specific steps and solutions are not revealed in the app. Students can generate additional versions of any exercise, with matching step-by-step help, solutions, and visual labs. Numbers vary while the requested skill is preserved; supported arithmetic families also offer single-skill, two-skill, and mixed practice.

Answer entry supports negatives, fractions, mixed numbers, coordinates, lists, expressions, equations, inequalities, and written explanations. Math keys, fraction and point builders, and a formatted preview make notation easier to enter. The interface includes light and neutral dark themes, with traditional serif mathematics and aligned fractions.

Answers, checks, generated practice, plotted points, and the selected problem save automatically in the current browser. The Progress screen shows completion, evidence of skill readiness, and recommended practice. Students can manually download a JSON backup, restore it on another device, download a CSV report, or copy a progress link for their teacher. Shared links contain a read-only snapshot of the optional student label and skill totals; they do not update automatically or send anything to a teacher. No account or server-side storage is required.

## Source

- `dist/`: static app and downloadable PDFs.
- `dist/data/packet.json`: 410 core problems in 73 instructional sections.
- `dist/data/print-layout.json`: mapping from instructional sections to 52 printed pages.
- `dist/data/packet-supplement.json`: 64 printed additions, with stable `P<page>-<index>` identifiers and source-section metadata.
- `dist/practice.js`: deterministic generation and restricted mathematical answer parsing.
- `dist/progress.js`: local progress records, readiness summaries, backups, CSV reports, and shareable snapshots.
- `scripts/`: content generation, PDF authoring, and validation.

Serve `dist/` with a static web server. It has no server-side dependencies.

## Validation

```sh
node scripts/test-practice.mjs
node scripts/test-practice-v4.mjs
node scripts/test-labs.mjs
```

The practice suites check canonical and supplemental answers, generated variants, independent mathematical results, geometry, notation entry, safe parsing, and variety. PDF builds also require visual review of the student sheets and matching red-answer sheets.

## Design requirements

Use traditional Times serif mathematics, stacked fractions, plain headings, and compact workspace for numerical exercises. Preserve room for constructions and geometry. Teach each method before combining skills; include repetition with gradual variation. Vary operands, answers, signs, units, and sizes. Keep diagrams geometrically accurate, with equal horizontal and vertical scale and consistent parallel projection for solids. Preserve the selected problem and saved work when switching between the packet and visual lab.
