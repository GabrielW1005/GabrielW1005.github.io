/* Original lesson text and game rules. Real functions, simplified scale and timing. */
'use strict';
window.CellContent = (() => {
  const buildings = {
    nucleus: {name:'Nucleus',short:'DNA instructions',color:'#9577d8',radius:88,cost:{},time:0,limit:1,tip:'DNA stores instructions. RNA carries instructions to ribosomes.'},
    mitochondrion: {name:'Mitochondrion',short:'Makes ATP',color:'#efac62',radius:46,cost:{protein:7,lipid:5,atp:10},time:12,limit:5,tip:'Cellular respiration releases energy from nutrients to make ATP. Oxygen is needed for efficient respiration.'},
    ribosome: {name:'Ribosome station',short:'Makes proteins',color:'#67b8c8',radius:35,cost:{protein:5,nucleotide:3,atp:8},time:10,limit:5,tip:'Ribosomes assemble amino acids into proteins. A station represents many tiny ribosomes.'},
    roughER: {name:'Rough ER',short:'Membrane proteins',color:'#ad95ce',radius:58,cost:{protein:7,lipid:6,atp:10},time:12,limit:3,tip:'Ribosomes on rough endoplasmic reticulum make proteins for membranes or secretion. The ER helps process them.'},
    smoothER: {name:'Smooth ER',short:'Makes lipids',color:'#df9eaf',radius:49,cost:{protein:6,lipid:5,atp:8},time:10,limit:4,tip:'Smooth endoplasmic reticulum makes lipids. In this game it uses a simplified nutrient supply.'},
    golgi: {name:'Golgi apparatus',short:'Packages cargo',color:'#e8ba69',radius:51,cost:{protein:8,lipid:7,atp:10},time:12,limit:3,tip:'The Golgi apparatus modifies, sorts, and packages proteins and lipids into vesicles.'},
    lysosome: {name:'Lysosome',short:'Digests & recycles',color:'#7bbe99',radius:39,cost:{protein:5,lipid:4,atp:7},time:9,limit:4,tip:'Enzymes inside lysosomes digest nutrient cargo and worn-out parts. Digestion returns useful building blocks.'},
    centrosome: {name:'Centrosome',short:'Organizes tracks',color:'#799dc6',radius:28,cost:{},time:0,limit:1,tip:'The animal-cell centrosome contains centrioles and organizes microtubules. These help form the spindle during division.'}
  };
  const resources = {
    glucose:{name:'Glucose',group:'Carbohydrate',icon:'⬡',color:'#f2b956'},
    amino:{name:'Amino acids',group:'Protein building blocks',icon:'●',color:'#87c5dd'},
    protein:{name:'Proteins',group:'Cell workers & structures',icon:'〰',color:'#b699e6'},
    lipid:{name:'Lipids',group:'Membrane materials',icon:'◒',color:'#e9a6b3'},
    nucleotide:{name:'Nucleotides',group:'DNA & RNA building blocks',icon:'◇',color:'#86c7a3'},
    atp:{name:'ATP',group:'Usable energy',icon:'ϟ',color:'#f5ca66'}
  };
  const guide = [
    ['Cell membrane','A flexible, selective boundary made mainly of a lipid bilayer with proteins. It controls exchange with the surroundings.','In the game, import sites bring in nutrients. Repair restores membrane integrity.'],
    ['Cytoplasm','The region outside the nucleus and inside the cell membrane, including cytosol, organelles, and other components.','This is your battlefield. The liquid background represents cytosol.'],
    ['Cytoskeleton','A network of protein filaments that supports cell shape and helps with movement and transport.','Thin tracks connect your organelles. Motor proteins carry vesicles along routes.'],
    ['Organelles','Specialized cell structures with particular jobs. Many, such as mitochondria, have surrounding membranes.','Select an organelle to see its job. Growing organelles costs materials and energy.'],
    ['Nucleus','Contains most of this cell’s DNA. DNA instructions are transcribed into RNA.','Your headquarters keeps the instructions; it does not directly manufacture proteins.'],
    ['Nucleolus','A region inside the nucleus where ribosomal subunits are assembled.','The darker spot inside the nucleus helps explain where ribosomes come from.'],
    ['Nucleic acids','DNA and RNA are nucleic acids made from nucleotides. They store or help use genetic information.','Nucleotides are a resource for growth. DNA and RNA are not fuel or protein.'],
    ['Proteins','Molecules made of amino acid chains. They can be enzymes, transporters, receptors, or structural components.','Your cell makes proteins for growth, repair, and antiviral responses.'],
    ['Carbohydrates','Sugars and related molecules. Glucose is a simple sugar used in cellular respiration.','Glucose supplies nutrients for ATP production.'],
    ['Lipids','A group of molecules including fats and phospholipids. Phospholipids are key membrane components.','Lipids support organelle growth and transport-vesicle production.'],
    ['Ribosomes','Structures made of RNA and proteins that assemble amino acids into proteins. They have no surrounding membrane.','Each visible station represents a group of ribosomes. It can make antiviral proteins.'],
    ['Mitochondria','Organelles where much of aerobic cellular respiration takes place. They grow and divide from existing mitochondria.','Glucose and incoming oxygen support ATP production. Extra mitochondria increase energy capacity.'],
    ['Cellular respiration','Cells release energy from nutrients and use it to make ATP. Aerobic respiration uses oxygen and produces carbon dioxide and water.','Oxygen enters automatically in this model. Glucose is consumed as mitochondria generate ATP.'],
    ['ATP','A small molecule that transfers energy for cellular work. It is continually used and regenerated.','Transport, protein production, repair, and growth use ATP.'],
    ['Rough endoplasmic reticulum','A membrane network with attached ribosomes. It helps make and process membrane and secreted proteins.','It supports membrane maintenance. Many other proteins are made on free ribosomes.'],
    ['Smooth endoplasmic reticulum','A membrane network without attached ribosomes. One important function is lipid synthesis.','It makes lipids from simplified nutrient precursors.'],
    ['Golgi apparatus','Modifies, sorts, and packages proteins and lipids received through the secretory pathway.','Make transport vesicles here. The Golgi packages cargo; ribosomes make proteins.'],
    ['Vesicles','Small membrane-bound sacs that transport or store material. Their membranes can fuse with other membranes.','Your transport vesicles collect imported nutrient cargo and carry it to lysosomes.'],
    ['Motor proteins','Proteins such as kinesin and dynein that use energy to move cargo along cytoskeletal tracks.','Small feet under moving vesicles represent motor proteins. Direct commands are a game simplification.'],
    ['Lysosome','An acidic compartment containing digestive enzymes that break down material and recycle components.','Nutrient vesicles deliver cargo here for digestion. Lysosomes are not weapons that shoot outside the cell.'],
    ['Endocytosis','The membrane folds inward to bring material into a cell inside a vesicle.','Blue import sites represent endocytosis of larger nutrient cargo. Small dissolved glucose can also enter through membrane transporters.'],
    ['Exocytosis','A vesicle fuses with the cell membrane and releases its contents outside the cell.','Small gold bubbles show secretion at the lower membrane. Carbon dioxide can diffuse out without exocytosis.'],
    ['Osmosis','Net movement of water across a selectively permeable membrane toward the side with a higher concentration of nonpenetrating solutes.','Moving blue dots show water exchange. Water balance is stable in this beginner mode.'],
    ['Centrioles and centrosome','In a typical animal cell, two centrioles are part of the centrosome, a microtubule-organizing center.','The blue pair near the nucleus organizes the transport-track display. It does not make proteins.'],
    ['Cell wall','A supporting layer outside the cell membrane. Plant cell walls contain cellulose. Animal cells have no cell wall.','This animal-cell mode has a membrane, but no cell wall.'],
    ['Chloroplasts','Organelles in photosynthetic plant cells and many algae. They use light energy to help make sugars by photosynthesis.','They belong in a future photosynthetic-cell mode. Plants also have mitochondria.'],
    ['Central vacuole','A large compartment in a typical mature plant cell that stores substances and supports water balance and turgor pressure.','It belongs in a plant-cell mode, rather than being added to this animal cell.'],
    ['Cilia and flagellum','Motile cilia are short beating projections; a eukaryotic flagellum is usually longer. They can move a cell or fluid around it.','Neither is included on this model cell. A suitable motile-cell mode could teach these structures.'],
    ['Peroxisomes','Organelles involved in reactions such as fatty-acid breakdown. Enzymes also break down harmful hydrogen peroxide.','A useful future organelle for a more advanced mode.'],
    ['Viruses','Infectious agents with a DNA or RNA genome inside a protein coat, sometimes with an envelope. They need host cells to reproduce.','This opponent models an enveloped RNA virus entering near compatible receptors. It uses host protein-making machinery.'],
    ['Antiviral proteins','Cells can produce proteins that detect infection or interfere with viral replication. Their actions depend on the cell and virus.','Each blue team represents many antiviral proteins. The suppression pulse is a visual metaphor, not a projectile.'],
    ['Model and reality','Molecules do not take player orders. Real cells have many more molecules, smaller ribosomes, and complex chemical controls.','Sizes, costs, movement orders, construction sites, and infection timing are simplified. Organelle growth represents expansion from existing structures.']
  ];
  const legacyConcepts = [{'id': 'energy', 'title': 'Power the cell'}, {'id': 'protein', 'title': 'Build the workers'}, {'id': 'golgi', 'title': 'Cargo check'}, {'id': 'lipid', 'title': 'Membrane materials'}, {'id': 'virus', 'title': 'Know your opponent'}, {'id': 'lysosome', 'title': 'Recycle and reuse'}, {'id': 'endo', 'title': 'Bring cargo inside'}, {'id': 'dna', 'title': 'Read the instructions'}, {'id': 'tracks', 'title': 'Transport routes'}, {'id': 'plant', 'title': 'Compare cells'}, {'id': 'osmosis', 'title': 'Water movement'}, {'id': 'exo', 'title': 'Send cargo out'}];
  const units={
    vesicle:{name:'Transport vesicle',role:'Worker',hp:70,speed:100,range:0,damage:0,vision:240,time:9,cost:{lipid:4,protein:2,atp:6},tier:1,producer:'golgi'},
    antiviral:{name:'Antiviral proteins',role:'Close defense',hp:100,speed:105,range:65,damage:13,vision:260,time:8,cost:{amino:6,atp:8},tier:1,producer:'ribosome'},
    sensor:{name:'Sensor proteins',role:'Scout',hp:60,speed:155,range:0,damage:0,vision:380,time:6,cost:{amino:4,atp:5},tier:1,producer:'ribosome'},
    nuclease:{name:'RNase complexes',role:'RNA degradation',hp:85,speed:80,range:155,damage:7,vision:270,time:11,cost:{amino:9,nucleotide:2,atp:12},tier:2,producer:'ribosome'}
  };
  const research={
    tier2:{name:'Research tier II',at:'nucleus',tier:1,time:24,cost:{protein:18,lipid:12,nucleotide:6,atp:25},tip:'Unlock RNase complexes and expand unit capacity. Requires 2 organelles grown.'},
    tier3:{name:'Research tier III',at:'nucleus',tier:2,time:30,cost:{protein:26,lipid:18,nucleotide:10,atp:35},tip:'Expand unit capacity and strengthen your response. Requires 3 organelles grown.'},
    motors:{name:'Motor efficiency',at:'golgi',tier:1,time:16,cost:{protein:10,lipid:5,atp:15},tip:'Transport vesicles move 25% faster. Motor proteins power cargo transport.'},
    cargo:{name:'Cargo handling',at:'lysosome',tier:1,time:16,cost:{protein:10,amino:8,atp:15},tip:'Nutrient deliveries return 50% more building blocks.'},
    respiration:{name:'Respiration capacity',at:'mitochondrion',tier:2,time:18,cost:{protein:12,lipid:5,atp:18},tip:'Mitochondria supply more ATP per production cycle. This represents improved enzyme capacity.'},
    response:{name:'Antiviral response',at:'ribosome',tier:2,time:18,cost:{protein:12,nucleotide:5,atp:20},tip:'Protein teams suppress infection 30% more strongly. Represents a larger, more active response.'}
  };
  buildings.vesiclePool={name:'Vesicle pool',short:'+6 unit capacity',color:'#8bbdad',radius:27,cost:{lipid:5,protein:2,atp:4},time:7,limit:10,tier:1,tip:'A group of membrane sacs represents transport capacity. The +6 unit limit is a game rule, not a biological molecule count.'};
  buildings.defenseHub={name:'Defense protein hub',short:'Stationary defense',color:'#659ab8',radius:40,cost:{protein:14,lipid:4,atp:16},time:16,limit:6,tier:2,requires:'roughER',tip:'A game-only assembly of antiviral proteins guards nearby cargo routes. Its pulses show biochemical suppression. This is not a real organelle or a lysosome weapon.'};
  buildings.centrosome.cost={protein:8,nucleotide:4,atp:8};buildings.centrosome.time=12;buildings.centrosome.tier=2;
  buildings.roughER.tier=2;
  units.restriction={name:'Restriction proteins',role:'Ranged support',hp:75,speed:92,range:205,damage:9,vision:280,time:11,cost:{amino:9,protein:3,atp:10},tier:2,producer:'roughER',tip:'Support unit: effective against ordinary viral cargo; keep it behind close-defense teams. This group represents membrane-associated restriction factors processed through rough ER. Attack range is a game metaphor.'};
  units.proteasome={name:'Proteasome teams',role:'Heavy defense',hp:170,speed:75,range:62,damage:11,vision:250,time:15,cost:{amino:12,protein:5,atp:14},tier:3,producer:'ribosome',tip:'Close unit: especially effective against protein-coated cargo. Proteasomes degrade selected proteins; armor and combat bonuses are game abstractions.'};
  units.antiviral.tip='Close defense: strong against fast cargo. Keep these teams in front of ranged units.';
  units.nuclease.tip='Site breaker: triple effectiveness against viral replication sites, but vulnerable without close-defense support.';
  units.sensor.tip='Fast scout with wide vision. Does not suppress infection.';
  units.vesicle.tip='Worker: gather cargo, grow structures, and repair them.';
  research.tier4={name:'Research tier IV',at:'nucleus',tier:3,time:36,cost:{protein:35,lipid:22,nucleotide:14,atp:45},tip:'Increase capacity and strengthen all protein teams. Requires 4 structures grown. Optional for victory.'};
  research.stability={name:'Protein stability',at:'roughER',tier:3,time:20,cost:{protein:18,nucleotide:6,atp:24},tip:'Defense teams take 25% less damage. Represents improved response stability; combat armor is a game abstraction.'};
  research.reach={name:'Response coverage',at:'defenseHub',tier:3,time:20,cost:{protein:18,nucleotide:6,atp:24},tip:'Ranged teams and defense hubs gain 25% coverage. This is an abstract strategy range, not a real shooting distance.'};
  const tiers=['Foundation','Expansion','Defense','Mastery'];
  const enemyTypes={cargo:{name:'Viral cargo',hp:46,speed:62,damage:3.2,range:44,armor:0},swift:{name:'Fast viral cargo',hp:32,speed:102,damage:2.4,range:44,armor:0},coated:{name:'Protein-coated cargo',hp:90,speed:45,damage:5,range:65,armor:3}};
  for(const b of Object.values(buildings))b.hp=b===buildings.nucleus?500:180;
  buildings.defenseHub.hp=320;buildings.vesiclePool.hp=140;
  buildings.golgi.limit=5;buildings.ribosome.limit=7;buildings.lysosome.limit=5;
  guide[29][2]='The match starts after viral entry. Enemy sites represent host-dependent viral replication and assembly, not independent cells or organelles.';
  guide.push(['RNase complexes','Ribonucleases are enzymes that cut RNA. RNase L is one example involved in antiviral responses and can cut viral and cellular RNA.','This unit represents targeted RNA degradation. Its range, targeting, and damage bonus against replication sites are game abstractions.']);
  guide.push(['Sensor proteins','Some cellular proteins detect molecular patterns associated with infection, including viral RNA.','Sensor teams reveal unobserved map areas. Fog is an information overlay; the actual cell is not dark.']);
  guide.push(['Research tiers and capacity','Real cells coordinate growth and gene expression through biochemical processes. They do not advance through RTS ages.','The four research tiers and unit-capacity limit are strategy-game abstractions, not interphase or mitotic stages.']);
  guide.push(['Viral replication sites','Viruses depend on the host for protein synthesis. Many RNA viruses organize replication using host membranes and viral proteins.','Pink sites are infected regions using host structures. The enemy’s material pool, expansion decisions, and moving viral cargo represent a simplified infection model.']);
  guide.push(['Strategy controls','Movement orders and combat stats help you explore the relationships between economy, transport, and cellular defense.','Workers collect specific cargo, build, and repair. Box-select teams, set rally points, and attack-move to clear replication sites. Pulses represent biochemical suppression.']);
  guide.push(['Proteasomes','Proteasomes are protein complexes that break down selected proteins, often after the proteins are marked with ubiquitin.','Heavy defense teams represent protein degradation. Their health, armor, and bonus against coated cargo are strategy rules, not literal biological battles.']);
  guide.push(['Restriction factors','Cellular restriction factors can interfere with viral infection and replication. Some, such as IFITM3, are membrane-associated proteins that interfere with viral entry.','The rough-ER support team represents membrane-associated factors as part of a coordinated response. Pulses and attack range are symbolic; proteins do not shoot projectiles.']);
  guide.push(['Nutrient deposits','Imported cargo and recycled cell material can supply building blocks. Cargo passes through cellular transport and processing pathways.','Round interior deposits represent stored nutrient cargo. They run out; the membrane imports replenish slowly. Grow forward lysosomes to shorten delivery routes.']);
  guide.push(['Defense protein hubs and vesicle pools','Antiviral responses involve cellular proteins. Vesicles are membrane-bound sacs involved in transport and storage.','These grouped structures are game representations. A defense hub is not a named real organelle. Vesicle-pool population capacity is an RTS rule.']);
  return {buildings,resources,guide,questions:legacyConcepts,units,research,tiers,enemyTypes};
})();
