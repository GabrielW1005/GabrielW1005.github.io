const stages = [
  {
    title: 'Approach the egg',
    description: 'Fertilization usually takes place in a fallopian tube. The sperm carries one set of 23 chromosomes. The ovulated egg also has a set of 23 chromosomes, each still copied into two sister chromatids at this point.',
    prompt: 'Why does each gamete carry only one set of chromosomes?',
  },
  {
    title: 'Pass through the outer layers',
    description: 'A sperm moves through the cells surrounding the egg and then through the zona pellucida, its protective coat. The sperm’s movement and changes at the tip of its head help it get through.',
    prompt: 'Which layer is the sperm about to reach?',
  },
  {
    title: 'The cell membranes fuse',
    description: 'The sperm membrane fuses with the egg membrane. The sperm’s genetic material enters the egg, and signals spread inside the egg.',
    prompt: 'Which part of the sperm carries its set of chromosomes?',
  },
  {
    title: 'The egg finishes meiosis',
    description: 'Signals from fusion trigger changes that help keep additional sperm out. The egg finishes meiosis II and sheds a small second polar body. It now keeps 23 chromosomes with one chromatid each.',
    prompt: 'What would happen to the chromosome count if a second sperm contributed its chromosomes?',
  },
  {
    title: 'Two sets in one zygote',
    description: 'The chromosomes from the sperm and egg are in two temporary nuclei, called pronuclei. The two sets give the one-celled zygote 46 chromosomes in all. The pronuclei move together, and their envelopes break down as the first mitosis begins.',
    prompt: 'How is the zygote’s chromosome count different from either gamete’s?',
  },
];

const coronaCells = Array.from({ length: 18 }, (_, index) => {
  const angle = index * 20 + 10;
  return `<g transform="rotate(${angle} 432 175)"><ellipse cx="432" cy="40" rx="13" ry="10"/><ellipse class="lab-corona-center" cx="432" cy="40" rx="3" ry="3.5"/></g>`;
}).join('');

