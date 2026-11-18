const meioticStages = [
  {
    name: 'Interphase', step: 'Start with two pairs', group: 'Before division',
    description: 'This diploid cell has two homologous pairs. Each pair has one chromosome inherited from each biological parent. The long pair and short pair carry different groups of genes.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 4],
  },
  {
    name: 'Interphase', step: 'Copy the DNA', group: 'Before division',
    description: 'The cell grows and copies its DNA. Each chromosome now has two sister chromatids joined at one centromere. Count the joining points to see why there are still four chromosomes.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Prophase I', step: 'Pair and exchange', group: 'Meiosis I',
    description: 'The chromosomes condense, the nuclear envelope breaks down, and homologs pair up. In this example, two non-sister chromatids in the long pair swap matching pieces of DNA. This is crossing over.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Metaphase I', step: 'Line up in pairs', group: 'Meiosis I',
    description: 'Homologous pairs line up across the middle. Spindle fibers attach to each duplicated chromosome. Each pair can face either way, independently of the other pair.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Anaphase I', step: 'Separate the homologs', group: 'Meiosis I',
    description: 'One duplicated chromosome from each pair moves toward each pole. Watch the entire X move together. Both sister chromatids stay attached.',
    ploidy: 'One set moving toward each pole', counts: [1, 4, 8],
  },
  {
    name: 'Telophase I & cytokinesis', step: 'Form two haploid cells', group: 'Meiosis I',
    description: 'In this model, nuclei reform as the cell splits. Each daughter cell has one long and one short chromosome. Both chromosomes still have two chromatids.',
    ploidy: 'Haploid (n)', counts: [2, 2, 4],
  },
  {
    name: 'Prophase II', step: 'Prepare to divide again', group: 'Meiosis II',
    description: 'A spindle forms in each cell, and the nuclear envelopes break down. The DNA is still in the same duplicated chromosomes. There is no second round of DNA copying.',
    ploidy: 'Haploid (n)', counts: [2, 2, 4],
  },
  {
    name: 'Metaphase II', step: 'Line up single file', group: 'Meiosis II',
    description: 'Duplicated chromosomes line up one at a time along the middle of each cell. Spindle fibers from opposite poles attach to opposite sister chromatids.',
    ploidy: 'Haploid (n)', counts: [2, 2, 4],
  },
  {
    name: 'Anaphase II', step: 'Separate the sisters', group: 'Meiosis II',
    description: 'Sister chromatids separate and move toward opposite poles. Each separated chromatid now counts as a chromosome. Each pole is getting one long and one short chromosome.',
    ploidy: 'One set moving toward each pole', counts: [2, 4, 4],
  },
  {
    name: 'Telophase II & cytokinesis', step: 'Form four haploid cells', group: 'Meiosis II',
    description: 'Nuclear envelopes reform and the cells split. Each of the four haploid cells has half the starting chromosome number. Follow the exchanged tips and compare the resulting cells.',
    ploidy: 'Haploid (n)', counts: [4, 2, 2],
  },
];

const mitoticStages = [
  {
    name: 'Interphase', step: 'Start with two pairs', group: 'Before division',
    description: 'The comparison starts with the same two homologous pairs in a diploid cell.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 4],
  },
  {
    name: 'Interphase', step: 'Copy the DNA', group: 'Before division',
    description: 'The DNA is copied once. Each chromosome now has two sister chromatids joined at the centromere.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Prophase', step: 'Condense chromosomes', group: 'Mitosis',
    description: 'Chromosomes condense, a spindle begins to form, and the nuclear envelope breaks down. Each chromosome moves independently.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Metaphase', step: 'Line up single file', group: 'Mitosis',
    description: 'All four duplicated chromosomes line up individually at the middle. Spindle fibers from opposite poles attach to opposite sister chromatids.',
    ploidy: 'Diploid (2n)', counts: [1, 4, 8],
  },
  {
    name: 'Anaphase', step: 'Separate the sisters', group: 'Mitosis',
    description: 'Sister chromatids separate. Each is now a chromosome, and each pole is getting a complete set of four.',
    ploidy: 'Two sets moving toward each pole', counts: [1, 8, 8],
  },
  {
    name: 'Telophase & cytokinesis', step: 'Form two diploid cells', group: 'Mitosis',
    description: 'Nuclei reform and the cell splits. Both daughter cells have the same four chromosomes as the starting cell in this model.',
    ploidy: 'Diploid (2n)', counts: [2, 4, 4],
  },
];

