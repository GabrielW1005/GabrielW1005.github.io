import {mathHTML, escapeHTML} from './math-format.js?v=answer-entry-1';

// Keep the value as plain text: the checker, saved work, and visual lab all use it.
export function answerKind(problem = {}) {
  const family = String(problem.family || '');
  if (problem.input === 'plot' || family === 'coordinate-read') return 'coordinates';
  if (family.startsWith('inequality-')) return 'inequality';
  if (/^(combine-terms|expand|factor|expression-|equation-arithmetic|percent-expression|proportion-equation)/.test(family)) return 'expression';
  if (/sequence/.test(family) && /rule|nth|n-th|formula|in terms of n/i.test(problem.prompt || '')) return 'expression';
  if (/sequence|order-rational|absolute-opposite|fraction-decimal-percent|proportion-table|scale-length|net-faces/.test(family) || family === 'circle-reverse') return 'list';
  if (problem.input === 'text') return 'words';
  return 'number';
}

const HELP = {
  number: 'Negative numbers, decimals, and fractions are accepted. Use / for a fraction; use a space in a mixed number.',
  coordinates: 'Enter each point as (x, y). Separate points with a semicolon. Each coordinate may be negative or a fraction. You can also plot in the visual lab.',
  inequality: 'Include the variable and inequality sign. You may type <= and >= instead of ≤ and ≥.',
  expression: 'Type the expression, equation, or explanation requested. Use * or × to multiply, / for fractions, and ^ for powers.',
  list: 'Separate values with commas or semicolons, in the requested order. Values may be negative, decimal, or fractional.',
  words: 'Type words, a short explanation, or mathematical notation as requested. The math keys can help with symbols.'
};
const PLACEHOLDER = {
  number: 'Number or fraction', coordinates: '(x, y); (x, y)', inequality: 'Variable and inequality',
  expression: 'Expression or explanation', list: 'Values in order', words: 'Your answer or explanation'
};
const EXTRA_KEYS = {
  number: ['+', '×', '÷', '%'], coordinates: [',', ';'], inequality: ['x', '<', '>', '≤', '≥', '='],
  expression: ['x', 'y', 'n', '+', '×', '÷', '=', '^', '²', ',', ';', '%'],
  list: [',', ';', '%', '='], words: ['x', '+', '×', '÷', '=', '<', '>', '≤', '≥', ',', ';', '^']
};
const KEY_LABELS = {'−':'Negative sign','/':'Fraction slash','.':'Decimal point','(':'Open parenthesis',')':'Close parenthesis','⌫':'Delete previous character',',':'Comma',';':'Separate answers','×':'Multiply','÷':'Divide','≤':'Less than or equal to','≥':'Greater than or equal to','<':'Less than','>':'Greater than','^':'Power','²':'Squared','=':'Equals','%':'Percent'};
const INSERT = {'−':'-', '×':'*', '÷':'/', '²':'^2'};
const idFor = key => `answer-entry-${Array.from(String(key)).map(c => /[a-z0-9_-]/i.test(c) ? c : `_${c.codePointAt(0).toString(16)}_`).join('')}`;
function keyHTML(key) {
  if (key === '⌫') return `<button type="button" class="answer-key" data-entry-delete aria-label="${KEY_LABELS[key]}">${key}</button>`;
  return `<button type="button" class="answer-key" data-entry-insert="${escapeHTML(INSERT[key] || key)}" aria-label="${escapeHTML(KEY_LABELS[key] || key)}">${escapeHTML(key)}</button>`;
}

