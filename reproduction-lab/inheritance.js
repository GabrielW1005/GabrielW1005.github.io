const alleleOptions = [
  ['P', 'P'], ['P', 'p'], ['p', 'P'], ['p', 'p'],
];

const environmentOptions = {
  ample: { label: 'Enough water', trait: 'Taller stem' },
  limited: { label: 'Limited water', trait: 'Shorter stem' },
};

function flower() {
  const petals = Array.from({ length: 6 }, (_, index) => `
    <ellipse cx="250" cy="75" rx="17" ry="29" transform="rotate(${index * 60} 250 108)"/>
  `).join('');

  return `<svg class="lab-inheritance-art" viewBox="0 0 500 280" role="img" aria-labelledby="lab-plant-title lab-plant-desc">
    <title id="lab-plant-title">Flowering plant offspring</title>
    <desc id="lab-plant-desc"></desc>
    <defs>
      <linearGradient id="lab-plant-sky" x2="0" y2="1">
        <stop offset="0" stop-color="#173348"/>
        <stop offset="1" stop-color="#1a4552"/>
      </linearGradient>
      <pattern id="lab-botany-grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M30 0H0V30" stroke="#b5d9cf" stroke-opacity=".09" fill="none"/>
      </pattern>
    </defs>
    <path d="M0 0H500V280H0Z" fill="url(#lab-plant-sky)"/>
    <path d="M0 0H500V280H0Z" fill="url(#lab-botany-grid)"/>
    <path class="lab-plant-soil" d="M0 243 Q84 231 154 245 T333 245 T500 239 V280 H0Z"/>
    <path class="lab-plant-roots" d="M250 241q-9 15-32 27 M250 241q14 10 29 22 M250 241q1 13-6 28 M263 253l17 3 M237 252l-17 2"/>
    <path class="lab-plant-ruler" d="M365 46V242 M365 46h12 M365 68h7 M365 90h7 M365 112h12 M365 134h7 M365 156h7 M365 178h12 M365 200h7 M365 222h7 M365 242h12"/>
    <path class="lab-plant-guide" d="M301 46H364 M301 112H364"/>
    <circle class="lab-ruler-pointer" cx="365" cy="46" r="4.5"/>
    <path class="lab-plant-stem" d="M250 242 Q241 217 250 188 Q257 157 250 111"/>
    <path class="lab-plant-leaf lab-plant-leaf-left" d="M247 220 C218 220 203 205 201 188 C226 188 243 199 247 220Z"/>
    <path class="lab-plant-leaf lab-plant-leaf-right" d="M252 194 C276 194 296 179 301 162 C278 161 261 177 252 194Z"/>
    <g class="lab-blossom">
      <g class="lab-petals">${petals}</g>
      <circle class="lab-flower-center" cx="250" cy="108" r="15"/>
      <path class="lab-flower-dots" d="M248 103h1m6 4h1m-10 7h1m6 -1h1"/>
    </g>
    <g class="lab-water-cue" transform="translate(113 211)">
      <path class="lab-water-drop" d="M0 -12 C5 -5 9 0 9 5A9 9 0 0 1 -9 5C-9 0 -5 -5 0 -12Z"/>
      <path class="lab-water-drop lab-extra-water" d="M24 -20 C29 -13 33 -8 33 -3A9 9 0 0 1 15 -3C15 -8 19 -13 24 -20Z"/>
      <path class="lab-water-drop lab-extra-water" d="M42 -7 C47 0 51 5 51 10A9 9 0 0 1 33 10C33 5 37 0 42 -7Z"/>
    </g>
  </svg>`;
}

function crossTable() {
  const cell = index => {
    const [alleleA, alleleB] = alleleOptions[index];
    const describe = allele => allele === 'P' ? 'capital P' : 'lowercase P';
    return `<td><button type="button" class="lab-allele-option" data-inherit-pair="${index}" aria-pressed="false" aria-label="Parent A contributes ${describe(alleleA)}. Parent B contributes ${describe(alleleB)}.">${genotypeOf(alleleOptions[index])}</button></td>`;
  };

  return `<table class="lab-cross-table" aria-label="Possible alleles from two Pp parent plants">
    <thead><tr><th scope="col">A ↓ · B →</th><th scope="col"><b>P</b></th><th scope="col"><b>p</b></th></tr></thead>
    <tbody>
      <tr><th scope="row"><b>P</b></th>${cell(0)}${cell(1)}</tr>
      <tr><th scope="row"><b>p</b></th>${cell(2)}${cell(3)}</tr>
    </tbody>
  </table>`;
}

function genotypeOf(alleles) {
  return [...alleles].sort().join('');
}