const cytoplasm = [
  [393, 120], [445, 117], [480, 152], [468, 199], [386, 196], [425, 230],
  [461, 221], [400, 164], [413, 133], [494, 185], [421, 102], [368, 151],
  [376, 223], [447, 251], [458, 97], [503, 159], [395, 245], [482, 126],
].map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="${index % 3 + 1}"/>`).join('');

function sperm(className) {
  return `<g class="${className}"><path class="lab-sperm-tail" d="M-8 0 C -20 -12 -28 13 -40 4 S -52 -6 -64 2"/><path class="lab-sperm-head" d="M -13 -6 Q 0 -13 12 -2 Q 14 0 12 2 Q 0 13 -13 6 Q -17 0 -13 -6 Z"/><path class="lab-sperm-cap" d="M 4 -6 Q 10 -4 12 -2 Q 14 0 12 2 Q 10 4 4 6 Q 8 0 4 -6 Z"/></g>`;
}

function pronucleus(className, name, labelX, leaderPath) {
  return `<g class="${className}"><circle cx="0" cy="0" r="23" class="lab-pronucleus-shell"/><path d="M-13 -2q8 -9 15 -2m-12 13q8 -1 16 -7m-1 -11q8 3 7 12" class="lab-pronucleus-dna"/><path d="${leaderPath}" class="lab-pronucleus-leader"/><text x="${labelX}" y="43" text-anchor="middle" class="lab-pronucleus-label"><tspan x="${labelX}">${name}</tspan><tspan x="${labelX}" dy="15">23 chromosomes</tspan></text></g>`;
}

const illustration = `
  <svg class="lab-fertilization-art" viewBox="0 0 650 345" role="img" aria-labelledby="lab-fert-svg-title lab-fert-svg-desc">
    <title id="lab-fert-svg-title">Human sperm and an egg cell</title>
    <desc id="lab-fert-svg-desc"></desc>
    <defs>
      <radialGradient id="lab-oocyte-fill" cx="43%" cy="36%" r="65%">
        <stop offset="0" stop-color="#ffe1a3"/>
        <stop offset=".47" stop-color="#e9807b"/>
        <stop offset="1" stop-color="#642a56"/>
      </radialGradient>
      <radialGradient id="lab-fert-bg" cx="57%" cy="46%" r="64%">
        <stop offset="0" stop-color="#422a50"/>
        <stop offset="1" stop-color="#161e37"/>
      </radialGradient>
    </defs>
    <path d="M0 0H650V345H0Z" fill="url(#lab-fert-bg)"/>
    <path class="lab-bio-flow" d="M-35 105 C89 0 183 34 280 66 M-22 283 C89 195 219 273 289 297 M166 343 C246 319 292 321 345 338 M28 155 C94 113 178 119 248 139"/>
    <circle cx="432" cy="175" r="113" class="lab-oocyte-coat"/>
    <circle cx="432" cy="175" r="102" class="lab-oocyte-membrane"/>
    <circle cx="432" cy="175" r="99" fill="url(#lab-oocyte-fill)"/>
    <g class="lab-corona">${coronaCells}</g>
    <g class="lab-cytoplasm">${cytoplasm}</g>
    <g class="lab-meiotic-spindle">
      <ellipse cx="475" cy="118" rx="20" ry="10" transform="rotate(-30 475 118)"/>
      <path d="m472 112 9 8 m-3 -11 -2 14 m-9 -7 8 7 m-2 -12 -3 12"/>
    </g>
    <g class="lab-polar-body"><circle cx="520" cy="114" r="6"/><path d="m517 113 6 3m-1 -5 -3 6"/></g>
    <g class="lab-sperm-chromatin"><ellipse cx="365" cy="160" rx="9" ry="6"/><path d="m360 160q4 -4 10 0"/></g>
    <g class="lab-fert-pulse"><circle cx="332" cy="176" r="12"/><circle cx="432" cy="175" r="89"/></g>
    ${sperm('lab-sperm-main')}
    ${sperm('lab-sperm-secondary lab-sperm-above')}
    ${sperm('lab-sperm-secondary lab-sperm-below')}
    ${pronucleus('lab-pronucleus lab-pronucleus-sperm', 'From sperm', -21, 'M-19 16L-22 29')}
    ${pronucleus('lab-pronucleus lab-pronucleus-egg', 'From egg', 24, 'M20 13L23 29')}
    <g class="lab-entry-block" transform="translate(339 247)"><circle r="11"/><path d="M-6 6 6 -6"/></g>
  </svg>`;

export function mountFertilization(root) {
  root.innerHTML = `
    <section class="bio-lab" aria-label="Fertilization animation">
      <div class="lab-grid lab-fert-grid">
        <div class="lab-panel lab-visual-panel">
          <div class="lab-illustration" data-fert-diagram data-stage="0">${illustration}</div>
          <div class="lab-legend" aria-label="Diagram legend">
            <span><i class="lab-key lab-key-sperm"></i>Sperm</span>
            <span><i class="lab-key lab-key-corona"></i>Outer cells</span>
            <span><i class="lab-key lab-key-coat"></i>Protective coat</span>
            <span><i class="lab-key lab-key-membrane"></i>Cell membrane</span>
          </div>
          <p class="lab-note">Illustration is enlarged to show detail. Only a few chromosomes are drawn.</p>
        </div>
        <div class="lab-panel lab-stage-panel">
          <div class="lab-stage-copy" aria-live="polite" aria-atomic="true">
            <p class="lab-kicker" data-fert-progress></p>
            <h3 data-fert-title></h3>
            <p data-fert-description></p>
            <div class="lab-question">
              <p class="lab-kicker">Pause and think</p>
              <p data-fert-question></p>
            </div>
          </div>
          <div class="lab-controls" aria-label="Fertilization animation controls">
            <button type="button" class="lab-button" data-fert-previous>Back</button>
            <button type="button" class="lab-button lab-button-primary" data-fert-play>Play</button>
            <button type="button" class="lab-button" data-fert-next>Next</button>
          </div>
          <div class="lab-chapters" aria-label="Go to a fertilization stage">
            ${stages.map(({ title }, index) => `<button type="button" data-fert-jump="${index}" aria-label="Stage ${index + 1} · ${title}">${index + 1}</button>`).join('')}
          </div>
        </div>
      </div>
      <p class="lab-source"><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/28-1-fertilization" target="_blank" rel="noopener">OpenStax · Fertilization</a><a href="https://www.ncbi.nlm.nih.gov/books/NBK26843/" target="_blank" rel="noopener">Molecular Biology of the Cell · Fertilization</a></p>
    </section>`;

  const diagram = root.querySelector('[data-fert-diagram]');
  const svgDescription = root.querySelector('#lab-fert-svg-desc');
  const progress = root.querySelector('[data-fert-progress]');
  const title = root.querySelector('[data-fert-title]');
  const description = root.querySelector('[data-fert-description]');
  const question = root.querySelector('[data-fert-question]');
  const previous = root.querySelector('[data-fert-previous]');
  const play = root.querySelector('[data-fert-play]');
  const next = root.querySelector('[data-fert-next]');
  const chapterButtons = root.querySelectorAll('[data-fert-jump]');
  let current = 0;
  let timer;

  function render() {
    const stage = stages[current];
    diagram.dataset.stage = current;
    diagram.dataset.playing = Boolean(timer);
    svgDescription.textContent = `${stage.title}. ${stage.description}`;
    progress.textContent = `Stage ${current + 1} of ${stages.length}`;
    title.textContent = stage.title;
    description.textContent = stage.description;
    question.textContent = stage.prompt;
    previous.disabled = current === 0;
    next.disabled = current === stages.length - 1;
    play.textContent = timer ? 'Pause' : (next.disabled ? 'Replay' : 'Play');
    chapterButtons.forEach((button, index) => {
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
    });
  }

  function stop() {
    window.clearInterval(timer);
    timer = undefined;
  }

  function goTo(index) {
    stop();
    current = index;
    render();
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  chapterButtons.forEach((button, index) => button.addEventListener('click', () => goTo(index)));
  play.addEventListener('click', () => {
    if (timer) {
      stop();
    } else {
      if (current === stages.length - 1) current = 0;
      timer = window.setInterval(() => {
        if (!root.isConnected) {
          stop();
          return;
        }
        current += 1;
        if (current === stages.length - 1) stop();
        render();
      }, 7000);
    }
    render();
  });
  render();
  return stop;
}