const chromosomeColors = ['#4188ce', '#d64b79', '#278e75', '#bf8014'];
const restingCenters = [[260, 125], [340, 125], [260, 208], [340, 208]];
const condensedCenters = [[233, 108], [362, 111], [253, 229], [367, 223]];
const pairedCenters = [[267, 107], [333, 107], [267, 222], [333, 222]];
const singleCell = [[300, 166, 148]];
const dividingCell = [[300, 166, 238, 148]];
const twoCells = [[151, 167, 114], [449, 167, 114]];
const fourCells = [[151, 80, 73], [151, 252, 73], [449, 80, 73], [449, 252, 73]];
const doublePoleX = [[93, 167], [507, 167]];
const mitoticRows = [74, 141, 202, 259];
const chromosomeLabels = ['Long from parent 1', 'Long from parent 2', 'Short from parent 1', 'Short from parent 2'];

let nextLabId = 0;

function pairedChromatids(centers, copied) {
  return centers.flatMap(([x, y]) => [
    [x, y, copied ? -1 : 0, true],
    [x, y, 1, copied],
  ]);
}

function meioticGeometry(stage, flipPair) {
  const sides = [0, 1, flipPair ? 1 : 0, flipPair ? 0 : 1];
  const alignedCenters = sides.map((side, index) => [
    side === 0 ? 273 : 327, index < 2 ? 103 : 228,
  ]);
  const earlyLocations = sides.map((side, index) => [
    (side === 0 ? 151 : 449) + (index < 2 ? -32 : 31),
    index < 2 ? 153 : 179,
  ]);
  const lateLocations = sides.map((side, index) => [
    (side === 0 ? 151 : 449) + (index < 2 ? -35 : 35), 167,
  ]);
  const cells = stage === 9 ? fourCells : stage >= 5 ? twoCells : stage >= 2 ? dividingCell : singleCell;
  let nuclei = [];
  let centers = restingCenters;
  let tracks = [];
  let poles = [];
  let axes = [];
  let exchange = false;
  if (stage < 2) {
    nuclei = [[300, 166, 104]];
  } else if (stage === 2) {
    centers = pairedCenters;
    poles = doublePoleX;
    exchange = true;
  } else if (stage === 3) {
    centers = alignedCenters;
    poles = doublePoleX;
    tracks = centers.map((point, index) => [poles[sides[index]], point]);
    axes = [[300, 42, 300, 291]];
  } else if (stage === 4) {
    centers = earlyLocations.map(([x, y], index) => [x + (sides[index] === 0 ? 18 : -18), y]);
    poles = doublePoleX;
    tracks = centers.map((point, index) => [poles[sides[index]], point]);
  } else if (stage === 5) {
    centers = earlyLocations;
    nuclei = twoCells.map(([x, y]) => [x, y, 79]);
  } else if (stage <= 7) {
    centers = stage === 6 ? earlyLocations : lateLocations;
    poles = twoCells.flatMap(([x]) => [[x, 81], [x, 253]]);
    if (stage === 7) {
      tracks = centers.flatMap((point, index) => [
        [poles[sides[index] * 2], point], [poles[sides[index] * 2 + 1], point],
      ]);
      axes = twoCells.map(([x, y]) => [x - 94, y, x + 94, y]);
    }
  }
  let chromatids = pairedChromatids(centers, stage !== 0);
  if (stage >= 8) {
    const insideCellOffset = stage === 8 ? 2 : 6;
    chromatids = lateLocations.flatMap(([x]) => [
      [x + insideCellOffset, stage === 8 ? 109 : 80, 0, true],
      [x + insideCellOffset, stage === 8 ? 225 : 252, 0, true],
    ]);
    if (stage === 8) {
      poles = twoCells.flatMap(([x]) => [[x, 69], [x, 264]]);
      tracks = chromatids.map((position, index) => [
        poles[sides[Math.floor(index / 2)] * 2 + index % 2], position,
      ]);
    } else {
      nuclei = fourCells.map(([x, y]) => [x, y, 56]);
    }
  }
  const elongatedCells = stage === 8 ? cells.map(([x, y, r]) => [x, y, r * .93, r * 1.15]) : cells;
  return { cells: elongatedCells, nuclei, poles, tracks, axes, chromatids, exchange, crossover: stage >= 2 };
}

