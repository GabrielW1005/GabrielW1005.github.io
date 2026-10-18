# Microcosm — Life in a Drop

A self-contained 2D cell-survival game for a modern browser. Designed as a scientifically grounded teaching game for middle-school students, with an in-game field guide that explains the model's limits.

## Play

Open `index.html` in Chrome, Edge, Firefox, or Safari. The game has no runtime dependencies, network requests, accounts, or build step. Its source links are optional reading and require internet access.

Choose an organism and select **Enter the pond** or **Enter the microhabitat**. On later visits, choose **Resume**. Each organism has its own save slot. Reach generation 3 to establish a lineage, then continue exploring.

| Organism | Food | Special strategy |
| --- | --- | --- |
| Amoeba | Small algae, bacteria, sufficiently small ciliates | Crawl with pseudopodia and engulf nearby food |
| Paramecium | Bacteria | Feed through the oral groove; discharge defensive trichocysts |
| Didinium | Paramecium | Contact-triggered toxicysts, capture, and ingestion |
| Bacillus-inspired model | Dissolved nutrients | Bacteriocins, competence, and compatible DNA uptake |

The bacterial habitat uses a separate approximate scale. It is a composite teaching model rather than one named strain.

## Controls

| Control | Action |
| --- | --- |
| WASD or arrow keys | Move |
| Hold a mouse, trackpad, or touch pointer on the habitat | Steer toward that location |
| Space / first action button | Engulf, discharge trichocysts, capture prey, or secrete bacteriocin |
| R / Divide | Reproduce when eligible |
| E / Enter competence | Toggle bacterial DNA uptake state |
| G / Genome | Inspect and attempt integration of collected bacterial variants |
| H / Field guide | Inspect anatomy, biology, controls, and sources |
| P / pause button | Pause or resume |
| Escape | Close a panel, or toggle pause |
| + / − buttons | Zoom |

All essential actions are available through buttons. Moving with a pointer requires holding it down; releasing it stops propulsion. A school Chromebook trackpad can be used with the keyboard controls.

## Survival and division

- **Integrity** represents cell damage. Energy-supported repair restores it slowly.
- **Energy reserve** pays for maintenance, movement, defense, and reproduction. Starvation damages the cell.
- **Biomass** comes from food and provides materials for division.
- Food vacuoles digest prey over time. Bacteria absorb dissolved nutrients directly.
- Division needs **100% biomass, at least 60% energy, and at least 60% integrity**. Finish digestion first. Bacteria must also leave competence and finish any recombination attempt.
- After division, you control one daughter; the other is represented by a moving sibling. Resources are shared. Integrated variants remain in the controlled lineage.
- **Gentle mode** reduces damage and energy loss for new runs. Select it when beginning a new organism or before restarting.

## Saves and classroom use

Autosave runs every eight seconds, at key milestones, and when the page is left. Progress stops while paused or closed. Use **Saves → Download save** to create a `.json` backup. Use **Saves → Import save** to resume a downloaded run.

Saves are local to the browser, device, and website address. Clearing browser data or moving from a local file to GitHub Pages can make the old local save inaccessible. Download a backup before changing devices or addresses. Managed school browsers may clear or block local storage. The game warns when saving is blocked; download still works if browser download policy permits it. The game sends no student data to a server.

Import validates the file and rejects incompatible or malformed saves. Importing replaces the matching organism's slot. Other organism slots remain available. In-game **Restart this organism** offers a download before starting over.

## Publish on GitHub Pages

1. Create a GitHub repository for the game, or open the repository you want to use.
2. Upload the **contents** of this folder. `index.html` must sit at the top of the publishing folder, not inside another nested `microcosm` folder. Include `.nojekyll` when uploading with Git.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the branch containing the game, usually **main**, and the **/(root)** folder; save.
6. After GitHub finishes deployment, use the address shown on that Pages settings screen.

If your repository already hosts a site, put this game in a subfolder such as `microcosm/index.html` to avoid replacing its homepage. The game then lives at that site's `/microcosm/` path. There is no need for a build command or a package installation.

GitHub's official instructions: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

This package is ready to publish; it has not been uploaded to your GitHub account.

## Biology and limitations

Read the in-game **Field guide**, including **Model & controls** and **Sources**, or the accompanying `BIOLOGY.md`. Colors are illustrative, structures are enlarged, times are compressed, and the physics is qualitative. The game is not a quantitative microbiology or fluid-dynamics simulator.

## Project contents

- `index.html` — complete game, styles, original procedural graphics, and save system.
- `README.md` — play, save, classroom, and publishing instructions.
- `BIOLOGY.md` — scientific scope, modeling decisions, and research references.
- `TESTING.md` — verification performed for this build.
- `.nojekyll` — tells GitHub Pages to serve the files without Jekyll processing.

Everything needed to play is inside `index.html`. The standalone `Microcosm.html` download is the same game with a descriptive filename.