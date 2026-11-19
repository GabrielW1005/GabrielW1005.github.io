(() => {
  const model = SurvivalModel;
  const node = id => document.getElementById(id);
  const scene = node('scene');
  const population = node('population');
  const controls = node('controls');
  const historyPanel = node('history');
  const dialog = node('cellsDialog');
  const dialogContent = node('dialogContent');
  const saveKey = 'reproduction-survival-v1';
  const stageLabels = ['Choose parents', 'Inspect offspring', 'Survival results'];
  const habitatKeys = Object.keys(model.habitats);
  let explorerTab = 'division';

  function newRun() {
    return {
      generation: 1,
      mode: 'sexual',
      habitat: 'grove',
      stage: 0,
      adults: model.founders(),
      parents: [],
      brood: [],
      viewed: null,
      prediction: null,
      history: [],
    };
  }

  function loadState() {
    try {
      const progress = JSON.parse(localStorage.getItem(saveKey));
      if (progress && Array.isArray(progress.adults) && Array.isArray(progress.history)
          && habitatKeys.includes(progress.habitat) && [0, 1, 2].includes(progress.stage)) {
        return progress;
      }
    } catch { /* Local progress is optional. */ }
    return newRun();
  }

  let state = loadState();

  function saveState() {
    try { localStorage.setItem(saveKey, JSON.stringify(state)); } catch { /* Keep playing without storage. */ }
  }

  function announce(text) {
    node('announcer').textContent = text;
  }

  function sprite(genotype, extraClass = '') {
    const traits = model.phenotype(genotype);
    const dark = traits.color === 'Dark slate';
    const coat = traits.fur === 'Fluffy';
    const colors = dark
      ? { back: '#595d87', belly: '#a7a4c2', face: '#76779d', leg: '#505577', ear: '#de95a7', tail: '#a4a3c4', cheek: '#f5b5bc', edge: '#393d5c' }
      : { back: '#dfb58c', belly: '#fcdfb6', face: '#f3cca1', leg: '#bc8c6c', ear: '#d88286', tail: '#f8dfb4', cheek: '#ed9290', edge: '#825c58' };
    return `<svg class="critter ${extraClass}" viewBox="0 0 205 142" aria-hidden="true">
      <ellipse cx="105" cy="124" rx="65" ry="8" fill="#19273c" opacity=".18"/>
      <g class="bob" stroke="${colors.edge}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
        <path class="tail" d="M129 101C151 70 176 74 191 52c5 22-4 45-24 55-14 6-26 6-38 3z" fill="${colors.back}"/>
        <path d="M163 103c13-10 23-27 28-51 5 22-4 45-24 55z" fill="${colors.tail}" stroke="none"/>
        <path d="M73 104q-9 11-4 16 8 5 20-2l5-13M125 107q-7 10-1 14 10 3 19-3l2-12" fill="${colors.leg}"/>
        <path d="M85 75c17-15 54-13 67 7 11 17 1 32-21 35l-40-2c-19-4-25-22-6-40z" fill="${colors.back}"/>
        <path d="M104 90c10-6 38-7 43 2 4 10-2 18-18 20l-31-3z" fill="${colors.belly}" stroke="none"/>
        <path d="M64 58Q46 19 56 15c11-5 39 18 39 39M105 51q11-30 27-31c13 0 9 20-3 42" fill="${colors.back}"/>
        <path d="M72 49Q59 25 62 23q15 5 25 26M114 52q7-18 17-23 4 1-3 16l-4 8" fill="${colors.ear}" stroke="none"/>
        ${coat ? `<path d="M129 73q8-7 14 0 9-3 14 7 10 4 7 13 4 5-3 10 0 7-9 8-6 7-14 3-8 7-17 1-9 4-14-4l-3-27z" fill="${colors.back}"/><path d="M57 86q-10 9-3 14 0 8 9 9 5 7 15 3 7 7 16 2 12 1 15-12l-9-18z" fill="${colors.belly}"/>` : ''}
        <path d="M53 65c9-13 23-18 43-18 26 0 42 17 38 33-4 19-25 27-57 25-24-1-38-15-35-25 1-5 5-10 11-15z" fill="${colors.face}"/>
        <path d="M43 82q12-6 24-3c12 1 14 5 24 5 14-1 19-5 31-4-7 17-28 25-52 24-18-1-26-8-27-22z" fill="${colors.belly}" stroke="none"/>
        ${coat ? `<path d="M83 49q6-13 14-12l-2 10 11-6-1 9" fill="${colors.face}"/>` : ''}
        <ellipse cx="76" cy="87" rx="9" ry="4.4" fill="${colors.cheek}" opacity=".68" stroke="none"/>
        <g class="eye" stroke="none">
          <ellipse cx="75" cy="73" rx="7" ry="8.4" fill="#24243a"/>
          <ellipse cx="73.1" cy="70.5" rx="2" ry="2.4" fill="#fff9ed"/>
          <ellipse cx="107" cy="75" rx="6" ry="7.3" fill="#24243a"/>
          <ellipse cx="105.5" cy="72.7" rx="1.75" ry="2.1" fill="#fff9ed"/>
        </g>
        <path d="M44 80q5-3 10 0l-4 5q-4 1-6-5" fill="#594259" stroke="none"/>
        <path d="M52 90q5 4 10-1" fill="none" stroke="#66516b" stroke-width="1.65"/>
        <path d="M88 113q9 7 18 2l5-9m-20 7v5" fill="${colors.leg}"/>
      </g></svg>`;
  }

  function landscape(key) {
    const backgroundShapes = {
      grove: `<path d="M0 235l42-59 25 62 45-110 53 91 41-137 43 126 45-61 48 91 55-122 59 106 58-81 39 94 51-123 44 93 63-169 64 150 39-78 31 80 51-121 65 115 48-131 51 117 55-80 39 68v90H0z" fill="var(--mid)"/><path d="M0 298l66-56 27 54 52-96 34 75 39-46 45 48 24-73 60 80 38-60 45 63 69-42 60 43 49-81 55 74 37-55 50 54 76-112 48 87 53-61 57 70 40-121 44 112 64-76 63 65v72H0z" fill="var(--near)"/>`,
      frost: `<path d="M0 246 175 111l115 94L430 32l174 197 117-110 61 67L974 14l183 174 86-72 87 122v131H0z" fill="var(--mid)"/><path d="m380 88 50-56 54 62-28-7-18 15-20-20-38 6M907 77l67-63 66 63-27-7-24 30-31-21-51 9" fill="#cfdef0"/><path d="M0 302q172-64 335-1 145 70 281 1 139-65 298 0 176-37 416-28v100H0z" fill="#a8c0de"/>`,
      dunes: `<path d="M0 263q143-55 272-37t261 6 266-8 273-6 258-3v150H0z" fill="var(--mid)"/><path d="M0 321q154-42 325 1t318-5 309 1 378-19v80H0z" fill="var(--near)"/><path d="M1020 278v-58m0 18q-21 0-21-20v-11m21 16q18 0 18-18v-10M1110 297v-34m0 14q-13 0-13-11v-9" fill="none" stroke="#443948" stroke-width="7" stroke-linecap="round"/>`,
    };
    return `<svg class="landscape" viewBox="0 0 1330 365" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 0h1330v365H0z" fill="var(--sky)"/><circle cx="1098" cy="106" r="62" fill="var(--sun)" opacity=".93"/><path d="M0 284V183Q252 109 484 217T905 194q182-114 425-58v229H0z" fill="var(--far)"/>${backgroundShapes[key]}<path d="M0 325q312 37 632-5 355-44 698 7v38H0z" fill="var(--near)"/></svg>`;
  }

  const formattedGenotype = genotype => genotype.color + ' ' + genotype.fur;
  const activeParentCount = () => state.mode === 'sexual' ? 2 : 1;
  const parents = () => state.parents.map(id => state.adults.find(individual => individual.id === id)).filter(Boolean);

  function currentIndividual() {
    const pool = state.stage ? state.brood : state.adults;
    return pool.find(individual => individual.id === state.viewed);
  }

  function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

  function renderScene() {
    const habitat = model.habitats[state.habitat];
    scene.className = 'scene ' + habitat.className;
    const mascot = { color: habitat.color === 'Cream' ? 'cc' : 'Cc', fur: habitat.fur === 'Fluffy' ? 'Ff' : 'ff' };
    scene.innerHTML = landscape(state.habitat) + `
      <div class="scene-copy">
        <p class="scene-metadata">Generation ${state.generation + Number(state.stage !== 0)}</p>
        <h1>Nimbles in the wild</h1>
        <p class="scene-lead">Breed a new generation and see how inherited traits affect survival when the habitat changes.</p>
        <span class="scene-habitat">${habitat.name}</span>
      </div>
      <div class="scene-friend">${sprite(mascot)}</div>
      <div class="scene-friend scene-friend--small">${sprite({ color: 'Cc', fur: 'Ff' })}</div>`;
  }

  function renderProgress() {
    node('progress').innerHTML = stageLabels.map((name, index) => `
      <span class="progress-step ${index < state.stage ? 'done' : ''}" ${index === state.stage ? 'aria-current="step"' : ''}>
        <strong>${index < state.stage ? '✓' : index + 1}</strong> ${name}
      </span>`).join('');
  }

  function critterCard(individual) {
    const traits = model.phenotype(individual.genotype);
    const parentIndex = state.parents.indexOf(individual.id);
    const inspected = state.viewed === individual.id;
    const forecast = state.prediction === individual.id;
    let tag = '';
    if (state.stage === 0 && parentIndex !== -1) {
      tag = `<span class="parent-tag">Parent ${state.mode === 'sexual' ? 'AB'[parentIndex] : ''}</span>`;
    }
    if (state.stage === 1 && forecast) tag = '<span class="parent-tag prediction">My prediction</span>';
    if (state.stage === 2) tag = individual.survived
      ? '<span class="parent-tag good">Survived</span>'
      : '<span class="parent-tag lost">Didn’t survive</span>';
    const statusClass = state.stage === 2 ? (individual.survived ? 'survivor' : 'absent') : '';
    const selected = state.stage === 0 ? parentIndex !== -1 : inspected;
    const action = state.stage === 0 ? 'parent' : 'offspring';
    const genotype = formattedGenotype(individual.genotype);
    return `<button type="button" class="creature-card ${selected ? 'selected' : ''} ${statusClass}" data-action="${action}" data-id="${individual.id}" aria-pressed="${selected}">
      ${tag}${sprite(individual.genotype)}
      <span class="creature-card-name">${individual.name}</span>
      <span class="creature-card-traits">${traits.color} · ${traits.fur.toLowerCase()}</span>
      ${state.stage === 0 || inspected ? '<span class="creature-card-genotype">' + genotype + '</span>' : ''}
    </button>`;
  }

  function renderPopulation(animate) {
    const pool = state.stage === 0 ? state.adults : state.brood;
    const inspected = currentIndividual();
    const descriptions = [
      ['Choose your parents', state.mode === 'sexual' ? 'Pick two Nimbles from the same species.' : 'Pick one Nimble to produce offspring by budding.'],
      ['Meet the offspring', 'Select an offspring to inspect its DNA. Predict one that could survive.'],
      ['Who survived?', 'Select an offspring to compare its traits with the habitat.'],
    ];
    const [heading, detail] = descriptions[state.stage];
    const traits = inspected ? model.phenotype(inspected.genotype) : null;
    const fit = inspected ? model.fitness(inspected.genotype, state.habitat) : null;
    population.innerHTML = `
      <div class="section-heading">
        <div><h2 id="populationTitle" tabindex="-1">${heading}</h2><p>${detail}</p></div>
        <span class="pop-count">${pool.length} ${state.stage ? 'offspring' : 'adults'}</span>
      </div>
      <div class="creature-grid ${animate ? 'offspring-in' : ''}">${pool.map(critterCard).join('')}</div>
      ${inspected ? `<div class="detail">
        <div><strong>${inspected.name} · ${formattedGenotype(inspected.genotype)}</strong>
        <p>${traits.color}, ${traits.fur.toLowerCase()} · ${fit.matches} matching ${fit.matches === 1 ? 'trait' : 'traits'} · ${Math.round(fit.chance * 100)}% survival chance</p></div>
        <button type="button" class="secondary" data-action="explore-dna">Inspect DNA</button>
      </div>` : ''}`;
  }

  function renderControls() {
    const habitat = model.habitats[state.habitat];
    const target = 'Favored here: ' + habitat.color.toLowerCase() + ' coloring and ' + habitat.fur.toLowerCase() + ' fur.';
    if (state.stage === 0) {
      const p = parents();
      const required = activeParentCount();
      const modes = ['sexual', 'asexual'].map(mode =>
        `<button class="choice" type="button" data-action="mode" data-id="${mode}" aria-pressed="${mode === state.mode}" ${mode === 'sexual' && state.adults.length < 2 ? 'disabled' : ''}>${titleCase(mode)}</button>`).join('');
      controls.innerHTML = `
        <h2>Plan your brood</h2>
        <div class="control-label" id="habitatLabel">Habitat</div>
        <div class="control-options" role="group" aria-labelledby="habitatLabel">${habitatKeys.map(key =>
          `<button type="button" class="choice" data-action="habitat" data-id="${key}" aria-pressed="${key === state.habitat}">${model.habitats[key].name}</button>`).join('')}</div>
        <p class="summary">${habitat.cue}<br>${target}</p>
        <div class="control-label" id="routeLabel">Reproduction</div>
        <div class="control-options" role="group" aria-labelledby="routeLabel">${modes}</div>
        <p class="summary">${state.mode === 'sexual' ? 'Two parents combine gametes. Four offspring can inherit different allele combinations.' : 'One parent forms six buds. Each copy has the same genotype in this model.'}</p>
        ${state.adults.length < 2 ? '<p class="summary">One survivor can still reproduce asexually.</p>' : ''}
        <div class="small-rule"></div>
        <p class="summary"><strong>${p.length} of ${required} ${required === 1 ? 'parent' : 'parents'} selected.</strong> ${p.map(individual => individual.name).join(' + ')}</p>
        <div class="action-stack"><button type="button" class="primary" data-action="breed" ${p.length < required ? 'disabled' : ''}>Breed</button>
        ${state.generation > 1 ? '<button type="button" class="text-button" data-action="reset">Restart with founders</button>' : ''}
        </div>`;
      return;
    }

    if (state.stage === 1) {
      const inspected = currentIndividual();
      const predicted = state.brood.find(individual => individual.id === state.prediction);
      controls.innerHTML = `
        <h2>Test the habitat</h2>
        <p class="round-summary">${target}</p>
        <div class="odds-key" aria-label="Modeled chance of survival">
          <div><strong>20%</strong>0 matches</div><div><strong>55%</strong>1 match</div><div><strong>90%</strong>2 matches</div>
        </div>
        <p class="round-summary">${predicted ? 'Your prediction: ' + predicted.name + ' survives.' : 'Choose an offspring and mark your prediction before you test.'}</p>
        <div class="action-stack">
          <button type="button" class="secondary" data-action="prediction" ${inspected && inspected.id !== state.prediction ? '' : 'disabled'}>Mark prediction</button>
          <button type="button" class="primary" data-action="test">Test survival</button>
          <button type="button" class="text-button" data-action="explore-fusion">${state.mode === 'sexual' ? 'Watch sperm and egg' : 'Watch asexual budding'}</button>
        </div>`;
      return;
    }

    const survivors = state.brood.filter(individual => individual.survived);
    const predicted = state.brood.find(individual => individual.id === state.prediction);
    const isExtinct = survivors.length === 0;
    const future = isExtinct
      ? 'This population died out in the model. Restart with the founders to try a different strategy.'
      : survivors.length === 1
        ? 'One survivor can start the next round by budding. Sexual reproduction needs two parents here.'
        : 'The survivors can be parents in the next generation. See whether their traits fit the new habitat.';
    controls.innerHTML = `
      <h2>${model.habitats[state.habitat].name} results</h2>
      <p class="round-figure">${survivors.length}/${state.brood.length} <small>survived</small></p>
      <p class="round-summary">${future}</p>
      ${predicted ? `<p class="round-summary"><strong>Your prediction:</strong> ${predicted.name} ${predicted.survived ? 'survived' : 'didn’t survive'}.</p>` : ''}
      <div class="action-stack">
        <button type="button" class="primary" data-action="${isExtinct ? 'reset' : 'next'}">${isExtinct ? 'Restart with founders' : 'Next generation'}</button>
        <button type="button" class="secondary" data-action="compare">Try this brood in another habitat</button>
        ${isExtinct ? '' : '<button type="button" class="text-button" data-action="reset">Restart with founders</button>'}
      </div>
      <p class="summary">Comparing the same brood keeps each offspring’s chance draw. Changes come from the habitat.</p>`;
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyPanel.innerHTML = '';
      return;
    }
    historyPanel.innerHTML = `<h2>Generation record</h2><div class="table-scroll"><table>
      <thead><tr><th scope="col">Offspring generation</th><th scope="col">Habitat</th><th scope="col">Route</th><th scope="col">Survived</th><th scope="col">Survivor traits</th></tr></thead>
      <tbody>${[...state.history].reverse().map(round =>
        `<tr><td>${round.generation}</td><td>${model.habitats[round.habitat].name}</td><td>${titleCase(round.mode)}</td><td>${round.survived}/${round.total}</td><td>${round.traits || 'None'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function render({ focus = null, animate = false } = {}) {
    renderScene();
    renderProgress();
    renderPopulation(animate);
    renderControls();
    renderHistory();
    saveState();
    if (focus === 'stage') node('populationTitle').focus({ preventScroll: true });
    else if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
  }

  function alleles(genotype) {
    return `<div class="genes">${[...genotype.color].map(value => `<span class="allele">${value}</span>`).join('')}${[...genotype.fur].map(value => `<span class="allele fur">${value}</span>`).join('')}</div>`;
  }

  function divisionPanel() {
    const stage = (heading, count, detail) => `<article class="cell-stage"><h3>${heading}</h3><div class="cell-icons">${count.map(label =>
      `<span class="dot-cell ${count.length > 2 ? 'tiny' : ''}">${label}</span>`).join('')}</div><p>${detail}</p></article>`;
    return `
      <p class="explorer-copy"><strong>Sexual reproduction uses meiosis.</strong> The cell copies DNA once, then divides twice. A gamete carries one set of chromosomes, so it gets one allele for each gene in the game.</p>
      <div class="cell-track" aria-label="Meiosis diagram">
        ${stage('DNA copied', ['2n'], 'One diploid cell with duplicated chromosomes.')}
        ${stage('Meiosis I', ['n', 'n'], 'Homologous chromosomes separate. Sisters stay joined.')}
        ${stage('Meiosis II', ['n', 'n', 'n', 'n'], 'Sister chromatids separate. Four haploid products form in this model.')}
      </div>
      <p class="explorer-copy"><strong>Asexual budding uses mitosis.</strong> DNA is copied and the nucleus divides once. Each daughter nucleus gets both sets. More mitotic divisions grow the bud.</p>
      <div class="cell-track" aria-label="Mitosis diagram">
        ${stage('DNA copied', ['2n'], 'One diploid cell with duplicated chromosomes.')}
        ${stage('Mitosis', ['2n'], 'Sister chromatids move to opposite sides.')}
        ${stage('Two daughter cells', ['2n', '2n'], 'Each cell retains both chromosome sets.')}
      </div>
      <p class="explorer-copy">A real hydra can reproduce sexually or by budding, like the fictional Nimble. Strawberry plants also use both routes, with seeds and runners.</p>`;
  }

  function dnaPanel() {
    const inspected = currentIndividual();
    const outcome = state.stage ? (inspected ?? state.brood[0]) : null;
    const current = outcome ?? inspected;
    const row = (label, genotype, detail) =>
      `<div class="genotype-row"><strong>${label}</strong>${alleles(genotype)}<span>${detail}</span></div>`;
    const ancestorRows = parents().map((parent, index) => {
      const traits = model.phenotype(parent.genotype);
      return row(state.mode === 'sexual' ? 'Parent ' + 'AB'[index] + ' · ' + parent.name : 'Parent · ' + parent.name,
        parent.genotype, traits.color + ' / ' + traits.fur.toLowerCase());
    }).join('');
    const individualRows = outcome ? `
      ${state.mode === 'sexual' ? row('Sperm alleles', outcome.sperm, 'One from each pair in Parent A.') + row('Egg alleles', outcome.egg, 'One from each pair in Parent B.') : ''}
      ${row(outcome.name, outcome.genotype, state.mode === 'sexual' ? 'Fertilization combines the alleles.' : 'Budding preserves both allele pairs.')}`
      : current && !state.parents.includes(current.id) ? row(current.name, current.genotype, 'One allele pair for each modeled gene.') : '';
    return `<p class="explorer-copy"><strong>Genotype</strong> means the allele combination. <strong>Phenotype</strong> means the observable trait it helps produce.</p>
      <p class="explorer-copy">CC or Cc gives dark slate coloring. cc gives cream coloring. FF or Ff gives fluffy fur. ff gives sleek fur.</p>
      <div class="genotype-list">${ancestorRows}${individualRows || (ancestorRows ? '' : '<p class="explorer-copy">Choose a Nimble to inspect its two allele pairs.</p>')}</div>
      <p class="round-summary">Real traits can depend on many genes and the environment. This game isolates two genes that assort independently.</p>`;
  }

  function punnettPanel() {
    const p = parents();
    if (state.mode === 'asexual') return '<p class="explorer-copy">A clone copies the parent’s two allele pairs. No gametes fuse, so there is no Punnett cross to calculate.</p>' + dnaPanel();
    if (p.length < 2) return '<p class="explorer-copy">Choose two sexual parents to calculate a Punnett square for each gene.</p>';
    const grid = (name, gene) => {
      const a = [...p[0].genotype[gene]];
      const b = [...p[1].genotype[gene]];
      return `<section class="punnett"><h3>${name}</h3><table aria-label="${name} Punnett square">
        <thead><tr><th scope="col">Egg ↓ · Sperm →</th>${a.map(allele => `<th scope="col">${allele}</th>`).join('')}</tr></thead>
        <tbody>${b.map(egg => `<tr><th scope="row">${egg}</th>${a.map(sperm => `<td>${model.pair(sperm, egg)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></section>`;
    };
    return `<p class="explorer-copy">${p[0].name} contributes sperm alleles across the top. ${p[1].name} contributes egg alleles down the side.</p>
      <div class="punnett-wrap">${grid('Color gene', 'color')}${grid('Fur gene', 'fur')}</div>
      <p class="round-summary">Each box is equally likely for one offspring at that gene. A prediction of 25% does not guarantee that one out of four siblings will have that outcome.</p>`;
  }

  function fusionPanel() {
    const individual = state.stage ? (currentIndividual() ?? state.brood[0]) : null;
    if (state.mode === 'asexual') {
      const parent = parents()[0];
      const genotype = parent ? formattedGenotype(parent.genotype) : 'Cc Ff';
      return `<p class="explorer-copy">A bud grows from a parent through mitosis, then separates. The bud and parent retain the same allele pairs in this model.</p>
        <div class="fertilization-demo replay" aria-label="A diploid bud grows from a diploid parent">
          <div class="fusion-cell">Parent<br>${genotype}</div><div class="fusion-cell small bud" aria-label="Bud with copied DNA">Bud</div><span class="demo-arrow" aria-hidden="true">→</span><div class="fusion-cell">Clone<br>${genotype}</div>
        </div><button type="button" class="text-button" data-action="replay">Replay budding</button>`;
    }
    const p = parents();
    const example = (parent, fallback) => parent
      ? { color: parent.genotype.color[0], fur: parent.genotype.fur[0] }
      : fallback;
    const spermAlleles = individual?.sperm ?? example(p[0], { color: 'C', fur: 'f' });
    const eggAlleles = individual?.egg ?? example(p[1], { color: 'c', fur: 'F' });
    const sperm = formattedGenotype(spermAlleles);
    const egg = formattedGenotype(eggAlleles);
    const zygote = formattedGenotype({
      color: model.pair(spermAlleles.color, eggAlleles.color),
      fur: model.pair(spermAlleles.fur, eggAlleles.fur),
    });
    return `<p class="explorer-copy">${individual ? individual.name + ' began as a one-cell zygote.' : 'Here is one example of a sperm and egg fusing to form a one-cell zygote.'} Each gamete brings one allele for each modeled gene. Fertilization restores two chromosome sets.</p>
      <div class="fertilization-demo replay" aria-label="Sperm and egg fuse and the zygote has both sets of alleles">
        <div class="fusion-cell small sperm" aria-label="Sperm, alleles ${sperm}"><small>Sperm</small>${sperm}</div><div class="fusion-cell egg">Egg<br>${egg}</div><span class="demo-arrow" aria-hidden="true">→</span><div class="fusion-cell">Zygote<br>${zygote}</div>
      </div><button type="button" class="text-button" data-action="replay">Replay fertilization</button>`;
  }

  function renderExplorer() {
    const panels = [
      ['division', 'Cell division', divisionPanel],
      ['fusion', state.mode === 'sexual' ? 'Fertilization' : 'Budding', fusionPanel],
      ['dna', 'DNA & traits', dnaPanel],
      ['punnett', 'Punnett squares', punnettPanel],
    ];
    dialogContent.innerHTML = `<div class="tabs" role="group" aria-label="Explore a topic">${panels.map(([name, label]) =>
      `<button type="button" class="choice" data-action="cell-tab" data-id="${name}" aria-pressed="${name === explorerTab}">${label}</button>`).join('')}</div>`
      + panels.find(([name]) => name === explorerTab)[2]();
  }

  function openExplorer(tab) {
    explorerTab = tab;
    renderExplorer();
    if (!dialog.open) dialog.showModal();
  }

  function toggleParent(id) {
    const selected = state.parents.includes(id);
    if (selected) state.parents = state.parents.filter(parentId => parentId !== id);
    else if (state.parents.length < activeParentCount()) state.parents.push(id);
    else state.parents = [...state.parents.slice(1), id];
    state.viewed = id;
  }

  function testSurvival() {
    state.brood = model.assess(state.brood, state.habitat);
    const survivors = state.brood.filter(individual => individual.survived);
    const traits = [...new Set(survivors.map(individual => {
      const trait = model.phenotype(individual.genotype);
      return trait.color + ' / ' + trait.fur.toLowerCase();
    }))].join(', ');
    const record = {
      generation: state.generation + 1, habitat: state.habitat, mode: state.mode,
      survived: survivors.length, total: state.brood.length, traits,
    };
    const previous = state.history.findIndex(round => round.generation === record.generation && round.habitat === record.habitat);
    if (previous < 0) state.history.push(record);
    else state.history[previous] = record;
    state.stage = 2;
    announce(survivors.length + ' of ' + state.brood.length + ' offspring survived.');
    render({ focus: 'stage', animate: true });
  }

  function nextGeneration() {
    const survivors = state.brood.filter(individual => individual.survived);
    const currentHabitatIndex = habitatKeys.indexOf(state.habitat);
    state = {
      ...state, generation: state.generation + 1, adults: survivors,
      habitat: habitatKeys[(currentHabitatIndex + 1) % habitatKeys.length],
      parents: [], brood: [], viewed: null, prediction: null, stage: 0,
      mode: survivors.length < 2 ? 'asexual' : 'sexual',
    };
    announce('A new habitat is ready for generation ' + state.generation + '.');
    render({ focus: 'stage' });
  }

  function actionFocus(action, id) {
    return '[data-action="' + action + '"]' + (id ? '[data-id="' + id + '"]' : '');
  }

  function handleAction(action, id) {
    if (action === 'explore-dna') return openExplorer('dna');
    if (action === 'explore-fusion') return openExplorer('fusion');
    if (action === 'cell-tab') {
      explorerTab = id;
      renderExplorer();
      dialogContent.querySelector(actionFocus(action, id))?.focus();
      return;
    }
    if (action === 'replay') {
      const animation = dialog.querySelector('.fertilization-demo');
      animation.classList.remove('replay');
      void animation.offsetWidth;
      animation.classList.add('replay');
      return;
    }
    if (action === 'habitat') state.habitat = id;
    if (action === 'mode' && id !== state.mode) {
      state.mode = id;
      state.parents = state.parents.slice(0, activeParentCount());
    }
    if (action === 'parent') toggleParent(id);
    if (action === 'offspring') state.viewed = id;
    if (action === 'prediction' && currentIndividual()) {
      state.prediction = state.viewed;
      announce('Prediction saved for ' + currentIndividual().name + '.');
    }
    if (action === 'breed') {
      const chosen = parents();
      if (chosen.length !== activeParentCount()) return;
      state.brood = model.breed(chosen, state.mode, state.generation);
      state.stage = 1;
      state.viewed = null;
      announce(state.brood.length + ' offspring arrived.');
      render({ focus: 'stage', animate: true });
      return;
    }
    if (action === 'test') return testSurvival();
    if (action === 'next') return nextGeneration();
    if (action === 'compare') {
      const keyIndex = habitatKeys.indexOf(state.habitat);
      state.habitat = habitatKeys[(keyIndex + 1) % habitatKeys.length];
      state.stage = 1;
      state.prediction = null;
      state.brood = state.brood.map(({ survived, ...individual }) => individual);
      announce('Same offspring, new habitat: ' + model.habitats[state.habitat].name + '.');
      render({ focus: 'stage' });
      return;
    }
    if (action === 'reset') {
      state = newRun();
      announce('Restarted with the six founders.');
      render({ focus: 'stage' });
      return;
    }
    const focus = action === 'prediction' ? actionFocus('test') : actionFocus(action, id);
    render({ focus });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (button) handleAction(button.dataset.action, button.dataset.id);
  });
  node('openCells').addEventListener('click', () => openExplorer('division'));
  node('closeCells').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  render();
})();