function mitoticGeometry(stage) {
  const finished = stage === 5;
  const poles = stage >= 2 && !finished ? doublePoleX : [];
  let nuclei = [];
  let axes = [];
  let tracks = [];
  let centers = restingCenters;
  if (stage < 2) {
    nuclei = [[300, 166, 104]];
  } else if (stage === 2) {
    centers = condensedCenters;
  } else if (stage === 3) {
    centers = mitoticRows.map(y => [300, y]);
    axes = [[300, 29, 300, 303]];
    tracks = centers.flatMap(point => [[poles[0], point], [poles[1], point]]);
  }
  let chromatids = pairedChromatids(centers, stage !== 0);
  if (stage === 4) {
    chromatids = mitoticRows.flatMap(y => [[193, y, 0, true], [407, y, 0, true]]);
    tracks = chromatids.map((position, index) => [poles[index % 2], position]);
  } else if (finished) {
    chromatids = mitoticRows.flatMap((_, index) => twoCells.map(([x, y]) => [
      x + (index % 2 === 0 ? -28 : 28), y + (index < 2 ? -43 : 44), 0, true,
    ]));
    nuclei = twoCells.map(([x, y]) => [x, y, 88]);
  }
  const cells = finished ? twoCells : stage >= 2 ? dividingCell : singleCell;
  return { cells, nuclei, axes, tracks, poles, chromatids, exchange: false, crossover: false };
}

function stageCard(kind, id) {
  const colors = kind === 'meiosis' ? 'dl-meiosis' : 'dl-mitosis';
  const title = kind === 'meiosis' ? 'Meiosis' : 'Mitosis';
  return `
    <article class="dl-card ${colors}" data-model="${kind}" ${kind === 'mitosis' ? 'hidden' : ''}>
      <header class="dl-card-top">
        <h3>${title}</h3>
        <span class="dl-phase"></span>
      </header>
      <div class="dl-display">
        <svg class="dl-svg" viewBox="0 0 600 334" role="img" aria-labelledby="${id}-${kind}-title">
          <title id="${id}-${kind}-title"></title>
          <g class="dl-membranes">${'<ellipse class="dl-membrane"/>'.repeat(4)}</g>
          <g class="dl-nuclei">${'<ellipse class="dl-nucleus"/>'.repeat(4)}</g>
          <g class="dl-spindle"></g>
          <g class="dl-strands"></g>
          <g class="dl-exchange"></g>
        </svg>
        <span class="dl-ploidy"></span>
      </div>
      <div class="dl-stage-copy">
        <p class="dl-name"></p>
        <h4></h4>
        <p class="dl-description"></p>
      </div>
      <dl class="dl-counts">
        <div><dt>Cells</dt><dd></dd></div>
        <div><dt>Chromosomes per cell</dt><dd></dd></div>
        <div><dt>Chromatids per cell</dt><dd></dd></div>
      </dl>
    </article>`;
}

function createStageCard(card) {
  const svg = card.querySelector('svg');
  const strands = svg.querySelector('.dl-strands');
  strands.innerHTML = chromosomeColors.map((color, chromosome) => [0, 1].map(copy => `
    <g class="dl-strand" style="--strand-color:${color}" data-chromosome="${chromosome}" data-copy="${copy}">
      <path class="dl-strand-base"/>
      <path class="dl-strand-color"/>
      <path class="dl-strand-tip"/>
      <circle class="dl-centromere" r="3.1"/>
    </g>`).join('')).join('');
  return {
    card,
    svg,
    title: svg.querySelector('title'),
    cells: [...svg.querySelectorAll('.dl-membrane')],
    nuclei: [...svg.querySelectorAll('.dl-nucleus')],
    strands: [...strands.children],
    spindle: svg.querySelector('.dl-spindle'),
    exchange: svg.querySelector('.dl-exchange'),
    phase: card.querySelector('.dl-phase'),
    ploidy: card.querySelector('.dl-ploidy'),
    name: card.querySelector('.dl-name'),
    heading: card.querySelector('h4'),
    description: card.querySelector('.dl-description'),
    counts: [...card.querySelectorAll('dd')],
  };
}

function moveMembranes(nodes, positions) {
  nodes.forEach((node, index) => {
    const position = positions[index];
    node.style.opacity = position ? 1 : 0;
    if (position) {
      const [x, y, rx, ry = rx] = position;
      node.style.cx = `${x}px`;
      node.style.cy = `${y}px`;
      node.style.rx = `${rx}px`;
      node.style.ry = `${ry}px`;
    }
  });
}

