# Biology and model notes — Microcosm 2.3

The game keeps organism-specific mechanisms separate. Its parameter values, colors, relative visual scales, faction rules and progression rewards are gameplay choices. Real organisms do not deliberately buy mutations, choose strategic routes or follow a human player's colony commands.

## Enclosure, digestion and transport

The amoeba proceeds through attachment, pseudopod extension, enclosure, and an internal food vacuole. Broad pseudopods can change the cell's polarity and spread around food; they are not a uniform expanding circular ring. The game uses two uneven, sequentially extending lobes, an irregular opening, and prey-oriented dimensions. Prey remains outside the open cup until closure. Biomass and energy are released gradually by digestion after internalization. The idle boundary uses damped radial springs and contact constraints; the feeding outline is a small animated spline. These illustrate the sequence without solving actin networks, membrane tension or cytoplasmic fluid dynamics.

Paramecium uses a localized feeding current near an oral groove. Didinium captures ciliate prey at its anterior end. Dissolved nutrient parcels cross bacterial membranes without a phagosome. Detritus releases dissolved nutrient parcels; this represents decomposition and environmental processing, not a complete microbial enzyme model. Prey DNA is not automatically converted into abilities.

The game's feeding gate combines an organism-specific diet with prey-to-predator radius. Amoebae accept modeled bacteria and Paramecium up to 0.85 of their radius; Paramecium accepts bacteria up to 0.55; Didinium accepts Paramecium up to 1.65. These are deliberately tuned game limits, not universal biological thresholds or measured maximum prey sizes. The species roster is selective, and bacterial sizes are exaggerated relative to protists for visibility. Feeding duration grows with prey size and slows at low energy; these times are likewise illustrative.

Research:

