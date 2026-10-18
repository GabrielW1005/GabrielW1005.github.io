# Biology and model notes — Microcosm 2.1

The game keeps organism-specific mechanisms separate. Its parameter values, colors, relative visual scales, faction rules and progression rewards are gameplay choices. Real organisms do not deliberately buy mutations, choose strategic routes or follow a human player's colony commands.

## Enclosure, digestion and transport

The amoeba proceeds through attachment, pseudopod extension, enclosure, and an internal food vacuole. Prey remains present during capture. Biomass and energy are released gradually by digestion after internalization. A moving cell boundary is modeled with damped radial springs and contact constraints; the game does not solve actin networks or cytoplasmic fluid dynamics.

Paramecium uses a localized feeding current near an oral groove. Didinium captures ciliate prey at its anterior end. Dissolved nutrient parcels cross bacterial membranes without a phagosome. Detritus releases dissolved nutrient parcels; this represents decomposition and environmental processing, not a complete microbial enzyme model. Prey DNA is not automatically converted into abilities.

Research:

- [Phagocytic cup closure research, PMC6541287](https://pmc.ncbi.nlm.nih.gov/articles/PMC6541287/).
- [Amoeba proteus phagosome acidification experiment, PMID 6885916](https://pubmed.ncbi.nlm.nih.gov/6885916/).
- [Rogers, Waigh & Lu: Intracellular Microrheology of Motile Amoeba proteus](https://pmc.ncbi.nlm.nih.gov/articles/PMC2275677/).
- [Ciliary motor responses](https://pmc.ncbi.nlm.nih.gov/articles/PMC3907369/).

## Contact capture, puncture and chemical competition

Didinium toxicysts are close-contact prey-capture organelles. Paramecium trichocysts are a distinct defensive system; the game does not make them reliable protection from Didinium. The T6SS bacterium is separately identified as a composite Gram-negative model: its injector acts at contact range and damages a neighboring cell. It is not a distant grappling hook and is not an amoeba organelle.

The Bacillus-like bacterium releases a bacteriocin field. A Gaussian profile widens with time, drifts and decays; its concentration determines damage. The faction immunity model compresses real toxin/target/immunity specificity. Bacteria do not universally share one toxin or one set of defenses. The composite T6SS model's competence capability is also not universal.

Research:

- [Didinium toxicysts contacting Paramecium, Cell Image Library CIL:40951](https://www.cellimagelibrary.org/images/40951).
- [Transitions between three swimming gaits in Paramecium escape](https://pmc.ncbi.nlm.nih.gov/articles/PMC3088577/).
- [A family of Type VI secretion system effector proteins that form ion-selective pores](https://www.nature.com/articles/s41467-019-13439-0).
- [Bacillus subtilis bacteriocin production and immunity](https://pmc.ncbi.nlm.nih.gov/articles/PMC94516/).

## Genetics, mutation and reproduction

Player-selected variants stand for mutation followed by selection across compressed generations. A selected mutation is expressed in the two daughters at division. Mutations cannot create arbitrary foreign organelles. Level caps and prices are game rules.

Bacterial natural transformation requires modeled competence, DNA uptake, compatibility and an integration delay. An integration attempt can fail. Incompatible DNA does not confer a trait. Compatibility uses a coarse same-model-lineage gate; real sequence homology, restriction systems, competence regulation and mobile genetic elements are more complex. Digestion and genetic transformation are different processes.

The Paramecium pairing action is a schematic conjugation episode between existing compatible cells. It exchanges modeled nuclear variants without creating another cell. Real ciliate conjugation involves meiosis, nuclear exchange and subsequent nuclear reorganization; the timed game operation does not reproduce those steps or mating-type restrictions. It should not be mistaken for bacterial conjugation.

Division animates genetic-material separation and membrane constriction. Both daughters remain controllable. Stored biomass and energy are partitioned, and existing food vacuoles are distributed. The radius-to-biomass mapping conserves approximate two-dimensional cell area at equal division. Organelle duplication and partitioning are schematic; the game does not track each molecule or every organelle through its full cycle. The Paramecium macro- and micronuclear division mechanisms are not separately simulated.

Research:

- [Episodic selection, competence and transformation in Bacillus subtilis](https://pmc.ncbi.nlm.nih.gov/articles/PMC2666517/).
- [Programming bacteria for multiplexed DNA detection — primary natural-transformation research](https://www.nature.com/articles/s41467-023-37582-x).

## Functional interior and environmental stress

The model connects digestion to nutrient availability, aerobic energy yield to oxygen, membrane repair to reserves, water imbalance to osmotic conditions, and nuclei/nucleoids to inheritance and division. Eukaryotic cells show nucleus, mitochondria, lysosomal structures, food vacuoles, contractile vacuole, ER and ribosome dots. Bacteria show a nucleoid and ribosomes and do not have membrane-bound nuclei, mitochondria or lysosomes. Bacterial respiration is modeled at the membrane.

Organelles have lightweight animated drift and boundary confinement within the deformable cell. Pairwise organelle collisions are omitted for performance. Their positions, shapes and numbers are illustrations; moving a displayed mitochondrion does not simulate a change in its molecular output. Lysosomal digestion is associated with each food vacuole. Protein production and maintenance are aggregate resource costs, not individual ribosomal translation events. Golgi trafficking, cytoskeletal chemistry and detailed membrane pumps are not simulated.

Freshwater conditions tend to drive water inward; the contractile vacuole's cycle reduces excess water. A saline habitat produces dehydration instead. The osmoregulation variant reduces imbalance. Oxygen alone is not a food source. Photosynthesis is represented by the algal habitat, not by giving the player amoeba arbitrary chloroplasts. Endosymbiosis and kleptoplasty remain interesting future mechanisms but are not included in this release.

Research:

- [Acanthamoeba mitochondrial energy metabolism](https://pmc.ncbi.nlm.nih.gov/articles/PMC12040293/).
- [Paramecium bursaria and algal endosymbiosis](https://www.nature.com/articles/s41598-022-12496-8) — background for an unimplemented future mechanism.

## Physics and ecology

Velocity relaxes rapidly toward propulsion plus environmental flow, with no inertial bouncing. Small particles use stochastic displacement proportional to the square root of the time step; their diffusion is larger than whole-cell motion. Toxin variance increases over time and concentration falls with spreading and decay. These are qualitative low-Reynolds-number and diffusion models, not a calibrated Navier–Stokes solver or measured intracellular rheology.

AI has bounded sensing and resource choices, threat avoidance, cached obstacle-aware A* routes, feeding and resource-dependent reproduction. Predation is gated by reserves and a post-feeding pause. Selected player cells obey manual orders; distant ecology is updated at a coarser rate. Strategic navigation is a game convenience, not evidence that microbes plan paths. Factions are not taxonomic units. Habitat inflow and population limits prevent extinction or unbounded growth in the teaching game.

Research:

- [Purcell, Life at low Reynolds number](https://courses.washington.edu/biomechs/Purcell.pdf).
- [Field-based microbial chemotaxis research](https://www.nature.com/articles/s41586-022-04614-3).

All graphics are original procedural drawings. No research images are reproduced.