function drawStrand(node, position, index, showCrossover, stage) {
  const [x, y, branch, visible] = position;
  const chromosome = Math.floor(index / 2);
  const height = chromosome < 2 ? 32 : 24;
  const spread = chromosome < 2 ? 11 : 8;
  const tipX = branch === 0 ? -3 : spread * branch;
  const lowerX = branch === 0 ? 5 : -tipX;
  const middleX = branch === 0 ? 3 : 0;
  const tipLength = chromosome < 2 ? 13 : 8;
  const path = `M ${tipX} ${-height} Q ${middleX} ${-height * .43} 0 0 Q ${middleX} ${height * .43} ${lowerX} ${height}`;
  const tipPath = `M ${tipX} ${-height} Q ${tipX / 1.4} ${-height + tipLength / 2} ${tipX / 1.7} ${-height + tipLength}`;
  const tipColor = index === 1 ? chromosomeColors[1] : index === 2 ? chromosomeColors[0] : null;
  node.style.transform = `translate(${x}px, ${y}px)`;
  node.style.opacity = visible ? 1 : 0;
  node.classList.toggle('dl-uncondensed', stage <= 1);
  node.querySelector('.dl-strand-base').setAttribute('d', path);
  node.querySelector('.dl-strand-color').setAttribute('d', path);
  node.querySelector('.dl-centromere').style.opacity = branch === -1 ? 0 : 1;
  const tip = node.querySelector('.dl-strand-tip');
  tip.setAttribute('d', tipPath);
  tip.style.stroke = showCrossover && tipColor ? tipColor : 'transparent';
}

function drawDiagram(model, geometry, stage) {
  moveMembranes(model.cells, geometry.cells);
  moveMembranes(model.nuclei, geometry.nuclei);
  model.strands.forEach((node, index) => {
    drawStrand(node, geometry.chromatids[index], index, geometry.crossover, stage);
  });
  model.spindle.innerHTML = [
    ...geometry.axes.map(([x1, y1, x2, y2]) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="dl-equator"/>`),
    ...geometry.tracks.map(([[x1, y1], [x2, y2]]) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="dl-fiber"/>`),
    ...geometry.poles.map(([x, y]) => `
      <g class="dl-pole" transform="translate(${x}, ${y})">
        <circle r="10"/><path d="M 0 -15 V 15 M -15 0 H 15 M -10 -10 L 10 10 M -10 10 L 10 -10"/>
        <circle class="dl-pole-dot" r="4"/>
      </g>`),
  ].join('');
  model.exchange.innerHTML = geometry.exchange ? `
    <path d="M284 68 Q302 57 319 69 M311 60 L319 69 L308 72
             M316 81 Q299 92 282 80 M290 88 L282 80 L293 77" class="dl-swap-arrows"/>
    <text class="dl-swap-label" x="300" y="47" text-anchor="middle">DNA exchange</text>` : '';
}

function renderCard(model, info, geometry, stage, finished = false) {
  model.phase.textContent = finished ? 'Division complete' : info.group;
  model.ploidy.textContent = info.ploidy;
  model.name.textContent = info.name;
  model.heading.textContent = info.step;
  model.description.textContent = info.description;
  model.title.textContent = `${info.name}. ${info.step}. ${info.description}`;
  model.counts.forEach((node, index) => { node.textContent = info.counts[index]; });
  drawDiagram(model, geometry, stage);
}