export function answerEntryHTML(problem, value = '', result = null) {
  const key = String(problem.key ?? problem.id ?? ''), id = idFor(key), kind = answerKind(problem);
  const displayNumber = problem.displayNumber ?? problem.block?.number ?? key;
  const number = problem.originalKey ? `${displayNumber} · extra` : displayNumber;
  const preview = previewMarkup(value);
  const fractionBuilder = `<div class="entry-builder"><span class="entry-builder-title">Build a fraction</span><div class="entry-builder-fields"><label><span>Whole (optional)</span><input type="text" class="entry-piece" data-entry-whole inputmode="text" autocomplete="off" aria-label="Whole number for fraction, optional"></label><label><span>Numerator</span><input type="text" class="entry-piece" data-entry-numerator inputmode="text" autocomplete="off" aria-label="Fraction numerator"></label><label><span>Denominator</span><input type="text" class="entry-piece" data-entry-denominator inputmode="text" autocomplete="off" aria-label="Fraction denominator"></label></div><button type="button" class="entry-insert" data-entry-fraction>Insert fraction</button></div>`;
  const pointBuilder = kind === 'coordinates' ? `<div class="entry-builder"><span class="entry-builder-title">Build a point</span><div class="entry-builder-fields entry-point-fields"><label><span>x</span><input type="text" class="entry-piece" data-entry-x autocomplete="off" aria-label="Point x coordinate"></label><label><span>y</span><input type="text" class="entry-piece" data-entry-y autocomplete="off" aria-label="Point y coordinate"></label></div><button type="button" class="entry-insert" data-entry-point>Insert point</button></div>` : '';
  return `<div class="answer-entry" data-entry-kind="${kind}" data-entry-key="${escapeHTML(key)}"><label class="answer-field" for="${id}"><span class="sr-only">Answer for problem ${escapeHTML(number)}</span><input id="${id}" type="text" class="answer-input ${result?.correct ? 'correct' : ''}" data-key="${escapeHTML(key)}" placeholder="${PLACEHOLDER[kind]}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="${id}-hint" value="${escapeHTML(value)}"></label><div class="answer-preview math-copy" aria-hidden="true" ${preview ? '' : 'hidden'}>${preview ? `<span class="answer-preview-label">You entered</span>${preview}` : ''}</div><details class="answer-tools"><summary>Math keys & answer format</summary><p class="answer-format-hint" id="${id}-hint">${HELP[kind]}</p><div class="entry-keypad" aria-label="Math keys">${['7','8','9','−','4','5','6','/','1','2','3','.','0','(',')','⌫'].map(keyHTML).join('')}</div><div class="entry-symbols">${EXTRA_KEYS[kind].map(keyHTML).join('')}</div>${fractionBuilder}${pointBuilder}<p class="entry-message" role="status" aria-live="polite"></p></details></div>`;
}

