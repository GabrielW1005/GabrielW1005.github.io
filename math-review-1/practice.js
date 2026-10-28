/* Deterministic, independent problem generation. No source text is numerically patched. */
const vulgarFractions={'½':'1/2','⅓':'1/3','⅔':'2/3','¼':'1/4','¾':'3/4','⅕':'1/5','⅖':'2/5','⅗':'3/5','⅘':'4/5','⅙':'1/6','⅚':'5/6','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'};
const clean = s => String(s ?? '').replaceAll('−','-').replaceAll('–','-').replaceAll('×','*').replaceAll('÷','/').replaceAll('⁄','/').replaceAll('\u00a0',' ').replace(/([0-9]?)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g,(_,whole,f)=>`${whole}${whole?' ':''}${vulgarFractions[f]}`).trim();
const gcd = (a,b) => b ? gcd(b,a%b) : Math.abs(a)||1;
const frac = (n,d=1) => { if(d===0) throw Error('Zero denominator'); const g=gcd(Math.round(n),Math.round(d)),sg=d<0?-1:1;return {n:sg*n/g,d:sg*d/g}; };
const fs = f => f.d===1 ? String(f.n) : `${f.n}/${f.d}`;
const add = (a,b) => frac(a.n*b.d+b.n*a.d,a.d*b.d);
const mul = (a,b) => frac(a.n*b.n,a.d*b.d);
const num = f => f.n/f.d;
const rnd = (n,d=2) => Math.round((n+Number.EPSILON)*10**d)/10**d;
function rng(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function chooser(seed){const r=rng(seed);return {int:(a,b)=>Math.floor(r()*(b-a+1))+a,pick:a=>a[Math.floor(r()*a.length)],bool:()=>r()<.5};}
function rationalText(n){for(let d=1;d<=1000;d++)if(Math.abs(n*d-Math.round(n*d))<1e-7)return fs(frac(Math.round(n*d),d));return String(rnd(n,6));}
const coefficientText=s=>String(s).includes('/')?`(${s})`:s;
function signed(n){return n<0?`(${n})`:String(n);}
function polygon(points,labels=[],extra={}){return {type:'polygon',points,labels,unit:'cm',...extra};}
function rect(w,h,unit='cm'){return polygon([[0,0],[w,0],[w,h],[0,h]],[{text:`${w} ${unit}`,x:w/2,y:-.6},{text:`${h} ${unit}`,x:w+.6,y:h/2}],{unit});}
function area(points){return Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
function perimeter(points){return points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+Math.hypot(q[0]-p[0],q[1]-p[1]);},0);}
function eqPrompt(t){return `Solve: ${t}`;}