export function mountDivision(root) {
  const id = `division-${++nextLabId}`;
  root.classList.add('division-lab');
  root.innerHTML = `
    <div class="dl-toolbar">
      <div class="dl-transport" aria-label="Animation controls">
        <button type="button" data-action="previous" aria-label="Previous stage"
          title="Previous stage (left arrow)">←</button>
        <button type="button" data-action="play" class="dl-primary">▶ Play</button>
        <button type="button" data-action="next" aria-label="Next stage"
          title="Next stage (right arrow)">→</button>
      </div>
      <span class="dl-progress" aria-hidden="true"></span>
      <label class="dl-compare">
        <input type="checkbox" data-action="compare">
        <span class="dl-switch" aria-hidden="true"></span>
        Compare with mitosis
      </label>
    </div>
    <nav class="dl-rail" aria-label="Division stages">
      ${meioticStages.map((stage, index) => {
        const short = ['Start', 'DNA copy', 'Pro I', 'Meta I', 'Ana I', 'Telo I', 'Pro II', 'Meta II', 'Ana II', 'Telo II'][index];
        return `<button type="button" data-stage="${index}" class="dl-step"
          data-group="${stage.group}" title="${stage.name} · ${stage.step}" aria-label="${stage.name}. ${stage.step}">
          <span aria-hidden="true">${short}</span>
        </button>`;
      }).join('')}
    </nav>
    <p class="dl-sr" aria-live="polite" aria-atomic="true" data-announcement></p>
    <div class="dl-models">
      ${stageCard('meiosis', id)}
      ${stageCard('mitosis', id)}
    </div>
    <div class="dl-tools">
      <ul class="dl-key" aria-label="Chromosome colors">
        ${chromosomeLabels.map((label, index) => `
          <li style="--key-color:${chromosomeColors[index]}"><span></span>${label}</li>`).join('')}
      </ul>
      <button type="button" class="dl-flip" data-action="flip" aria-pressed="false" hidden>Flip the short pair</button>
    </div>
    <p class="dl-model-note">
      Teaching model with two homologous pairs. A diploid human cell usually starts with 23 pairs.
      The four-cell result illustrates meiosis. In human egg formation, one cell becomes the functional egg,
      and the other small cells are polar bodies.
      <a href="https://openstax.org/books/biology-2e/pages/11-1-the-process-of-meiosis" target="_blank" rel="noopener">Meiosis reference</a>
    </p>`;

  const models = root.querySelector('.dl-models');
  const meiosis = createStageCard(root.querySelector('.dl-meiosis'));
  const mitosis = createStageCard(root.querySelector('.dl-mitosis'));
  const progress = root.querySelector('.dl-progress');
  const announcement = root.querySelector('[data-announcement]');
  const stepButtons = [...root.querySelectorAll('[data-stage]')];
  const actions = Object.fromEntries([...root.querySelectorAll('[data-action]')].map(node => [node.dataset.action, node]));
  const endStage = meioticStages.length - 1;
  let currentStage = 0;
  let flipped = false;
  let timer = null;

  function render() {
    const info = meioticStages[currentStage];
    const mitosisStage = Math.min(currentStage, mitoticStages.length - 1);
    const compare = actions.compare.checked;
    models.classList.toggle('dl-side-by-side', compare);
    mitosis.card.hidden = !compare;
    renderCard(meiosis, info, meioticGeometry(currentStage, flipped), currentStage);
    renderCard(mitosis, mitoticStages[mitosisStage], mitoticGeometry(mitosisStage), mitosisStage, currentStage > mitosisStage);
    actions.flip.hidden = currentStage !== 3;
    actions.flip.setAttribute('aria-pressed', flipped);
    actions.previous.disabled = currentStage === 0;
    actions.next.disabled = currentStage === endStage;
    progress.textContent = `Stage ${currentStage + 1} of ${meioticStages.length}`;
    announcement.textContent = `${progress.textContent}. Meiosis: ${info.name}, ${info.step}. ${info.counts[0]} cells, ${info.counts[1]} chromosomes per cell, ${info.counts[2]} chromatids per cell.${compare ? ` Mitosis: ${mitoticStages[mitosisStage].name}, ${mitoticStages[mitosisStage].step}.` : ''}`;
    stepButtons.forEach((button, index) => {
      if (index === currentStage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    actions.play.textContent = timer ? 'Ⅱ Pause' : currentStage === endStage ? '↻ Replay' : '▶ Play';
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
  }

  function seek(stage) {
    stop();
    currentStage = Math.max(0, Math.min(stage, endStage));
    render();
  }

  actions.play.addEventListener('click', () => {
    if (timer) {
      stop();
    } else {
      if (currentStage === endStage) currentStage = 0;
      timer = window.setInterval(() => {
        if (!root.isConnected) {
          stop();
          return;
        }
        currentStage += 1;
        if (currentStage === endStage) stop();
        render();
      }, 3450);
    }
    render();
  });
  actions.previous.addEventListener('click', () => seek(currentStage - 1));
  actions.next.addEventListener('click', () => seek(currentStage + 1));
  actions.compare.addEventListener('change', render);
  actions.flip.addEventListener('click', () => {
    stop();
    flipped = !flipped;
    render();
    announcement.textContent = flipped ? 'The short homologs have switched sides.' : 'The short homologs are back in their first arrangement.';
  });
  stepButtons.forEach((button, index) => button.addEventListener('click', () => seek(index)));
  root.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const fromRail = event.target.closest('[data-stage]');
    seek(currentStage + (event.key === 'ArrowLeft' ? -1 : 1));
    if (fromRail) stepButtons[currentStage].focus();
  });
  render();
}
