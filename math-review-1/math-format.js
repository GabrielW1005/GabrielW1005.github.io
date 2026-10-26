// Native, local typesetting for the packet's plain-text mathematics.
// Sources remain plain Unicode for answer checking and interactive models.
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SUPER={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'−','⁺':'+'};
export function mathHTML(value){
  let source=String(value??''),saved=[];
  const token=html=>{const n=saved.push(html)-1;return `\uE000${n}\uE001`;};
  const frac=(a,b)=>token(`<span class="math-frac" role="math" aria-label="${escapeHTML(a)} divided by ${escapeHTML(b)}"><span>${escapeHTML(a)}</span><span>${escapeHTML(b)}</span></span>`);
  source=source.replace(/\\\(|\\\)|\\\[|\\\]/g,'').replace(/\\(?:left|right)/g,'').replace(/\\times/g,'×').replace(/\\div/g,'÷').replace(/\\cdot/g,'·').replace(/\\pi/g,'π').replace(/\\leq?/g,'≤').replace(/\\geq?/g,'≥').replace(/\\neq/g,'≠').replace(/\\%/g,'%');
  source=source.replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g,(_,a,b)=>frac(a,b));
  source=source.replace(/(^|[^\w.])([−-]?(?:\d+(?:\.\d+)?|[a-z]))\s*\/\s*\(([^()]+)\)/gi,(_,lead,a,b)=>lead+frac(a,b));
  // A numerical denominator distinguishes exercise fractions from prose units (mi/h).
  source=source.replace(/(^|[^\w.])([−-]?(?:\d+(?:\.\d+)?|[a-z]))\s*\/\s*([−-]?\d+(?:\.\d+)?)(?!\d|\.\d)/gi,(_,lead,a,b)=>lead+frac(a,b));
  source=source.replace(/(^|[^\w.])([−-]?(?:\d+(?:\.\d+)?|[xyn]))\s*\/\s*([xyn])(?!\w)/gi,(_,lead,a,b)=>lead+frac(a,b));
  source=source.replace(/\^\(([^()]*)\)/g,(_,x)=>token(`<sup>${escapeHTML(x)}</sup>`));
  source=source.replace(/\^\{([^{}]+)\}|\^([−-]?\d+|[a-z])/gi,(_,a,b)=>token(`<sup>${escapeHTML(a??b)}</sup>`));
  source=source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,s=>token(`<sup>${[...s].map(c=>SUPER[c]).join('')}</sup>`));
  return escapeHTML(source).replace(/\uE000(\d+)\uE001/g,(_,i)=>saved[+i]).replace(/\n/g,'<br>');
}
