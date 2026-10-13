# The Cell Cycle — interactive lesson

A self-contained, animated lesson for grades 6–8 covering the two cell-cycle quizzes and the 15-question study guide. All illustrations are original vector/canvas teaching graphics. No textbook images are included.

## Open it

Open `index.html` in a modern browser. It works offline, with no installation, account, server, external fonts, or libraries. It supports keyboard, mouse, touch, and full-screen viewing.

## Publish with GitHub Pages

1. Extract the ZIP.
2. Upload `index.html` and `README.md` to the root of your GitHub repository.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select your main branch and **/ (root)**, then save.
6. Open the Pages address shown by GitHub after deployment finishes.

If you already publish another site in that repository, place this lesson in a `cell-cycle` folder instead. It will be available at your existing Pages address followed by `/cell-cycle/`.

## Controls

- **Play / pause**, **restart**, and **next phase**.
- Select any phase or drag the timeline to inspect a moment. Selecting or scrubbing pauses the main animation.
- Set playback speed from 0.5× to 2×.
- Switch between animal and plant cells at any point.
- Show or hide on-canvas labels.
- **Show in cell** pauses at metaphase to examine a duplicated chromosome.
- Enter a chromosome number to compare the parent and daughters. This number example is separate from the animation's four-chromosome model.
- Replay the skin-repair illustration independently.
- Keyboard: Space toggles playback; left and right arrows seek by two seconds when focus is not in a control.
- Reduced-motion browser preferences pause the initial animations. Students can explicitly play them.

## Scientific model

The animation tracks four model chromosomes through interphase (G₁, S, G₂), prophase, metaphase, anaphase, telophase, cytokinesis, and two daughter cells. Each daughter receives all four chromosomes. DNA duplication does not double the chromosome number: it makes two sister chromatids per duplicated chromosome. After separation, each sister chromatid becomes a chromosome; there are briefly eight chromosomes in the undivided model cell, with four going to each pole.

Spindle fibers end at kinetochores on the correct moving chromatid. Chromatid arm lengths are fixed in the condensed model during alignment and separation; the arms pivot at the centromere rather than shrinking. Sister chromatids become independent chromosomes in anaphase. The brief eight-chromosome count in the undivided parent is distinguished from the four chromosomes in each daughter set. Animal cells show centrosomes with schematic centrioles; the plant mode omits centrioles. Animal centrosomes follow paths around the parent nucleus, rather than passing through it. The parent nuclear membrane breaks into visible fragments and disappears before kinetochore attachment. It re-forms around each set as chromosomes decondense. Animal cytokinesis starts as a furrow during late mitosis; plant cytokinesis shows a cell plate growing from the center until it meets the existing wall, with new plasma membranes on both sides. The plant outer wall stays fixed during mitosis, and the daughter cells remain adjacent.

The four-stage mitosis scheme matches the lesson. Events commonly assigned to prometaphase are included in late prophase. Cytokinesis overlaps late mitosis, although it has its own playback segment. The animation is a schematic teaching model: colors, sizes, organelle counts, and playback durations do not represent a microscope image or measured phase durations. Interphase usually occupies most of the real cycle. Only cells preparing to divide follow the complete cycle shown here.

The skin scene shows one living cell forming two chromosome sets and two nuclei before cytokinesis produces two cells. Cell movement and growth help fill the gap. It is a simplified illustration, not a complete wound-healing simulation: clotting, immune responses, and additional repair processes are omitted.

## Coverage

All 15 study questions are addressed: time spent in interphase; interphase preparation; chromatin; two sister chromatids; the centromere; plant cell plates; division of cytoplasm; chromosome numbers in daughter cells; skin replacement and repair; all four mitosis stages; and recognition of metaphase and anaphase diagrams.

## Science reference

Scientific details checked against [OpenStax Biology 2e, 10.2 — The Cell Cycle](https://openstax.org/books/biology-2e/pages/10-2-the-cell-cycle). Wording is adapted for middle-school students. No external content is needed to run the lesson.

Publishing reference: [GitHub Docs — Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Validation of the corrected model

The revised drawing logic was checked through the full timeline for both cell types. Geometric checks verify unchanged condensed arm lengths, centromere-leading movement, matching spindle endpoints, nuclear-envelope timing, all DNA paths inside their nuclei, centrosomes outside the parent nucleus, the final plant plate reaching the wall, and chromosome counts. Phase controls, scrubbing, playback speed, labels, and example number entry were checked. Representative phases were rendered for visual inspection. This environment did not provide a successful full browser test; a final check on the target Chromebook/browser is still recommended.