function finish(source,seed,family,fields){
  const originalKey=source.originalKey||source.key||`${source.block?.id||''}${source.id||''}`;
  const result={...source,...fields,key:`practice-${originalKey}-${seed}`,originalKey,isPractice:true,family,unit:fields.unit||'',accept:fields.accept||[],input:fields.input||(typeof fields.value==='number'||Array.isArray(fields.value)?'number':'text')};
  result.block={...(source.block||{}),prompt:'',stage:fields.stage||source.block?.stage||'More practice'};
  // A generated prompt must not inherit a rendered formula or validation expression
  // belonging to its prototype. Preserve sourceKey, but recompute all math content.
  for(const key of ['promptMath','answerMath','checkExpression','equation','requiredFactor'])if(!(key in fields))delete result[key];
  if(!result.steps?.length)throw Error(`Missing steps for ${family}`);
  return result;
}
function identify(p){
  if(p.family)return p.family;
  const t=clean(`${p.block?.title||p.blockTitle||p.category||''} ${p.prompt}`).toLowerCase();
  const v=p.visual;
  if(v?.type==='grid')return /proportion|y\s*=|graph.*equation/.test(t)?'proportion-graph':'plot';
  if(v?.type==='circle')return /derive|explain|rearrang/.test(t)?'circle-explain':/diameter/.test(t)&&/circumference.*given|given.*circumference|from.*circumference/.test(t)?'circle-reverse':/circumference/.test(t)&&!/area/.test(t)?'circle-circumference':/radius|diameter/.test(t)&&!/area/.test(t)?'circle-radius-diameter':'circle-area';
  if(v?.type==='angle')return /vertical/.test(t)?'angle-vertical':/complement|90/.test(t)?'angle-complement':'angle-supplement';
  if(/cross.section|slice/.test(t))return 'cross-section';
  if(/construct|unique triangle|how many triangles/.test(t))return 'triangle-construct';
  if(/triangle.*possible|inequality theorem|can.*triangle|form.*triangle/.test(t))return 'triangle-possible';
  if(/scale|similar/.test(t))return 'scale';
  if(/pyramid/.test(t)||v?.type==='pyramid')return 'pyramid-surface';
  if(/surface|net|lateral/.test(t)||v?.type==='net')return /triangular/.test(t)?'triangular-surface':'rectangular-surface';
  if(/volume/.test(t)||v?.type==='prism')return /triangular/.test(t)?'triangular-volume':/composite|irregular/.test(t)?'composite-volume':'rectangular-volume';
  if(/parallelogram/.test(t))return 'area-parallelogram';
  if(/trapezoid/.test(t))return 'area-trapezoid';
  if(/composite|irregular/.test(t)&&v)return 'area-composite';
  if(/perimeter/.test(t))return 'perimeter';
  if(v?.type==='polygon')return v.points?.length===3?'area-triangle':'area-rectangle';
  if(/percent.*error|error.*percent/.test(t))return 'percent-error';
  if(/interest/.test(t))return 'simple-interest';
  if(/percent.*change|increase|decrease|discount|markup|tax|tip|commission|fee/.test(t))return 'percent-change';
  if(/percent|%/.test(t))return 'percent';
  if(/unit rate|per hour|per item|rate/.test(t))return 'unit-rate';
  if(/proportion|constant.*proportional|y\s*=/.test(t))return 'proportion-table';
  if(/geometric|common ratio/.test(t))return 'geometric-sequence';
  if(/sequence|arithmetic|common difference/.test(t))return 'arithmetic-sequence';
  if(/inequal|[<>≤≥]/.test(t))return 'inequality';
  if(/equation|solve/.test(t)&&/=/ .test(t))return /multi|distribut|\(/.test(t)?'equation-multi':/two.step/.test(t)?'equation-two':'equation-one';
  if(/factor/.test(t))return 'factor';
  if(/expand|distribut/.test(t))return 'expand';
  if(/like terms|simplify.*x|expression.*x/.test(t))return 'combine-terms';
  if(/absolute|distance|opposite/.test(t))return 'absolute';
  if(/order|mixed|combine|three skills|two skills/.test(t))return 'mixed-order';
  if(/convert|decimal form|terminat|repeat/.test(t))return 'convert';
  if(/fraction/.test(t)||/\d\s*\/\s*\d/.test(t))return /divide|÷/.test(p.prompt)?'fraction-divide':/multiply|×/.test(p.prompt)?'fraction-multiply':'fraction-add';
  if(/decimal/.test(t)||/\d\.\d/.test(t))return 'decimal';
  if(/compar|order.*number/.test(t))return 'compare';
  if(/multiply|×/.test(p.prompt))return 'integer-multiply';
  if(/divide|÷/.test(p.prompt))return 'integer-divide';
  if(/subtract/.test(t))return 'integer-subtract';
  return 'integer-add';
}

const aliases={
 'number-distance':'absolute','decimal-operations':'decimal','order-operations':'mixed-order','signed-order':'mixed-order','fraction-order':'mixed-order',
 'signed-fraction-add':'fraction-add','signed-fraction-subtract':'fraction-subtract','signed-fraction-multiply':'fraction-multiply','signed-fraction-divide':'fraction-divide','like-terms':'combine-terms','expression-subtract':'combine-terms','expression-expand-combine':'expand',
 'decimal-add':'decimal','decimal-subtract':'decimal','decimal-multiply':'decimal','decimal-divide':'decimal','terminating-decimal':'convert',
 'equation-add':'equation-one','equation-subtract':'equation-one','equation-multiply':'equation-one','equation-divide':'equation-one','equation-arithmetic':'equation-two',
 'inequality-add':'inequality','inequality-multiply':'inequality','inequality-two':'inequality','coordinate-plot':'plot','proportion-plot':'proportion-graph',
 'percent-of':'percent','tip':'percent','angle-opposite':'angle-vertical','triangle-inequality':'triangle-possible','triangle-construction':'triangle-construct',
 'scale-area':'scale','perimeter-rectangle':'perimeter','circle-radius':'circle-radius-diameter','circle-diameter':'circle-radius-diameter',
 'prism-volume':'rectangular-volume','triangle-prism-volume':'triangular-volume','composite-prism-volume':'composite-volume',
 'prism-surface':'rectangular-surface','triangle-prism-surface':'triangular-surface'
};
const difficultyFamilies=new Set(['integer-add','integer-subtract','integer-multiply','integer-divide','fraction-add','fraction-subtract','fraction-multiply','fraction-divide','signed-fraction-add','signed-fraction-subtract','signed-fraction-multiply','signed-fraction-divide','decimal','decimal-operations','decimal-add','decimal-subtract','decimal-multiply','decimal-divide','order-operations','signed-order','fraction-order','mixed-order']);
export const supportsDifficulty=problem=>difficultyFamilies.has(identify(problem));
function scaledVisual(source,k){
  const v=JSON.parse(JSON.stringify(source)),vec=a=>a.map(n=>rnd(n*k,12)),pts=a=>a.map(vec);
  const measure=s=>String(s).replace(/\d+(?:\.\d+)?/g,n=>String(rnd(+n*k,6)));
  for(const p of ['r','width','length','height','slant','depth'])if(typeof v[p]==='number')v[p]=rnd(v[p]*k,12);
  if(v.base)v.base=pts(v.base);if(v.points&&Array.isArray(v.points[0]))v.points=pts(v.points);
  if(v.vertices3D)v.vertices3D=pts(v.vertices3D);
  for(const p of ['labels','pointLabels'])for(const l of v[p]||[]){if(typeof l.x==='number')l.x*=k;if(typeof l.y==='number')l.y*=k;if(l.text&&!l.text.includes('°'))l.text=measure(l.text);}
  for(const l of v.labels3D||[]){if(l.point)l.point=vec(l.point);l.text=measure(l.text);}
  if(v.baseLabels)v.baseLabels=v.baseLabels.map(s=>s==null?s:measure(s));
  if(v.depthLabel)v.depthLabel=measure(v.depthLabel);
  for(const p of ['segments','segments3D'])for(const s of v[p]||[]){s.from=vec(s.from);s.to=vec(s.to);if(s.labelPosition)s.labelPosition=vec(s.labelPosition);if(s.label)s.label=measure(s.label);}
  if(v.highlight?.points)v.highlight.points=pts(v.highlight.points);
  if(v.type==='net')for(const f of v.faces){f.points=pts(f.points);}
  if(v.caption)v.caption=measure(v.caption);
  if(v.label)v.label=measure(v.label);
  return v;
}
function relabelUnit(v,unit){
  const old=v.unit||'cm';v.unit=unit;
  const replace=s=>typeof s==='string'?s.replace(new RegExp(`\\b${old}\\b`,'g'),unit):s;
  for(const key of ['label','caption','depthLabel','radiusLabel','diameterLabel'])if(v[key])v[key]=replace(v[key]);
  if(v.baseLabels)v.baseLabels=v.baseLabels.map(replace);
  for(const key of ['labels','pointLabels','labels3D','segments','segments3D'])for(const l of v[key]||[]){if(l.text)l.text=replace(l.text);if(l.label)l.label=replace(l.label);}
  return v;
}
function triangleArea3(a,b,c){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;}
function specialized(p,seed,R,F,level,unit){
  const f=identify(p),I=R.int,P=R.pick;
  if(f==='measure-unit'){
    const length=I(2,25),u=P(['cm','m','in']),segments=[{from:[0,0],to:[length,0]},...Array.from({length:length+1},(_,i)=>({from:[i,-.14],to:[i,.14]}))];
    return F(f,{prompt:`Each interval is 1 ${u}. Find the segment length.`,value:length,answer:`${length} ${u}`,unit:u,steps:[`Count the ${length} intervals between the two endpoints.`,`Length = ${length} × 1 = ${length} ${u}.`],visual:{type:'segments',segments,unit:u,measureLength:length}});
  }
  if(f==='area-count'){
    const w=I(2,8),h=I(2,6),u=P(['cm','m','in']),segments=[...Array.from({length:w-1},(_,i)=>({from:[i+1,0],to:[i+1,h]})),...Array.from({length:h-1},(_,i)=>({from:[0,i+1],to:[w,i+1]}))];
    return F(f,{prompt:`Each small square is 1 ${u}². Find the area.`,value:w*h,answer:`${w*h} ${u}²`,unit:`${u}²`,steps:[`There are ${h} rows of ${w} unit squares.`,`Area = ${h} × ${w} = ${w*h} ${u}².`],visual:polygon([[0,0],[w,0],[w,h],[0,h]],[],{width:w,height:h,segments,unit:u})});
  }
  if(f==='order-rational'){
    const vals=[-I(11,29)/10,num(frac(-I(1,5),8)),num(frac(I(1,7),8))],shuffled=[vals[1],vals[2],vals[0]];
    return F(f,{prompt:`Order least to greatest: ${shuffled.join(', ')}.`,value:vals,answer:vals.join(', '),steps:['Compare locations on the number line. Negative values come before positive values.',`From left to right: ${vals.join(', ')}.`],visual:null});
  }
  if(f==='absolute-opposite'){
    const a=rnd((R.bool()?-1:1)*I(1,120)/P([1,2,4,5,10]),6),absolute=Math.abs(a);return F(f,{prompt:`Find the opposite of ${a}; then |${a}|.`,value:[-a,absolute],answer:`${-a}; ${absolute}`,steps:[`The opposite is equally far from 0 on the other side: ${-a}.`,`Absolute value is distance from 0: |${a}| = ${absolute}.`],visual:null});
  }
  if(f==='zero-division'){
    const a=(R.bool()?-1:1)*I(2,150);return F(f,{prompt:`${a} ÷ 0`,value:null,answer:'undefined',accept:['not defined','undefined'],steps:[`Division asks for a number x with 0 × x = ${a}.`,`No such number exists. Division by 0 is undefined.`],visual:null});
  }
  if(f==='fraction-decimal-percent'){
    const denominator=P([4,5,8,10,20,25,40,50,100]),q=frac(I(1,denominator-1),denominator),v=num(q),pc=rnd(v*100,3);
    if(/write\s+[\d.]+%/i.test(p.prompt||''))return F(f,{prompt:`Write ${pc}% as a decimal and a simplified fraction.`,value:[v,v],answer:`${v}; ${fs(q)}`,steps:[`Divide by 100: ${pc}% = ${v}.`,`Write ${v} as ${Math.round(v*1000)}/1000 and simplify to ${fs(q)}.`],visual:null});
    if(/write\s+\d+\s*\//i.test(p.prompt||''))return F(f,{prompt:`Write ${fs(q)} as a decimal and a percent.`,value:[v,pc],answer:`${v}; ${pc}%`,steps:[`Divide: ${q.n} ÷ ${q.d} = ${v}.`,`Multiply by 100: ${v} × 100 = ${pc}%.`],visual:null});
    return F(f,{prompt:`Write ${v} as a simplified fraction and a percent.`,value:[v,pc],answer:`${fs(q)}; ${pc}%`,steps:[`Write ${v} as ${Math.round(v*1000)}/1000 and simplify to ${fs(q)}.`,`Multiply by 100: ${v} × 100 = ${pc}%.`],visual:null});
  }
  if(f==='repeating-decimal'){
    const n=I(1,98),cycle=String(n).padStart(2,'0');return F(f,{prompt:`Divide ${n} by 99. Terminating or repeating?`,value:null,answer:`0.${cycle}${cycle}${cycle}…; repeating`,accept:[`0.(${cycle}); repeating`,`0.${cycle} repeating`,`0.${cycle}${cycle}${cycle} repeating`,`0.${cycle}${cycle}${cycle}...; repeating`,`0.${cycle}... repeating`],steps:[`Long division returns to the same remainder after the two-digit cycle ${cycle}.`,`The digits ${cycle} repeat forever: 0.${cycle}${cycle}${cycle}… .`],visual:null});
  }
  if(f==='percent-expression'){
    const pc=I(1,95),multiplier=rnd(1+pc/100,2);return F(f,{prompt:`p + ${pc/100}p = ___p. This is an increase of ___%.`,value:[multiplier,pc],answer:`${multiplier}; ${pc}%`,steps:[`Combine coefficients: 1 + ${pc/100} = ${multiplier}.`,`The extra ${pc/100} of the original is ${pc}%.`],visual:null});
  }
  if(f==='fraction-order'){
    const a=frac(I(1,5),P([3,4,5,6])),b=frac(I(1,4),P([3,5,6])),c=frac(I(1,4),P([6,8,9]));
    let prompt,total,steps;
    if(/[²³^]/.test(p.prompt||'')){
      const square=mul(b,b);total=add(a,square);prompt=`${fs(a)} + (${fs(b)})²`;steps=[`Evaluate the power: (${fs(b)})² = ${fs(square)}.`,`Add with a common denominator: ${fs(a)} + ${fs(square)} = ${fs(total)}.`];
    }else if(/[(]/.test(p.prompt||'')){
      const sum=add(a,b);total=mul(sum,c);prompt=`(${fs(a)} + ${fs(b)}) × ${fs(c)}`;steps=[`Parentheses first: ${fs(a)} + ${fs(b)} = ${fs(sum)}.`,`Multiply: ${fs(sum)} × ${fs(c)} = ${fs(total)}.`];
    }else if(/[÷]/.test(p.prompt||'')){
      const k=I(2,5),dividend=mul(a,frac(k));total=add(frac(k),frac(-c.n,c.d));prompt=`${fs(dividend)} ÷ ${fs(a)} − ${fs(c)}`;steps=[`Divide by multiplying by the reciprocal: ${fs(dividend)} × ${fs(frac(a.d,a.n))} = ${k}.`,`Subtract: ${k} − ${fs(c)} = ${fs(total)}.`];
    }else{
      const k=I(2,5),prod=mul(frac(k),c);total=add(a,prod);prompt=`${fs(a)} + ${k} × ${fs(c)}`;steps=[`Multiply first: ${k} × ${fs(c)} = ${fs(prod)}.`,`Add with a common denominator: ${fs(a)} + ${fs(prod)} = ${fs(total)}.`];
    }
    return F(f,{prompt,value:num(total),answer:fs(total),steps,visual:null,stage:'Two skills'});
  }
  if(f==='expression-subtract'){
    const a=I(4,9),b=I(2,9),c=I(1,a-1),d=I(2,8),answer=`${a-c}x + ${b+d}`;
    return F(f,{prompt:`Simplify: (${a}x + ${b}) − (${c}x − ${d})`,value:null,answer,input:'text',algebraic:true,steps:[`Subtract both terms in the second parentheses: ${a}x + ${b} − ${c}x + ${d}.`,`Combine: (${a} − ${c})x + (${b} + ${d}) = ${answer}.`],visual:null});
  }
  if(f==='expression-equivalence'){
    const a=I(2,8),b=I(2,9),yes=R.bool(),constant=yes?a*b:b,answer=yes?'Yes':'No';
    return F(f,{prompt:`Are ${a}(x + ${b}) and ${a}x + ${constant} equivalent? Show why.`,value:null,answer:`${answer}; ${a}(x + ${b}) = ${a}x + ${a*b}.`,accept:[answer.toLowerCase()],freeResponse:true,input:'text',steps:[`Distribute ${a} to both terms: ${a}x + ${a*b}.`,yes?'Both expressions have the same coefficient and constant.':`The constants ${a*b} and ${constant} differ, so the expressions are not equivalent.`],visual:null});
  }
  if(f==='expression-expand-combine'){
    const a=I(2,6),b=I(2,7),c=I(1,5),answer=`${a+c}x − ${b}`;
    return F(f,{prompt:`Expand and simplify: (1/2)(${2*a}x − ${2*b}) + ${c}x`,value:null,answer,input:'text',algebraic:true,steps:[`Distribute 1/2: ${a}x − ${b} + ${c}x.`,`Combine variable terms: ${answer}.`],visual:null});
  }
  if(f==='equation-division-position'){
    const source=p.division||{},position=source.position||'numerator',orientation=source.orientation||'fraction-left';
    const fractionAnswer=source.answerKind==='fraction',decimal=source.numberKind==='decimal';
    let quotient,numerator,denominator;
    if(fractionAnswer){
      const d=P(decimal?[2,4,5,8,10]:[2,3,4,5,6,8]),a=I(1,19)*d+P(Array.from({length:d-1},(_,i)=>i+1)),x=frac(a,d);
      if(position==='quotient'){quotient=x;denominator=frac(d*I(1,9));numerator=mul(quotient,denominator);}
      else if(position==='numerator'){quotient=frac(a);denominator=frac(1,d);numerator=x;}
      else{denominator=x;quotient=frac(d*I(1,9));numerator=mul(quotient,denominator);}
    }else if(decimal){
      const x=frac(I(2,36));
      if(position==='quotient'){quotient=x;denominator=frac(I(3,39),10);numerator=mul(quotient,denominator);}
      else if(position==='numerator'){numerator=x;denominator=P([frac(1,2),frac(1,4),frac(5,4),frac(5,2)]);quotient=frac(numerator.n*denominator.d,numerator.d*denominator.n);}
      else{denominator=x;quotient=frac(I(3,49),10);numerator=mul(quotient,denominator);}
    }else{quotient=frac(I(2,24));denominator=frac(I(2,19));numerator=mul(quotient,denominator);}
    if(decimal){
      // Keep decimal prototypes visibly decimal without changing the unknown value.
      const known=()=>Object.entries({quotient,numerator,denominator}).filter(([key])=>key!==position).map(([,q])=>q);
      while(known().every(q=>q.d===1)){
        if(position==='quotient'){numerator=mul(numerator,frac(1,10));denominator=mul(denominator,frac(1,10));}
        else if(position==='numerator'){quotient=mul(quotient,frac(1,10));denominator=mul(denominator,frac(10));}
        else{numerator=mul(numerator,frac(1,10));quotient=mul(quotient,frac(1,10));}
      }
    }
    if(source.signed){
      // A negative numerator ensures that a sign remains visible whichever role is x.
      if(R.bool())quotient=frac(-quotient.n,quotient.d);else denominator=frac(-denominator.n,denominator.d);
      numerator=mul(quotient,denominator);
    }
    const parts={quotient,numerator,denominator},solution=parts[position];
    const numeric=q=>decimal?String(rnd(num(q),8)):fs(q),knownText=key=>numeric(parts[key]);
    const token=key=>key===position?'x':knownText(key),divisor=token('denominator');
    const fraction=`${token('numerator')}/${divisor.startsWith('-')||divisor.includes('/')?`(${divisor})`:divisor}`;
    const equation=orientation==='fraction-left'?`${fraction} = ${token('quotient')}`:`${token('quotient')} = ${fraction}`;
    const q=knownText('quotient'),n=knownText('numerator'),d=knownText('denominator'),answer=fs(solution);
    let steps;
    if(position==='quotient')steps=[`Divide the numerator by the denominator: x = ${n} ÷ (${d}) = ${answer}.`];
    else if(position==='numerator')steps=[`Multiply both sides by ${d}.`,`x = (${q}) × (${d}) = ${answer}.`];
    else steps=[`Use dividend = quotient × divisor: ${n} = (${q})x.`,`Divide both sides by ${q}: x = ${n} ÷ (${q}) = ${answer}.`];
    steps.push(`Check: (${n}) ÷ (${d}) = ${q}.`);
    const division={...source,position,orientation,numberKind:decimal?'decimal':'integer',signed:!!source.signed,
      quotient:position==='quotient'?null:num(quotient),numerator:position==='numerator'?null:num(numerator),denominator:position==='denominator'?null:num(denominator)};
    return F(f,{prompt:`Solve for x: ${equation}`,equation,value:num(solution),answer:`x = ${answer}`,steps,visual:null,division});
  }
  if(f==='equation-arithmetic'){
    const x=I(3,15),a=I(2,8),b=I(1,9),rhs=a*x+b;
    return F(f,{prompt:`For ${a}x + ${b} = ${rhs}, write an arithmetic expression for x; then find x.`,value:x,answer:`(${rhs} − ${b}) ÷ ${a} = ${x}`,steps:[`Undo addition: subtract ${b} from ${rhs}.`,`Undo multiplication: divide by ${a}.`,`(${rhs} − ${b}) ÷ ${a} = ${x}.`],visual:null});
  }
  if(f==='inequality-add'||f==='inequality-multiply'||f==='inequality-two'){
    const source=clean(p.prompt||''),boundary=I(-7,10),symbol=P(['<','≤','>','≥']),negative=/[-−]/.test((p.prompt||'').split('x')[0]),divide=/x\s*\//.test(source);
    let a=f==='inequality-add'?1:(negative?-1:1)*I(2,6),b=f==='inequality-multiply'?0:I(-8,8)||3;
    if(divide)a=1/a;
    if(/\d+\.\d/.test(source)&&f!=='inequality-add'){a=(negative?-1:1)*P([.25,.5,.75]);b=I(1,8)/2;}
    const rhs=rnd(a*boundary+b,8),swap={'<':'>','>':'<','≤':'≥','≥':'≤'},solved=a<0?swap[symbol]:symbol;
    const left=f==='inequality-add'?`x ${b<0?'−':'+'} ${Math.abs(b)}`:divide?`x/(${rationalText(1/a)})${b?` ${b<0?'−':'+'} ${rationalText(Math.abs(b))}`:''}`:`${coefficientText(rationalText(a))}x${b?` ${b<0?'−':'+'} ${rationalText(Math.abs(b))}`:''}`;
    const boundaryCheck=/does\s+x|does.*work/i.test(p.prompt||''),works=solved==='≤'||solved==='≥',answer=`x ${solved} ${boundary}${boundaryCheck?`; ${works?'yes':'no'}`:''}`;
    const steps=[...(b?[`Subtract ${rationalText(b)} from both sides.`]:[]),...(a!==1?[`Divide by ${rationalText(a)}${a<0?'; reverse the inequality because the divisor is negative':''}.`]:[]),`x ${solved} ${boundary}. ${works?'Filled':'Open'} circle; shade ${solved.startsWith('<')||solved==='≤'?'left':'right'}.`,...(boundaryCheck?[`The boundary ${works?'is':'is not'} included, so x = ${boundary} ${works?'works':'does not work'}.`]:[])];
    return F(f,{prompt:`Solve and graph: ${left} ${symbol} ${rationalText(rhs)}.${boundaryCheck?` Does x = ${boundary} work?`:''}`,value:null,answer,steps,input:'text',visual:{type:'numberline',min:Math.min(-6,boundary-4),max:Math.max(6,boundary+4),step:1,solution:{boundary,direction:solved==='<'||solved==='≤'?'left':'right',closed:works}}});
  }
  if(f==='coordinate-plot'){
    const count=Math.max(1,Math.min(4,p.visual?.targets?.length||2)),pts=[];for(let j=0;j<count;j++){const target=p.visual?.targets?.[j];let x=I(1,12)*(target?.x<0?-1:1),y=I(1,12)*(target?.y<0?-1:1);if(target?.x===0)x=0;else if(target&&!Number.isInteger(target.x))x-=Math.sign(x)*.5;if(target?.y===0)y=0;else if(target&&!Number.isInteger(target.y))y-=Math.sign(y)*.5;pts.push({x,y,label:String.fromCharCode(65+j)});}
    const extent=Math.max(6,Math.ceil(Math.max(...pts.flatMap(q=>[Math.abs(q.x),Math.abs(q.y)])))+1);
    return F(f,{prompt:`Plot ${pts.map(q=>`${q.label}(${q.x}, ${q.y})`).join(' and ')}.`,value:pts.flatMap(q=>[q.x,q.y]),answer:pts.map(q=>`${q.label}(${q.x}, ${q.y})`).join('; '),input:'plot',steps:pts.map(q=>`${q.label}: move ${Math.abs(q.x)} ${q.x<0?'left':'right'} and ${Math.abs(q.y)} ${q.y<0?'down':'up'} from the origin.`),visual:{type:'grid',min:-extent,max:extent,step:1,points:[],targets:pts}});
  }
  if(f==='proportion-plot'){
    const k=I(1,16)/4,x=I(1,4),extent=Math.ceil(Math.max(6,x*k+1)),pts=[{x:-x,y:-x*k,label:'A'},{x:0,y:0,label:'B'},{x,y:x*k,label:'C'}];
    return F(f,{prompt:`For y = ${k}x, plot x = −${x}, 0, ${x}; draw the line.`,value:pts.flatMap(q=>[q.x,q.y]),answer:pts.map(q=>`(${q.x}, ${q.y})`).join('; '),input:'plot',proportion:{k,xs:[-x,0,x]},steps:[`Multiply each x-value by ${k}: ${pts.map(q=>`${q.x} → ${q.y}`).join('; ')}.`,`Plot all three points and connect them with a straight line through (0, 0).`],visual:{type:'grid',min:-extent,max:extent,step:1,points:[],targets:pts,line:null,answerLine:{k}}});
  }
  if(f==='arithmetic-sequence'||f==='geometric-sequence'){
    const geometric=f==='geometric-sequence',src=p.sequence||{},sub=p.subtype||'next-rule',fractional=!Number.isInteger(src.first??1)||!Number.isInteger(src.difference??1);
    let d=geometric?(src.ratio<0?P([-2,-3,-4,-.5]):src.ratio>0&&src.ratio<1?P([.5,1/3,.25,.2]):P([2,3,4,5])):(src.difference<0?-I(1,18):fractional?I(1,15)/4:I(1,18));
    let a=geometric&&Math.abs(d)<1?I(1,18)*Math.round(1/Math.abs(d))**4:fractional?I(-24,40)/4:I(-24,40)||1;
    if(sub==='plot'){a=geometric?I(1,24)/4:I(-8,8);d=geometric?P([.5,1.5,2,2.5]):I(1,6);}
    const vals=Array.from({length:5},(_,i)=>rnd(geometric?a*d**i:a+i*d,10)),fmt=n=>rationalText(n),ds=fmt(d),as=fmt(a);
    const rule=geometric?`${coefficientText(as)}(${ds})^(n − 1)`:`${coefficientText(ds)}n ${a-d<0?'−':'+'} ${fmt(Math.abs(a-d))}`;
    const sequence=geometric?{kind:'geometric',first:a,ratio:d}:{kind:'arithmetic',first:a,difference:d};
    const method=geometric?`Multiply by ${ds} each time.`:`Add ${ds} each time.`;
    if(sub==='plot'){
      const pts=vals.slice(0,4).map((y,i)=>({x:i+1,y,label:String.fromCharCode(65+i)}));
      return F(f,{prompt:`Sequence: ${vals.slice(0,4).map(fmt).join(', ')}. Use positions 1, 2, 3, 4 as x and the number at that position as y. Plot four separate points; do not connect them.`,value:pts.flatMap(q=>[q.x,q.y]),answer:pts.map(q=>`(${q.x}, ${fmt(q.y)})`).join('; '),input:'plot',sequence,steps:[method,`Pair each position with its term: ${pts.map(q=>`(${q.x}, ${fmt(q.y)})`).join('; ')}.`,`Plot separate points at whole-number positions.`],visual:{type:'grid',xMin:0,xMax:5,yMin:Math.min(0,Math.floor(Math.min(...vals.slice(0,4))-1)),yMax:Math.ceil(Math.max(...vals.slice(0,4))+1),step:1,points:[],targets:pts,xLabel:'x',yLabel:'y'}});
    }
    if(sub==='table')return F(f,{prompt:`Rule: term value = ${rule}. Here n is the position: 1 means first, 2 means second, and so on. Find the first four term values by substituting n = 1, 2, 3, 4.`,value:vals.slice(0,4),answer:vals.slice(0,4).map(fmt).join(', '),sequence,steps:[`Substitute n = 1, 2, 3, 4 into ${rule}.`,method,`The terms are ${vals.slice(0,4).map(fmt).join(', ')}.`],visual:null});
    if(sub==='rule')return F(f,{prompt:`Sequence: ${vals.slice(0,3).map(fmt).join(', ')}, … Write a formula in n for the value at position n. Position 1 is the first number, position 2 the second, and so on.`,value:null,answer:rule,accept:[geometric?`${as}*(${ds})^(n-1)`:`${as}+(${ds})(n-1)`],sequence,algebraic:!geometric,freeResponse:geometric,steps:[`The first term is ${as}. ${method}`,`At position n, the term value is ${rule}. Substitute n = 1 to check that the formula gives ${as}.`],visual:null});
    if(sub==='next'||sub==='next-terms'||sub==='next-ratio'){
      const ratio=sub==='next-ratio'||!!p.askRatio,value=ratio?[...vals.slice(3),d]:vals.slice(3);
      return F(f,{prompt:`${vals.slice(0,3).map(fmt).join(', ')}, … Find the next two terms${ratio?' and the ratio':''}.`,value,answer:`${vals.slice(3).map(fmt).join(', ')}${ratio?`; ratio ${ds}`:''}`,sequence,steps:[method,`Next terms: ${vals.slice(3).map(fmt).join(', ')}.`,...(ratio?[`The common ratio is ${ds}.`]:[])],visual:null});
    }
    return F(f,{prompt:`Sequence: ${vals.slice(0,3).map(fmt).join(', ')}, … Find the next two terms. Then write a formula for the value at position n, where n = 1 means first, n = 2 means second, and so on.`,value:null,answer:`${vals.slice(3).map(fmt).join(', ')}; ${rule}`,input:'text',freeResponse:true,sequence,steps:[method,`Next terms: ${vals.slice(3).map(fmt).join(', ')}.`,`Term value at position n: ${rule}.`],visual:null});
  }
  if(f==='coordinate-read'){
    const point=(label,old)=>{let x=I(-5,5),y=I(-5,5);if(old?.x===0)x=0;else if(old&&!Number.isInteger(old.x))x=(x||2)-.5;if(old?.y===0)y=0;else if(old&&!Number.isInteger(old.y))y=(y||2)-.5;return{x,y,label};};
    const pts=[point('A',p.visual?.points?.[0]),point('B',p.visual?.points?.[1])],visual={type:'grid',min:-6,max:6,step:1,points:pts,targets:[]};
    if(p.subtype==='axes'){visual.points=[{x:I(-4,4),y:I(-4,4),label:'A'}];const a=visual.points[0];return F(f,{prompt:'Name the horizontal and vertical axes. Write the ordered pair (x, y) for point A.',value:null,answer:`x-axis; y-axis; (${a.x}, ${a.y})`,freeResponse:true,steps:['The horizontal axis is the x-axis; the vertical axis is the y-axis.',`Read horizontal position first: A = (${a.x}, ${a.y}).`],visual});}
    if(p.subtype==='read-quadrant'){
      const q=p=>p.x>0?(p.y>0?'I':'IV'):(p.y>0?'II':'III');for(const pt of pts){if(!pt.x)pt.x=-2;if(!pt.y)pt.y=3;}
      return F(f,{prompt:'Write the ordered pair (x, y) for each labeled point A and B. Also name the quadrant containing each point.',value:null,answer:pts.map(pt=>`${pt.label}(${pt.x}, ${pt.y}), ${q(pt)}`).join('; '),freeResponse:true,steps:pts.map(pt=>`${pt.label}: x = ${pt.x}, y = ${pt.y}; quadrant ${q(pt)}.`),visual});
    }
    return F(f,{prompt:'Write the ordered pair (x, y) for point A, then for point B.',value:pts.flatMap(pt=>[pt.x,pt.y]),answer:pts.map(pt=>`(${pt.x}, ${pt.y})`).join('; '),steps:pts.map(pt=>`${pt.label}: x = ${pt.x}, y = ${pt.y}.`),visual});
  }
  if(f==='proportion-constant'||f==='proportion-interpret'){
    if(f==='proportion-interpret'&&p.visual?.type==='grid'){
      const k=I(1,48)/8,extent=Math.max(5,Math.ceil(k+1)),answer=`k = ${k}; 1 unit of x gives ${k} units of y; zero gives zero.`;
      return F(f,{prompt:`Find k from the graph. Explain what (1, ${k}) and (0, 0) mean.`,value:null,answer,input:'text',freeResponse:true,steps:[`The graph passes through (1, ${k}), so k = ${k}/1 = ${k}.`,`(1, ${k}) states the unit rate.`,`The origin means zero x corresponds to zero y.`],visual:{type:'grid',min:-extent,max:extent,step:1,points:[{x:1,y:k,label:'A'},{x:0,y:0,label:'B'}],targets:[],line:{k,b:0}}});
    }
    const k=I(1,48)/4,x=I(2,15);return F(f,{prompt:`A proportional relationship contains (0, 0) and (${x}, ${x*k}). Find k in y = kx.`,value:k,answer:String(k),steps:[`For a nonzero x, k = y/x.`,`k = ${x*k}/${x} = ${k}. The point (1, ${k}) gives the unit rate.`],visual:null});
  }
  if(f==='proportion-equation'){
    const n=I(1,23),d=I(2,16),k=frac(n,d),xs=[d,2*d,3*d],ys=[n,2*n,3*n],answer=`y = ${coefficientText(fs(k))}x`;
    return F(f,{prompt:`x: ${xs.join(', ')}; y: ${ys.join(', ')}. Write y in terms of x.`,value:null,answer,input:'text',freeResponse:true,proportion:{k:num(k)},steps:[`Divide y by x: ${n}/${d} = ${fs(k)} for each pair.`,`Use y = kx: ${answer}.`],visual:null});
  }
  if(f==='proportion-table'&&p.subtype==='table'){
    const k=I(1,40)/4,xs=[0,I(1,8),I(9,18)],ys=xs.map(x=>x*k);
    return F(f,{prompt:`y = ${coefficientText(rationalText(k))}x. Find y when x = ${xs.join(', ')}.`,value:ys,answer:ys.map(rationalText).join(', '),proportion:{k,xs},steps:[`Substitute each x-value into y = ${coefficientText(rationalText(k))}x.`,...xs.map((x,i)=>`${rationalText(k)} × ${x} = ${rationalText(ys[i])}.`)],visual:null});
  }
  if(f==='proportion-check'){
    if(p.visual?.type==='grid'){
      const k=I(1,16)/4,b=R.bool()?0:P([-3,-2.5,-2,-1.5,-1,.5,1,1.5,2,2.5,3]),yes=b===0;
      return F(f,{prompt:'Is the graphed relationship proportional? Explain.',value:null,answer:yes?'Yes; it is a straight line through the origin.':'No; the line does not pass through the origin.',accept:[yes?'yes':'no'],freeResponse:true,steps:[`The graph crosses the y-axis at (0, ${b}).`,yes?'A straight line through (0, 0) represents a proportional relationship.':'A proportional graph must pass through (0, 0); this one does not.'],visual:{type:'grid',min:-5,max:5,step:1,points:[{x:0,y:b,label:'A'},{x:1,y:k+b,label:'B'}],targets:[],line:{k,b}}});
    }
    if(/find k/i.test(p.prompt||'')){
      const k=I(1,48)/4,start=I(1,6),gap=I(1,5),xs=[start,start+gap,start+2*gap],ys=xs.map(x=>k*x);
      return F(f,{prompt:`x: ${xs.join(', ')}; y: ${ys.join(', ')}. Is it proportional? If so, find k.`,value:null,answer:`Yes; k = ${rationalText(k)}`,freeResponse:true,steps:[`The ratios y/x are all ${rationalText(k)}.`,`Yes, the common ratio is k = ${rationalText(k)}.`],visual:null});
    }
    const k=I(1,30)/2,b=R.bool()?0:I(1,19)/2,ys=[k+b,2*k+b,3*k+b],yes=b===0;return F(f,{prompt:`x: 1, 2, 3; y: ${ys.join(', ')}. Proportional?`,value:null,answer:yes?'Yes':'No',accept:[yes?'yes':'no'],steps:[`Compare y/x: ${ys[0]}, ${rnd(ys[1]/2,4)}, ${rnd(ys[2]/3,4)}.`,yes?'All ratios match, so the relationship is proportional.':'The ratios differ, so the relationship is not proportional.'],visual:null});
  }
  if(f==='proportion-solve'){
    const n=I(1,8),d=I(n+1,n+8),k=I(2,6);return F(f,{prompt:`${n}/${d} = x/${d*k}. Find x.`,value:n*k,answer:String(n*k),steps:[`The denominator is multiplied by ${k}: ${d} × ${k} = ${d*k}.`,`Multiply the numerator by the same factor: x = ${n} × ${k} = ${n*k}.`],visual:null});
  }
  if(f==='unit-rate-compare'){
    if(typeof p.value!=='number'){
      const cost=/cost|item|\$/.test(p.prompt||''),ra=I(3,12)/2,rb=ra+P([-.5,.25,.5,1]),ta=I(2,6),tb=I(2,6),winner=cost?(ra<rb?'A':'B'):(ra>rb?'A':'B');
      return F(f,{prompt:cost?`A: $${(ra*ta).toFixed(2)} for ${ta} items. B: $${(rb*tb).toFixed(2)} for ${tb} items. Which has the lower cost per item?`:`A: ${rationalText(ra*ta/4)} miles in ${rationalText(ta/4)} hour. B: ${rationalText(rb*tb/4)} miles in ${rationalText(tb/4)} hour. Which rate is greater?`,value:null,answer:winner,accept:[winner.toLowerCase(),`rate ${winner.toLowerCase()}`],steps:[`A: amount ÷ quantity = ${ra}${cost?' dollars per item':' miles per hour'}.`,`B: amount ÷ quantity = ${rb}${cost?' dollars per item':' miles per hour'}.`,`${winner} has the ${cost?'lower':'greater'} unit rate.`],visual:null});
    }
    const ra=I(5,12),rb=I(1,4),ta=I(2,6),tb=I(2,6);return F(f,{prompt:`A: ${ra*ta} cm in ${ta} s. B: ${rb*tb} cm in ${tb} s. How much faster is A, in cm/s?`,value:ra-rb,answer:String(ra-rb),unit:'cm/s',steps:[`A: ${ra*ta}/${ta} = ${ra} cm/s. B: ${rb*tb}/${tb} = ${rb} cm/s.`,`Difference = ${ra} − ${rb} = ${ra-rb} cm/s.`],visual:null});
  }
  if(f==='percent-whole'){
    const pc=I(1,95),whole=I(4,100)*5,part=rnd(pc*whole/100,4);return F(f,{prompt:`${part} is ${pc}% of what number?`,value:whole,answer:String(whole),steps:[`Let w be the whole: ${pc/100}w = ${part}.`,`Divide: w = ${part}/${pc/100} = ${whole}.`],visual:null});
  }
  if(f==='percent-rate'){
    const whole=I(4,100)*5,pc=I(1,95),part=rnd(whole*pc/100,4);
    return F(f,{prompt:`${part} is what percent of ${whole}?`,value:pc,answer:`${pc}%`,unit:'%',steps:[`Divide the part by the whole: ${part}/${whole} = ${pc/100}.`,`Multiply by 100: ${pc/100} × 100 = ${pc}%.`],visual:null});
  }
  if(f==='percent-reverse'){
    const original=I(5,100)*5,pc=I(1,75),down=p.percent?.direction?p.percent.direction==='decrease':R.bool(),factor=rnd(1+(down?-pc:pc)/100,4),now=rnd(original*factor,2);
    return F(f,{prompt:`After a ${pc}% ${down?'decrease':'increase'}, the value is ${now}. Find the original value.`,value:original,answer:String(original),percent:{direction:down?'decrease':'increase',final:now,rate:pc},steps:[`The new value is ${100+(down?-pc:pc)}% of the original: ${factor}x = ${now}.`,`Divide by ${factor}: x = ${now}/${factor} = ${original}.`],visual:null});
  }
  if(f==='percent-adjust'){
    const original=I(5,100)*5,pc=I(1,75),down=p.percent?.direction==='decrease',factor=rnd(1+(down?-pc:pc)/100,4),value=rnd(original*factor,2);
    return F(f,{prompt:`${down?'Decrease':'Increase'} ${original} by ${pc}%.`,value,answer:String(value),percent:{direction:down?'decrease':'increase',original,rate:pc},steps:[`Multiplier = 1 ${down?'−':'+'} ${pc/100} = ${factor}.`,`New amount = ${original} × ${factor} = ${value}.`],visual:null});
  }
  if(['tax','commission','discount-amount','markup-amount'].includes(f)){
    const amount=I(4,120)*5,pc=f==='tax'?I(8,40)/4:I(1,60),value=rnd(amount*pc/100,2),label={tax:'tax',commission:'commission','discount-amount':'discount','markup-amount':'markup'}[f];
    return F(f,{prompt:`Find the ${pc}% ${label} amount on $${amount.toFixed(2)}.`,value,answer:`$${value.toFixed(2)}`,unit:'$',steps:[`Convert ${pc}% to ${pc/100}.`,`${label[0].toUpperCase()+label.slice(1)} = ${amount} × ${pc/100} = $${value.toFixed(2)}.`],visual:null});
  }
  if(f==='tip-total'||f==='markup-discount'){
    const amount=I(3,80)*5,pc=I(10,30),discount=I(5,40),raised=rnd(amount*(1+pc/100),2),value=f==='tip-total'?raised:rnd(raised*(1-discount/100),2);
    return F(f,{prompt:f==='tip-total'?`$${amount} meal: add a ${pc}% tip based on the meal price. Find the total.`:`$${amount} cost: ${pc}% markup, then a ${discount}% discount on the marked price. Find the final price.`,value,answer:`$${value.toFixed(2)}`,unit:'$',steps:[`${f==='tip-total'?'Total after tip':'Marked price'} = ${amount} × ${rnd(1+pc/100,4)} = $${raised.toFixed(2)}.`,...(f==='markup-discount'?[`After discount: ${raised} × ${rnd(1-discount/100,4)} = $${value.toFixed(2)}.`]:[])],visual:null});
  }
  if(f==='discount-tax-fee'){
    const price=I(4,80)*5,discount=I(5,50),tax=I(4,10),fee=I(2,15),reduced=rnd(price*(1-discount/100),2),taxed=rnd(reduced*(1+tax/100),2),value=rnd(taxed+fee,2);
    return F(f,{prompt:`$${price} price: ${discount}% discount, ${tax}% tax on the discounted price, then a $${fee} fee. Find the total.`,value,answer:`$${value.toFixed(2)}`,unit:'$',steps:[`Discounted price = ${price} × ${rnd(1-discount/100,4)} = $${reduced.toFixed(2)}.`,`After tax = ${reduced} × ${rnd(1+tax/100,4)} = $${taxed.toFixed(2)}.`,`Add the fee: ${taxed} + ${fee} = $${value.toFixed(2)}.`],visual:null});
  }
  if(f==='discount-tax'){
    const price=I(4,80)*5,discount=I(5,50),tax=I(4,10),reduced=price*(1-discount/100),value=rnd(reduced*(1+tax/100));return F(f,{prompt:`A $${price} item has ${discount}% off, then ${tax}% tax. Find the final price.`,value,answer:`$${value.toFixed(2)}`,steps:[`After the discount: ${price} × ${rnd(1-discount/100,4)} = $${rnd(reduced)}.`,`Apply tax to that price: ${rnd(reduced)} × ${rnd(1+tax/100,4)} = $${value.toFixed(2)}.`],visual:null});
  }
  if(f==='commission-fee'){
    const sales=I(5,100)*20,pc=I(2,15),fee=I(2,15),commission=sales*pc/100;return F(f,{prompt:`${pc}% commission on $${sales}, minus a $${fee} fee. Find the amount kept.`,value:commission-fee,answer:`$${commission-fee}`,steps:[`Commission = ${pc/100} × ${sales} = $${commission}.`,`Subtract the fee: ${commission} − ${fee} = $${commission-fee}.`],visual:null});
  }
  if(f==='tip'){
    const pc=I(10,25),amount=I(4,80)*5,value=rnd(amount*pc/100);return F(f,{prompt:`Find a ${pc}% tip on $${amount}.`,value,answer:`$${value.toFixed(2)}`,steps:[`Convert ${pc}% to ${pc/100}.`,`Tip = ${pc/100} × ${amount} = $${value.toFixed(2)}.`],visual:null});
  }
  if(f==='angle-equation'){
    const rays=p.visual?.rays||[],relation=p.relation||(rays.length===3?(rays.at(-1)===90?'complement':'supplement'):'opposite');
    if(relation!=='opposite'){
      const total=relation==='complement'?90:180,a=I(2,4),b=I(1,10),x=I(4,Math.floor((total-b-15)/a)),angle=a*x+b,given=total-angle;
      return F(f,{prompt:'Find x.',value:x,answer:String(x),relation,steps:[`${relation==='complement'?'Complementary':'Supplementary'} angles total ${total}°.`,`${given} + ${a}x + ${b} = ${total}. Subtract ${given+b}: ${a}x = ${a*x}.`,`Divide by ${a}: x = ${x}.`],visual:{type:'angle',rays:[0,given,total],arcs:[{from:0,to:given,label:`${given}°`},{from:given,to:total,label:`${a}x + ${b}°`}],...(total===90?{rightAngle:{}}:{})}});
    }
    const a=P([2,3,4]),x=I(10,35),b=I(1,10),angle=a*x+b;
    return F(f,{prompt:'Find x.',value:x,answer:String(x),steps:['Opposite angles at an intersection are equal.',`${a}x + ${b} = ${angle}. Subtract ${b}: ${a}x = ${a*x}.`,`Divide by ${a}: x = ${x}.`],visual:{type:'angle',rays:[0,angle,180,180+angle],arcs:[{from:0,to:angle,label:`${angle}°`},{from:180,to:180+angle,label:`${a}x + ${b}°`}]}});
  }
  if(f==='triangle-construction'){
    const triple=P([[3,4,5],[4,3,5],[5,12,13],[12,5,13],[8,15,17],[15,8,17]]),k=I(2,20)/8,[a,b,c]=triple.map(n=>n*k);return F(f,{prompt:`Each interval is 1 unit. Place C above AB so AC = ${a} and BC = ${c}. Join A, B, C.`,value:[0,a],answer:`C(0, ${a})`,input:'plot',steps:[`AB = ${b}; AC = ${a}; BC = ${c}. Locate the intersection of the two length constraints above AB.`,`C = (0, ${a}) is ${a} units from A and ${c} units from B.`,`Connect A–B–C–A.`],visual:{type:'grid',xMin:0,xMax:Math.ceil(b+1),yMin:0,yMax:Math.ceil(a+1),step:1,points:[{x:0,y:0,label:'A'},{x:b,y:0,label:'B'}],targets:[{x:0,y:a,label:'C'}],targetEdges:true,axisLabels:false}});
  }
  if(f==='triangle-conditions'){
    const triple=P([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]),k=I(1,12)/2,[a,b,c]=triple.map(n=>n*k);return F(f,{prompt:`Do side lengths ${a}, ${b}, ${c} determine one triangle shape?`,value:null,answer:'Yes',accept:['yes','one','one triangle','unique'],steps:[`The two shorter sides sum to ${a+b}, greater than ${c}.`,`Three fixed valid side lengths determine one triangle shape, up to rotation and reflection.`],visual:polygon([[0,0],[b,0],[0,a]],[{text:String(a),x:-.6,y:a/2},{text:String(b),x:b/2,y:-.6},{text:String(c),x:b/2,y:a/2}])});
  }
  if(f==='triangle-angle-conditions'){
    const A=I(25,65),B=I(30,75),C=180-A-B,base=I(4,15),len=base*Math.sin(B*Math.PI/180)/Math.sin(C*Math.PI/180),top=[len*Math.cos(A*Math.PI/180),len*Math.sin(A*Math.PI/180)];
    return F(f,{prompt:`Do angles ${A}°, ${B}°, ${C} determine one size or many sizes?`,value:null,answer:'Many sizes',accept:['many','many sizes','infinitely many','more than one'],steps:[`The angles sum to ${A+B+C}°, so such triangles exist.`,`Scaling all sides preserves the angles, so there are many sizes.`],visual:polygon([[0,0],[base,0],top],[],{pointLabels:[{x:0,y:0,text:`${A}°`},{x:base,y:0,text:`${B}°`},{x:top[0],y:top[1],text:`${C}°`}]})});
  }
  if(f==='scale-length'||f==='scale-area'){
    const sourceFactor=p.scaleFactor??parseNumber((p.prompt||'').match(/scale factor\s+([\d./]+)/i)?.[1]),reduction=sourceFactor>0&&sourceFactor<1,fracScale=sourceFactor>1&&!Number.isInteger(sourceFactor);
    const k=reduction?P([.5,1/3,.25,.2]):fracScale?P([1.25,1.5,1.75,2.25,2.5,2.75]):P([2,3,4]),divisor=reduction?Math.round(1/k):1,w=I(2,10)*divisor,h=I(2,8)*divisor,newW=rnd(w*k,5),newH=rnd(h*k,5),isArea=f==='scale-area',value=isArea?newW*newH:[newW,newH],ks=rationalText(k);
    if(p.visual?.type==='polygon')return F(f,{prompt:`Scale factor ${ks}: find the new width and height.`,value,answer:`${newW}; ${newH} ${unit}`,unit,scaleFactor:k,steps:[`Multiply each original length by ${ks}.`,`Width = ${w} × ${ks} = ${newW} ${unit}.`,`Height = ${h} × ${ks} = ${newH} ${unit}.`],visual:rect(w,h,unit)});
    const points=[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}],targets=[{x:0,y:0},{x:newW,y:0},{x:newW,y:newH},{x:0,y:newH}];
    return F(f,{prompt:`Each interval is 1 unit. Scale factor ${ks}: ${isArea?'draw the scaled rectangle and find its area.':'find the new width and height.'}`,value,answer:isArea?`${value} square units`:`${newW}, ${newH}`,unit:isArea?'square units':'units',scaleFactor:k,steps:[`Multiply every length by ${ks}.`,`Width = ${w} × ${ks} = ${newW}; height = ${h} × ${ks} = ${newH}.`,...(isArea?[`Area = ${newW} × ${newH} = ${value} square units.`]:[])],visual:{type:'grid',xMin:0,xMax:Math.max(w,newW)+1,yMin:0,yMax:Math.max(h,newH)+1,step:1,points,connectPoints:true,closedPoints:true,targets,targetEdges:true}});
  }
  if(f==='circle-radius'||f==='circle-diameter'||f==='circle-area-from-circumference'||f==='circle-reverse'){
    const r=I(2,60)/2,d=2*r,C=rnd(2*3.14*r),A=rnd(3.14*r*r,6),rev=f==='circle-reverse',fromC=f==='circle-area-from-circumference';
    let value=f==='circle-radius'?r:f==='circle-diameter'?d:rev?[d,r]:A;
    const prompt=f==='circle-radius'?'Find the radius.':f==='circle-diameter'?'Find the diameter.':rev?'Find the diameter and radius. Use π = 3.14.':'Find the circle area from its circumference. Use π = 3.14.';
    const steps=rev||fromC?[`d = C/π = ${C}/3.14 = ${d}.`,`r = d/2 = ${r}.`,...(fromC?[`A = πr² = 3.14 × ${r}² = ${A}.`]:[])]:[f==='circle-radius'?`r = d/2 = ${d}/2 = ${r}.`:`d = 2r = 2 × ${r} = ${d}.`];
    return F(f,{prompt,value,answer:rev?`${d}; ${r}`:String(value),steps,unit:fromC?`${unit}²`:unit,visual:{type:'circle',r,given:rev||fromC?'circumference':f==='circle-radius'?'diameter':'radius',label:rev||fromC?`C = ${C} ${unit}`:f==='circle-radius'?`d = ${d} ${unit}`:`r = ${r} ${unit}`}});
  }
  if(f==='cross-section'&&p.visual){
    const v=scaledVisual(p.visual,I(3,32)/8),pyramid=v.type==='pyramid',parallel=R.bool();v.crossSection=parallel?'parallel-base':'vertical';
    const answer=pyramid?(parallel?'Square':'Triangle'):(parallel&&v.base?.length===3?'Triangle':'Rectangle');
    const prompt=pyramid?(parallel?'Name the slice parallel to the square pyramid base.':'Name the slice through the pyramid apex and two opposite base-edge midpoints.'):(parallel?'Name the slice parallel to the prism base.':'Name the vertical slice along the prism height.');
    return F(f,{prompt,value:null,answer,accept:[answer.toLowerCase(),`a ${answer.toLowerCase()}`],input:'text',steps:[parallel?'A parallel slice has the same shape as the base.':pyramid?'The slice includes the apex and two base points, forming three sides.':'The vertical slice has two edges along the prism height and two across the base.',`The cross-section is a ${answer.toLowerCase()}.`],visual:v});
  }
  if(f.startsWith('area-')&&p.visual?.type==='prism'){
    const v=relabelUnit(scaledVisual(p.visual,I(3,32)/8),unit),value=rnd(area(v.base),6);
    const xs=v.base.map(q=>q[0]),ys=v.base.map(q=>q[1]),w=rnd(Math.max(...xs)-Math.min(...xs),6),h=rnd(Math.max(...ys)-Math.min(...ys),6);
    const computation=v.base.length===3?`Base area = 1/2 × ${w} × ${h} = ${value}.`:v.base.length===4?`Base area = ${w} × ${h} = ${value}.`:`Split the L-shaped base into rectangles, or subtract the rectangular cutout from its ${w} by ${h} bounding rectangle. The base area is ${value}.`;
    return F(f,{prompt:'Find the area of one base.',value,answer:`${value} ${unit}²`,unit:`${unit}²`,steps:[computation,`The prism depth is not needed to find one base area: ${value} ${unit}².`],visual:v});
  }
  const solidFamilies=['net-faces','net-surface','prism-lateral','prism-surface','triangle-prism-lateral','triangle-prism-surface','pyramid-lateral','pyramid-surface','triangular-pyramid-lateral','triangular-pyramid-surface','composite-prism-surface','volume-count','prism-volume','triangle-prism-volume','composite-prism-volume','prism-height'];
  if(solidFamilies.includes(f)&&p.visual){
    const k=I(3,32)/8,v=relabelUnit(scaledVisual(p.visual,k),unit),u=v.unit;let value,prompt,steps,answer,unitOut=`${u}²`;
    if(f==='volume-count'){const w=I(2,10),h=I(2,8),d=I(2,9);Object.assign(v,{base:[[0,0],[w,0],[w,h],[0,h]],depth:d,labels3D:[{point:[w/2,0,0],text:`${w} ${u}`,dy:21},{point:[0,h/2,0],text:`${h} ${u}`,dx:-26},{point:[0,0,d/2],text:`${d} ${u}`,dx:-28}],showUnitGrid:true});}
    if(f==='net-faces'){value=[6,12,8];prompt='How many faces, edges, and vertices does this rectangular-prism net make?';steps=['Six rectangular faces fold around the box.','Count each shared edge once: 12 edges.','The corners are its 8 vertices.'];answer='6; 12; 8';unitOut='';}
    else if(f==='net-surface'){value=v.faces.reduce((s,face)=>s+area(face.points),0);prompt='Find the total area of this net.';steps=[`Find the areas of the six rectangles: ${v.faces.map(face=>rnd(area(face.points),4)).join(', ')}.`,`Add all face areas: ${rnd(value,4)} ${u}².`];}
    else if(v.type==='prism'){
      const B=area(v.base),per=perimeter(v.base),lat=per*v.depth,vol=B*v.depth;
      if(f==='prism-height'){value=v.depth;prompt=`Volume = ${rnd(vol,4)} ${u}³. Find the missing prism height h.`;steps=[`Base area = ${rnd(B,4)} ${u}².`,`h = V/B = ${rnd(vol,4)}/${rnd(B,4)} = ${rnd(value,4)} ${u}.`];unitOut=u;}
      else if(/volume|count/.test(f)){value=vol;prompt=f==='volume-count'?`How many 1 ${u}³ cubes fill this prism?`:'Find the volume.';steps=[`Base area = ${rnd(B,4)} ${u}².`,`V = B × height = ${rnd(B,4)} × ${v.depth} = ${rnd(value,4)} ${u}³.`];unitOut=f==='volume-count'?'':`${u}³`;}
      else{const lateral=f.endsWith('lateral');value=lateral?lat:lat+2*B;prompt=`Find the ${lateral?'lateral':'total'} surface area.`;steps=[`Base perimeter = ${rnd(per,4)} ${u}; base area = ${rnd(B,4)} ${u}².`,`Lateral area = perimeter × height = ${rnd(per,4)} × ${v.depth} = ${rnd(lat,4)}.`,...(!lateral?[`Add two bases: ${rnd(lat,4)} + 2(${rnd(B,4)}) = ${rnd(value,4)} ${u}².`]:[])];}
    }else if(v.type==='pyramid'){
      let B,L;
      if(v.vertices3D){const faces=v.faces.map(face=>triangleArea3(...face.map(i=>v.vertices3D[i])));B=faces[0];L=faces.slice(1).reduce((a,b)=>a+b,0);}
      else{B=v.width*v.length;L=2*v.width*v.slant;}
      const lateral=f.endsWith('lateral');value=lateral?L:L+B;prompt=`Find the ${lateral?'lateral':'total'} surface area of the pyramid.`;steps=[`Find each triangular side area using 1/2 × base × side-face height.`,`Sum of side areas = ${rnd(L,4)} ${u}².`,...(!lateral?[`Base area = ${rnd(B,4)} ${u}². Total = ${rnd(L,4)} + ${rnd(B,4)} = ${rnd(value,4)} ${u}².`]:[])];
    }
    if(value!==undefined)return F(f,{prompt,value:Array.isArray(value)?value:rnd(value,6),answer:answer||`${rnd(value,4)} ${unitOut}`,unit:unitOut,steps,visual:v,tolerance:.00011});
  }
  return null;
}

// Upgrade the wording of saved extra practice without changing its mathematics or identity.
export function clarifyPracticeWording(problem){
  const result={...problem};let prompt=String(problem.prompt||'');
  if(problem.family==='arithmetic-sequence'||problem.family==='geometric-sequence'){
    prompt=prompt.replace(/Write term n, beginning with n = 1\./i,'Write a formula in n for the value at position n. Position 1 is the first number, position 2 the second, and so on.');
    prompt=prompt.replace(/a rule for term n, starting at n = 1\./i,'a formula for the value at position n, where n = 1 means first, n = 2 means second, and so on.');
    prompt=prompt.replace(/Plot \(n, term n\) for (.*?) using n = 1, 2, 3, 4\./i,(_,values)=>`Sequence: ${values.replace(/,?\s*(?:…|\.\.\.)$/,'')}. Use positions 1, 2, 3, 4 as x and the number at that position as y. Plot four separate points; do not connect them.`);
    prompt=prompt.replace(/Rule: term n = (.*?)\. Find terms 1, 2, 3, 4\./i,(_,rule)=>`Rule: term value = ${rule}. Here n is the position: 1 means first, 2 means second, and so on. Find the first four term values by substituting n = 1, 2, 3, 4.`);
    if(result.visual?.type==='grid'&&(result.subtype==='plot'||/Plot \(n, term n\)/i.test(problem.prompt||'')))result.visual={...result.visual,xLabel:'x',yLabel:'y'};
  }
  if(problem.family==='coordinate-read'){
    prompt=prompt.replace(/Read A and B\./i,'Write the ordered pair (x, y) for each labeled point A and B.');
    prompt=prompt.replace(/Read the coordinates of A and B, in that order\./i,'Write the ordered pair (x, y) for point A, then for point B.');
    prompt=prompt.replace(/Name the horizontal axis, the vertical axis, and the coordinates of A\./i,'Name the horizontal and vertical axes. Write the ordered pair (x, y) for point A.');
  }
  result.prompt=prompt;return result;
}

export function generateVariant(problem,seed=Date.now(),difficulty='same'){
  const sourceFamily=identify(problem);
  const R=chooser(seed),I=R.int,P=R.pick, F=(family,fields)=>finish(problem,seed,difficulty==='same'&&aliases[sourceFamily]===family?sourceFamily:family,supportsDifficulty(problem)&&difficulty!=='same'?{...fields,stage:['Single skill','Two skills','Mixed skills'][level-1]}:fields);
  let family=identify(problem),level=/mixed|three|3|hard/.test(String(difficulty))?3:/pair|two|2/.test(String(difficulty))?2:1;
  const unit=P(['cm','m','in']);
  if(difficulty==='single'&&family==='fraction-order')family='fraction-add';
  if(supportsDifficulty(problem)&&difficulty!=='same'&&level>1){
    if(/decimal/.test(family)){
      const a=I(12,70)/10,b=I(2,9)/10,c=I(2,7),negative=level===3,value=rnd((negative?-a:a)+b*c,3);
      return F('mixed-order',{prompt:`${negative?'−':''}${a} + ${b} × ${c}`,value,answer:String(value),steps:[`Multiply first: ${b} × ${c} = ${rnd(b*c,3)}.`,`Then ${negative?'combine signed values':'add'}: ${negative?'−':''}${a} + ${rnd(b*c,3)} = ${value}.`],visual:null,stage:negative?'Mixed skills':'Two skills'});
    }
    if(/fraction/.test(family)&&level===2){const v=specialized({...problem,family:'fraction-order'},seed,R,F,level,unit);v.stage='Two skills';v.block.stage='Two skills';return v;}
    family='mixed-order';
  }
  const routed=family===identify(problem)?problem:{...problem,family};
  const special=specialized(routed,seed,R,F,level,unit);if(special)return special;
  const originalFamily=family;
  family=aliases[family]||family;
  if(originalFamily.startsWith('signed-fraction')&&difficulty==='same')level=Math.max(2,level);
  if(['integer-add','integer-subtract','integer-multiply','integer-divide'].includes(family)){
    const positive=problem.generation?.signs==='positive',max=problem.generation?.max||15;
    let a=I(positive?1:-max,max)||4,b=I(positive?1:-max,max)||-3,op=family.split('-')[1];
    if(op==='divide'){a=b*(I(-9,9)||5);}
    const value=op==='add'?a+b:op==='subtract'?a-b:op==='multiply'?a*b:a/b;
    const sym={add:'+',subtract:'−',multiply:'×',divide:'÷'}[op];
    return F(family,{prompt:`${signed(a)} ${sym} ${signed(b)}`,value,answer:String(value),steps:[`${a} ${sym} ${signed(b)} = ${value}.`,op==='subtract'?'Subtracting a number is adding its opposite.':op==='multiply'||op==='divide'?'Same signs give a positive result; different signs give a negative result.':'Combine signed quantities on the number line.'],visual:null});
  }
  if(family==='absolute'){
    let a=I(-18,-1),b=I(1,15);return F(family,{prompt:`Find the distance between ${a} and ${b} on a number line.`,value:b-a,answer:String(b-a),steps:[`Distance = |${b} − (${a})|.`,`|${b-a}| = ${b-a}.`],visual:null});
  }
  if(family==='compare'){
    let a=frac(-I(1,9),P([2,3,4,5])),b=frac(-I(1,7),P([2,3,4,5]));if(num(a)===num(b))b=frac(b.n-1,b.d);
    const ans=num(a)<num(b)?'<':'>';return F(family,{prompt:`Complete with < or >: ${fs(a)} ___ ${fs(b)}`,answer:ans,value:null,input:'text',steps:[`${fs(a)} = ${rnd(num(a),4)}; ${fs(b)} = ${rnd(num(b),4)}.`,`On the number line, the farther-right number is greater: ${fs(a)} ${ans} ${fs(b)}.`],visual:null});
  }
  if(family.startsWith('fraction-')){
    const signMode=difficulty==='single'?'positive':problem.generation?.signs||((originalFamily.startsWith('signed-')||level>1)?'signed':'positive'),negative=signMode==='signed';
    const denominators=[2,3,4,5,6,8,9,10,12,15,16,18,20,24],da=P(denominators),db=problem.generation?.denominators==='same'?da:P(denominators.filter(d=>problem.generation?.denominators!=='different'||d!==da));
    let a=frac(I(1,19)*(negative&&R.bool()?-1:1),da),b=frac(I(1,17)*(negative&&R.bool()?-1:1),db);
    if(problem.generation?.denominators==='same'){
      const ns=Array.from({length:da-1},(_,i)=>i+1).filter(n=>gcd(n,da)===1);
      a=frac(P(ns)*(a.n<0?-1:1),da);b=frac(P(ns)*(b.n<0?-1:1),da);
    }else if(problem.generation?.denominators==='different'&&a.d===b.d)b=frac(b.n<0?-1:1,a.d===2?3:2);
    if(negative&&a.n>0&&b.n>0)a=frac(-a.n,a.d);
    if(!negative&&family==='fraction-subtract'&&(problem.value??1)>=0){if(num(a)<num(b))[a,b]=[b,a];if(num(a)===num(b))a=frac(a.n+a.d,a.d);}
    const op=family.split('-')[1],res=op==='multiply'?mul(a,b):op==='divide'?mul(a,frac(b.d,b.n)):add(a,op==='subtract'?frac(-b.n,b.d):b),sym=op==='multiply'?'×':op==='divide'?'÷':op==='subtract'?'−':'+';
    const common=a.d/gcd(a.d,b.d)*b.d,an=a.n*(common/a.d),bn=b.n*(common/b.d);
    const steps=op==='divide'?[`Multiply by the reciprocal: ${fs(a)} × ${fs(frac(b.d,b.n))}.`]:op==='multiply'?[`Multiply numerators and denominators: (${a.n} × ${b.n})/(${a.d} × ${b.d}).`]:a.d===b.d?[`Keep denominator ${common}: (${an} ${sym} ${signed(bn)})/${common} = ${an+(op==='subtract'?-bn:bn)}/${common}.`]:[`Use least common denominator ${common}: ${an}/${common} ${sym} ${bn<0?`(${bn}/${common})`:`${bn}/${common}`}.`];
    steps.push(`Simplify: ${fs(res)}.`);return F(family,{prompt:`${a.n<0?`(${fs(a)})`:fs(a)} ${sym} ${b.n<0?`(${fs(b)})`:fs(b)}`,value:num(res),answer:fs(res),steps,visual:null});
  }
  if(family==='decimal'){
    const signedOperands=problem.generation?.signs==='signed'||(problem.generation?.signs!=='positive'&&/[−-]/.test(problem.prompt||''));
    let a=I(signedOperands?-90:1,90)/10,b=I(1,40)/10;
    const op=({'decimal-add':'+','decimal-subtract':'−','decimal-multiply':'×','decimal-divide':'÷'})[originalFamily]||P(['+','−','×','÷']);
    if(op==='÷'){b=I(2,12)/10;a=rnd((I(signedOperands?-30:1,30)||4)/10*b,3);}
    const value=rnd(op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:a/b,6);
    return F(family,{prompt:`${a} ${op} ${b}`,value,answer:String(value),steps:[op==='×'?'Multiply the whole-number digits, then place the decimal using the total number of decimal places.':op==='÷'?`Multiply both dividend and divisor by 10: ${rnd(a*10,4)} ÷ ${rnd(b*10,4)}.`:'Align decimal places, then use the rules for signed numbers.',`${a} ${op} ${b} = ${value}.`],visual:null});
  }
  if(family==='convert'){
    const d=P([4,5,8,10,20,25,40,50,100]),n=I(1,d-1),f=frac(n,d),value=num(f);return F(family,{prompt:`Write ${fs(f)} as a decimal.`,value,answer:String(value),steps:[`Divide numerator by denominator: ${f.n} ÷ ${f.d}.`,`${f.n} ÷ ${f.d} = ${value}. This decimal terminates.`],visual:null});
  }
  if(family==='mixed-order'){
    if(difficulty==='same')level=/mixed|three/i.test(problem.block?.stage||'')?3:/two/i.test(problem.block?.stage||'')?2:1;
    const a=I(3,12),b=I(2,8),c=I(2,7),n=I(1,5),d=P([2,4,5]);
    const source=problem.prompt||'',power=difficulty==='same'&&/[²³^]/.test(source),parentheses=difficulty==='same'&&/\(/.test(source),division=difficulty==='same'&&/÷/.test(source);
    if(level<3&&power){const negative=level===2,value=a*a+(negative?-1:1)*b*c;return F(family,{prompt:`${negative?`(−${a})`:`${a}`}² ${negative?'−':'+'} ${b} × ${c}`,value,answer:String(value),steps:[`Power first: ${negative?`(−${a})`:`${a}`}² = ${a*a}.`,`Multiply: ${b} × ${c} = ${b*c}.`,`Then ${a*a} ${negative?'−':'+'} ${b*c} = ${value}.`],visual:null,stage:level===2?'Two skills':'Single skill'});}
    if(level<3&&parentheses){const first=level===2?-a:a,value=(first+b)*c;return F(family,{prompt:`(${first} + ${b}) × ${c}`,value,answer:String(value),steps:[`Parentheses first: ${first} + ${b} = ${first+b}.`,`Multiply: (${first+b}) × ${c} = ${value}.`],visual:null,stage:level===2?'Two skills':'Single skill'});}
    if(level<3&&division){const first=level===2?-a*b:a*b,value=first/b+c;return F(family,{prompt:`${first} ÷ ${b} + ${c}`,value,answer:String(value),steps:[`Divide first: ${first} ÷ ${b} = ${first/b}.`,`Add: ${first/b} + ${c} = ${value}.`],visual:null,stage:level===2?'Two skills':'Single skill'});}
    if(level===1){const value=a+b*c;return F(family,{prompt:`${a} + ${b} × ${c}`,value,answer:String(value),steps:[`Multiply first: ${b} × ${c} = ${b*c}.`,`Add: ${a} + ${b*c} = ${value}.`],visual:null,stage:'Single skill'});}
    if(level===2){const value=-a+b*c;return F(family,{prompt:`−${a} + ${b} × ${c}`,value,answer:String(value),steps:[`Multiply first: ${b} × ${c} = ${b*c}.`,`Combine signed numbers: −${a} + ${b*c} = ${value}.`],visual:null,stage:'Two skills'});}
    const f=frac(n,d);
    if(power){const square=mul(f,f),other=frac(I(1,5),P([3,4,6])),quotient=mul(other,frac(-1,c)),res=add(square,frac(-quotient.n,quotient.d));return F(family,{prompt:`(−${fs(f)})² − ${fs(other)} ÷ (−${c})`,value:num(res),answer:fs(res),steps:[`Square first: (−${fs(f)})² = ${fs(square)}.`,`Divide: ${fs(other)} ÷ (−${c}) = ${fs(quotient)}.`,`Subtract the signed fraction: ${fs(square)} − (${fs(quotient)}) = ${fs(res)}.`],visual:null,stage:'Mixed skills'});}
    const decimal=difficulty==='same'&&/\d+\.\d+/.test(source),last=decimal?c+.25:(b===c?c+1:c),inside=frac(Math.round((b-last)*100),100),res=add(frac(-a),mul(f,inside));
    return F(family,{prompt:`−${a} + ${fs(f)} × (${b} − ${last})`,value:num(res),answer:fs(res),steps:[`Parentheses first: ${b} − ${last} = ${rationalText(b-last)}.`,`Multiply: ${fs(f)} × (${fs(inside)}) = ${fs(mul(f,inside))}.`,`Add the signed values: ${fs(res)}.`],visual:null,stage:'Mixed skills'});
  }
  if(['combine-terms','expand','factor'].includes(family)){
    const kind=problem.generation?.numberKind||(/\d+\s*\/\s*\d+/.test(problem.prompt||'')?'fraction':/\d+\.\d+/.test(problem.prompt||'')?'decimal':'integer');
    const fractionKind=kind==='fraction',decimalKind=kind==='decimal',fmt=n=>fractionKind?rationalText(n):String(rnd(n,5)),draw=()=>fractionKind?I(1,23)/P([2,3,4,5,6,8,10,12]):decimalKind?I(1,99)/10:I(1,24);
    let a=draw(),b=draw(),c=draw(),k=draw();let prompt,answer,steps;
    const sign=(n)=>`${n<0?'−':'+'} ${fmt(Math.abs(n))}`;
    if(family==='factor'){
      a=I(2,9);c=I(2,9);while(gcd(a,c)!==1)c=I(2,9);
      const specified=/factor out/i.test(problem.prompt||''),negative=/factor out\s*[-−]/i.test(problem.prompt||'');
      k=fractionKind?P([.5,.25,1/3]):I(2,7);if(negative)k=-k;if(/[-−]/.test((problem.prompt||'').split(':')[1]||''))c=-c;
      prompt=`${specified?`Factor out ${fmt(k)}`:'Factor completely'}: ${coefficientText(fmt(k*a))}x ${sign(k*c)}`;answer=`${coefficientText(fmt(k))}(${a}x ${c<0?'−':'+'} ${Math.abs(c)})`;
      steps=[`Divide each term by ${fmt(k)}: ${coefficientText(fmt(k*a))}x ÷ (${fmt(k)}) = ${a}x; ${fmt(k*c)} ÷ (${fmt(k)}) = ${c}.`,`Write the common factor outside: ${answer}.`];
    }else if(family==='expand'){
      if(/[-−]/.test((problem.prompt||'').split('(')[0]))k=-k;
      const innerCoefficient=/\([−-]?\d[^)]*x/.test(problem.prompt||'')?I(2,6):1;
      if(R.bool())b=-b;
      prompt=`Expand: ${coefficientText(fmt(k))}(${innerCoefficient===1?'':innerCoefficient}x ${sign(b)})`;answer=`${coefficientText(fmt(k*innerCoefficient))}x ${sign(k*b)}`;
      steps=[`Multiply ${fmt(k)} by each term.`,`${fmt(k)} × ${innerCoefficient}x = ${coefficientText(fmt(k*innerCoefficient))}x; ${fmt(k)} × (${fmt(b)}) = ${fmt(k*b)}.`,answer];
    }else{
      if(/[-−]/.test(problem.prompt||'')){a=-a;if(R.bool())c=-c;}
      if(Math.abs(a+c)<1e-8)c+=fractionKind?.5:decimalKind?.1:1;
      const onlyVariable=/^simplify:[^x]*x\s*[+−-]\s*[\d./ ]+x\.?$/i.test(problem.prompt||'');
      if(R.bool())b=-b;if(R.bool())k=-k;
      prompt=`Simplify: ${coefficientText(fmt(a))}x ${onlyVariable?'':`${sign(b)} `}${c<0?'−':'+'} ${coefficientText(fmt(Math.abs(c)))}x${onlyVariable?'':` ${sign(k)}`}`;
      answer=`${coefficientText(fmt(a+c))}x${onlyVariable?'':` ${sign(b+k)}`}`;
      steps=[`Combine variable coefficients: ${fmt(a)} + (${fmt(c)}) = ${fmt(a+c)}.`,...(!onlyVariable?[`Combine constants: ${fmt(b)} + (${fmt(k)}) = ${fmt(b+k)}.`]:[]),answer];
    }
    return F(family,{prompt,answer,value:null,input:'text',steps,visual:null,algebraic:true,requiredForm:family==='factor'?'factored':undefined});
  }
  if(family.startsWith('equation-')){
    const source=problem.prompt||'',kind=problem.generation?.numberKind||(/\d+\s*\/\s*\d+/.test(source)?'fraction':/\d+\.\d+/.test(source)?'decimal':'integer');
    const fmt=n=>kind==='decimal'?String(rnd(n,6)):rationalText(n);
    const draw=()=>kind==='fraction'?I(1,9)/P([2,3,4,5]):kind==='decimal'?I(1,35)/10:I(2,9);
    let x=(R.bool()?-1:1)*draw();const a=draw(),b=(R.bool()?-1:1)*draw();let prompt,steps;
    if(family==='equation-one'){
      const op=({'equation-add':'+','equation-subtract':'-','equation-multiply':'*','equation-divide':'/'})[originalFamily]||P(['+','-','*','/']);
      if(op==='+'){prompt=`x + (${fmt(b)}) = ${fmt(x+b)}`;steps=[`Subtract ${fmt(b)} from both sides.`,`x = ${fmt(x+b)} − (${fmt(b)}) = ${fmt(x)}.`];}
      else if(op==='-'){prompt=`x − (${fmt(b)}) = ${fmt(x-b)}`;steps=[`Add ${fmt(b)} to both sides.`,`x = ${fmt(x-b)} + (${fmt(b)}) = ${fmt(x)}.`];}
      else if(op==='*'){const m=R.bool()?a:-a;prompt=`${coefficientText(fmt(m))}x = ${fmt(m*x)}`;steps=[`Divide both sides by ${fmt(m)}.`,`x = ${fmt(m*x)} ÷ (${fmt(m)}) = ${fmt(x)}.`];}
      else{if(kind==='decimal')x=rnd(a*draw()*(x<0?-1:1),6);prompt=`x/(${fmt(a)}) = ${fmt(x/a)}`;steps=[`Multiply both sides by ${fmt(a)}.`,`x = ${fmt(x/a)} × ${fmt(a)} = ${fmt(x)}.`];}
    }else if(family==='equation-two'){prompt=`${coefficientText(fmt(a))}x ${b<0?'−':'+'} ${fmt(Math.abs(b))} = ${fmt(a*x+b)}`;steps=[`Subtract ${fmt(b)}: ${coefficientText(fmt(a))}x = ${fmt(a*x)}.`,`Divide by ${fmt(a)}: x = ${fmt(x)}.`];}
    else{const c=I(1,5);prompt=`${coefficientText(fmt(a))}(x ${b<0?'−':'+'} ${fmt(Math.abs(b))}) + ${c}x = ${fmt((a+c)*x+a*b)}`;steps=[`Distribute: ${coefficientText(fmt(a))}x + (${fmt(a*b)}) + ${c}x = ${fmt((a+c)*x+a*b)}.`,`Combine terms and subtract ${fmt(a*b)}: ${coefficientText(fmt(a+c))}x = ${fmt((a+c)*x)}.`,`Divide by ${fmt(a+c)}: x = ${fmt(x)}.`];}
    steps.push(`Substitute x = ${fmt(x)} to check both sides agree.`);return F(family,{prompt:eqPrompt(prompt),value:x,answer:`x = ${fmt(x)}`,steps,visual:null});
  }
  if(family==='inequality'){
    const a=-I(2,7),x=I(-7,10),b=I(-10,10),right=a*x+b;return F(family,{prompt:`Solve and graph: ${a}x ${b<0?'−':'+'} ${Math.abs(b)} < ${right}`,value:null,answer:`x > ${x}`,accept:[`x>${x}`,`${x}<x`],input:'text',steps:[`Subtract ${b}: ${a}x < ${a*x}.`,`Divide by ${a} and reverse the comparison: x > ${x}.`,`Use an open circle at ${x} and shade right.`],visual:null});
  }
  if(family==='arithmetic-sequence'||family==='geometric-sequence'){
    const a=I(1,9),d=family==='arithmetic-sequence'?I(2,8):I(2,4),values=Array.from({length:5},(_,i)=>family==='arithmetic-sequence'?a+i*d:a*d**i);return F(family,{prompt:`Find the next two terms: ${values.slice(0,3).join(', ')}, __, __`,value:values.slice(3),answer:values.slice(3).join(', '),steps:[family==='arithmetic-sequence'?`Add ${d} each time.`:`Multiply by ${d} each time.`,`Next: ${values[3]}, then ${values[4]}.`],visual:null});
  }
  if(family==='plot'){
    let x=I(-5,5),y=I(-5,5);if(x===0)x=-2;if(y===0)y=3;return F(family,{prompt:`Plot A(${x}, ${y}) on the Cartesian plane.`,value:[x,y],answer:`(${x}, ${y})`,input:'plot',steps:[`Start at (0, 0). Move ${Math.abs(x)} units ${x<0?'left':'right'}.`,`Then move ${Math.abs(y)} units ${y<0?'down':'up'}. Place A at (${x}, ${y}).`],visual:{type:'grid',min:-6,max:6,step:1,points:[],targets:[{x,y,label:'A'}]}});
  }
  if(family==='proportion-graph'){
    const k=P([1,1.5,2,2.5,3]),x=P([1,2]),y=k*x;return F(family,{prompt:`For y = ${k}x, plot the point with x = ${x}.`,value:[x,y],answer:`(${x}, ${y})`,input:'plot',steps:[`Substitute x = ${x}: y = ${k} × ${x} = ${y}.`,`Plot (${x}, ${y}); the proportional graph also passes through (0, 0).`],visual:{type:'grid',min:-1,max:7,step:1,points:[{x:0,y:0,label:'O'}],targets:[{x,y,label:'P'}],line:null}});
  }
  if(family==='proportion-table'){
    const k=I(1,48)/4,x=I(2,18);return F(family,{prompt:`A proportional table contains (1, ${k}) and (${x}, ?). Find the missing y-value.`,value:k*x,answer:String(k*x),steps:[`The constant of proportionality is k = ${k}/1 = ${k}.`,`Use y = ${k}x. For x = ${x}, y = ${k*x}.`],visual:null});
  }
  if(family==='unit-rate'){
    const fractional=/\d+\//.test(problem.prompt||''),k=fractional?frac(I(3,15),P([2,3,4])):frac(I(2,12)),time=fractional?frac(I(1,5),P([3,4,6])):frac(I(2,7)),amount=mul(k,time),[u,t]=P([['miles','hour'],['meters','second'],['liters','minute'],['kilometers','hour']]);
    return F(family,{prompt:`Find the unit rate: ${fs(amount)} ${u} in ${fs(time)} ${t}${num(time)>1?'s':''}.`,value:num(k),answer:`${fs(k)} ${u}/${t}`,unit:`${u}/${t}`,steps:[`Divide amount by time: ${fs(amount)} ÷ ${fs(time)}.`,`Multiply by the reciprocal: ${fs(amount)} × ${fs(frac(time.d,time.n))} = ${fs(k)}.`,`The rate is ${fs(k)} ${u}/${t}.`],visual:null});
  }
  if(family==='percent'){
    const percent=I(1,95),whole=I(4,100)*5,value=rnd(whole*percent/100,4);return F(family,{prompt:`Find ${percent}% of ${whole}.`,value,answer:String(value),steps:[`Convert: ${percent}% = ${percent/100}.`,`Multiply: ${percent/100} × ${whole} = ${value}.`],visual:null});
  }
  if(family==='percent-change'){
    const old=I(4,100)*5,pc=I(1,75),down=R.bool(),now=rnd(old*(1+(down?-pc:pc)/100),4);return F(family,{prompt:`Find the percent ${down?'decrease':'increase'} from ${old} to ${rnd(now)}.`,value:pc,answer:`${pc}%`,unit:'%',steps:[`Change = |${rnd(now)} − ${old}| = ${rnd(Math.abs(now-old))}.`,`Percent change = ${rnd(Math.abs(now-old))}/${old} × 100 = ${pc}%.`],visual:null});
  }
  if(family==='percent-error'){
    const actual=I(4,100)*5,pc=I(1,60),estimate=rnd(actual*(1+(R.bool()?-pc:pc)/100),4);return F(family,{prompt:`Actual value = ${actual}; estimate = ${rnd(estimate)}. Find the percent error.`,value:pc,answer:`${pc}%`,unit:'%',steps:[`Absolute error = |${rnd(estimate)} − ${actual}| = ${rnd(Math.abs(estimate-actual))}.`,`Percent error = ${rnd(Math.abs(estimate-actual))}/${actual} × 100 = ${pc}%.`],visual:null});
  }
  if(family==='simple-interest'){
    const p=I(5,100)*50,r=I(1,32)/4,t=I(1,12)/2,interest=p*r/100*t,total=p+interest,both=problem.subtype==='interest-total';return F(family,{prompt:`Principal $${p}, simple interest ${r}% per year, time ${t} years. Find ${both?'interest, then total balance':'the interest'}.`,value:both?[interest,total]:interest,answer:both?`$${interest.toFixed(2)}; $${total.toFixed(2)}`:`$${interest.toFixed(2)}`,unit:'$',steps:[`I = Prt; r = ${r/100}.`,`I = ${p} × ${r/100} × ${t} = $${interest.toFixed(2)}.`,...(both?[`Balance = ${p} + ${interest} = $${total.toFixed(2)}.`]:[])],visual:null});
  }
  if(family.startsWith('angle-')){
    const max=family==='angle-complement'?90:180,given=I(20,max-20),value=family==='angle-vertical'?given:max-given;
    const visual=family==='angle-vertical'?{type:'angle',rays:[0,given,180,180+given],arcs:[{from:0,to:given,label:`${given}°`},{from:180,to:180+given,label:'x'}]}:{type:'angle',rays:[0,given,max],arcs:[{from:0,to:given,label:`${given}°`},{from:given,to:max,label:'x'}]};
    return F(family,{prompt:'Find x.',value,answer:`${value}°`,unit:'°',steps:family==='angle-vertical'?[`Opposite angles formed by two crossing lines are equal.`,`x = ${given}°.`]:[`The two adjacent angles total ${max}°.`,`x = ${max} − ${given} = ${value}°.`],visual});
  }
  if(family==='triangle-possible'){
    const a=I(3,8),b=I(4,9),valid=R.bool(),c=valid?Math.max(Math.abs(a-b)+1,Math.min(a+b-1,I(4,11))):a+b+I(0,3),answer=valid?'Yes':'No';
    return F(family,{prompt:`Can sides ${a}, ${b}, and ${c} form a triangle?`,value:null,answer,accept:[answer.toLowerCase(),valid?'possible':'not possible'],input:'text',steps:[`The sum of the two shorter sides must exceed the longest side.`,`Sorted sides: ${[a,b,c].sort((x,y)=>x-y).join(', ')}.`,valid?'The inequality holds, so a triangle is possible.':'The inequality fails, so no triangle is possible.'],visual:{type:'segments',lengths:[a,b,c].map(length=>({length,label:`${length} ${unit}`})),unit}});
  }
  if(family==='triangle-construct'){
    const k=I(1,3),a=3*k,b=4*k,c=5*k;return F(family,{prompt:`Draw a triangle with side lengths ${a}, ${b}, and ${c} ${unit}. How many different triangles, ignoring position and reflection?`,value:null,answer:'One triangle',accept:['one','1','one triangle','unique'],steps:[`Draw a base of ${b} ${unit}.`,`The other two lengths fix the third vertex, up to reflection.`,`There is one triangle shape.`],visual:polygon([[0,0],[b,0],[0,a]],[{text:`${b} ${unit}`,x:b/2,y:-.7},{text:`${a} ${unit}`,x:-.7,y:a/2},{text:`${c} ${unit}`,x:b/2+.5,y:a/2+.5}],{unit})});
  }
  if(family==='scale'){
    const w=I(3,7),h=I(2,5),k=P([2,3,4]),value=w*h*k*k;return F(family,{prompt:`Enlarge the rectangle by scale factor ${k}. Find its new area.`,value,answer:`${value} ${unit}²`,unit:`${unit}²`,steps:[`New dimensions: ${w} × ${k} = ${w*k}; ${h} × ${k} = ${h*k}.`,`New area = ${w*k} × ${h*k} = ${value} ${unit}².`],visual:rect(w,h,unit)});
  }
  if(family==='perimeter'||family==='area-rectangle'){
    const w=I(4,14),h=I(2,9),value=family==='perimeter'?2*(w+h):w*h;return F(family,{prompt:`Find the ${family==='perimeter'?'perimeter':'area'}.`,value,answer:`${value} ${unit}${family==='perimeter'?'':'²'}`,unit:`${unit}${family==='perimeter'?'':'²'}`,steps:family==='perimeter'?[`P = 2w + 2h.`,`P = 2(${w}) + 2(${h}) = ${value} ${unit}.`]:[`A = base × height.`,`A = ${w} × ${h} = ${value} ${unit}².`],visual:rect(w,h,unit)});
  }
  if(['area-triangle','area-parallelogram','area-trapezoid'].includes(family)){
    const b=I(5,12),h=I(3,8),a=I(2,b-1),offset=Math.min(2,b/3);let pts,value,steps;
    if(family==='area-triangle'){pts=[[0,0],[b,0],[b/3,h]];value=b*h/2;steps=[`A = 1/2 × base × perpendicular height.`,`A = 1/2 × ${b} × ${h} = ${value} ${unit}².`];}
    else if(family==='area-parallelogram'){pts=[[0,0],[b,0],[b+offset,h],[offset,h]];value=b*h;steps=[`Cut off a side triangle and move it to form a rectangle.`,`A = base × perpendicular height = ${b} × ${h} = ${value} ${unit}².`];}
    else{pts=[[0,0],[b,0],[(b+a)/2,h],[(b-a)/2,h]];value=(a+b)*h/2;steps=[`Average the parallel bases: (${a} + ${b})/2 = ${(a+b)/2}.`,`Multiply by height: ${(a+b)/2} × ${h} = ${value} ${unit}².`];}
    const labels=[{text:`${b} ${unit}`,x:b/2,y:-.7},{text:`h = ${h} ${unit}`,x:-1,y:h/2}];if(family==='area-trapezoid')labels.push({text:`${a} ${unit}`,x:b/2,y:h+.7});
    const foot=family==='area-triangle'?b/3:family==='area-parallelogram'?offset:(b-a)/2;
    labels[1]={text:`h = ${h} ${unit}`,x:foot+.4,y:h/2};
    return F(family,{prompt:'Find the area.',value,answer:`${value} ${unit}²`,unit:`${unit}²`,steps,visual:polygon(pts,labels,{unit,height:h,segments:[{from:[foot,0],to:[foot,h],dashed:true}]})});
  }
  if(family==='area-composite'||family==='composite-volume'){
    const w=I(7,12),h=I(6,10),cutW=I(2,4),cutH=I(2,4),dep=I(3,8),pts=[[0,0],[w,0],[w,h-cutH],[w-cutW,h-cutH],[w-cutW,h],[0,h]],base=w*h-cutW*cutH;
    const labels=[{text:`${w} ${unit}`,x:w/2,y:-.7},{text:`${h} ${unit}`,x:-.8,y:h/2},{text:`cut ${cutW} × ${cutH}`,x:w-cutW/2,y:h+.6}];
    const volume=family==='composite-volume',value=volume?base*dep:base;return F(family,{prompt:volume?'Find the volume of the L-shaped prism.':'Find the area of the L-shape.',value,answer:`${value} ${unit}${volume?'³':'²'}`,unit:`${unit}${volume?'³':'²'}`,steps:[`Outer rectangle: ${w} × ${h} = ${w*h}.`,`Remove the cutout: ${cutW} × ${cutH} = ${cutW*cutH}. Base area = ${base}.`,...(volume?[`Volume = base area × depth = ${base} × ${dep} = ${value} ${unit}³.`]:[])],visual:volume?{type:'prism',base:pts,depth:dep,labels,unit}:polygon(pts,labels,{unit})});
  }
  if(family.startsWith('circle-')){
    const r=I(2,60)/2,d=2*r,C=rnd(2*3.14*r),A=rnd(3.14*r*r,4);let given='radius',label=`r = ${r} ${unit}`,prompt,answer,value,steps;
    if(family==='circle-radius-diameter'){const radius=R.bool();given=radius?'diameter':'radius';label=`${radius?'d':'r'} = ${radius?d:r} ${unit}`;value=radius?r:d;prompt=`Find the ${radius?'radius':'diameter'}.`;answer=`${value} ${unit}`;steps=[radius?`Radius is half the diameter: ${d} ÷ 2 = ${r}.`:`Diameter is twice the radius: 2 × ${r} = ${d}.`];}
    else if(family==='circle-reverse'){given='circumference';label=`C = ${C} ${unit}`;prompt='Find the diameter. Use π = 3.14.';value=d;answer=`${d} ${unit}`;steps=[`C = πd, so d = C/π.`,`d = ${C}/3.14 = ${d} ${unit}.`];}
    else if(family==='circle-circumference'){given=['diameter','radius'].includes(problem.visual?.given)?problem.visual.given:R.bool()?'diameter':'radius';label=`${given==='diameter'?'d':'r'} = ${given==='diameter'?d:r} ${unit}`;prompt='Find the circumference. Use π = 3.14.';value=C;answer=`${C} ${unit}`;steps=[given==='diameter'?`Use C = πd.`:`Use C = 2πr. Diameter = 2 × ${r} = ${d}.`,`C = 3.14 × ${d} = ${C} ${unit}.`];}
    else if(family==='circle-explain'){prompt='If the circle is cut into many sectors and rearranged, what is the approximate rectangle base in terms of its circumference C?';value:null;answer='C/2';steps=['Alternate the sectors up and down.','Half of the circular boundary lies along each long edge.','The base is C/2 = πr; the height is r.'];}
    else{given=problem.visual?.given==='radius'?'radius':'diameter';label=`${given==='radius'?'r':'d'} = ${given==='radius'?r:d} ${unit}`;prompt='Find the area. Use π = 3.14.';value=A;answer=`${A} ${unit}²`;steps=[...(given==='diameter'?[`Find the radius: r = ${d}/2 = ${r}.`]:[]),`A = πr² = 3.14 × ${r}² = ${A} ${unit}².`];}
    return F(family,{prompt,value,answer,steps,unit:family==='circle-area'?`${unit}²`:unit,visual:{type:'circle',r,given,label,unit},accept:family==='circle-explain'?['C/2','0.5C','half the circumference','πr','pi r']:[]});
  }
  if(['rectangular-volume','rectangular-surface','triangular-volume','triangular-surface'].includes(family)){
    const tri=family.startsWith('triangular'),volume=family.endsWith('volume'),k=I(1,3),w=tri?4*k:I(3,9),h=tri?3*k:I(2,7),depth=I(3,10),base=tri?[[0,0],[w,0],[0,h]]:[[0,0],[w,0],[w,h],[0,h]],B=area(base),p=perimeter(base),value=volume?B*depth:2*B+p*depth;
    return F(family,{prompt:`Find the ${volume?'volume':'total surface area'} of the ${tri?'triangular':'rectangular'} prism.`,value,answer:`${rnd(value)} ${unit}${volume?'³':'²'}`,unit:`${unit}${volume?'³':'²'}`,steps:[`Base area = ${tri?'1/2 × ':''}${w} × ${h} = ${B}.`,...(volume?[`V = B × depth = ${B} × ${depth} = ${value} ${unit}³.`]:[`Base perimeter = ${rnd(p)}; lateral area = ${rnd(p)} × ${depth} = ${rnd(p*depth)}.`,`Total surface area = 2(${B}) + ${rnd(p*depth)} = ${rnd(value)} ${unit}².`])],visual:{type:'prism',base,depth,unit,labels:[{text:`${w} ${unit}`,x:w/2,y:-.6},{text:`${h} ${unit}`,x:-.6,y:h/2},...(tri?[{text:`${5*k} ${unit}`,x:w/2,y:h/2}]:[])]}});
  }
  if(family==='pyramid-surface'){
    const k=I(1,3),w=6*k,height=4*k,slant=5*k,lateral=4*.5*w*slant,total=lateral+w*w;return F(family,{prompt:'Find the total surface area of the square pyramid.',value:total,answer:`${total} ${unit}²`,unit:`${unit}²`,steps:[`One triangular side area = 1/2 × ${w} × ${slant} = ${w*slant/2}.`,`Lateral area = 4 × ${w*slant/2} = ${lateral}.`,`Base area = ${w}² = ${w*w}. Total = ${lateral} + ${w*w} = ${total} ${unit}².`],visual:{type:'pyramid',width:w,length:w,height,slant,unit}});
  }
  if(family==='cross-section'){
    const w=I(3,8),h=I(3,7),depth=I(4,9);return F(family,{prompt:'A rectangular prism is sliced parallel to its rectangular base. Name the cross-section.',value:null,answer:'Rectangle',accept:['rectangle','a rectangle','rectangular'],input:'text',steps:['A slice parallel to a prism base has the same shape and dimensions as that base.','The base is a rectangle, so the cross-section is a rectangle.'],visual:{type:'prism',base:[[0,0],[w,0],[w,h],[0,h]],depth,unit,labels:[],slice:.5}});
  }
  throw new Error(`Unsupported practice family ${family}`);
}

// Only recognized quantity labels may follow a number. Do not harvest a number
// from arbitrary prose: a response such as “2 or 7” is not a numeric answer.
const unitWord='(?:(?:square|cubic)\\s+)?(?:units?|centimeters?|millimeters?|kilometers?|meters?|liters?|litres?|gallons?|inch(?:es)?|feet|foot|degrees?|miles?|hours?|minutes?|seconds?|items?|dollars?|cents?|cubes?|cm|mm|km|in|ft|mi|hr|h|s|m)';
const unitSuffix=new RegExp('\\s*(?:(?:%|°|\\$)|'+unitWord+'(?:[²³]|\\^[23])?(?:\\s*(?:/|per)\\s*'+unitWord+')?)\\s*$','i');
function stripNumberDecoration(raw){
  let s=clean(raw).replace(/^\$\s*/,'').replace(/^[a-z]\s*=\s*/i,'');
  s=s.replace(unitSuffix,'').trim();
  if(/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s))s=s.replaceAll(',','');
  return s;
}
function parseNumber(raw){
  if(typeof raw==='number')return Number.isFinite(raw)?raw:NaN;
  let s=stripNumberDecoration(raw);
  // Check a mixed number before removing spaces; -1 1/2 is -1.5, not -5.5.
  const mixed=s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if(mixed&&+mixed[3])return Number(mixed[1])+(mixed[1].startsWith('-')?-1:1)*(+mixed[2]/+mixed[3]);
  s=s.replace(/\s/g,'');
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return Number(s);
  const f=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if(f&&Number(f[2])!==0)return Number(f[1])/Number(f[2]);
  if(/^[\d.()+*/^²³-]+$/.test(s))try{return arithmetic(s);}catch{}
  return NaN;
}
function numbers(raw){
  if(Array.isArray(raw))return raw.flat(Infinity).map(parseNumber);
  let s=clean(raw).replace(/\b[A-Za-z]\s*[:=]?\s*(?=\()/g,'').replace(/[\[\]]/g,'').replace(/\band\b/gi,',').replace(/\)\s*[,;]?\s*\(/g,');(').replace(/\r?\n/g,';');
  s=s.replace(/\b(?:ratio|difference|term\s*\d+)\s*[:=]?\s*/gi,'');
  // Parentheses in ordered pairs group coordinates; parentheses around a fraction
  // are handled by the scalar parser instead.
  if(/[,;]/.test(s))return s.replace(/[()]/g,'').split(/[,;]/).filter(x=>x.trim()).map(parseNumber);
  const one=parseNumber(s);if(Number.isFinite(one))return [one];
  if(/^[+\-\d./\s]+$/.test(s))return s.trim().split(/\s+/).map(parseNumber);
  return [];
}
const normalizedText=s=>clean(s).toLowerCase().replace(/\s+/g,'').replaceAll('≤','<=').replaceAll('≥','>=').replace(/[.,;!?]$/,'');
/* Restricted arithmetic for numeric answers and sequence rules. Tokens are
   parsed directly; student input is never passed to eval or Function. */
function arithmetic(raw,n){
  const s=clean(raw).replaceAll('²','^2').replaceAll('³','^3').replaceAll('**','^').replace(/\s/g,'').replace(/(\d|\)|n)(?=[(n])/g,'$1*');
  if(s.length>512)throw Error('Expression too long');
  const tok=s.match(/\d*\.?\d+|[n()+\-*/^]/g);if(!tok||tok.join('')!==s||tok.length>256)throw Error('Bad arithmetic');let pos=0;
  function atom(){const t=tok[pos++];if(t==='('){const a=sum();if(tok[pos++]!==')')throw Error('Unclosed');return a;}if(t==='n'&&Number.isFinite(n))return n;if(t!==undefined&&!isNaN(+t))return +t;throw Error('Bad atom');}
  function power(){let a=atom();if(tok[pos]==='^'){pos++;const b=unary();if(Math.abs(b)>32)throw Error('Exponent too large');a=a**b;}return a;}
  function unary(){if(tok[pos]==='-'){pos++;return -unary();}if(tok[pos]==='+'){pos++;return unary();}return power();}
  function product(){let a=unary();while(tok[pos]==='*'||tok[pos]==='/'){const op=tok[pos++],b=unary();a=op==='*'?a*b:a/b;}return a;}
  function sum(){let a=product();while(tok[pos]==='+'||tok[pos]==='-'){const op=tok[pos++],b=product();a=op==='+'?a+b:a-b;}return a;}
  const result=sum();if(pos!==tok.length||!Number.isFinite(result))throw Error('Invalid result');return result;
}
/* A tiny, restricted linear-expression parser for equivalence; it never runs JavaScript. */
function linear(raw,variables=['x']){
  let s=clean(raw).replace(/\s/g,'').replace(/(\d|\))(?=[xy]|\()/g,'$1*').replace(/[xy](?=\()/g,'$&*');
  if(s.length>512)throw Error('Expression too long');
  const tok=s.match(/\d*\.?\d+|[xy]|[()+\-*/]/g);if(!tok||tok.join('')!==s)throw Error('Bad expression');let pos=0;
  const size=variables.length,constant=n=>[...variables.map(()=>0),n],plus=(a,b,sg=1)=>a.map((v,i)=>v+sg*b[i]),hasVariable=a=>a.slice(0,size).some(v=>v!==0);
  function atom(){const t=tok[pos++];if(t==='-')return atom().map(v=>-v);if(t==='+')return atom();if(variables.includes(t)){const a=constant(0);a[variables.indexOf(t)]=1;return a;}if(t==='('){const a=sum();if(tok[pos++]!==')')throw Error('Unclosed');return a;}if(t!==undefined&&!isNaN(+t))return constant(+t);throw Error('Bad atom');}
  function product(){let a=atom();while(tok[pos]==='*'||tok[pos]==='/'){const op=tok[pos++],b=atom();if(op==='*'){if(hasVariable(a)&&hasVariable(b))throw Error('Nonlinear');a=a.map((v,i)=>i===size?v*b[size]:v*b[size]+b[i]*a[size]);}else{if(hasVariable(b)||!b[size])throw Error('Bad divisor');a=a.map(v=>v/b[size]);}}return a;}
  function sum(){let a=product();while(tok[pos]==='+'||tok[pos]==='-'){const op=tok[pos++];a=plus(a,product(),op==='+'?1:-1);}return a;}
  const result=sum();if(pos!==tok.length)throw Error('Trailing');return result;
}

export function checkAnswer(problem,raw){
  const expected=String(problem.answer??''),output={correct:false,normalized:String(raw??'').trim(),expected};
  if(!output.normalized)return output;
  const candidates=[expected,...(problem.accept||[])].map(normalizedText),norm=normalizedText(raw);
  if(candidates.includes(norm))return {...output,correct:true};
  const tolerance=problem.tolerance??(problem.rounding===2?.0051:1e-6);
  const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=Math.max(tolerance,Math.abs(b)*1e-8);
  if(typeof problem.value==='number'){
    const actual=parseNumber(raw);
    return {...output,correct:close(actual,problem.value)};
  }
  if(Array.isArray(problem.value)){
    const actual=numbers(raw),values=problem.value.flat();return {...output,correct:actual.length===values.length&&actual.every((a,i)=>close(a,values[i]))};
  }
  if((problem.family||'').startsWith('inequality')){
    const parse=s=>{
      const bits=clean(s).replaceAll('≤','<=').replaceAll('≥','>=').split(';'),match=bits[0].trim().match(/^(.+?)\s*(<=|>=|<|>)\s*(.+?)\.?$/);
      if(!match)return null;const reverse={'<':'>','>':'<','<=':'>=','>=':'<='};
      try{const side=s=>Number.isFinite(parseNumber(s))?[0,parseNumber(s)]:linear(s),left=side(match[1]),right=side(match[3]),coefficient=left[0]-right[0],constant=right[1]-left[1];if(coefficient)return [coefficient<0?reverse[match[2]]:match[2],constant/coefficient,bits.slice(1).join(';')];}catch{}
      return null;
    };
    const a=parse(raw),b=parse(expected);
    if(a&&b){const needed=b[2].match(/\b(yes|no)\b/i)?.[1],provided=a[2].match(/\b(yes|no)\b/i)?.[1];return {...output,correct:a[0]===b[0]&&close(a[1],b[1])&&(!needed||needed.toLowerCase()===provided?.toLowerCase())};}
  }
  if(problem.sequence&&typeof problem.value!=='number'&&!Array.isArray(problem.value)){
    try{
      const bits=clean(raw).split(';'),sequence=problem.sequence,term=n=>sequence.kind==='geometric'?sequence.first*sequence.ratio**(n-1):sequence.first+sequence.difference*(n-1);
      const rule=bits.at(-1).trim().replace(/^(?:term\s*n|a_?n|a\(n\)|term\s*value|value|y)\s*=\s*/i,'');
      const rulesMatch=[1,2,3,4,7].every(n=>close(arithmetic(rule,n),term(n)));
      const asksTerms=problem.subtype==='next-rule'||/next two terms.+(?:rule|formula)/i.test(problem.prompt||'');
      const entered=asksTerms?numbers(bits.slice(0,-1).join(';')):[];
      const termsMatch=!asksTerms||(entered.length===2&&entered.every((v,i)=>close(v,term(i+4))));
      return {...output,correct:rulesMatch&&termsMatch};
    }catch{}
  }
  if(problem.family==='proportion-equation'){
    try{const equation=s=>{const sides=clean(s).split('=');if(sides.length!==2)throw Error('Equation required');const left=linear(sides[0],['x','y']),right=linear(sides[1],['x','y']),v=left.map((n,i)=>n-right[i]);if(!v[1])throw Error('y required');return v.map(n=>n/v[1]);};const aa=equation(raw),bb=equation(expected);return {...output,correct:aa.every((v,i)=>close(v,bb[i]))};}catch{}
  }
  if(problem.algebraic||/simplify|expand|factor/.test(String(problem.prompt).toLowerCase())){
    try{
      const expectedVars=[...new Set(clean(expected).match(/[a-z]/gi)||[])],actualVars=[...new Set(clean(raw).match(/[a-z]/gi)||[])];
      if(expectedVars.length!==1||actualVars.some(v=>v!==expectedVars[0]))throw Error('Variable mismatch');
      const variable=expectedVars[0],a=linear(clean(raw).replaceAll(variable,'x')),b=linear(clean(expected).replaceAll(variable,'x'));
      const equivalent=a.every((v,i)=>close(v,b[i])),factoring=problem.requiredForm==='factored'||/^factor/i.test(problem.prompt||''),specified=clean(problem.prompt||'').match(/factor out\s+([+-]?[\d.]+(?:\/[\d.]+)?)/i);
      const factored=clean(raw).replace(/\s/g,'').match(/^\(?([+-]?[\d.]+(?:\/[\d.]+)?)\)?\*?\((.+)\)$/);
      let formOK=!factoring||!!factored;
      if(specified)formOK=formOK&&!!factored&&close(parseNumber(factored[1]),parseNumber(specified[1]));
      if(factoring&&/completely/i.test(problem.prompt||'')&&factored){const inner=linear(factored[2].replaceAll(variable,'x'));formOK=formOK&&inner.every(Number.isInteger)&&gcd(...inner)===1;}
      return {...output,correct:equivalent&&formOK};
    }catch{}
  }
  const family=problem.family||identify(problem),isExplanation=problem.freeResponse||/explain|describe|why|derive|rule|term n|name.*quadrant/.test(String(problem.prompt).toLowerCase())||family==='circle-explain';
  return {...output,...(isExplanation?{needsReview:true}:{} )};
}
export const isCorrect=(problem,raw)=>checkAnswer(problem,raw).correct;
export const practiceFamilies=['integer-add','integer-subtract','integer-multiply','integer-divide','absolute','compare','fraction-add','fraction-multiply','fraction-divide','decimal','convert','mixed-order','combine-terms','expand','factor','equation-one','equation-two','equation-multi','equation-division-position','inequality','arithmetic-sequence','geometric-sequence','plot','proportion-graph','proportion-table','unit-rate','percent','percent-change','percent-error','simple-interest','angle-complement','angle-supplement','angle-vertical','triangle-possible','triangle-construct','scale','perimeter','area-rectangle','area-triangle','area-parallelogram','area-trapezoid','area-composite','composite-volume','circle-radius-diameter','circle-reverse','circle-circumference','circle-area','circle-explain','rectangular-volume','rectangular-surface','triangular-volume','triangular-surface','pyramid-surface','cross-section'];