- [Jeon & Jeon, scanning electron microscope observations of Amoeba proteus during phagocytosis](https://pubmed.ncbi.nlm.nih.gov/1271309/).
- [Phagocytic cup closure research, PMC6541287](https://pmc.ncbi.nlm.nih.gov/articles/PMC6541287/).
- [Amoeba proteus phagosome acidification experiment, PMID 6885916](https://pubmed.ncbi.nlm.nih.gov/6885916/).
- [Rogers, Waigh & Lu: Intracellular Microrheology of Motile Amoeba proteus](https://pmc.ncbi.nlm.nih.gov/articles/PMC2275677/).
- [Ciliary motor responses](https://pmc.ncbi.nlm.nih.gov/articles/PMC3907369/).

## Contact capture, puncture and chemical competition

Didinium toxicysts are close-contact prey-capture organelles that anchor and immobilize ciliate prey before ingestion. Paramecium trichocysts are a distinct system whose effectiveness depends on the predator; they are not universal armor and do not reliably stop Didinium. Paramecium can often avoid amoeba enclosure by swimming away, while discharge after complete enclosure does not provide a dependable escape. Accordingly, the open-cup defense in the game is a ciliary escape swim and continued struggle, not a trichocyst attack that stuns the amoeba. A short filament cue can accompany a free-cell defensive response, but it deals no stun damage.

Before closure, the game's struggle meter compares prey motility, reserves and health with the captor's condition. Manual steering away contributes effort; NPC prey attempts escape automatically. Paramecium's Space action temporarily boosts swimming effort. Escape costs energy and grants a brief recapture grace period. These formulas, cooldowns and the interruption of an open cup by a strong hit are gameplay abstractions. Once enclosed, this escape action is unavailable. Didinium's anchored capture is treated separately.

The T6SS bacterium is separately identified as a composite Gram-negative model: its injector acts at contact range and damages a neighboring bacterium. It is not a distant grappling hook and is not an amoeba organelle. The modeled immunity variant reduces chemical and injection damage; it is a coarse stand-in for specific resistance mechanisms, not protection from every toxin or secretion system. Killing a rival does not directly award ingestion resources.

The Bacillus-like bacterium releases a bacteriocin field. A Gaussian profile widens with time, drifts and decays; its concentration determines damage. The faction immunity model compresses real toxin/target/immunity specificity. Bacteria do not universally share one toxin or one set of defenses. The composite T6SS model's competence capability is also not universal.

Research:

- [Didinium toxicysts contacting Paramecium, Cell Image Library CIL:40951](https://www.cellimagelibrary.org/images/40951).
- [Transitions between three swimming gaits in Paramecium escape](https://pmc.ncbi.nlm.nih.gov/articles/PMC3088577/).
- [Harumoto, predator-specific trichocyst defense and amoeba escape observations](https://www.jstage.jst.go.jp/article/jjprotozool/35/2/35_125/_pdf).
- [Miyake & Harumoto, trichocyst defense against Monodinium, with comparison to Didinium](https://www.sciencedirect.com/science/article/pii/S0932473996800484).
- [A family of Type VI secretion system effector proteins that form ion-selective pores](https://www.nature.com/articles/s41467-019-13439-0).
- [Bacillus subtilis bacteriocin production and immunity](https://pmc.ncbi.nlm.nih.gov/articles/PMC94516/).

## Genetics, mutation and reproduction

Player-selected variants stand for mutation followed by selection across compressed generations. New live upgrades express in the focused cell after a short timer and are inherited at division; older queued save variants still apply at division. This is an explicitly accelerated game abstraction, not a claim that organisms deliberately choose mutations. Mutations cannot create arbitrary foreign organelles. Level caps and prices are game rules.

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


## 2.4 readable organism animations

Paramecium uses a side oral groove, beating cilia and a forming food vacuole. Didinium shows two ciliary bands, anterior contact anchoring, widening of its feeding opening and gradual prey ingestion. These are schematic 2D sequences, with time and relative organism sizes adjusted for readability.

Bacteria show a nucleoid without a nuclear envelope, a cell envelope, nutrient entry and chromosome separation before septum closure. Flagellar traces suggest rotating bundles. The T6SS animation shows an internal contracting sheath and a short contact spike, not a projectile or a food intake organ. Chemical release is represented by a few symbols and a fading diffusion field. Species colors, molecule symbols and visible molecular machinery are educational overlays, not literal microscopy colors or scale.

Paramecium's escape action animates faster ciliary beating and schematic trichocyst discharge; successful open-cup escape is attributed to swimming and struggle, not universal protection by trichocysts.

Primary references for the visual sequences:
- https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1550-7408.1970.tb02366.x
- https://www.journals.uchicago.edu/doi/10.2307/1537967
- https://pmc.ncbi.nlm.nih.gov/articles/PMC4359589/


## 2.5 survival and contact model

Natural transformation: competent bacteria can take up extracellular DNA and integrate compatible sequences. Uptake and digestion are different processes; uptake need not produce successful integration. The game's same-lineage compatibility, selected trait fragments and integration probability are abstractions. T6SS-mediated competition can release DNA; the injector does not itself inject DNA or swallow prey.

Algal endosymbiosis and kleptoplasty can supply acquired photosynthetic function in particular protists. They do not imply routine acquisition of host genes by eating. These processes are not implemented as upgrades for our generic protists.

Primary references:
- DNA uptake by retracting competence pili: https://www.nature.com/articles/s41564-018-0174-y
- Algal endosymbiosis in Paramecium: https://www.nature.com/articles/s41396-018-0341-4
- Kleptoplasty: https://pmc.ncbi.nlm.nih.gov/articles/PMC10041101/
- Respiration, temperature selection and hypoxia: https://pubmed.ncbi.nlm.nih.gov/8048642/
- Contractile vacuoles under osmotic stress: https://pubmed.ncbi.nlm.nih.gov/14610031/

The game now models finite background food reserves, depletion by feeding, limited regeneration from those reserves, and decomposition. The reserve represents unmodeled substrate and nutrients, not a literal concentration or a fully mass-balanced ecosystem. Populations compete for food and consume habitat oxygen; photosynthesis and gas exchange replenish oxygen. New competitors still occasionally enter from outside the playable region.

Food supports energy and biomass. Basal maintenance and activity consume energy; starvation damages cells. Severe hypoxia inhibits repair and reduces survival, while lower oxygen reduces energy yield. These are aerobic composite lineages: real bacteria vary greatly, and some survive without oxygen. Dissolved oxygen uses a relative 0–100 game index, not a concentration or the oxygen fraction of water.

A spatial temperature field changes movement, digestion and energy demand. Extreme temperatures cause damage. The curve and 10–34 °C unstressed band are game tuning, not species-specific measured limits. Freshwater influx and saline dehydration remain distinct, with energy-consuming contractile-vacuole regulation in protists.

Contact uses three bounded, overdamped cell-constraint passes and spatially bucketed solid-food contact. Cells can push each other without inertial rebounds. Dissolved nutrient dots represent molecules and are not solid obstacles. Captured prey can enter its captor; open amoeba cups retain the encounter location until sealing. Membrane contact is an approximate 2D constraint, not molecular adhesion, a fluid solver or exact polygon intersection.


## 2.6 encounters and live variants

Species retain their existing feeding and attack restrictions. Didinium contact toxicysts cause a small modeled injury before capture; this HP change is illustrative, not a measured toxin dose. Paramecium retains its escape role rather than an invented damaging projectile. Bacterial clouds and T6SS target susceptible modeled rivals; pursuit, factions and cooldowns remain game abstractions.

Burst and recovery represent temporary energy expenditure on motility and membrane repair. Their timing, costs and manual activation are gameplay controls, not calibrated physiological rates. Recovery is interrupted by movement, successful attacks or damage and requires suitable environmental conditions. Upgrade expression takes 2.5 seconds in-game; mutation, selection and gene expression are biologically distinct and do not ordinarily occur on this chosen timescale. Natural transformation remains a separate compatible DNA integration path.
