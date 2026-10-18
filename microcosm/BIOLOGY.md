# Biology and modeling notes

## Purpose

Microcosm teaches different cellular strategies through play. It preserves distinctions between bacteria and eukaryotes, feeding and gene transfer, defensive and offensive extrusomes, and molecular uptake versus phagocytosis. It intentionally avoids a universal “eat an organism and steal all its powers” mechanic.

The playable types are recognizable biological models, not exact reconstructions of particular measured specimens. The Bacillus-like organism is explicitly a composite. The game's enemies and susceptibility classes are abstractions, not an experimentally characterized microbial community.

## Mechanism mapping

| Mechanism | Representation | Scope and simplification |
| --- | --- | --- |
| Amoeboid locomotion | Deforming outline and directional pseudopodia; slow surface movement | Procedural outline, no actin-network or full cytoplasmic-flow calculation |
| Phagocytosis | Enclosure, internal food vacuole, delayed energy and biomass gain | Food selection, enclosure shape, and digestion timing are simplified |
| Ciliary feeding | Nearby bacteria move toward Paramecium's oral groove | A local attraction field represents a feeding current, not a solved flow field |
| Trichocysts | Short-lived defensive filaments interrupt a nearby amoeba | Effect depends on predator; Didinium is not reliably stopped in this model |
| Didinium predation | Anterior proboscis, contact-range toxicysts, tethering and ingestion | Pexicysts are described in the guide; their separate physical contributions are not simulated |
| Contractile vacuoles | Repeated filling/discharge cycle in freshwater protists | Water balance is automatic; energetic cost is included in maintenance rather than explicit osmotic flux |
| Bacterial motility | Rod with several moving helical-filament projections | Flagella rotate in bacteria; the wavy drawing is a 2D projection, not a eukaryotic flagellar beat |
| Bacteriocins | Costly secretion, expanding/diluting/decaying fields, strain-dependent susceptibility | Generic products and susceptibility classes; not named drugs or laboratory protocols |
| Natural transformation | Competence, extracellular DNA uptake, compatibility check, recombination attempt | Only the bacterial model receives inherited variants from this mechanic |
| Reproduction | Cell elongation/constriction or septum formation followed by daughters | Division is compressed; the cell cycle and chromosome behavior are schematic |

## Genetics

Natural transformation involves uptake of extracellular DNA by competent bacteria. Stable inheritance may involve recombination and is not guaranteed merely by taking up a fragment. Homologous recombination depends on suitable sequence similarity. Other routes of horizontal gene transfer exist, and relatedness is not an absolute universal barrier; those routes are outside this game.

The compatible and incompatible DNA categories teach this distinction. Incompatible fragments provide no new trait in the implemented recombination route. DNA is not a collection of interchangeable organelles. The protist models digest food rather than installing its traits. Horizontal gene transfer can occur in eukaryotic evolution, but instant prey-to-predator ability transfer would misrepresent that process.

The three selectable variants—nutrient transport, rival-toxin immunity, and motility regulation—are invented phenotype examples. Their bonuses, energy costs, seven-second delay, and 70% success probability are game-balancing parameters, not measured Bacillus rates or specific gene descriptions. Competence slows motility and suspends nutrient-driven growth in the model. Real competence regulation is more complex.

The player-controlled daughter retains integrated variants. Nonplayer siblings are simplified lineage markers; they are not a fully simulated genetic population.

## Reproduction and nuclei

Amoebae undergo nuclear division and cytokinesis. Ciliates have macro- and micronuclei; during asexual division the micronucleus divides mitotically and the macronucleus amitotically. Bacterial binary fission does not involve mitosis or a membrane-bound nucleus. The bacterial graphics show a nucleoid and division septum rather than a nucleus.

The ciliate and bacterial division plane crosses the long axis. Amoeboid fission is depicted schematically. Daughter cells share modeled resources. The internal division graphics are summaries, not chromosome animations. Ciliate conjugation is not implemented, and should not be equated with an immediate increase in cell number.

## Physics

- Propulsion approaches a terminal velocity under strong drag. Its numerical relaxation time is about 0.03 game seconds. This is a control-model choice, not a fitted measurement.
- Small particles undergo random displacement proportional to the square root of the time step, representing diffusion. Bacterial food dots are parcels of dissolved nutrients, not visible individual nutrient molecules.
- Weak currents transport free particles and swimming cells. Amoeboid movement is substrate-associated.
- Contact produces soft separation without elastic bouncing. Collision boundaries approximate complex outlines.
- Bacteriocin-field radius grows approximately with the square root of time; effective concentration declines as the area expands and the product decays. The numerical parameters are qualitative.
- There is no full Navier–Stokes or Stokes-flow solution, hydrodynamic cell–cell interaction, temperature model, oxygen model, or realistic three-dimensional boundary treatment.

## Graphics and scale

Procedural graphics distinguish pseudopodia, a ciliated slipper-like body with an oral groove, Didinium's ciliary bands and anterior proboscis, and a rod-shaped bacterial cell without eukaryotic organelles. Food vacuoles and nuclei are schematic. Colors identify organisms and structures; they are not their natural colors under ordinary microscopy.

Protist mode uses a nominal mapping of one world unit to one micrometer, while bacterial mode uses one world unit to 0.1 micrometer. Scale bars follow zoom, but shapes and cell sizes are representative, and tiny prey are enlarged for visibility. The bacterial and protist habitats should not be compared at equal screen zoom as if they shared a scale.

Times for digestion, damage, gene integration, growth, and reproduction are compressed independently. Energy, biomass, and integrity are abstract gauges. Replenishing food and arriving cells represent an open habitat. The simulated scene does not conserve all ecosystem mass or maintain a complete food web. Dormancy, cyst formation, spores, and sexual reproduction are omitted.

## Research references

These publications and microscopy records informed the qualitative mechanics. No source images were copied into the game.

1. [Rogers, Waigh & Lu (2008), Intracellular Microrheology of Motile Amoeba proteus](https://pmc.ncbi.nlm.nih.gov/articles/PMC2275677/). Cytoplasmic streaming and the mechanics of motile amoebae.
2. [Amoeboid Cells Use Protrusions for Walking, Gliding and Swimming (2011)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3212573/). Pseudopod-based locomotion and environmental context.
3. [Evidence for Two Extremes of Ciliary Motor Response in a Single Swimming Microorganism (2014)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3907369/). Cilia in swimming and feeding.
4. [Transitions between three swimming gaits in Paramecium escape (2011)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3088577/). Trichocyst-associated escape responses.
5. [Cell Image Library, CIL:40951](https://www.cellimagelibrary.org/images/40951), Didinium and Paramecium during capture. Toxicysts connect prey to the proboscis before ingestion.
6. [Episodic Selection and the Maintenance of Competence and Natural Transformation in Bacillus subtilis (2009)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2666517/). Competence and periods of nongrowth.
7. [Zheng et al. (2000), Mutational Analysis of the sbo-alb Locus of Bacillus subtilis: Identification of Genes Required for Subtilosin Production and Immunity](https://pmc.ncbi.nlm.nih.gov/articles/PMC94516/). Antimicrobial-product synthesis and immunity.

## Discussion prompts

- Why would a defensive secretion need an energy cost?
- Why does a swimming cell stop quickly after it stops propelling itself?
- Why is taking in DNA different from inheriting a new trait?
- Why can a bacterium absorb dissolved food but not engulf a Paramecium?
- Which game simplification would you change to investigate a real research question?