export function mountInheritance(root) {
  root.innerHTML = `
    <section class="bio-lab" aria-label="Inheritance simulator">
      <div class="lab-grid lab-inheritance-grid" data-inheritance>
        <div class="lab-panel lab-stage-panel">
          <p>A genotype is a combination of gene versions, called alleles. A phenotype is an observable trait.</p>
          <div class="lab-tabs" aria-label="Type of reproduction">
            <button type="button" data-inherit-mode="sexual" aria-pressed="true">Sexual</button>
            <button type="button" data-inherit-mode="asexual" aria-pressed="false">Asexual</button>
          </div>
          <div data-inherit-sexual>
            <h3>Two parents contribute one allele each</h3>
            <p>Both parents have genotype <b>Pp</b>. Pick a cell in the Punnett square to see that offspring.</p>
            ${crossTable()}
            <p class="lab-note">Each square is equally likely in this model. Three squares give purple petals and one gives cream petals.</p>
          </div>
          <div data-inherit-asexual hidden>
            <h3>One parent makes a clone</h3>
            <p>A runner grows into a new plant. It usually copies the parent’s <b>Pp</b> genotype.</p>
            <label class="lab-switch"><input type="checkbox" data-inherit-mutation> Model a mutation from <b>P</b> to <b>p</b></label>
            <p class="lab-note">A mutation is a change in DNA. This switch shows one possible example.</p>
          </div>
          <fieldset class="lab-environment">
            <legend>Water available to the offspring</legend>
            <div class="lab-tabs">
              ${Object.entries(environmentOptions).map(([value, option]) => `<button type="button" data-inherit-environment="${value}" aria-pressed="${value === 'ample'}">${option.label}</button>`).join('')}
            </div>
          </fieldset>
        </div>
        <div class="lab-panel lab-visual-panel">
          <div class="lab-illustration" data-plant-diagram data-petal="purple" data-water="ample">${flower()}</div>
          <div class="lab-plant-results" aria-live="polite" aria-atomic="true">
            <div><p class="lab-kicker">Genotype</p><strong data-inherit-genotype></strong></div>
            <div><p class="lab-kicker">Phenotype</p><strong data-inherit-phenotype></strong></div>
          </div>
          <p class="lab-note">Fictional plant model. One <b>P</b> allele is enough for purple petals. Only height responds to water in this model.</p>
        </div>
      </div>
      <div class="lab-question lab-inherit-question">
        <p class="lab-kicker">Pause and think</p>
        <p>Can the same genotype give different phenotypes? Can different genotypes give the same petal color?</p>
      </div>
      <p class="lab-source"><a href="https://www.genome.gov/genetics-glossary/genotype" target="_blank" rel="noopener">NHGRI · Genotype</a><a href="https://www.genome.gov/genetics-glossary/Phenotype" target="_blank" rel="noopener">NHGRI · Phenotype</a><a href="https://openstax.org/books/biology-2e/pages/11-2-sexual-reproduction" target="_blank" rel="noopener">OpenStax · Sexual reproduction</a></p>
    </section>`;

  const diagram = root.querySelector('[data-plant-diagram]');
  const svgDescription = root.querySelector('#lab-plant-desc');
  const modeButtons = root.querySelectorAll('[data-inherit-mode]');
  const pairButtons = root.querySelectorAll('[data-inherit-pair]');
  const environmentButtons = root.querySelectorAll('[data-inherit-environment]');
  const sexualPanel = root.querySelector('[data-inherit-sexual]');
  const asexualPanel = root.querySelector('[data-inherit-asexual]');
  const mutation = root.querySelector('[data-inherit-mutation]');
  const genotypeOutput = root.querySelector('[data-inherit-genotype]');
  const phenotypeOutput = root.querySelector('[data-inherit-phenotype]');
  let mode = 'sexual';
  let cross = 1;
  let environment = 'ample';

  function render() {
    const genotype = mode === 'sexual' ? genotypeOf(alleleOptions[cross]) : (mutation.checked ? 'pp' : 'Pp');
    const petal = genotype.includes('P') ? 'purple' : 'cream';
    const phenotype = `${petal === 'purple' ? 'Purple' : 'Cream'} petals · ${environmentOptions[environment].trait.toLowerCase()}`;

    diagram.dataset.petal = petal;
    diagram.dataset.water = environment;
    svgDescription.textContent = `Offspring with genotype ${genotype}. ${phenotype}.`;
    genotypeOutput.textContent = genotype;
    phenotypeOutput.textContent = phenotype;
    sexualPanel.hidden = mode !== 'sexual';
    asexualPanel.hidden = mode !== 'asexual';
    modeButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.inheritMode === mode));
    pairButtons.forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.inheritPair) === cross));
    environmentButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.inheritEnvironment === environment));
  }

  modeButtons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.inheritMode;
    render();
  }));
  pairButtons.forEach(button => button.addEventListener('click', () => {
    cross = Number(button.dataset.inheritPair);
    render();
  }));
  environmentButtons.forEach(button => button.addEventListener('click', () => {
    environment = button.dataset.inheritEnvironment;
    render();
  }));
  mutation.addEventListener('change', render);
  render();
}