export function buildFraction(wholeValue, numeratorValue, denominatorValue) {
  const normalize = value => String(value ?? '').trim().replace(/−/g, '-');
  const whole = normalize(wholeValue), numerator = normalize(numeratorValue), denominator = normalize(denominatorValue);
  if (!/^[+-]?\d+$/.test(numerator) || !/^[+-]?\d+$/.test(denominator)) throw new Error('Enter whole numbers for the numerator and denominator.');
  if (Number(denominator) === 0) throw new Error('The denominator cannot be zero.');
  if (whole) {
    if (!/^[+-]?\d+$/.test(whole)) throw new Error('Enter a whole number, or leave Whole blank.');
    if (+numerator < 0 || +denominator < 0) throw new Error('For a mixed number, put the negative sign on Whole; use a positive numerator and denominator.');
    return `${whole} ${numerator}/${denominator}`;
  }
  return `${numerator}/${denominator}`;
}
export function coordinateValue(value) {
  const raw = String(value ?? '').trim().replace(/−/g, '-');
  const scalar = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  const fraction = /^[+-]?\d+\s*\/\s*[+-]?\d+$/;
  const mixed = /^[+-]?\d+\s+\d+\s*\/\s*\d+$/;
  if (!scalar.test(raw) && !fraction.test(raw) && !mixed.test(raw)) throw new Error('Use a number or fraction for each coordinate.');
  if (raw.includes('/') && Number(raw.split('/').at(-1)) === 0) throw new Error('A coordinate fraction cannot have a zero denominator.');
  return raw.replace(/\s*\/\s*/g, '/');
}
export function previewMarkup(value) {
  const text = String(value ?? '').trim();
  if (!text || /[a-z]{2,}/i.test(text) || !/[\/^²³≤≥]|[<>]=/.test(text)) return '';
  return mathHTML(text.replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠').replace(/\*/g, '×'));
}
export function updateAnswerPreview(input) {
  const output = input.closest('.answer-entry')?.querySelector('.answer-preview');
  if (!output) return;
  const html = previewMarkup(input.value);
  output.hidden = !html;
  output.innerHTML = html ? `<span class="answer-preview-label">You entered</span>${html}` : '';
}

/** Delegated binding survives packet/lab rerenders. Call once for the app root. */
export function bindAnswerEntry(root = document) {
  const selections = new WeakMap();
  const activeFields = new WeakMap();
  const remember = input => {
    if (input?.matches?.('.answer-input, .entry-piece')) selections.set(input, {start:input.selectionStart ?? input.value.length, end:input.selectionEnd ?? input.value.length});
  };
  const rememberEvent = event => remember(event.target);
  const onFocus = event => {
    const entry = event.target.closest?.('.answer-entry');
    if (entry && event.target.matches?.('.answer-input, .entry-piece')) activeFields.set(entry, event.target);
  };
  const onInput = event => {
    remember(event.target);
    if (event.target.matches?.('.answer-input')) updateAnswerPreview(event.target);
  };
  const onPointer = event => {
    if (event.target.closest?.('[data-entry-insert], [data-entry-delete]')) event.preventDefault();
  };
  function insert(input, text, deletion = false) {
    const saved = selections.get(input) || {start:input.value.length, end:input.value.length};
    let start = Math.min(input.value.length, saved.start), end = Math.min(input.value.length, saved.end);
    if (deletion && start === end) start = Math.max(0, start - 1);
    input.focus({preventScroll:true});
    input.setRangeText(deletion ? '' : text, start, end, 'end');
    remember(input);
    input.dispatchEvent(new Event('input', {bubbles:true}));
  }
  const onClick = event => {
    const button = event.target.closest?.('[data-entry-insert], [data-entry-delete], [data-entry-fraction], [data-entry-point]');
    if (!button || !root.contains(button)) return;
    const entry = button.closest('.answer-entry'), input = entry?.querySelector('.answer-input'), status = entry?.querySelector('.entry-message');
    if (!input || input.disabled || input.readOnly) return;
    event.preventDefault();
    try {
      let text;
      if (button.hasAttribute('data-entry-fraction')) {
        text = buildFraction(entry.querySelector('[data-entry-whole]').value, entry.querySelector('[data-entry-numerator]').value, entry.querySelector('[data-entry-denominator]').value);
      } else if (button.hasAttribute('data-entry-point')) {
        const x = coordinateValue(entry.querySelector('[data-entry-x]').value), y = coordinateValue(entry.querySelector('[data-entry-y]').value);
        const cursor = selections.get(input)?.start ?? input.value.length;
        const prefix = cursor === input.value.length && /\)\s*$/.test(input.value) ? '; ' : '';
        text = `${prefix}(${x}, ${y})`;
      } else text = button.getAttribute('data-entry-insert') || '';
      const active = activeFields.get(entry);
      const target = !button.hasAttribute('data-entry-fraction') && !button.hasAttribute('data-entry-point') && active?.isConnected && active.closest('.answer-entry') === entry ? active : input;
      insert(target, text, button.hasAttribute('data-entry-delete'));
      if (status) status.textContent = button.hasAttribute('data-entry-fraction') ? 'Fraction inserted.' : button.hasAttribute('data-entry-point') ? 'Point inserted.' : '';
    } catch (error) { if (status) status.textContent = error.message; }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('focusin', onFocus);
  root.addEventListener('select', rememberEvent, true);
  root.addEventListener('keyup', rememberEvent);
  root.addEventListener('focusout', rememberEvent);
  root.addEventListener('pointerdown', onPointer);
  root.addEventListener('click', rememberEvent);
  root.addEventListener('click', onClick);
  root.querySelectorAll('.answer-input').forEach(updateAnswerPreview);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('select', rememberEvent, true);
    root.removeEventListener('keyup', rememberEvent);
    root.removeEventListener('focusout', rememberEvent);
    root.removeEventListener('pointerdown', onPointer);
    root.removeEventListener('click', rememberEvent);
    root.removeEventListener('click', onClick);
  };
}
