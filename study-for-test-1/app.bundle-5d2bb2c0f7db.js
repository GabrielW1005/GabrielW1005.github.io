/* Study for Test 1: app, packet data, and visualizations in one request. */
(()=>{
"use strict";
const __studyModules=Object.create(null);
__studyModules["generators.js"] = (() => {
/* Deterministic practice: the index is a seed, so saved work always reopens the same problem. */
const MAX_EXAMPLE_INDEX = 1000000;
const units = ['cm','m','mm','ft'];
const clean = n => Number(Number(n).toFixed(10));
const fmt = n => String(clean(n));
// School rounding: exact half-way positive decimals round up, even when a
// binary floating-point product lands one representable number below the tie.
const rounded = (n,d=2) => Math.round((n+Number.EPSILON*Math.max(1,Math.abs(n))*2)*10**d)/10**d;
function random(seed) { let s=seed>>>0; return () => { s+=0x6D2B79F5; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
const numeric = (key,label,value,unit='',tolerance=.0001,answer) => ({key,label,value:clean(value),unit,tolerance,answer:answer ?? `${fmt(value)}${unit ? ' '+unit : ''}`});
const text = (key,label,answer,accepted) => ({key,label,value:null,tolerance:0,answer,...(accepted ? {accepted} : {})});
function circle(radius,given,unit) {
  const diameter=2*radius, circumference=clean(3.14*diameter);
  return {type:'circle',radius,given,unit,show_radius:true,show_diameter:true,
    radius_label:given==='radius'||given==='both' ? `r = ${fmt(radius)} ${unit}` : 'r = ?',
    diameter_label:given==='diameter'||given==='both' ? `d = ${fmt(diameter)} ${unit}` : 'd = ?',
    label:given==='circumference' ? `C = ${fmt(circumference)} ${unit}` : `${fmt(given==='diameter' ? diameter : radius)} ${unit}`};
}
function rearranged(n,r,unit,labels=false) {
  const base=n*r*Math.sin(Math.PI/n), height=r*Math.cos(Math.PI/n);
  return {type:'polygon_rearrange',n,radius:r,base,height,base_display:base.toFixed(6),height_display:height.toFixed(6),show_polygon:true,show_rearranged:true,label_dimensions:labels,show_radius_comparison:true,unit};
}
function makeGenerated(base,index) {
  const id=Number(base.id), serial=index-(base.variants?.length||0)-1;
  const rng=random(Math.imul(id,0x9e3779b1)^Math.imul(index,0x85ebca6b));
  const int=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const u=units[int(0,units.length-1)], u2=u+'²', u3=u+'³';
  const seq=(size,offset=0)=>(serial+id*13+offset)%size;
  const p={...base,generated:true,variantIndex:index,fields:[],solution:[],diagram:base.diagram ? structuredClone(base.diagram) : null};
  delete p.variants;
  const set=(fields,solution,diagram=p.diagram,prompt=base.prompt)=>Object.assign(p,{fields,solution,diagram,prompt});
  const area=(value,steps,d,prompt=base.prompt)=>set([numeric('a','Area',value,u2)],steps,d,prompt);
  const volume=(value,steps,d,prompt=base.prompt)=>set([numeric('a','Volume',value,u3)],steps,d,prompt);
  const r=(4+seq(60))/2;
  switch(id) {
    case 1: {
      const n=2+seq(23), length=n;
      set([numeric('a','Number of pieces',n)],[`Each piece is 1 ${u} long.`,`Number of pieces = ${length} ÷ 1 = ${n}.`],{...p.diagram,length,unit:u},`How many 1 ${u} line pieces fit along the ${length} ${u} line?`); break;
    }
    case 2: case 3: {
      const n=2+seq(19),length=n+.5;
      set([numeric('a','Whole pieces',n),numeric('b','Half pieces',1),numeric('c','Total length',length,u)],
        [`The line holds ${n} whole unit pieces and one half piece.`,`A half of 1 ${u} is 0.5 ${u}.`,`Total length = ${n} + 0.5 = ${fmt(length)} ${u}.`],{...p.diagram,length,unit:u},`Use whole 1 ${u} line pieces and half pieces to measure the line.`); break;
    }
    case 4: {
      const a=int(2,7),b=int(1,5),c=int(2,7)+.5,total=a+b+c;
      set([numeric('a','Whole pieces',Math.floor(total)),numeric('b','Half pieces',1),numeric('c','Total length',total,u)],
        [`Follow all three sections: ${a} + ${b} + ${c} = ${total} ${u}.`,`This uses ${Math.floor(total)} whole pieces and one half piece.`,`The half piece contributes 0.5 ${u}.`],{...p.diagram,points:[[0,0],[a,0],[a,b],[a+c,b]],unit:u},`Repeat 1 ${u} line pieces along the bent path. Cut a piece in half to fill the last space.`); break;
    }
    case 5: case 19: {
      const w=int(3,18),h=int(2,12),d={...p.diagram,width:w,height:h,unit:u};
      if(id===5)set([numeric('a','Perimeter',2*(w+h),u)],[`Opposite sides have the same length: ${w}, ${h}, ${w}, ${h}.`,`Perimeter = ${w} + ${h} + ${w} + ${h} = ${2*(w+h)} ${u}.`],d);
      else area(w*h,[`Area = length × width.`,`A = ${w} × ${h} = ${w*h} ${u2}.`],d);
      break;
    }
    case 6: case 22: {
      const tw=int(2,9),rh=int(1,5),w=tw+int(2,7),h=rh+int(2,8),d={...p.diagram,width:w,height:h,top_width:tw,right_height:rh,unit:u};
      if(id===6)set([numeric('a','Perimeter',2*(w+h),u)],[`Missing horizontal side = ${w} − ${tw} = ${w-tw} ${u}.`,`Missing vertical side = ${h} − ${rh} = ${h-rh} ${u}.`,`Add the outside sides: ${w} + ${rh} + ${w-tw} + ${h-rh} + ${tw} + ${h} = ${2*(w+h)} ${u}.`],d);
      else area(tw*h+(w-tw)*rh,[`Split the L into a ${tw} × ${h} rectangle and a ${w-tw} × ${rh} rectangle.`,`Areas = ${tw*h} and ${(w-tw)*rh} ${u2}.`,`Total area = ${tw*h} + ${(w-tw)*rh} = ${tw*h+(w-tw)*rh} ${u2}.`],d);
      break;
    }
    case 7: {
      const letters='ABCDEFGHJKLMNPQRSTUVWXYZ',start=seq(letters.length),names=Array.from({length:4},(_,i)=>letters[(start+i*5)%letters.length]);
      const [v,a,b,c]=names,angle=int(25,65),end=angle+int(35,80);
      set([text('a','Angle 1',`∠${a+v+b} or ∠${b+v+a}`,[a+v+b,b+v+a]),text('b','Angle 2',`∠${b+v+c} or ∠${c+v+b}`,[b+v+c,c+v+b])],
        [`Both angles meet at ${v}, so ${v} is the middle letter.`,`Angle 1 uses rays ${v+a} and ${v+b}: ∠${a+v+b} or ∠${b+v+a}.`,`Angle 2 uses rays ${v+b} and ${v+c}: ∠${b+v+c} or ∠${c+v+b}.`],
        {type:'angle_name',vertex:v,rays:[{name:c,angle:0},{name:b,angle},{name:a,angle:end}],sectors:[{start:angle,end,label:'1'},{start:0,end:angle,label:'2'}]}); break;
    }
    case 8: case 11: {
      const x=25+seq(131),rotation=id===11 ? int(10,45) : 0;
      set([numeric('a','x',x,'°')],[`The marked angles face each other across the intersection of two straight lines.`,`They have equal measures, so x = ${x}°.`],{type:'angles',rays:[0,x,180,180+x],sectors:[{start:0,end:x,label:`${x}°`},{start:180,end:180+x,label:'x°'}],right_angle:null,rotation}); break;
    }
    case 9: case 10: {
      const total=id===9 ? 90 : 180,known=(id===9 ? 15 : 25)+seq(id===9 ? 61 : 131),x=total-known;
      set([numeric('a','x',x,'°')],[id===9 ? 'The square corner measures 90°.' : 'Angles along one side of a straight line total 180°.',`x + ${known} = ${total}.`,`x = ${total} − ${known} = ${x}°.`],{type:'angles',rays:[0,x,total],sectors:[{start:0,end:x,label:'x°'},{start:x,end:total,label:`${known}°`}],right_angle:id===9 ? [0,90] : null,rotation:0}); break;
    }
    case 12: {
      const a=int(20,65),b=int(20,75),x=180-a-b;
      set([numeric('a','x',x,'°')],[`The three adjacent angles form a straight angle of 180°.`,`Add the known angles: ${a} + ${b} = ${a+b}°.`,`x = 180 − ${a+b} = ${x}°.`],{type:'angles',rays:[0,a,a+b,180],sectors:[{start:0,end:a,label:`${a}°`},{start:a,end:a+b,label:`${b}°`},{start:a+b,end:180,label:'x°'}],right_angle:null,rotation:0}); break;
    }
    case 13: {
      const w=int(3,10),h=int(2,7);
      set([numeric('a','Number of squares',w*h)],[`There are ${w} squares in each row and ${h} rows.`,`Number of squares = ${w} × ${h} = ${w*h}.`],{...p.diagram,width:w,height:h,unit:u},`Each small square is 1 ${u2}. How many unit squares cover the rectangle?`); break;
    }
    case 14: {
      const w=3+seq(9),whole=w-1;
      set([numeric('a','Whole squares',whole),numeric('b','Half-square pieces',1),numeric('c','Total area',whole+.5,u2)],[`Count ${whole} complete unit squares.`,`The slanted end is one half of a unit square.`,`Area = ${whole} + 0.5 = ${whole+.5} ${u2}.`],{...p.diagram,points:[[0,0],[w,0],[w-1,1],[0,1]],unit:u},`Use whole 1 ${u2} squares and half-square pieces to cover the figure exactly.`); break;
    }
    case 15: case 16: {
      const n=2+seq(9),whole=n*(n-1)/2;
      set([numeric('a','Whole squares',whole),numeric('b','Half-square pieces',n),numeric('c','Total area',n*n/2,u2)],[`Count ${whole} whole squares below the slanted edge.`,`There are ${n} triangular half-squares along the edge.`,`Area = ${whole} + ${n} × 0.5 = ${fmt(n*n/2)} ${u2}.`],{...p.diagram,base:n,height:n,unit:u},`Cover the triangle with 1 ${u2} squares. Count the whole squares and the triangular half-square pieces, then find its area.`); break;
    }
    case 17: case 18: case 23: {
      const b=int(4,17),h=int(2,10),shift=int(1,Math.min(4,b-1)),d={...p.diagram,base:b,height:h,shift,unit:u};
      if(id===17)set([numeric('a','Rectangle area',b*h,u2),numeric('b','Parallelogram area',b*h,u2)],[`Slide the cut triangle to complete a rectangle.`,`The new rectangle has base ${b} ${u} and height ${h} ${u}.`,`Both areas equal ${b} × ${h} = ${b*h} ${u2}; no area was lost or added.`],d);
      else if(id===18)set([text('a','Explain',`The rectangle and parallelogram have the same base ${b} ${u} and perpendicular height ${h} ${u}. Moving the triangle preserves area, so both areas are ${b*h} ${u2}.`)],
        ['Cut along the perpendicular height and move the triangle to the other side.',`The result is a rectangle with base ${b} ${u} and height ${h} ${u}.`,`The pieces cover the same area, so A = base × height = ${b} × ${h} = ${b*h} ${u2} for both.`],d);
      else area(b*h,[`Use the perpendicular height ${h} ${u}, not a slanted side.`,`Area = base × height = ${b} × ${h} = ${b*h} ${u2}.`],d);
      break;
    }
    case 20: {
      const b=int(4,20),h=int(2,12);
      area(b*h/2,[`The matching rectangle has area ${b} × ${h} = ${b*h} ${u2}.`,`A triangle with that base and height has half that area.`,`A = ½ × ${b} × ${h} = ${fmt(b*h/2)} ${u2}.`],{...p.diagram,base:b,height:h,apex_x:b/3,unit:u}); break;
    }
    case 21: {
      const top=int(3,12),bottom=top+2*int(1,5),h=int(2,10),side=(bottom-top)/2;
      area((top+bottom)*h/2,[`Split the shape into a ${top} × ${h} rectangle and two triangles.`,`Together the triangles have area 2 × ½ × ${side} × ${h} = ${side*h} ${u2}.`,`Total area = ${top*h} + ${side*h} = ${(top+bottom)*h/2} ${u2}.`],{...p.diagram,top,bottom,height:h,unit:u}); break;
    }
    case 24: {
      const w=int(4,16),wall=int(2,8),roof=int(2,7),a=w*wall+w*roof/2;
      area(a,[`Rectangle area = ${w} × ${wall} = ${w*wall} ${u2}.`,`Triangle area = ½ × ${w} × ${roof} = ${fmt(w*roof/2)} ${u2}.`,`Total area = ${w*wall} + ${fmt(w*roof/2)} = ${fmt(a)} ${u2}.`],{...p.diagram,width:w,wall_height:wall,roof_height:roof,unit:u}); break;
    }
    case 25: {
      const n=2+seq(8);
      set([numeric('a','Number of unit cubes',n**3)],[`Each layer contains ${n} × ${n} = ${n*n} unit cubes.`,`There are ${n} layers.`,`Total = ${n*n} × ${n} = ${n**3} unit cubes.`],{...p.diagram,side:n,unit:u},`How many 1 ${u3} cubes fit inside this larger cube?`); break;
    }
    case 26: {
      const l=int(2,7)+.5,w=int(1,3),h=int(1,2),whole=Math.floor(l)*w*h,halves=w*h;
      set([numeric('a','Whole cubes',whole),numeric('b','Half-cube blocks',halves),numeric('c','Total volume',l*w*h,u3)],[`The full-width part holds ${Math.floor(l)} × ${w} × ${h} = ${whole} whole cubes.`,`The half-width strip needs ${w} × ${h} = ${halves} half-cube blocks.`,`Volume = ${whole} + ${halves} × 0.5 = ${fmt(l*w*h)} ${u3}.`],{...p.diagram,length:l,width:w,height:h,unit:u},`Fill the prism with 1 ${u3} cubes. Cut cubes into two equal blocks to fill the half-unit strip.`); break;
    }
    case 27: case 29: {
      const n=int(2,7),l=int(1,4),a=n*n/2,whole=n*(n-1)/2*l,halves=n*l,d={...p.diagram,base:n,triangle_height:n,length:l,unit:u};
      if(id===27)set([numeric('a','Whole cubes',whole),numeric('b','Half-cube pieces',halves),numeric('c','Total volume',a*l,u3)],[`Each layer contains ${n*(n-1)/2} whole cubes and ${n} diagonal half-cubes.`,`Across ${l} layers, there are ${whole} whole cubes and ${halves} halves.`,`Volume = ${whole} + ${halves} × 0.5 = ${fmt(a*l)} ${u3}.`],d,`Fill the prism with 1 ${u3} cubes and diagonal half-cube pieces. Find the piece counts and volume.`);
      else volume(a*l,[`Area of triangular end = ½ × ${n} × ${n} = ${fmt(a)} ${u2}.`,`Volume = end area × prism length.`,`V = ${fmt(a)} × ${l} = ${fmt(a*l)} ${u3}.`],d);
      break;
    }
    case 28: {
      const l=int(3,14),w=int(2,8),h=int(2,9);
      volume(l*w*h,[`Area of rectangular base = ${l} × ${w} = ${l*w} ${u2}.`,`Volume = base area × height = ${l*w} × ${h} = ${l*w*h} ${u3}.`],{...p.diagram,length:l,width:w,height:h,unit:u}); break;
    }
    case 30: case 67: {
      const tw=int(1,3)+(id===30 ? .5 : 0),rh=int(1,3),w=tw+int(1,3),h=rh+int(1,4),l=int(1,4),a=tw*h+(w-tw)*rh;
      volume(a*l,[`Split the L-shaped end into rectangles: ${fmt(tw)} × ${h} and ${fmt(w-tw)} × ${rh}.`,`End area = ${fmt(tw*h)} + ${fmt((w-tw)*rh)} = ${fmt(a)} ${u2}.`,`Volume = ${fmt(a)} × ${l} = ${fmt(a*l)} ${u3}.`],{...p.diagram,width:w,height:h,top_width:tw,right_height:rh,length:l,unit:u}); break;
    }
    case 31: case 32: case 33: {
      const n=id===31?6:id===32?12:24,s=Number((2*r*Math.sin(Math.PI/n)).toFixed(9));
      // Carry the displayed decimal side exactly through the requested chain:
      // side (9 places) -> perimeter (6 places) -> P/d (6 places).
      const sideNanounits=BigInt(s.toFixed(9).replace('.',''));
      const perimeterMicros=(sideNanounits*BigInt(n)+500n)/1000n;
      const diameter=BigInt(2*r);
      const ratioMicros=(2n*perimeterMicros+diameter)/(2n*diameter);
      const perimeter=Number(perimeterMicros)/1e6,ratio=Number(ratioMicros)/1e6;
      set([numeric('a','Perimeter P',perimeter,u,.00000055,`${perimeter.toFixed(6)} ${u}`),numeric('b','P ÷ d',ratio,'',.00000055,ratio.toFixed(6))],
        [`All ${n} sides are equal, so P = ${n} × ${s.toFixed(9)}.`,`P ≈ ${perimeter.toFixed(6)} ${u}.`,`P ÷ d ≈ ${perimeter.toFixed(6)} ÷ ${fmt(2*r)} ≈ ${ratio.toFixed(6)}.`],
        {...p.diagram,n,radius:r,diameter:2*r,side_length:s,side_display:s.toFixed(9),side_length_label:`${s.toFixed(9)} ${u}`,unit:u},`Regular ${n}-gon: find perimeter P and P ÷ d to six decimal places. Circle reference: C = πd = 2πr.`); break;
    }
    case 34: {
      set([text('a','Explain',`The diameter is twice the radius: ${fmt(2*r)} = 2 × ${fmt(r)}. Thus πd = π(${fmt(2*r)}) = 2π(${fmt(r)}), so both formulas give the same circumference.`)],
        [`The diameter crosses two radii: d = 2 × ${fmt(r)} = ${fmt(2*r)} ${u}.`,'Substitute d = 2r into C = πd.','C = π(2r) = 2πr; the factors can be multiplied in either order.'],circle(r,'both',u),`The circle has radius ${fmt(r)} ${u} and diameter ${fmt(2*r)} ${u}. Explain why C = πd and C = 2πr give the same circumference.`); break;
    }
    case 35: case 36: case 49: case 50: case 51: case 52: case 53: case 54: {
      const d=2*r,c=clean(3.14*d),a=rounded(3.14*r*r,2);
      if(id===35)set([numeric('a','Diameter',d,u)],[`Use C = πd. Divide both sides by π.`,`d = ${fmt(c)} ÷ 3.14 = ${fmt(d)} ${u}.`],circle(r,'circumference',u),`The circumference is ${fmt(c)} ${u}. Find the diameter. Use C = πd and π = 3.14.`);
      if(id===36)set([numeric('a','Diameter',d,u),numeric('b','Radius',r,u)],[`d = C ÷ π = ${fmt(c)} ÷ 3.14 = ${fmt(d)} ${u}.`,`r = d ÷ 2 = ${fmt(d)} ÷ 2 = ${fmt(r)} ${u}.`],circle(r,'circumference',u),`The circumference is ${fmt(c)} ${u}. Find the diameter, then the radius. Use π = 3.14.`);
      if(id===49)set([numeric('a','Radius',r,u)],[`The diameter is twice the radius.`,`r = d ÷ 2 = ${fmt(d)} ÷ 2 = ${fmt(r)} ${u}.`],circle(r,'diameter',u));
      if(id===50)set([numeric('a','Diameter',d,u)],[`Two radii make one diameter.`,`d = 2r = 2 × ${fmt(r)} = ${fmt(d)} ${u}.`],circle(r,'radius',u));
      if(id===51)set([numeric('a','Radius',r,u),numeric('b','Area',a,u2,.0051,a.toFixed(2)+' '+u2)],[`r = ${fmt(d)} ÷ 2 = ${fmt(r)} ${u}.`,`Square the radius: ${fmt(r)}² = ${fmt(r*r)}.`,`A = 3.14 × ${fmt(r*r)} ≈ ${a.toFixed(2)} ${u2}.`],circle(r,'diameter',u),'Find the radius and circle area. Use A = πr² and π = 3.14. Round area to the nearest 0.01.');
      if(id===52)set([numeric('a','Diameter',d,u),numeric('b','Circumference',c,u,.0051)],[`d = 2 × ${fmt(r)} = ${fmt(d)} ${u}.`,`C = πd = 3.14 × ${fmt(d)} = ${fmt(c)} ${u}.`],circle(r,'radius',u));
      if(id===53)set([numeric('a','Radius',r,u),numeric('b','Area',a,u2,.0051,a.toFixed(2)+' '+u2)],[`d = C ÷ π = ${fmt(c)} ÷ 3.14 = ${fmt(d)} ${u}.`,`r = ${fmt(d)} ÷ 2 = ${fmt(r)} ${u}.`,`A = 3.14 × ${fmt(r)}² ≈ ${a.toFixed(2)} ${u2}.`],circle(r,'circumference',u),`A circle has circumference ${fmt(c)} ${u}. Find its radius and area. Use C = 2πr, A = πr², and π = 3.14. Round area to the nearest 0.01.`);
      if(id===54)set([numeric('a','Circumference',c,u,.0051)],[`Use the given diameter ${fmt(d)} ${u}.`,`C = πd = 3.14 × ${fmt(d)} = ${fmt(c)} ${u}.`],circle(r,'diameter',u));
      break;
    }
    case 37: {
      const a=rounded(3.14*r*r,2);
      set([numeric('a','Estimated area',a,u2,.0051,a.toFixed(2)+' '+u2)],[`Use the surrounding circle's radius ${fmt(r)} ${u}.`,`A ≈ 3.14 × ${fmt(r)}² = 3.14 × ${fmt(r*r)} ≈ ${a.toFixed(2)} ${u2}.`,'The circle formula gives an estimate for the polygon, not its exact area.'],{...p.diagram,radius:r,diameter:2*r,unit:u},'Estimate the regular 12-gon area using the surrounding circle: A ≈ πr². Use π = 3.14 and round to the nearest 0.01.'); break;
    }
    case 38: case 39: {
      const h=r/2,a=r*h/2,poly=12*a,d={...p.diagram,radius:r,radial_base:r,perpendicular_height:h,unit:u};
      if(id===38)set([numeric('a','Triangle area',a,u2)],[`Use the labeled radial base ${fmt(r)} ${u} and its perpendicular height ${fmt(h)} ${u}.`,`A = ½ × base × height = ½ × ${fmt(r)} × ${fmt(h)} = ${fmt(a)} ${u2}.`],d);
      else set([numeric('a','12-gon area',poly,u2),numeric('b','Circle estimate minus polygon area',rounded(3.14*r*r-poly,2),u2,.0051)],
        [`One triangle area = ½ × ${fmt(r)} × ${fmt(h)} = ${fmt(a)} ${u2}.`,`All 12 triangles: 12 × ${fmt(a)} = ${fmt(poly)} ${u2}.`,`Circle estimate minus polygon area = 3.14 × ${fmt(r)}² − ${fmt(poly)} ≈ ${rounded(3.14*r*r-poly,2).toFixed(2)} ${u2}.`],d,'The regular 12-gon has 12 equal triangles. Find its exact area using the labeled triangle. How much larger is 3.14r²? Round the difference to the nearest 0.01.'); break;
    }
    case 40: case 41: {
      const perimeter=clean(2*3.14*r),b=clean(3.14*r),n=[12,24,48][serial%3];
      set([numeric('a','Estimated perimeter',perimeter,u,.0051),numeric('b','Estimated base P ÷ 2',b,u,.0051)],[`Estimate the perimeter using the circle: P ≈ 2 × 3.14 × ${fmt(r)} = ${fmt(perimeter)} ${u}.`,`Half of the outside edges form the bottom of the rearranged figure.`,`Estimated base = ${fmt(perimeter)} ÷ 2 = ${fmt(b)} ${u}.`],rearranged(n,r,u)); break;
    }
    case 42: {
      set([text('a','Base approaches','πr',['πr','pi r','pi*r','pir']),text('b','Compare with diameter',`The base approaches πr, about ${fmt(clean(3.14*r))} ${u}; the diameter is 2r = ${fmt(2*r)} ${u}. Since π > 2, the base is longer.`)],
        ['The base uses half the perimeter: b ≈ (2πr) ÷ 2.','Cancel the factor 2: b approaches πr.',`For r = ${fmt(r)}, the base approaches about ${fmt(clean(3.14*r))} ${u}, while d = ${fmt(2*r)} ${u}.`],rearranged([12,24,48][serial%3],r,u)); break;
    }
    case 43: case 44: case 45: case 46: {
      const n=[6,12,24,48][id-43],d=rearranged(n,r,u,true),a=rounded(d.base*d.height,2),gap=rounded(r-d.height,4),estimate=rounded(3.14*r*r,2);
      set([numeric('a','Area b × h (nearest 0.01)',a,u2,.0051,a.toFixed(2)+' '+u2),numeric('b','r − h (nearest 0.0001)',gap,u,.000051,gap.toFixed(4)+' '+u),numeric('c','Circle estimate 3.14r² (nearest 0.01)',estimate,u2,.0051,estimate.toFixed(2)+' '+u2)],
        [`Multiply the displayed base and height: ${d.base_display} × ${d.height_display} ≈ ${a.toFixed(2)} ${u2}.`,`Compare height with radius: ${fmt(r)} − ${d.height_display} ≈ ${gap.toFixed(4)} ${u}.`,`Circle estimate = 3.14 × ${fmt(r)}² ≈ ${estimate.toFixed(2)} ${u2}.`],d); break;
    }
    case 47: {
      const gaps=[6,12,24,48].map(n=>(r-r*Math.cos(Math.PI/n)).toFixed(4));
      set([text('a','Explain',`The gaps ${gaps.join(', ')} ${u} decrease toward zero. The triangles become narrower, so their perpendicular heights approach their radius-length sides.`)],
        [`For radius ${fmt(r)} ${u}, the gaps for 6, 12, 24 and 48 sides are approximately ${gaps.join(', ')} ${u}.`,'Doubling the number of sides makes each central triangle narrower.','Its perpendicular height gets closer to the radius, so r − h approaches zero.'],rearranged(48,r,u),`All four polygons have radius ${fmt(r)} ${u}. Their r − h gaps are ${gaps.join(', ')} ${u} for 6, 12, 24, and 48 sides. What happens to the gap? Explain why height gets closer to radius.`); break;
    }
    case 48: {
      set([text('a','Base approaches','πr',['πr','pi r','pi*r','pir']),text('b','Height approaches','r',['r','radius']),text('c','Area approaches','πr²',['πr²','pi r^2','pi*r^2','pir^2','pi r squared'])],
        ['Half of the polygon perimeter forms the rearranged base. As the perimeter approaches 2πr, the base approaches πr.','The central triangles get narrower, so their heights approach r.','Area = base × height approaches (πr) × r = πr².'],rearranged([24,48,96][serial%3],r,u)); break;
    }
    case 55: case 56: case 57: {
      const a=int(1,12),b=int(2,15),factor=int(2,6),equal=(serial+id)%2===0,c=a*factor,d=b*factor+(equal?0:1),left=a*d,right=b*c;
      const eq=text(id===57?'c':'a','Equal or not equal',equal?'Equal':'Not equal',equal?['yes','equal']:['no','not equal','unequal']);
      const fields=id===57 ? [numeric('a',`${a} × ${d}`,left),numeric('b',`${b} × ${c}`,right),eq] : [eq,text('b','Cross-product check',`${a} × ${d} = ${left}; ${b} × ${c} = ${right}.`)];
      set(fields,[`Multiply top-left by bottom-right: ${a} × ${d} = ${left}.`,`Multiply bottom-left by top-right: ${b} × ${c} = ${right}.`,equal?'The products are equal, so the fractions are equal.':'The products differ, so the fractions are not equal.'],{type:'ratio',a:String(a),b:String(b),c:String(c),d:String(d)}); break;
    }
    case 58: case 59: {
      const a=int(2,12),b=int(3,20),c=int(2,20),d=int(3,20);
      if(id===58){const x=b*c/d;set([numeric('a','x',x,'',.0001,Number.isInteger(x)?String(x):`${b*c}/${d}`)],[`Cross multiply: ${d}x = ${b} × ${c}.`,`Compute the product: ${d}x = ${b*c}.`,`Divide by ${d}: x = ${b*c}/${d}${Number.isInteger(x)?' = '+x:' (or an equivalent fraction)'}.`],{type:'ratio',a:'x',b:String(b),c:String(c),d:String(d)});}
      else{const x=b*c/a;set([numeric('a','x',x,'',.0001,Number.isInteger(x)?String(x):`${b*c}/${a}`)],[`Cross multiply: ${a}x = ${b} × ${c}.`,`Compute the product: ${a}x = ${b*c}.`,`Divide by ${a}: x = ${b*c}/${a}${Number.isInteger(x)?' = '+x:' (or an equivalent fraction)'}.`],{type:'ratio',a:String(a),b:String(b),c:String(c),d:'x'});}
      break;
    }
    case 60: {
      const k=(2+seq(29))/2,a=int(1,3),xs=[a,a+int(1,2),a+4,a+int(6,9)],y1=k*xs[0],y3=k*xs[2];
      set([numeric('a',`y when x = ${xs[1]}`,k*xs[1]),numeric('b',`y when x = ${xs[3]}`,k*xs[3]),numeric('c','k',k)],
        [`Use a complete row: k = y ÷ x = ${fmt(y1)} ÷ ${xs[0]} = ${fmt(k)}.`,`Use y = ${fmt(k)}x for each blank.`,`At x = ${xs[1]}, y = ${fmt(k*xs[1])}; at x = ${xs[3]}, y = ${fmt(k*xs[3])}.`],{type:'table',headers:['x','y'],rows:[[xs[0],y1],[xs[1],null],[xs[2],y3],[xs[3],null]]}); break;
    }
    case 61: {
      const a=int(2,8),b=int(3,10),groups=int(3,12);
      set([numeric('a','Blue beads',b*groups,'beads')],[`There are ${a*groups} ÷ ${a} = ${groups} groups of the ratio.`,`Each group needs ${b} blue beads.`,`Blue beads = ${groups} × ${b} = ${b*groups}.`],null,`A bracelet uses ${a} orange beads for every ${b} blue beads. It has ${a*groups} orange beads. How many blue beads does it have?`); break;
    }
    case 62: {
      const count=int(2,8),price=(75+seq(31)*5)/100,target=int(3,15),cost=clean(count*price),answer=clean(price*target);
      set([numeric('a','Cost',answer,'dollars',.0001,'$'+answer.toFixed(2))],[`Find the cost of one notebook: $${cost.toFixed(2)} ÷ ${count} = $${price.toFixed(2)}.`,`Multiply by the number wanted: ${target} × $${price.toFixed(2)} = $${answer.toFixed(2)}.`],null,`${count} identical notebooks cost $${cost.toFixed(2)}. Each costs the same amount. What is the cost of ${target} notebooks?`); break;
    }
    case 63: {
      const batches=int(2,5),per=(2+seq(11))/2,cups=per*batches,target=int(3,12);
      set([numeric('a','Flour needed',per*target,'cups')],[`One batch uses ${fmt(cups)} ÷ ${batches} = ${fmt(per)} cups.`,`For ${target} batches: ${fmt(per)} × ${target} = ${fmt(per*target)} cups.`],null,`A muffin recipe uses ${fmt(cups)} cups of flour for ${batches} batches. How many cups are needed for ${target} batches of the same size?`); break;
    }
    case 64: {
      const minutes=int(2,6)*5,rate=(2+seq(7))/20,miles=clean(rate*minutes),target=int(3,12)*5;
      set([numeric('a','Distance',rate*target,'miles')],[`Distance per minute = ${fmt(miles)} ÷ ${minutes} = ${fmt(rate)} mile per minute.`,`In ${target} minutes: ${fmt(rate)} × ${target} = ${fmt(rate*target)} miles.`],null,`A cyclist travels ${fmt(miles)} miles in ${minutes} minutes at a steady speed. How far will the cyclist travel in ${target} minutes?`); break;
    }
    case 65: {
      const scale=int(2,15),length=(3+seq(25))/2;
      set([numeric('a','Actual length',scale*length,'m')],[`Each centimeter on the plan represents ${scale} meters.`,`Actual length = ${fmt(length)} × ${scale} = ${fmt(scale*length)} m.`],{...p.diagram,length,unit:'cm'},`On a garden plan, 1 cm represents ${scale} m. A path is ${fmt(length)} cm long on the plan. Find its actual length.`); break;
    }
    case 66: {
      const a=int(4,10),b=int(4,12),pa=(35+seq(16)*5)/100,pb=clean(pa+(serial%2===0 ? 1 : -1)*int(1,4)*.05),ca=clean(a*pa),cb=clean(b*pb),lower=pa<pb?'A':'B';
      set([numeric('a','Pack A price per pen',pa,'dollars',.0001,'$'+pa.toFixed(2)),numeric('b','Pack B price per pen',pb,'dollars',.0001,'$'+pb.toFixed(2)),text('c','Lower unit price','Pack '+lower,['Pack '+lower,lower])],
        [`Pack A: $${ca.toFixed(2)} ÷ ${a} = $${pa.toFixed(2)} per pen.`,`Pack B: $${cb.toFixed(2)} ÷ ${b} = $${pb.toFixed(2)} per pen.`,`Compare the unit prices: Pack ${lower} costs less per pen.`],null,`Pack A has ${a} pens for $${ca.toFixed(2)}. Pack B has ${b} pens for $${cb.toFixed(2)}. Find each price per pen. Which pack has the lower unit price?`); break;
    }
    case 68: {
      const stem=int(1,3),w=stem+2*int(1,3),top=int(1,2),h=top+int(2,5),l=int(1,4),a=w*top+stem*(h-top);
      volume(a*l,[`Top rectangle area = ${w} × ${top} = ${w*top} ${u2}.`,`Lower stem area = ${stem} × (${h} − ${top}) = ${stem*(h-top)} ${u2}.`,`End area = ${a} ${u2}; volume = ${a} × ${l} = ${a*l} ${u3}.`],{...p.diagram,width:w,height:h,top_height:top,stem_width:stem,length:l,unit:u}); break;
    }
    case 69: {
      const k=(2+seq(31))/2,step=1+Math.floor(serial/31)%2,xs=[0,step,3*step,5*step],ys=xs.map(x=>x*k),points=xs.map((x,i)=>[x,ys[i]]),read=4*step;
      set([text('a','y-values in order',ys.map(fmt).join(', '),[ys.map(fmt).join(',')]),text('b','Plot the points',points.map(pt=>`(${pt.map(fmt).join(', ')})`).join(', ')),numeric('c',`Water after ${read} minutes`,k*read,'liters')],
        [`The rate is ${fmt(k)} liters per minute, so y = ${fmt(k)}x.`,`Substitute x = ${xs.join(', ')} to get y = ${ys.map(fmt).join(', ')}.`,`Plot ${points.map(pt=>`(${pt.map(fmt).join(', ')})`).join(', ')} and connect them with a straight line.`,`After ${read} minutes: y = ${fmt(k)} × ${read} = ${fmt(k*read)} liters.`],
        {...p.diagram,slope:k,xmax:6*step,ymax:6*step*k,xstep:step,ystep:step*k,points:[],expected_points:points,table:{headers:['x: minutes','y: liters'],rows:xs.map(x=>[x,null])}},`Water enters an empty container at ${fmt(k)} liters per minute. Complete y for x = ${xs.join(', ')}. Plot the four points and connect them with a straight line. Then read the amount after ${read} minutes.`); break;
    }
    case 70: {
      const k=(2+seq(31))/2,read=2+serial%3;
      set([numeric('a','Distance per hour',k,'km/h'),numeric('b',`Distance after ${read} hours`,k*read,'km')],[`Read the point (1, ${fmt(k)}): the distance per hour is ${fmt(k)} km/h.`,`Use distance = rate × time.`,`After ${read} hours: ${fmt(k)} × ${read} = ${fmt(k*read)} km.`],{...p.diagram,slope:k,xmax:5,ymax:5*k,xstep:1,ystep:k,points:[[0,0],[1,k],[4,4*k]]},`The graph shows distance traveled at a steady speed. Find the distance per hour. What distance is reached after ${read} hours?`);
      p.hint=`Read the height of the line at x = 1 and x = ${read}.`; break;
    }
    default: throw new RangeError(`No generator for problem ${id}.`);
  }
  return p;
}

function getExample(base,index=0) {
  if (!base || !Number.isInteger(Number(base.id))) throw new TypeError('A packet problem is required.');
  if (!Number.isSafeInteger(index) || index<0 || index>MAX_EXAMPLE_INDEX) throw new RangeError('The example index is out of range.');
  if(index===0)return base;
  if(index<=(base.variants?.length||0))return {...base,...base.variants[index-1],id:base.id};
  let result=makeGenerated(base,index),attempt=0;
  // A worked example must not simply reprint the packet's original givens.
  while(sameGivens(base,result) && attempt<100)result=makeGenerated(base,index+(++attempt)*1000003);
  result.variantIndex=index;
  return result;
}

function sameGivens(a,b) {
  if(!a.diagram || !b.diagram)return a.prompt===b.prompt;
  const x=a.diagram,y=b.diagram;
  if(x.type!==y.type || (x.unit||'')!==(y.unit||''))return false;
  const keys={segment:['length','unit_length'],bent_path:['points'],rectangle:['width','height'],lshape:['width','height','top_width','right_height'],angle_name:['vertex','rays','sectors'],angles:['rays','sectors','rotation'],grid_rectangle:['width','height'],grid_polygon:['points'],grid_triangle:['base','height'],parallelogram_cut:['base','height','shift'],parallelogram:['base','height','shift'],triangle:['base','height','apex_x'],trapezoid:['top','bottom','height'],composite:['width','wall_height','roof_height'],cube_units:['side','unit_edge'],rect_prism:['length','width','height'],triangular_prism:['base','triangle_height','length'],l_prism:['width','height','top_width','right_height','length'],t_prism:['width','height','top_height','stem_width','length'],polygon:['n','radius'],polygon_rearrange:['n','radius'],central_triangle:['n','radius'],circle:['given','radius'],ratio:['a','b','c','d'],table:['rows'],graph:['slope','xmax','xstep']}[x.type];
  return !!keys && keys.every(key=>JSON.stringify(x[key])===JSON.stringify(y[key]));
}

return {MAX_EXAMPLE_INDEX,getExample};
})();

__studyModules["progress.js"] = (() => {
const {getExample,MAX_EXAMPLE_INDEX} = __studyModules["generators.js"];

/* Local learning records and portable, deliberately non-secure student reports. */
const FORMAT = 'study-for-test-1-backup';
const STATUSES = new Set(['correct','incorrect','blank','review','self-reviewed']);
const COMPLETE = new Set(['correct','self-reviewed']);
const MAPS = ['answers','plots','lines','checked','plotChecked','variants','exampleIndices'];
const BAD_KEYS = new Set(['__proto__','prototype','constructor']);
const now = () => new Date().toISOString();
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const finished = fields => Object.keys(fields).length > 0 && Object.values(fields).every(status=>COMPLETE.has(status));
const recordKey = (id,variant=0) => `${Number(id)}:${Number(variant)}`;
const safeCount = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value,1000000) : 0;
const timestamp = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : now();
const flatten = definitions => Array.isArray(definitions) ? definitions : (definitions?.pages || []).flatMap(page=>page.problems || []);
const validVariant = variant => Number.isSafeInteger(variant) && variant >= 0 && variant <= MAX_EXAMPLE_INDEX;
const actualProblem = (problem,variant) => getExample(problem,variant);
// Collect only examples with saved data. A million possible indices must never create a million-row report.
function savedExamples(problems,{records={},variants={},maps=[]}={}) {
  const found = new Map(problems.map(problem=>[Number(problem.id),new Set([0])]));
  const add = (id,variant) => { if (found.has(id) && validVariant(variant)) found.get(id).add(variant); };
  for (const [id,variant] of Object.entries(variants || {})) add(Number(id),Number(variant));
  for (const map of [records,...maps]) for (const key of Object.keys(map || {})) {
    const match = key.match(/^(\d+):(\d+)(?::[^:]+)?$/);
    if (match) add(Number(match[1]),Number(match[2]));
  }
  return found;
}
const isPlotField = (problem,field) => problem.diagram?.student_plot && /plot.*point/i.test(field.label || '');

function createProgressState() { return {version:1,records:{}}; }

function recordCheck(progress,{id,variant=0,fields=[],graphStatus,timestamp:checkedAt} = {}) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1 || !validVariant(Number(variant))) throw new Error('A valid problem and example are required.');
  if (!plain(progress.records)) progress.records = {};
  progress.version = 1;
  const key = recordKey(id,variant), previous = progress.records[key] || {};
  const statuses = {};
  for (const field of fields) {
    if (!field || typeof field.key !== 'string' || BAD_KEYS.has(field.key) || field.key.length > 100) throw new Error('Invalid answer field.');
    statuses[field.key] = STATUSES.has(field.status) ? field.status : 'blank';
  }
  if (graphStatus !== undefined) statuses.$graph = STATUSES.has(graphStatus) ? graphStatus : 'blank';
  const complete = finished(statuses);
  const record = {
    attempts:Math.min(1000000,safeCount(previous.attempts)+1),
    totalCorrectChecks:Math.min(1000000,safeCount(previous.totalCorrectChecks)+(complete ? 1 : 0)),
    lastChecked:timestamp(checkedAt),fields:statuses,complete,
    lastReviewed:previous.lastReviewed || null,
  };
  progress.records[key] = record;
  return record;
}

function recordSelfReview(progress,{id,variant=0,fieldKeys=[],timestamp:reviewedAt} = {}) {
  const record = progress?.records?.[recordKey(id,variant)];
  if (!record || !plain(record.fields)) return null;
  let changed = false;
  for (const key of fieldKeys) if (record.fields[key] === 'review') { record.fields[key] = 'self-reviewed'; changed = true; }
  if (changed) record.lastReviewed = timestamp(reviewedAt);
  record.complete = finished(record.fields);
  return record;
}

function summarizeProgress(progress,definitions,variantsMap={}) {
  const problems = flatten(definitions), records = progress?.records || {};
  const overall = {mainTotal:problems.length,mainAttempted:0,mainComplete:0,extraTotal:null,extraSeen:0,extraAvailableUnlimited:true,extraAttempted:0,extraComplete:0,totalAttempts:0};
  const indices = savedExamples(problems,{records,variants:variantsMap});
  const topics = new Map(), targetedReview = [], missed = new Set(), review = new Set();
  for (const base of problems) {
    const topic = base.topic || 'Mathematics';
    if (!topics.has(topic)) topics.set(topic,{topic,mainTotal:0,mainAttempted:0,mainComplete:0,extraTotal:null,extraSeen:0,extraAvailableUnlimited:true,extraAttempted:0,extraComplete:0,missedIds:[],reviewIds:[]});
    const skill = topics.get(topic); skill.mainTotal++;
    const seen = indices.get(Number(base.id));
    overall.extraSeen += seen.size-1; skill.extraSeen += seen.size-1;
    for (const variant of [...seen].sort((a,b)=>a-b)) {
      const entry = records[recordKey(base.id,variant)];
      if (!entry) continue;
      const attempted = safeCount(entry.attempts)>0 || Object.values(entry.fields || {}).includes('self-reviewed');
      const complete = entry.complete === true && finished(entry.fields || {});
      const prefix = variant ? 'extra' : 'main';
      if (attempted) { overall[prefix+'Attempted']++; skill[prefix+'Attempted']++; }
      if (complete) { overall[prefix+'Complete']++; skill[prefix+'Complete']++; }
      overall.totalAttempts += safeCount(entry.attempts);
      const values = Object.values(entry.fields || {});
      if (!complete && values.includes('incorrect')) {
        missed.add(base.id); if (!skill.missedIds.includes(base.id)) skill.missedIds.push(base.id);
        targetedReview.push({id:base.id,variant,topic,reason:'An answer needs another look.',hint:variant ? actualProblem(base,variant).hint || 'Review the measurements and units, then try again.' : 'Review the diagram, measurements, and units, then explain each step.'});
      } else if (!complete && values.includes('review')) {
        review.add(base.id); if (!skill.reviewIds.includes(base.id)) skill.reviewIds.push(base.id);
        targetedReview.push({id:base.id,variant,topic,reason:variant ? 'Compare your explanation with the example solution.' : 'Review your explanation with the concept guidance or your teacher.',hint:variant ? actualProblem(base,variant).hint || 'Check whether your explanation includes the same mathematical idea.' : 'Review the diagram, measurements, and units, then explain each step.'});
      }
    }
  }
  const mainComplete = problem => records[recordKey(problem.id)]?.complete === true && finished(records[recordKey(problem.id)]?.fields || {});
  let recommended = targetedReview.find(item=>item.variant===0) || null;
  if (!recommended) { const problem = problems.find(p=>!mainComplete(p)); if (problem) recommended = {id:problem.id,variant:0}; }
  if (!recommended) recommended = targetedReview[0] || null;
  if (!recommended) for (const problem of problems) {
    const preferred = Number(variantsMap[problem.id] || 0);
    let variant = validVariant(preferred) && preferred>0 && !records[recordKey(problem.id,preferred)]?.complete ? preferred : 1;
    while (variant<=MAX_EXAMPLE_INDEX && records[recordKey(problem.id,variant)]?.complete) variant++;
    if (variant<=MAX_EXAMPLE_INDEX) { recommended = {id:problem.id,variant}; break; }
  }
  return {overall,topics:[...topics.values()],missedIds:[...missed],reviewIds:[...review],targetedReview,recommendedId:recommended?.id ?? null,recommendedVariant:recommended?.variant ?? 0};
}

function reportRows(data,state) {
  const rows = [], problems = flatten(data);
  const indices = savedExamples(problems,{records:state.progress?.records,variants:state.variants,maps:[state.answers,state.plots,state.lines,state.checked,state.plotChecked]});
  for (const base of problems) for (const variant of [...indices.get(Number(base.id))].sort((a,b)=>a-b)) {
    const key = recordKey(base.id,variant), entry = state.progress?.records?.[key];
    const problem = actualProblem(base,variant);
    const responses = (problem.fields || []).map(field=>({field,answer:isPlotField(problem,field) ? (state.plots?.[key] || []).map(pt=>`(${pt[0]}, ${pt[1]})`).join('; ') : String(state.answers?.[`${key}:${field.key}`] ?? ''),status:entry?.fields?.[field.key] || (isPlotField(problem,field) ? entry?.fields?.$graph : '') || 'not checked'}));
    if (variant && !entry && !responses.some(item=>item.answer.trim())) continue;
    rows.push({id:base.id,variant,topic:problem.topic || base.topic || 'Mathematics',prompt:problem.prompt,attempts:safeCount(entry?.attempts),complete:entry?.complete === true && finished(entry.fields || {}),entry,responses});
  }
  return rows;
}
function statusLabel(value) { return ({correct:'Correct',incorrect:'Needs review',blank:'Incomplete',review:'Explanation review needed','self-reviewed':'Self-reviewed'})[value] || 'Not checked'; }

function makeReportHTML({data,state,studentName='',createdAt=now()}) {
  const summary = summarizeProgress(state.progress,data,state.variants), rows = reportRows(data,state);
  const name = String(studentName).slice(0,100), title = data.title || 'Study for Test 1 Packet';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(name ? name+' — '+title : title)} — Progress report</title><style>body{font:15px/1.55 system-ui,sans-serif;color:#1c293c;max-width:1000px;margin:40px auto;padding:0 22px}h1{font-size:28px}h2{font-size:20px;margin-top:32px}h3{font-size:16px}p{margin:.5em 0}.muted{color:#5c697b}.summary{display:flex;gap:24px;flex-wrap:wrap;background:#edf2f7;padding:18px;border-radius:10px}.summary strong{display:block;font-size:23px}table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13px}th,td{border-bottom:1px solid #d9dfe7;padding:9px;text-align:left;vertical-align:top}th{background:#f1f4f8}.response{white-space:pre-wrap;overflow-wrap:anywhere}.problem{border-top:1px solid #d9dfe7;padding-top:14px;margin-top:20px;break-inside:avoid}.status{font-size:12px;color:#5c697b}@media print{body{margin:10px;font-size:11px}.summary{padding:10px}h2{break-after:avoid}table{font-size:10px}}</style></head><body><h1>${escapeHTML(title)} — Progress report</h1>${name ? `<p><strong>Student:</strong> ${escapeHTML(name)}</p>` : ''}<p class="muted">Created ${escapeHTML(createdAt)}. This report reflects answers and self-reviews saved on one browser. It is not a verified grade.</p><div class="summary"><div><strong>${summary.overall.mainComplete} / ${summary.overall.mainTotal}</strong>packet problems complete</div><div><strong>${summary.overall.extraComplete}</strong>extra examples complete</div><div><strong>${summary.overall.totalAttempts}</strong>answer checks</div></div><h2>Skills to review</h2>${summary.targetedReview.length ? `<ul>${summary.targetedReview.map(item=>`<li><strong>Problem ${item.id}${item.variant ? `, extra example ${item.variant}` : ''} — ${escapeHTML(item.topic)}.</strong> ${escapeHTML(item.reason)} ${escapeHTML(item.hint)}</li>`).join('')}</ul>` : '<p>No checked answers currently need review. Unchecked problems are listed below.</p>'}<table><thead><tr><th>Skill</th><th>Packet complete</th><th>Extra examples complete</th><th>Review problems</th></tr></thead><tbody>${summary.topics.map(topic=>`<tr><td>${escapeHTML(topic.topic)}</td><td>${topic.mainComplete} / ${topic.mainTotal}</td><td>${topic.extraComplete}</td><td>${[...new Set([...topic.missedIds,...topic.reviewIds])].join(', ') || '—'}</td></tr>`).join('')}</tbody></table><h2>Answers and checks</h2>${rows.map(row=>`<section class="problem"><h3>Problem ${row.id}${row.variant ? ` · Extra example ${row.variant}` : ' · Packet original'} — ${escapeHTML(row.topic)}</h3><p>${escapeHTML(row.prompt)}</p><p class="status">${row.complete ? 'Complete' : row.attempts ? 'In progress' : 'Not checked'} · ${row.attempts} ${row.attempts===1 ? 'check' : 'checks'}${Object.values(row.entry?.fields || {}).includes('self-reviewed') ? ' · Includes student self-review' : ''}</p><table><thead><tr><th>Answer</th><th>Student response</th><th>Check</th></tr></thead><tbody>${row.responses.map(item=>`<tr><td>${escapeHTML(item.field.label)}</td><td class="response">${escapeHTML(item.answer || '—')}</td><td>${escapeHTML(statusLabel(item.status))}</td></tr>`).join('')}</tbody></table></section>`).join('')}</body></html>`;
}

function makeReportCSV({data,state,studentName='',createdAt=now()}) {
  const cell = value => { let text=String(value ?? ''); if (/^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text="'"+text; return '"'+text.replace(/"/g,'""')+'"'; };
  const rows = [['Student','Created','Problem','Example','Skill','Complete','Checks','Answer field','Student response','Check result']];
  for (const row of reportRows(data,state)) for (const item of row.responses) rows.push([String(studentName).slice(0,100),createdAt,row.id,row.variant ? `Extra ${row.variant}` : 'Original',row.topic,row.complete ? 'Yes' : 'No',row.attempts,item.field.label,item.answer,statusLabel(item.status)]);
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

function makeReportText({data,state,studentName='',createdAt=now()}) {
  const summary=summarizeProgress(state.progress,data,state.variants),rows=reportRows(data,state);
  const lines=[`${data.title || 'Study for Test 1 Packet'} — Progress report`];
  const name=String(studentName).slice(0,100);
  if(name)lines.push(`Student: ${name}`);
  lines.push(`Created: ${createdAt}`,'',
    'This report reflects answers and checks saved on one browser. It is not a verified grade.',
    'Correct = automatically checked. Self-reviewed = the student reviewed an explanation; example problems include worked solutions. Packet explanations can be reviewed with a teacher. Completion may include self-reviewed explanations. Unchecked answers do not count as complete.','',
    'PROGRESS',
    `Packet problems complete: ${summary.overall.mainComplete} / ${summary.overall.mainTotal}`,
    `Extra examples complete: ${summary.overall.extraComplete}`,
    `Extra examples attempted: ${summary.overall.extraAttempted}; generate more whenever you are ready.`,
    `Answer checks: ${summary.overall.totalAttempts}`);
  if(summary.recommendedId!==null)lines.push(`Recommended next: Problem ${summary.recommendedId}${summary.recommendedVariant ? `, extra example ${summary.recommendedVariant}` : ', packet original'}`);
  lines.push('','SKILLS');
  for(const topic of summary.topics)lines.push(`${topic.topic}: ${topic.mainComplete} / ${topic.mainTotal} packet problems complete; ${topic.extraComplete} extra examples complete. Review problems: ${[...new Set([...topic.missedIds,...topic.reviewIds])].join(', ') || 'none currently flagged'}.`);
  lines.push('','WHAT TO REVIEW');
  if(!summary.targetedReview.length)lines.push('No checked answers currently need review. Unchecked problems are listed below.');
  for(const item of summary.targetedReview)lines.push(`Problem ${item.id}${item.variant ? `, extra example ${item.variant}` : ''} — ${item.topic}`,`${item.reason} ${item.hint}`,'');
  lines.push('','ANSWERS AND CHECKS');
  for(const row of rows){
    lines.push('',`Problem ${row.id} — ${row.variant ? `Extra example ${row.variant}` : 'Packet original'} — ${row.topic}`,String(row.prompt || ''),
      `${row.complete ? 'Complete' : row.attempts ? 'In progress' : 'Not checked'}; ${row.attempts} ${row.attempts===1 ? 'check' : 'checks'}${Object.values(row.entry?.fields || {}).includes('self-reviewed') ? '; includes student self-review' : ''}.`);
    for(const item of row.responses)lines.push(`${item.field.label}${item.field.unit ? ` (${item.field.unit})` : ''}: ${item.answer || '[not entered]'}`,`Check: ${statusLabel(item.status)}`);
  }
  return lines.join('\n')+'\n';
}

function makeBackup({state,createdAt=now()}) {
  const saved = {};
  for (const key of [...MAPS,'progress','autoNext','autonext','theme','question','view','studentName']) if (state[key] !== undefined) saved[key] = JSON.parse(JSON.stringify(state[key]));
  return {format:FORMAT,version:1,createdAt,state:saved};
}

function validateBackup(value,definitions) {
  if (typeof value === 'string') { if (value.length > 5_000_000) throw new Error('The backup is too large.'); try { value = JSON.parse(value); } catch { throw new Error('This file is not valid JSON.'); } }
  if (!plain(value) || value.format !== FORMAT || value.version !== 1 || !plain(value.state)) throw new Error('Choose a Study for Test 1 backup file.');
  const problems = new Map(flatten(definitions).map(problem=>[Number(problem.id),problem]));
  const resolvedProblems = new Map();
  const resolve = (base,variant) => { const key=recordKey(base.id,variant); if (!resolvedProblems.has(key)) resolvedProblems.set(key,actualProblem(base,variant)); return resolvedProblems.get(key); };
  const source = value.state, out = {answers:{},plots:{},lines:{},checked:{},plotChecked:{},variants:{},progress:createProgressState()};
  const entries = (object,label) => {
    if (object === undefined) return [];
    if (!plain(object)) throw new Error(`The ${label} section is invalid.`);
    const items = Object.entries(object);
    if (items.length > 10000 || items.some(([key])=>BAD_KEYS.has(key))) throw new Error(`The ${label} section is invalid.`);
    return items;
  };
  function identity(key,withField=false) {
    const match = String(key).match(withField ? /^(\d+):(\d+):([^:]+)$/ : /^(\d+):(\d+)$/);
    if (!match) throw new Error('A saved problem reference is invalid.');
    const id=Number(match[1]),variant=Number(match[2]),base=problems.get(id);
    if (!base || !validVariant(variant) || String(key)!==`${id}:${variant}${withField ? ':'+match[3] : ''}`) throw new Error('The backup contains an unavailable problem or example.');
    const problem=resolve(base,variant),field=withField ? (problem.fields || []).find(f=>f.key===match[3]) : null;
    if (withField && (!field || BAD_KEYS.has(match[3]))) throw new Error('The backup contains an unknown answer field.');
    return {id,variant,problem,field};
  }
  for (const [key,answer] of entries(source.answers,'answers')) {
    identity(key,true); if (typeof answer !== 'string' || answer.length>10000) throw new Error('A saved answer is invalid or too long.'); out.answers[key]=answer;
  }
  for (const name of ['checked','lines','plotChecked']) for (const [key,value] of entries(source[name],name)) {
    const {problem}=identity(key,name==='checked');
    if (typeof value !== 'boolean' || (name!=='checked' && !problem.diagram?.student_plot)) throw new Error('A saved check is invalid.'); out[name][key]=value;
  }
  for (const [key,points] of entries(source.plots,'graphs')) {
    const {problem}=identity(key),d=problem.diagram;
    if (!d?.student_plot || !Array.isArray(points) || points.length>500) throw new Error('A saved graph is invalid.');
    out.plots[key]=points.map(point=>{
      if (!Array.isArray(point) || point.length!==2 || !point.every(n=>typeof n==='number' && Number.isFinite(n)) || point[0]<0 || point[1]<0 || point[0]>d.xmax || point[1]>d.ymax || Math.abs(point[0]/(d.xstep||1)-Math.round(point[0]/(d.xstep||1)))>1e-7 || Math.abs(point[1]/(d.ystep||1)-Math.round(point[1]/(d.ystep||1)))>1e-7) throw new Error('A saved graph coordinate is outside its grid.');
      return [...point];
    });
    const unique=new Set(out.plots[key].map(point=>point.join(','))); if(unique.size!==points.length) throw new Error('A saved graph contains duplicate points.');
  }
  for (const [id,variant] of entries(source.variants,'examples')) {
    if (!/^\d+$/.test(id) || String(Number(id))!==id || !validVariant(variant) || !problems.has(Number(id))) throw new Error('A selected example is invalid.'); out.variants[id]=variant;
  }
  if (source.exampleIndices !== undefined) {
    out.exampleIndices = {};
    for (const [id,index] of entries(source.exampleIndices,'example history')) {
      if (!/^\d+$/.test(id) || String(Number(id))!==id || !validVariant(index) || !problems.has(Number(id))) throw new Error('A saved example history is invalid.');
      out.exampleIndices[id] = index;
    }
  }
  if (source.progress !== undefined) {
    if (!plain(source.progress) || source.progress.version!==1) throw new Error('The learning progress section is invalid.');
    for (const [key,record] of entries(source.progress.records,'learning progress')) {
      const {problem}=identity(key);
      if (!plain(record) || !Number.isSafeInteger(record.attempts) || record.attempts<0 || record.attempts>1000000 || !Number.isSafeInteger(record.totalCorrectChecks) || record.totalCorrectChecks<0 || record.totalCorrectChecks>record.attempts) throw new Error('A learning record is invalid.');
      const allowed=new Set((problem.fields || []).map(f=>f.key)); if(problem.diagram?.student_plot)allowed.add('$graph');
      const fields={};
      for(const [field,status] of entries(record.fields,'answer checks')) {
        if(!allowed.has(field) || !STATUSES.has(status))throw new Error('An answer check is invalid.');
        const definition=(problem.fields || []).find(item=>item.key===field);
        if(status==='self-reviewed' && (!definition || definition.value!==null && definition.value!==undefined || (definition.accepted || []).length || isPlotField(problem,definition)))throw new Error('Only explanation answers may be marked self-reviewed.');
        fields[field]=status;
      }
      for(const field of problem.fields || []) if(fields[field.key]===undefined && !(isPlotField(problem,field) && fields.$graph!==undefined))fields[field.key]='blank';
      const importTime=value=>{if(value===null || value===undefined)return null;if(typeof value!=='string' || value.length>40 || !Number.isFinite(Date.parse(value)))throw new Error('A saved check date is invalid.');return new Date(value).toISOString();};
      const lastChecked=importTime(record.lastChecked),lastReviewed=importTime(record.lastReviewed);
      out.progress.records[key]={attempts:record.attempts,totalCorrectChecks:record.totalCorrectChecks,lastChecked,lastReviewed,fields,complete:finished(fields)};
    }
  }
  for(const key of ['autoNext','autonext']) if(source[key]!==undefined) { if(typeof source[key]!=='boolean')throw new Error('The auto-next preference is invalid.');out[key]=source[key]; }
  if(source.theme!==undefined) { if(!['light','dark'].includes(source.theme))throw new Error('The color theme is invalid.');out.theme=source.theme; }
  if(source.question!==undefined) { if(!Number.isInteger(source.question) || !problems.has(source.question))throw new Error('The saved current problem is invalid.');out.question=source.question; }
  if(source.view!==undefined) { if(!['lesson','packet','practice'].includes(source.view))throw new Error('The saved view is invalid.');out.view=source.view; }
  if(source.studentName!==undefined) { if(typeof source.studentName!=='string' || source.studentName.length>100)throw new Error('The student name is too long or invalid.');out.studentName=source.studentName; }
  return out;
}

return {createProgressState,recordCheck,recordSelfReview,summarizeProgress,makeReportHTML,makeReportCSV,makeReportText,makeBackup,validateBackup};
})();

__studyModules["advance.js"] = (() => {
function createAutoAdvance({onAdvance,schedule = setTimeout,unschedule = clearTimeout}) {
  let pending = null, timer = null;
  function cancel() {
    if (timer !== null) unschedule(timer);
    timer = null; pending = null;
  }
  function finish(expected) {
    if (!pending || pending !== expected) return false;
    const next = pending; cancel(); onAdvance(next); return true;
  }
  return {
    start(value,delay = 3000) { cancel(); pending = {...value}; const expected = pending; timer = schedule(()=>finish(expected),delay); return pending; },
    cancel,
    nextNow() { return finish(pending); },
    get pending() { return pending; }
  };
}

return {createAutoAdvance};
})();

__studyModules["generated-diagrams.js"] = (() => {
/* Exact runtime diagrams for deterministic generated practice. No answer values are drawn. */
const INK='#24364b',MUTED='#62758a',GRID='#b6c7d4',BLUE='#dcecf8',TEAL='#d9efe9',WHITE='#ffffff';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>typeof v==='string'?v:Number(Number(v).toFixed(6)).toString();
const dim=(v,d)=>`${num(v)} ${d.unit||''}`.trim();
const rad=a=>a*Math.PI/180;
const polygonArea=pts=>Math.abs(pts.reduce((s,a,i)=>{const b=pts[(i+1)%pts.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
class Drawing{
 constructor(){this.bits=[];}
 line(a,b,color=INK,width=2,dash=''){this.bits.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`);}
 poly(pts,fill=WHITE,stroke=INK,width=2){pts=pts.length?[...pts,pts[0]]:pts;this.bits.push(`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`);}
 circle(x,y,r,fill='none',stroke=INK,width=2,dash=''){this.bits.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`);}
 text(x,y,value,size=23,anchor='middle',color=INK,rotate=0){this.bits.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" font-size="${size}" fill="${color}"${rotate?` transform="rotate(${rotate} ${x} ${y})"`:''}>${esc(value)}</text>`);}
 path(path,stroke=INK,width=2){this.bits.push(`<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`);}
 arrow(a,b){this.line(a,b,MUTED,2);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);for(const k of[-.5,.5])this.line(b,[b[0]-10*Math.cos(ang+k),b[1]-10*Math.sin(ang+k)],MUTED,2);}
 square(x,y,k=12){this.path(`M${x},${y-k}h${k}v${k}`,MUTED,1.5);}
 dimension(a,b,label,offset=27){this.line(a,b,MUTED,1.4);if(Math.abs(a[1]-b[1])<.01){for(const p of[a,b])this.line([p[0],p[1]-5],[p[0],p[1]+5],MUTED,1.4);this.text((a[0]+b[0])/2,a[1]+offset,label);}else{for(const p of[a,b])this.line([p[0]-5,p[1]],[p[0]+5,p[1]],MUTED,1.4);this.text(a[0]+offset,(a[1]+b[1])/2+8,label,22,offset>0?'start':'end');}}
}
function fitPoints(points,box,maxScale=Infinity){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),[x,y,w,h]=box;const scale=Math.min(w/Math.max(xmax-xmin,1e-8),h/Math.max(ymax-ymin,1e-8),maxScale),ox=x+(w-(xmax-xmin)*scale)/2-xmin*scale,oy=y+(h-(ymax-ymin)*scale)/2+ymax*scale;return {point:(a,b)=>[ox+a*scale,oy-b*scale],scale};}
const mapped=(points,tr)=>points.map(p=>tr(...p));
const lPoints=d=>[[0,0],[d.width,0],[d.width,d.right_height],[d.top_width,d.right_height],[d.top_width,d.height],[0,d.height]];
const tPoints=d=>{const a=(d.width-d.stem_width)/2,b=a+d.stem_width;return [[a,0],[b,0],[b,d.height-d.top_height],[d.width,d.height-d.top_height],[d.width,d.height],[0,d.height],[0,d.height-d.top_height],[a,d.height-d.top_height]];};
function clip(poly,axis,bound,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=sign*(a[axis]-bound)>=-1e-8,inb=sign*(b[axis]-bound)>=-1e-8;if(ina)out.push(a);if(ina!==inb){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push(a.map((v,k)=>v+t*(b[k]-v)));}}return out;}
function unitCells(poly){const cells=[];for(let x=Math.floor(Math.min(...poly.map(p=>p[0])));x<Math.ceil(Math.max(...poly.map(p=>p[0])));x++)for(let y=Math.floor(Math.min(...poly.map(p=>p[1])));y<Math.ceil(Math.max(...poly.map(p=>p[1])));y++){let p=poly;for(const [ax,b,sg]of[[0,x,1],[0,x+1,-1],[1,y,1],[1,y+1,-1]])p=clip(p,ax,b,sg);const area=polygonArea(p);if(area>1e-8)cells.push({points:p,area,x,y});}return cells;}
function tiles(s,poly,tr){for(const cell of unitCells(poly))s.poly(mapped(cell.points,tr),cell.area<1-1e-8?BLUE:WHITE,GRID,1.3);s.poly(mapped(poly,tr),'none',INK,2.5);}
function unitReference(s,scale,unit,kind='square',x=65,y=287){s.text(x+scale/2,69,'One unit',22);if(kind==='line'){s.line([x,y],[x+scale,y],INK,4);for(const xx of[x,x+scale])s.line([xx,y-9],[xx,y+9]);s.text(x+scale/2,y+40,`1 ${unit}`,21);}else{const p=(a,b)=>[x+a*scale,y-b*scale];s.poly(mapped([[0,0],[1,0],[1,1],[0,1]],p));s.text(x+scale/2,y+40,`1 ${unit}²`,21);}}
function cutReference(s,scale,unit,kind='square',x=218,y=287){s.text(x+scale+14,69,'Cut into halves',22);if(kind==='line'){s.line([x,y],[x+scale/2,y],MUTED,4);s.line([x+scale/2+25,y],[x+scale+25,y],MUTED,4);}else{s.poly([[x,y],[x+scale,y],[x,y-scale]],BLUE);s.poly([[x+scale+20,y],[x+scale+20,y-scale],[x+20,y-scale]],BLUE);}}
function renderSegment(s,d){const L=Number(d.length),u=Number(d.unit_length||1);if(d.fill_units){const sc=Math.min(330/L,90);unitReference(s,sc,d.unit,'line',53,220);cutReference(s,sc,d.unit,'line',210,220);s.text(575,69,'Fill the line',22);const x=405,y=220;for(let i=0;i<L/u;i++){const len=Math.min(u,L-i*u);s.line([x+i*u*sc,y],[x+(i*u+len)*sc,y],len<u?MUTED:INK,len<u?7:4);}for(let i=0;i<L/u;i++)s.line([x+i*u*sc,y-11],[x+i*u*sc,y+11]);s.line([x+L*sc,y-11],[x+L*sc,y+11]);return;}const x=125,y=210,w=550;s.line([x,y],[x+w,y],INK,4);if(d.show_ticks!==false)for(let i=0;i<=Math.floor(L/u);i++)s.line([x+w*i*u/L,y-12],[x+w*i*u/L,y+12]);s.line([x+w,y-12],[x+w,y+12]);if(d.show_length!==false)s.dimension([x,y-60],[x+w,y-60],dim(L,d));if(d.show_ticks!==false)s.text(400,325,`Each unit segment: ${dim(u,d)}`,23);}
function renderBent(s,d){const {point:p,scale:sc}=fitPoints(d.points,[415,135,320,160]);if(d.show_unit_piece){unitReference(s,sc,d.unit,'line',45,240);cutReference(s,sc,d.unit,'line',210,240);}for(let i=0;i<d.points.length-1;i++){const a=d.points[i],b=d.points[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;for(let k=0;k<L;k++){const to=Math.min(k+1,L);s.line(p(a[0]+ux*k,a[1]+uy*k),p(a[0]+ux*to,a[1]+uy*to),to-k<1?MUTED:INK,to-k<1?6:3);}for(const k of[...Array(Math.floor(L)+1).keys(),L]){const q=p(a[0]+ux*k,a[1]+uy*k);s.line([q[0]-uy*7,q[1]-ux*7],[q[0]+uy*7,q[1]+ux*7]);}}s.text(575,69,'Fill the path',22);}
function renderRectangle(s,d,grid=false){const w=+d.width,h=+d.height,pts=[[0,0],[w,0],[w,h],[0,h]],{point:p}=fitPoints(pts,[170,70,470,245]);if(grid){tiles(s,pts,p);s.text(400,389,`Each square: 1 ${d.unit||''}²`,23);}else{s.poly(mapped(pts,p),BLUE);s.text((p(0,0)[0]+p(w,0)[0])/2,p(0,0)[1]+38,dim(w,d));s.text(p(0,h/2)[0]-18,p(0,h/2)[1]+7,dim(h,d),23,'end');}}
function renderL(s,d){const {point:p}=fitPoints(lPoints(d),[160,85,470,225]);s.poly(mapped(lPoints(d),p),BLUE);s.text(p(d.width/2,0)[0],p(0,0)[1]+40,dim(d.width,d));s.text(p(0,d.height/2)[0]-20,p(0,d.height/2)[1]+8,dim(d.height,d),23,'end');s.text(p(d.top_width/2,d.height)[0],p(0,d.height)[1]-20,dim(d.top_width,d));s.text(p(d.width,d.right_height/2)[0]+18,p(d.width,d.right_height/2)[1]+8,dim(d.right_height,d),23,'start');}
function renderAngles(s,d,naming){const cx=400,cy=235,R=140,rotation=d.rotation||0,p=(a,r)=>[cx+r*Math.cos(rad(a+rotation)),cy-r*Math.sin(rad(a+rotation))];for(const ray of d.rays){const a=typeof ray==='object'?ray.angle:ray;s.arrow([cx,cy],p(a,R));if(naming){const dot=p(a,R*.78);s.circle(...dot,3,INK,INK);const t=p(a,R+27);s.text(t[0],t[1]+8,ray.name,27);}}s.circle(cx,cy,3,INK,INK);if(naming)s.text(cx-17,cy+36,d.vertex||'P',27);for(const [i,q]of(d.sectors||[]).entries()){const r=46+i%2*10,a=p(q.start,r),b=p(q.end,r),extent=(q.end-q.start+360)%360;s.path(`M${a} A${r},${r} 0 ${extent>180?1:0} 0 ${b}`,MUTED,1.4);const label=p(q.start+extent/2,extent<36?180:92);s.text(label[0],label[1]+8,q.label,25);}if(d.right_angle){const [a,b]=Array.isArray(d.right_angle)?d.right_angle:[0,90],pa=p(a,18),pb=p(b,18),pc=[pa[0]+pb[0]-cx,pa[1]+pb[1]-cy];s.line(pa,pc);s.line(pc,pb);}}
function renderUnitArea(s,d){const pts=d.type==='grid_polygon'?d.points:d.type==='grid_triangle'?[[0,0],[d.base,0],[0,d.height]]:[[0,0],[d.width,0],[d.width,d.height],[0,d.height]],{point:p,scale:sc}=fitPoints(pts,[420,135,310,190],70);unitReference(s,sc,d.unit);cutReference(s,sc,d.unit);s.text(575,69,'Fill the shape',22);tiles(s,pts,p);}
function renderTriangle(s,d){const b=+d.base,h=+d.height,a=d.apex_x??b/3,{point:p}=fitPoints([[0,0],[b,h]],[165,70,470,245]);s.poly(mapped([[0,0],[b,0],[a,h]],p),BLUE);s.line(p(a,0),p(a,h),MUTED,1.5,'6 5');s.square(...p(a,0));s.text(p(b/2,0)[0],p(0,0)[1]+39,dim(b,d));s.text(p(a,h/2)[0]+18,p(a,h/2)[1]+8,dim(h,d),23,'start');}
function renderTrapezoid(s,d){const b=+d.bottom,t=+d.top,h=+d.height,a=(b-t)/2,{point:p}=fitPoints([[0,0],[b,h]],[155,85,490,225]);s.poly(mapped([[0,0],[b,0],[a+t,h],[a,h]],p),BLUE);s.line(p(a,0),p(a,h),MUTED,1.5,'6 5');s.square(...p(a,0));s.text(p(b/2,0)[0],p(0,0)[1]+39,dim(b,d));s.text(p(a+t/2,h)[0],p(0,h)[1]-20,dim(t,d));s.text(p(a,h/2)[0]+18,p(a,h/2)[1]+8,dim(h,d),23,'start');}
function renderParallelogram(s,d,cut){const b=+d.base,h=+d.height,a=+d.shift||0;if(!cut){const {point:p}=fitPoints([[0,0],[b+a,h]],[145,75,510,235]);s.poly(mapped([[0,0],[b,0],[b+a,h],[a,h]],p),BLUE);s.line(p(a,0),p(a,h),MUTED,1.5,'6 5');s.square(...p(a,0));s.text(p(b/2,0)[0],p(0,0)[1]+39,dim(b,d));s.text(p(a,h/2)[0]+18,p(a,h/2)[1]+8,dim(h,d),23,'start');return;}const sc=Math.min(275/(b+a),180/h),p=(x,y)=>[45+x*sc,290-y*sc],q=(x,y)=>[460+x*sc,290-y*sc];s.text(190,65,'Cut one triangle',23);s.text(600,65,'Move the same piece',23);s.poly(mapped([[0,0],[b,0],[b+a,h],[a,h]],p),WHITE);s.poly(mapped([[0,0],[a,0],[a,h]],p),BLUE);s.line(p(a,0),p(a,h),MUTED,2,'6 5');s.arrow([350,200],[415,200]);s.poly(mapped([[0,0],[b,0],[b,h],[0,h]],q),WHITE);s.poly(mapped([[b-a,0],[b,0],[b,h]],q),BLUE);s.text(p(b/2,0)[0],330,dim(b,d));s.text(q(b/2,0)[0],330,dim(b,d));s.text(q(b,h/2)[0]+15,q(b,h/2)[1]+8,dim(h,d),22,'start');}
function renderComposite(s,d){const w=+d.width,h=+d.wall_height,r=+d.roof_height,{point:p}=fitPoints([[0,0],[w,h+r]],[175,60,440,255]);s.poly(mapped([[0,0],[w,0],[w,h],[w/2,h+r],[0,h]],p),BLUE);s.line(p(0,h),p(w,h),MUTED,1.5,'6 5');s.line(p(w/2,h),p(w/2,h+r),MUTED,1.5,'6 5');s.text(p(w/2,0)[0],p(0,0)[1]+40,dim(w,d));s.text(p(0,h/2)[0]-20,p(0,h/2)[1]+8,dim(h,d),23,'end');const x=p(w,h)[0]+30;s.dimension([x,p(w/2,h+r)[1]],[x,p(w,h)[1]],dim(r,d),14);s.line(p(w/2,h+r),[x,p(w/2,h+r)[1]],GRID,1,'5 4');}
function prism(s,pts,depth,box,grid=true,forcedScale,maxScale=Infinity){const a=Math.sqrt(3)/2,projected=pts.flatMap(([x,y])=>[[x,y],[x+a*depth,y+.5*depth]]);let {point:tr,scale}=fitPoints(projected,box,maxScale);if(forcedScale){scale=forcedScale;const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),lo=Math.min(...xs),hi=Math.max(...xs),bt=Math.min(...ys),top=Math.max(...ys),[x,y,w,h]=box;tr=(xx,yy)=>[x+(w-(hi-lo)*scale)/2+(xx-lo)*scale,y+(h-(top-bt)*scale)/2+(top-yy)*scale];}const p=(x,y,z)=>tr(x+a*z,y+.5*z);for(let i=0;i<pts.length;i++){const u=pts[i],v=pts[(i+1)%pts.length],dx=v[0]-u[0],dy=v[1]-u[1];if(dy*a-dx*.5<=1e-8)continue;const ts=[0,1];if(grid)for(const axis of[0,1])if(Math.abs(v[axis]-u[axis])>1e-8)for(let n=Math.floor(Math.min(u[axis],v[axis]))+1;n<Math.ceil(Math.max(u[axis],v[axis]));n++){const t=(n-u[axis])/(v[axis]-u[axis]);if(t>0&&t<1)ts.push(t);}const tt=[...new Set(ts)].sort((a,b)=>a-b),zs=grid?[0,...Array.from({length:Math.max(0,Math.ceil(depth)-1)},(_,k)=>k+1).filter(z=>z<depth),depth]:[0,depth];for(let k=0;k<tt.length-1;k++)for(let z=0;z<zs.length-1;z++){const q0=[u[0]+dx*tt[k],u[1]+dy*tt[k]],q1=[u[0]+dx*tt[k+1],u[1]+dy*tt[k+1]];s.poly([p(...q0,zs[z]),p(...q1,zs[z]),p(...q1,zs[z+1]),p(...q0,zs[z+1])],Math.abs(dx*dy)>1e-8?BLUE:TEAL,GRID,1);}s.poly([p(...u,0),p(...v,0),p(...v,depth),p(...u,depth)],'none',INK,2);}if(grid)tiles(s,pts,(x,y)=>p(x,y,0));else s.poly(pts.map(([x,y])=>p(x,y,0)),WHITE);return {point:p,scale};}
function renderPrism(s,d){const type=d.type;let pts,depth;if(type==='triangular_prism'){pts=[[0,0],[d.base,0],[0,d.triangle_height]];depth=d.length;}else if(type==='l_prism'){pts=lPoints(d);depth=d.length;}else if(type==='t_prism'){pts=tPoints(d);depth=d.length;}else {const l=d.length??d.side,h=d.height??d.side;pts=[[0,0],[l,0],[l,h],[0,h]];depth=d.width??d.side;}const grid=d.show_unit_cubes||d.show_grid||type==='cube_units',process=d.show_fill_process,box=process?[430,120,295,200]:[180,90,410,235],{point:p,scale}=prism(s,pts,depth,box,grid,undefined,process?60:Infinity);if(process){s.text(92,65,'One unit cube',21);s.text(290,65,'Cut into halves',21);s.text(580,65,'Fill the solid',21);prism(s,[[0,0],[1,0],[1,1],[0,1]],1,[30,130,130,180],false,scale);const halves=d.cut==='diagonal_half'?[[[0,0],[1,0],[0,1]],[[0,1],[1,0],[1,1]]]:[[[0,0],[.5,0],[.5,1],[0,1]],[[.5,0],[1,0],[1,1],[.5,1]]];halves.forEach((pp,i)=>prism(s,pp,1,[190+i*105,130,100,180],false,scale));s.text(92,375,`1 ${d.unit||''}³`,21);return;}const minx=Math.min(...pts.map(p=>p[0])),maxx=Math.max(...pts.map(p=>p[0])),h=Math.max(...pts.map(p=>p[1])),w=maxx-minx;if(type==='cube_units'){s.text(400,392,`Each small cube: 1 ${d.unit||''}³`,23);return;}if(d.show_dimensions!==false){if(type==='t_prism'){const a=p(0,h,depth),b=p(d.width,h,depth);s.dimension([a[0],a[1]-25],[b[0],b[1]-25],dim(w,d),-12);const st=(d.width-d.stem_width)/2;s.text(p(st+d.stem_width/2,0,0)[0],p(st,0,0)[1]+35,dim(d.stem_width,d));}else s.text(p((minx+maxx)/2,0,0)[0],p(minx,0,0)[1]+35,dim(w,d));s.text(p(minx,h/2,0)[0]-20,p(minx,h/2,0)[1]+8,dim(h,d),23,'end');const depthY=type==='t_prism'?d.height-d.top_height:0,a=p(maxx,depthY,0),b=p(maxx,depthY,depth);s.line(a,b,MUTED,2);s.text((a[0]+b[0])/2+14,(a[1]+b[1])/2+28,dim(depth,d),22,'start');if(type==='l_prism'){s.text(p(d.top_width/2,h,0)[0],p(0,h,0)[1]-18,dim(d.top_width,d),22);const x=p(d.width,0,depth)[0]+30;s.dimension([x,p(d.width,d.right_height,0)[1]],[x,p(d.width,0,0)[1]],dim(d.right_height,d),12);}if(type==='t_prism'){const x=p(d.width,h,depth)[0]+25;s.dimension([x,p(d.width,h,0)[1]],[x,p(d.width,h-d.top_height,0)[1]],dim(d.top_height,d),12);}}if(grid)s.text(400,407,`Each full cube: 1 ${d.unit||''}³`,21);}
const regular=(n,cx,cy,R)=>Array.from({length:n},(_,k)=>[cx+R*Math.cos(2*Math.PI*k/n),cy-R*Math.sin(2*Math.PI*k/n)]);
function renderPolygon(s,d){const cx=240,cy=215,R=135,pts=regular(d.n,cx,cy,R);if(d.show_circle!==false)s.circle(cx,cy,R,'none',GRID,1.5,'6 5');if(d.show_radii)for(const q of pts)s.line([cx,cy],q,GRID,Math.min(.8,9.6/d.n));s.poly(pts,'none',INK,2.5);if(d.highlight_triangle)s.poly([[cx,cy],pts[0],pts[1]],BLUE);if(d.show_diameter){s.line([cx-R,cy],[cx+R,cy],MUTED,1.8);s.text(cx,cy+35,`d = ${dim(d.diameter??2*d.radius,d)}`,22);s.line([cx,cy],[cx,cy-R],MUTED,1.8);s.text(cx+12,cy-R/2,`r = ${dim(d.radius,d)}`,20,'start');}else{s.line([cx,cy],[cx+R,cy],MUTED,1.8);s.text(cx+R/2,cy-16,`r = ${dim(d.radius,d)}`,21);}s.text(575,155,`${d.n}-gon`,30);if(d.side_length_label){s.line(pts[0],pts[1],INK,5);s.text(575,218,'Each side',23);s.text(575,260,d.side_length_label,23);}else if(d.perimeter_label){s.text(575,218,'Perimeter',23);s.text(575,260,d.perimeter_label,23);}}
function renderCircle(s,d){const cx=400,cy=200,R=140;s.circle(cx,cy,R,'none',INK,2.5);const rl=d.radius_label??(d.given==='radius'?`r = ${dim(d.radius,d)}`:'r = ?'),dl=d.diameter_label??(d.given==='diameter'?`d = ${d.label}`:'d = ?');if(d.given==='radius'){s.line([cx,cy-R],[cx,cy+R],MUTED,1.8);s.text(cx-18,cy-R/2,dl,23,'end');s.line([cx,cy],[cx+R,cy],MUTED,1.8);s.text(cx+R/2,cy-16,rl,23);}else{s.line([cx-R,cy],[cx+R,cy],MUTED,1.8);s.text(cx,cy+38,dl,25);s.line([cx,cy],[cx,cy-R],MUTED,1.8);s.text(cx+15,cy-R/2,rl,23,'start');}if(d.given==='circumference')s.text(cx,395,d.label,25);}
function renderCentral(s,d){const n=d.n||12,r=d.radius,pts=regular(n,145,210,100);for(let k=0;k<n;k++)s.poly([[145,210],pts[k],pts[(k+1)%n]],k===0?BLUE:WHITE,'none',0);for(const p of pts)s.line([145,210],p,GRID,Math.min(.8,9.6/n));s.poly(pts,'none');s.text(145,360,`${n} equal triangles`,22);s.arrow([275,210],[340,210]);const b=d.radial_base??r,h=d.perpendicular_height??r*Math.sin(2*Math.PI/n),ap=Math.sqrt(Math.max(0,r*r-h*h)),{point:p}=fitPoints([[0,0],[b,h]],[390,125,290,190]);s.text(535,70,'One enlarged triangle',24);s.poly(mapped([[0,0],[b,0],[ap,h]],p),BLUE);s.line(p(ap,0),p(ap,h),MUTED,1.5,'6 5');s.square(...p(ap,0));s.text(p(b/2,0)[0],p(0,0)[1]+38,dim(b,d));s.text(p(ap,h/2)[0]-18,p(ap,h/2)[1]+8,dim(h,d),23,'end');}
function renderRearrange(s,d){const n=d.n,r=d.radius,side=2*r*Math.sin(Math.PI/n),h=r*Math.cos(Math.PI/n),base=n*side/2,sc=Math.min(88/r,335/(base+side/2)),R=sc*r,cx=130,cy=220,pts=regular(n,cx,cy,R);s.text(cx,65,`${n}-gon`,25);for(let k=0;k<n;k++)s.poly([[cx,cy],pts[k],pts[(k+1)%n]],k%2?WHITE:BLUE,'none',0);for(const p of pts)s.line([cx,cy],p,GRID,Math.min(.8,9.6/n));s.poly(pts,'none');s.text(cx,363,`r = ${dim(r,d)}`,23);const x0=355,y0=287,p=(x,y)=>[x0+x*sc,y0-y*sc];for(let k=0;k<n;k++){const j=Math.floor(k/2),tri=k%2?[[ (j+.5)*side,h],[(j+1)*side,0],[(j+1.5)*side,h]]:[[j*side,0],[(j+1)*side,0],[(j+.5)*side,h]];s.poly(mapped(tri,p),k%2?WHITE:BLUE,GRID,.8);}s.poly(mapped([[0,0],[base,0],[base+side/2,h],[side/2,h]],p),'none');s.arrow([245,220],[290,220]);const ry=y0-r*sc,hy=y0-h*sc;s.dimension([320,ry],[320,y0],'r',-15);s.line([340,ry],[735,ry],GRID,1.2,'6 5');s.dimension([740,hy],[740,y0],'h',14);if(d.label_dimensions){s.text(555,83,`h = ${d.height_display??num(d.height??h)} ${d.unit||''}`,23);s.text(555,355,`b = ${d.base_display??num(d.base??base)} ${d.unit||''}`,23);}else{s.text(550,355,'Base = half the perimeter',21);s.text(550,392,'Compare the height with the radius.',20);}}
function renderRatio(s,d){for(const[x,a,b]of[[245,d.a,d.b],[555,d.c,d.d]]){s.text(x,165,a,48);s.line([x-65,195],[x+65,195],INK,2.5);s.text(x,255,b,48);}s.text(400,215,Object.values(d).some(v=>String(v).toLowerCase()==='x')?'=':'?',42);}
function renderTable(s,d){const rows=[d.headers,...d.rows],cw=Math.min(210,600/d.headers.length),rh=Math.min(54,340/rows.length),x0=(800-cw*d.headers.length)/2,y0=(430-rh*rows.length)/2;rows.forEach((row,i)=>row.forEach((v,j)=>{const x=x0+j*cw,y=y0+i*rh;s.poly([[x,y],[x+cw,y],[x+cw,y+rh],[x,y+rh]],i?WHITE:BLUE,GRID,1.5);if(v!==null&&v!==undefined)s.text(x+cw/2,y+rh/2+8,num(v),23);}));}
function renderGraph(s,d){const xmin=d.xmin||0,ymin=d.ymin||0,xmax=d.xmax||6,ymax=d.ymax||12,xs=d.xstep||1,ys=d.ystep||1,x0=100,y0=335,w=590,h=270,p=(x,y)=>[x0+(x-xmin)/(xmax-xmin)*w,y0-(y-ymin)/(ymax-ymin)*h];for(let v=xmin;v<=xmax+1e-8;v+=xs){const x=p(v,ymin)[0];s.line([x,y0],[x,y0-h],GRID,1);s.text(x,y0+28,num(v),20);}for(let v=ymin;v<=ymax+1e-8;v+=ys){const y=p(xmin,v)[1];s.line([x0,y],[x0+w,y],GRID,1);if(v!==0)s.text(x0-16,y+7,num(v),20,'end');}s.arrow([x0,y0],[x0+w+13,y0]);s.arrow([x0,y0],[x0,y0-h-13]);s.text(x0+w/2,403,d.xlabel||'x',23);s.text(33,y0-h/2,d.ylabel||'y',23,'middle',INK,-90);if(d.plot_line){const m=+d.slope,c=d.intercept||0,xe=d.line_xmax??Math.min(xmax,m>0?(ymax-c)/m:xmax);s.line(p(0,c),p(xe,m*xe+c),'#356d9b',3);}for(const q of d.points||[])s.circle(...p(...q),5,INK,INK);}
const renderers={segment:renderSegment,bent_path:renderBent,rectangle:renderRectangle,lshape:renderL,angle_name:(s,d)=>renderAngles(s,d,true),angles:(s,d)=>renderAngles(s,d,false),grid_rectangle:(s,d)=>d.show_unit_piece?renderUnitArea(s,d):renderRectangle(s,d,true),grid_polygon:renderUnitArea,grid_triangle:renderUnitArea,triangle:renderTriangle,trapezoid:renderTrapezoid,parallelogram:(s,d)=>renderParallelogram(s,d,false),parallelogram_cut:(s,d)=>renderParallelogram(s,d,true),composite:renderComposite,cube_units:renderPrism,rect_prism:renderPrism,triangular_prism:renderPrism,l_prism:renderPrism,t_prism:renderPrism,polygon:renderPolygon,circle:renderCircle,central_triangle:renderCentral,polygon_rearrange:renderRearrange,ratio:renderRatio,table:renderTable,graph:renderGraph};
function diagramMarkup(problem,{answer=false}={}){const d=problem?.diagram;if(!d)return '';const render=renderers[d.type];if(!render)throw new Error(`Unsupported generated diagram: ${d.type}`);const s=new Drawing();render(s,d);return `<svg xmlns="http://www.w3.org/2000/svg" class="diagram-image generated-diagram" viewBox="0 0 800 430" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(problem.topic||'Mathematics')} diagram with the given measurements" style="width:100%;height:100%"><title>${esc(problem.topic||'Mathematics')} — example ${esc(problem.variantIndex??'')}</title>${s.bits.join('')}</svg>`;}
const supportedDiagramTypes=Object.freeze(Object.keys(renderers));

return {fitPoints,unitCells,diagramMarkup,supportedDiagramTypes};
})();

__studyModules["packet-data.js"] = (() => {
const packetData = {"title":"Study for Test 1 Packet","description":"Geometry, measurement, circles, ratios, and proportional relationships.","pages":[{"number":1,"title":"Length and Perimeter","large":false,"problems":[{"topic":"Length","concept":true,"prompt":"How many 1 cm line pieces fit along the 8 cm line?","fields":[{"label":"Number of pieces","answer":"8","value":8,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"segment","length":8,"unit_length":1,"show_ticks":true,"half_highlight":false,"unit":"cm"},"solution":["8 ÷ 1 = 8 pieces."],"hint":"Divide the total length by the length of one piece.","variants":[{"topic":"Length","concept":true,"prompt":"How many 1 m line pieces fit along the 9 m line?","fields":[{"label":"Number of pieces","answer":"9","value":9,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"segment","length":9,"unit_length":1,"show_ticks":true,"half_highlight":false,"unit":"m"},"solution":["9 ÷ 1 = 9 pieces."],"hint":"Divide the total length by the length of one piece."},{"topic":"Length","concept":true,"prompt":"How many 2 cm line pieces fit along the 12 cm line?","fields":[{"label":"Number of pieces","answer":"6","value":6,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"segment","length":12,"unit_length":2,"show_ticks":true,"half_highlight":false,"unit":"cm"},"solution":["12 ÷ 2 = 6 pieces."],"hint":"Divide the total length by the length of one piece."}],"id":1},{"topic":"Length","concept":true,"prompt":"Use whole 1 cm pieces and half pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"5","value":5,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"5.5 cm","value":5.5,"tolerance":0.0001,"unit":"cm","key":"c"}],"diagram":{"type":"segment","length":5.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"cm"},"solution":["5 whole pieces and 1 half piece fill the line.","5 + 1 × 0.5 = 5.5 cm."],"hint":"A half piece adds 0.5 unit of length.","variants":[{"topic":"Length","concept":true,"prompt":"Use whole 1 m pieces and half pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"4","value":4,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"4.5 m","value":4.5,"tolerance":0.0001,"unit":"m","key":"c"}],"diagram":{"type":"segment","length":4.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"m"},"solution":["4 whole pieces and 1 half piece fill the line.","4 + 1 × 0.5 = 4.5 m."],"hint":"A half piece adds 0.5 unit of length."},{"topic":"Length","concept":true,"prompt":"Use whole 1 cm pieces and half pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"6","value":6,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"6.5 cm","value":6.5,"tolerance":0.0001,"unit":"cm","key":"c"}],"diagram":{"type":"segment","length":6.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"cm"},"solution":["6 whole pieces and 1 half piece fill the line.","6 + 1 × 0.5 = 6.5 cm."],"hint":"A half piece adds 0.5 unit of length."}],"id":2},{"topic":"Length","concept":true,"prompt":"Cut a 1 m line into two equal pieces. Use whole and cut pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"7","value":7,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"7.5 m","value":7.5,"tolerance":0.0001,"unit":"m","key":"c"}],"diagram":{"type":"segment","length":7.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"m"},"solution":["7 whole pieces and 1 half piece fill the line.","7 + 1 × 0.5 = 7.5 m."],"hint":"A half piece adds 0.5 unit of length.","variants":[{"topic":"Length","concept":true,"prompt":"Cut a 1 cm line into two equal pieces. Use whole and cut pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"3.5 cm","value":3.5,"tolerance":0.0001,"unit":"cm","key":"c"}],"diagram":{"type":"segment","length":3.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"cm"},"solution":["3 whole pieces and 1 half piece fill the line.","3 + 1 × 0.5 = 3.5 cm."],"hint":"A half piece adds 0.5 unit of length."},{"topic":"Length","concept":true,"prompt":"Cut a 1 ft line into two equal pieces. Use whole and cut pieces to measure the line.","fields":[{"label":"Whole pieces","answer":"8","value":8,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"8.5 ft","value":8.5,"tolerance":0.0001,"unit":"ft","key":"c"}],"diagram":{"type":"segment","length":8.5,"unit_length":1,"show_ticks":true,"half_highlight":false,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"unit":"ft"},"solution":["8 whole pieces and 1 half piece fill the line.","8 + 1 × 0.5 = 8.5 ft."],"hint":"A half piece adds 0.5 unit of length."}],"id":3},{"topic":"Length","concept":true,"prompt":"Repeat 1 m pieces along the bent path. Cut a piece in half to fill the remaining space.","fields":[{"label":"Whole pieces","answer":"8","value":8,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"8.5 m","value":8.5,"tolerance":0.0001,"unit":"m","key":"c"}],"diagram":{"type":"bent_path","points":[[0,0],[3,0],[3,2],[6.5,2]],"unit_length":1,"show_ticks":true,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"show_fill_process":true,"unit":"m"},"solution":["8 whole pieces and 1 half piece fill the bent path.","8 + 1 × 0.5 = 8.5 m."],"hint":"Measure along the path, including each turn and the partial unit.","variants":[{"topic":"Length","concept":true,"prompt":"Repeat 1 cm pieces along the bent path. Cut a piece in half to fill the remaining space.","fields":[{"label":"Whole pieces","answer":"4","value":4,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"4.5 cm","value":4.5,"tolerance":0.0001,"unit":"cm","key":"c"}],"diagram":{"type":"bent_path","points":[[0,0],[2,0],[2,1],[3.5,1]],"unit_length":1,"show_ticks":true,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"show_fill_process":true,"unit":"cm"},"solution":["4 whole pieces and 1 half piece fill the bent path.","4 + 1 × 0.5 = 4.5 cm."],"hint":"Measure along the path, including each turn and the partial unit."},{"topic":"Length","concept":true,"prompt":"Repeat 1 m pieces along the bent path. Cut a piece in half to fill the remaining space.","fields":[{"label":"Whole pieces","answer":"6","value":6,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total length","answer":"6.5 m","value":6.5,"tolerance":0.0001,"unit":"m","key":"c"}],"diagram":{"type":"bent_path","points":[[0,0],[3,0],[3,1],[5.5,1]],"unit_length":1,"show_ticks":true,"show_length":false,"show_unit_piece":true,"show_cut_piece":true,"fill_units":true,"show_fill_process":true,"unit":"m"},"solution":["6 whole pieces and 1 half piece fill the bent path.","6 + 1 × 0.5 = 6.5 m."],"hint":"Measure along the path, including each turn and the partial unit."}],"id":4},{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the rectangle.","fields":[{"label":"Perimeter","answer":"22 cm","value":22,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"rectangle","width":8,"height":3,"show_dimensions":true,"unit":"cm"},"solution":["8 + 3 + 8 + 3 = 22 cm."],"hint":"Add the lengths of all four sides.","variants":[{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the rectangle.","fields":[{"label":"Perimeter","answer":"24 m","value":24,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"rectangle","width":7,"height":5,"show_dimensions":true,"unit":"m"},"solution":["7 + 5 + 7 + 5 = 24 m."],"hint":"Add the lengths of all four sides."},{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the rectangle.","fields":[{"label":"Perimeter","answer":"32 ft","value":32,"tolerance":0.0001,"unit":"ft","key":"a"}],"diagram":{"type":"rectangle","width":12,"height":4,"show_dimensions":true,"unit":"ft"},"solution":["12 + 4 + 12 + 4 = 32 ft."],"hint":"Add the lengths of all four sides."}],"id":5},{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the entire figure.","fields":[{"label":"Perimeter","answer":"38 ft","value":38,"tolerance":0.0001,"unit":"ft","key":"a"}],"diagram":{"type":"lshape","width":11,"height":8,"top_width":7,"right_height":3,"show_dimensions":true,"unit":"ft"},"solution":["Missing sides: 11 − 7 = 4 and 8 − 3 = 5.","11 + 3 + 4 + 5 + 7 + 8 = 38 ft."],"hint":"Find the two missing side lengths, then add every outside side.","variants":[{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the entire figure.","fields":[{"label":"Perimeter","answer":"42 cm","value":42,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"lshape","width":12,"height":9,"top_width":5,"right_height":4,"show_dimensions":true,"unit":"cm"},"solution":["Missing sides: 12 − 5 = 7 and 9 − 4 = 5.","12 + 4 + 7 + 5 + 5 + 9 = 42 cm."],"hint":"Find the two missing side lengths, then add every outside side."},{"topic":"Perimeter","concept":false,"prompt":"Find the perimeter of the entire figure.","fields":[{"label":"Perimeter","answer":"34 m","value":34,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"lshape","width":10,"height":7,"top_width":6,"right_height":2,"show_dimensions":true,"unit":"m"},"solution":["Missing sides: 10 − 6 = 4 and 7 − 2 = 5.","10 + 2 + 4 + 5 + 6 + 7 = 34 m."],"hint":"Find the two missing side lengths, then add every outside side."}],"id":6}]},{"number":2,"title":"Angles","large":false,"problems":[{"topic":"Angles","concept":true,"prompt":"Name each numbered angle using three letters.","fields":[{"label":"Angle 1","answer":"∠APB or ∠BPA","value":null,"tolerance":0,"accepted":["APB","BPA"],"key":"a"},{"label":"Angle 2","answer":"∠BPC or ∠CPB","value":null,"tolerance":0,"accepted":["BPC","CPB"],"key":"b"}],"diagram":{"type":"angle_name","vertex":"P","rays":[{"name":"C","angle":0},{"name":"B","angle":55},{"name":"A","angle":120}],"sectors":[{"start":55,"end":120,"label":"1"},{"start":0,"end":55,"label":"2"}]},"solution":["P is the vertex, so it must be the middle letter."],"hint":"The middle letter names the point where the two rays meet.","variants":[{"topic":"Angles","concept":true,"prompt":"Name each numbered angle using three letters.","fields":[{"label":"Angle 1","answer":"∠DOE or ∠EOD","value":null,"tolerance":0,"accepted":["DOE","EOD"],"key":"a"},{"label":"Angle 2","answer":"∠EOF or ∠FOE","value":null,"tolerance":0,"accepted":["EOF","FOE"],"key":"b"}],"diagram":{"type":"angle_name","vertex":"O","rays":[{"name":"F","angle":0},{"name":"E","angle":55},{"name":"D","angle":120}],"sectors":[{"start":55,"end":120,"label":"1"},{"start":0,"end":55,"label":"2"}]},"solution":["O is the vertex, so it must be the middle letter."],"hint":"The middle letter names the point where the two rays meet."},{"topic":"Angles","concept":true,"prompt":"Name each numbered angle using three letters.","fields":[{"label":"Angle 1","answer":"∠JMK or ∠KMJ","value":null,"tolerance":0,"accepted":["JMK","KMJ"],"key":"a"},{"label":"Angle 2","answer":"∠KML or ∠LMK","value":null,"tolerance":0,"accepted":["KML","LMK"],"key":"b"}],"diagram":{"type":"angle_name","vertex":"M","rays":[{"name":"L","angle":0},{"name":"K","angle":55},{"name":"J","angle":120}],"sectors":[{"start":55,"end":120,"label":"1"},{"start":0,"end":55,"label":"2"}]},"solution":["M is the vertex, so it must be the middle letter."],"hint":"The middle letter names the point where the two rays meet."}],"id":7},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"73 °","value":73,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,73,180,253],"sectors":[{"start":0,"end":73,"label":"73°"},{"start":180,"end":253,"label":"x°"}],"right_angle":null,"rotation":0},"solution":["The marked angles face each other across the intersection. x = 73°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures.","variants":[{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"58 °","value":58,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,58,180,238],"sectors":[{"start":0,"end":58,"label":"58°"},{"start":180,"end":238,"label":"x°"}],"right_angle":null,"rotation":20},"solution":["The marked angles face each other across the intersection. x = 58°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures."},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"112 °","value":112,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,112,180,292],"sectors":[{"start":0,"end":112,"label":"112°"},{"start":180,"end":292,"label":"x°"}],"right_angle":null,"rotation":10},"solution":["The marked angles face each other across the intersection. x = 112°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures."}],"id":8},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"56 °","value":56,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,56,90],"sectors":[{"start":0,"end":56,"label":"x°"},{"start":56,"end":90,"label":"34°"}],"right_angle":[0,90],"rotation":0},"solution":["90 − 34 = 56°."],"hint":"The square corner measures 90°.","variants":[{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"63 °","value":63,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,63,90],"sectors":[{"start":0,"end":63,"label":"x°"},{"start":63,"end":90,"label":"27°"}],"right_angle":[0,90],"rotation":15},"solution":["90 − 27 = 63°."],"hint":"The square corner measures 90°."},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"41 °","value":41,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,41,90],"sectors":[{"start":0,"end":41,"label":"x°"},{"start":41,"end":90,"label":"49°"}],"right_angle":[0,90],"rotation":0},"solution":["90 − 49 = 41°."],"hint":"The square corner measures 90°."}],"id":9},{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"53 °","value":53,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,53,180],"sectors":[{"start":0,"end":53,"label":"x°"},{"start":53,"end":180,"label":"127°"}],"right_angle":null,"rotation":0},"solution":["180 − 127 = 53°."],"hint":"The angles along one side of a straight line add to 180°.","variants":[{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"64 °","value":64,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,64,180],"sectors":[{"start":0,"end":64,"label":"x°"},{"start":64,"end":180,"label":"116°"}],"right_angle":null,"rotation":20},"solution":["180 − 116 = 64°."],"hint":"The angles along one side of a straight line add to 180°."},{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"38 °","value":38,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,38,180],"sectors":[{"start":0,"end":38,"label":"x°"},{"start":38,"end":180,"label":"142°"}],"right_angle":null,"rotation":-15},"solution":["180 − 142 = 38°."],"hint":"The angles along one side of a straight line add to 180°."}],"id":10},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"118 °","value":118,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,118,180,298],"sectors":[{"start":0,"end":118,"label":"118°"},{"start":180,"end":298,"label":"x°"}],"right_angle":null,"rotation":25},"solution":["The marked angles face each other across the intersection. x = 118°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures.","variants":[{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"66 °","value":66,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,66,180,246],"sectors":[{"start":0,"end":66,"label":"66°"},{"start":180,"end":246,"label":"x°"}],"right_angle":null,"rotation":35},"solution":["The marked angles face each other across the intersection. x = 66°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures."},{"topic":"Angles","concept":false,"prompt":"Find x.","fields":[{"label":"x","answer":"105 °","value":105,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,105,180,285],"sectors":[{"start":0,"end":105,"label":"105°"},{"start":180,"end":285,"label":"x°"}],"right_angle":null,"rotation":15},"solution":["The marked angles face each other across the intersection. x = 105°."],"hint":"Angles facing each other across two intersecting straight lines have equal measures."}],"id":11},{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"81 °","value":81,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,35,99,180],"sectors":[{"start":0,"end":35,"label":"35°"},{"start":35,"end":99,"label":"64°"},{"start":99,"end":180,"label":"x°"}],"right_angle":null,"rotation":0},"solution":["180 − 35 − 64 = 81°."],"hint":"Subtract both known angles from 180°.","variants":[{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"81 °","value":81,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,42,99,180],"sectors":[{"start":0,"end":42,"label":"42°"},{"start":42,"end":99,"label":"57°"},{"start":99,"end":180,"label":"x°"}],"right_angle":null,"rotation":0},"solution":["180 − 42 − 57 = 81°."],"hint":"Subtract both known angles from 180°."},{"topic":"Angles","concept":false,"prompt":"Find x. The long line is straight.","fields":[{"label":"x","answer":"86 °","value":86,"tolerance":0.0001,"unit":"°","key":"a"}],"diagram":{"type":"angles","rays":[0,26,94,180],"sectors":[{"start":0,"end":26,"label":"26°"},{"start":26,"end":94,"label":"68°"},{"start":94,"end":180,"label":"x°"}],"right_angle":null,"rotation":0},"solution":["180 − 26 − 68 = 86°."],"hint":"Subtract both known angles from 180°."}],"id":12}]},{"number":3,"title":"Understanding Area","large":false,"problems":[{"topic":"Area concepts","concept":true,"prompt":"Each small square is 1 cm². How many squares cover the rectangle?","fields":[{"label":"Number of squares","answer":"15","value":15,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"grid_rectangle","width":5,"height":3,"piece":"square","shade_half":false,"unit":"cm"},"solution":["5 × 3 = 15 square units."],"hint":"Count rows and columns.","variants":[{"topic":"Area concepts","concept":true,"prompt":"Each small square is 1 cm². How many squares cover the rectangle?","fields":[{"label":"Number of squares","answer":"16","value":16,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"grid_rectangle","width":4,"height":4,"piece":"square","shade_half":false,"unit":"cm"},"solution":["4 × 4 = 16 square units."],"hint":"Count rows and columns."},{"topic":"Area concepts","concept":true,"prompt":"Each small square is 1 cm². How many squares cover the rectangle?","fields":[{"label":"Number of squares","answer":"12","value":12,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"grid_rectangle","width":6,"height":2,"piece":"square","shade_half":false,"unit":"cm"},"solution":["6 × 2 = 12 square units."],"hint":"Count rows and columns."}],"id":13},{"topic":"Area concepts","concept":true,"prompt":"Use whole 1 cm² squares and half-square pieces to cover the figure exactly.","fields":[{"label":"Whole squares","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"3.5 cm²","value":3.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_polygon","points":[[0,0],[4,0],[3,1],[0,1]],"piece":"diagonal_half","show_unit_piece":true,"show_cut_piece":true,"show_grid":true,"unit":"cm"},"solution":["3 whole squares and one half-square cover the figure.","3 + 0.5 = 3.5 cm²."],"hint":"The slanted boundary cuts one unit square into two equal triangles.","variants":[{"topic":"Area concepts","concept":true,"prompt":"Use whole 1 m² squares and half-square pieces to cover the figure exactly.","fields":[{"label":"Whole squares","answer":"4","value":4,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"4.5 m²","value":4.5,"tolerance":0.0001,"unit":"m²","key":"c"}],"diagram":{"type":"grid_polygon","points":[[0,0],[5,0],[4,1],[0,1]],"piece":"diagonal_half","show_unit_piece":true,"show_cut_piece":true,"show_grid":true,"unit":"m"},"solution":["4 whole squares and one half-square cover the figure.","4 + 0.5 = 4.5 m²."],"hint":"The slanted boundary cuts one unit square into two equal triangles."},{"topic":"Area concepts","concept":true,"prompt":"Use whole 1 cm² squares and half-square pieces to cover the figure exactly.","fields":[{"label":"Whole squares","answer":"5","value":5,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"5.5 cm²","value":5.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_polygon","points":[[0,0],[6,0],[5,1],[0,1]],"piece":"diagonal_half","show_unit_piece":true,"show_cut_piece":true,"show_grid":true,"unit":"cm"},"solution":["5 whole squares and one half-square cover the figure.","5 + 0.5 = 5.5 cm²."],"hint":"The slanted boundary cuts one unit square into two equal triangles."}],"id":14},{"topic":"Area concepts","concept":true,"prompt":"Count the whole 1 cm² squares and the half-square pieces. Find the triangle area.","fields":[{"label":"Whole squares","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"4.5 cm²","value":4.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_triangle","base":3,"height":3,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":false,"unit":"cm"},"solution":["3 whole squares and 3 half-square pieces cover the triangle.","3 + 3 × 0.5 = 4.5 cm²."],"hint":"Each piece along the slanted edge is half of a unit square.","variants":[{"topic":"Area concepts","concept":true,"prompt":"Count the whole 1 m² squares and the half-square pieces. Find the triangle area.","fields":[{"label":"Whole squares","answer":"10","value":10,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"5","value":5,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"12.5 m²","value":12.5,"tolerance":0.0001,"unit":"m²","key":"c"}],"diagram":{"type":"grid_triangle","base":5,"height":5,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":false,"unit":"m"},"solution":["10 whole squares and 5 half-square pieces cover the triangle.","10 + 5 × 0.5 = 12.5 m²."],"hint":"Each piece along the slanted edge is half of a unit square."},{"topic":"Area concepts","concept":true,"prompt":"Count the whole 1 cm² squares and the half-square pieces. Find the triangle area.","fields":[{"label":"Whole squares","answer":"21","value":21,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"7","value":7,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"24.5 cm²","value":24.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_triangle","base":7,"height":7,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":false,"unit":"cm"},"solution":["21 whole squares and 7 half-square pieces cover the triangle.","21 + 7 × 0.5 = 24.5 cm²."],"hint":"Each piece along the slanted edge is half of a unit square."}],"id":15},{"topic":"Area concepts","concept":true,"prompt":"Repeat 1 cm² squares to cover the triangle. Cut squares into equal triangular halves to fill its slanted edge.","fields":[{"label":"Whole squares","answer":"10","value":10,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"5","value":5,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"12.5 cm²","value":12.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_triangle","base":5,"height":5,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":true,"unit":"cm"},"solution":["10 whole squares and 5 half-square pieces cover the triangle.","10 + 5 × 0.5 = 12.5 cm²."],"hint":"Each piece along the slanted edge is half of a unit square.","variants":[{"topic":"Area concepts","concept":true,"prompt":"Repeat 1 m² squares to cover the triangle. Cut squares into equal triangular halves to fill its slanted edge.","fields":[{"label":"Whole squares","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"4.5 m²","value":4.5,"tolerance":0.0001,"unit":"m²","key":"c"}],"diagram":{"type":"grid_triangle","base":3,"height":3,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":true,"unit":"m"},"solution":["3 whole squares and 3 half-square pieces cover the triangle.","3 + 3 × 0.5 = 4.5 m²."],"hint":"Each piece along the slanted edge is half of a unit square."},{"topic":"Area concepts","concept":true,"prompt":"Repeat 1 cm² squares to cover the triangle. Cut squares into equal triangular halves to fill its slanted edge.","fields":[{"label":"Whole squares","answer":"21","value":21,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-square pieces","answer":"7","value":7,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total area","answer":"24.5 cm²","value":24.5,"tolerance":0.0001,"unit":"cm²","key":"c"}],"diagram":{"type":"grid_triangle","base":7,"height":7,"piece":"diagonal_half","show_grid":true,"show_unit_piece":true,"show_cut_piece":true,"show_fill_process":true,"unit":"cm"},"solution":["21 whole squares and 7 half-square pieces cover the triangle.","21 + 7 × 0.5 = 24.5 cm²."],"hint":"Each piece along the slanted edge is half of a unit square."}],"id":16},{"topic":"Area concepts","concept":true,"prompt":"Cut off the marked triangle and move it to the other side. Find the area of the new rectangle and the original parallelogram.","fields":[{"label":"Rectangle area","answer":"28 cm²","value":28,"tolerance":0.0001,"unit":"cm²","key":"a"},{"label":"Parallelogram area","answer":"28 cm²","value":28,"tolerance":0.0001,"unit":"cm²","key":"b"}],"diagram":{"type":"parallelogram_cut","base":7,"height":4,"shift":2,"show_rearranged":true,"show_dimensions":true,"unit":"cm"},"solution":["The cut pieces form a rectangle with base 7 and height 4.","Both areas are 7 × 4 = 28 cm²."],"hint":"Moving pieces changes the outline, not the total area.","variants":[{"topic":"Area concepts","concept":true,"prompt":"Cut off the marked triangle and move it to the other side. Find the area of the new rectangle and the original parallelogram.","fields":[{"label":"Rectangle area","answer":"24 m²","value":24,"tolerance":0.0001,"unit":"m²","key":"a"},{"label":"Parallelogram area","answer":"24 m²","value":24,"tolerance":0.0001,"unit":"m²","key":"b"}],"diagram":{"type":"parallelogram_cut","base":8,"height":3,"shift":2,"show_rearranged":true,"show_dimensions":true,"unit":"m"},"solution":["The cut pieces form a rectangle with base 8 and height 3.","Both areas are 8 × 3 = 24 m²."],"hint":"Moving pieces changes the outline, not the total area."},{"topic":"Area concepts","concept":true,"prompt":"Cut off the marked triangle and move it to the other side. Find the area of the new rectangle and the original parallelogram.","fields":[{"label":"Rectangle area","answer":"30 cm²","value":30,"tolerance":0.0001,"unit":"cm²","key":"a"},{"label":"Parallelogram area","answer":"30 cm²","value":30,"tolerance":0.0001,"unit":"cm²","key":"b"}],"diagram":{"type":"parallelogram_cut","base":6,"height":5,"shift":2,"show_rearranged":true,"show_dimensions":true,"unit":"cm"},"solution":["The cut pieces form a rectangle with base 6 and height 5.","Both areas are 6 × 5 = 30 cm²."],"hint":"Moving pieces changes the outline, not the total area."}],"id":17},{"topic":"Area concepts","concept":true,"prompt":"The parallelogram is cut and rearranged into the matching rectangle. Why does A = base × height work for both shapes?","fields":[{"label":"Explain","answer":"They have the same base and perpendicular height. Moving the triangle preserves area, so both areas equal base × height.","value":null,"tolerance":0,"key":"a"}],"diagram":{"type":"parallelogram_cut","base":6,"height":3,"shift":2,"show_rearranged":true,"show_dimensions":true,"unit":"cm"},"solution":["The rectangle has the same base and perpendicular height as the parallelogram. No pieces are lost or added."],"hint":"Describe what changed and what stayed the same.","variants":[],"id":18}]},{"number":4,"title":"Finding Area","large":false,"problems":[{"topic":"Area","concept":false,"prompt":"Find the area of the rectangle.","fields":[{"label":"Area","answer":"36 m²","value":36,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"rectangle","width":9,"height":4,"show_dimensions":true,"unit":"m"},"solution":["9 × 4 = 36 m²."],"hint":"Multiply length by width.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the rectangle.","fields":[{"label":"Area","answer":"42 cm²","value":42,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"rectangle","width":7,"height":6,"show_dimensions":true,"unit":"cm"},"solution":["7 × 6 = 42 cm²."],"hint":"Multiply length by width."},{"topic":"Area","concept":false,"prompt":"Find the area of the rectangle.","fields":[{"label":"Area","answer":"60 ft²","value":60,"tolerance":0.0001,"unit":"ft²","key":"a"}],"diagram":{"type":"rectangle","width":12,"height":5,"show_dimensions":true,"unit":"ft"},"solution":["12 × 5 = 60 ft²."],"hint":"Multiply length by width."}],"id":19},{"topic":"Area","concept":false,"prompt":"Find the area of the triangle.","fields":[{"label":"Area","answer":"42 cm²","value":42,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"triangle","base":12,"height":7,"apex_x":4,"show_dimensions":true,"unit":"cm"},"solution":["½ × 12 × 7 = 42 cm²."],"hint":"Use half of base × perpendicular height.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the triangle.","fields":[{"label":"Area","answer":"36 m²","value":36,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"triangle","base":9,"height":8,"apex_x":3,"show_dimensions":true,"unit":"m"},"solution":["½ × 9 × 8 = 36 m²."],"hint":"Use half of base × perpendicular height."},{"topic":"Area","concept":false,"prompt":"Find the area of the triangle.","fields":[{"label":"Area","answer":"25 cm²","value":25,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"triangle","base":10,"height":5,"apex_x":3.3333333333333335,"show_dimensions":true,"unit":"cm"},"solution":["½ × 10 × 5 = 25 cm²."],"hint":"Use half of base × perpendicular height."}],"id":20},{"topic":"Area","concept":false,"prompt":"Find the area of the trapezoid.","fields":[{"label":"Area","answer":"50 m²","value":50,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"trapezoid","bottom":14,"top":6,"height":5,"show_dimensions":true,"unit":"m"},"solution":["½ × (14 + 6) × 5 = 50 m²."],"hint":"Split it into a rectangle and two triangles, or average the two bases.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the trapezoid.","fields":[{"label":"Area","answer":"48 cm²","value":48,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"trapezoid","bottom":12,"top":4,"height":6,"show_dimensions":true,"unit":"cm"},"solution":["½ × (12 + 4) × 6 = 48 cm²."],"hint":"Split it into a rectangle and two triangles, or average the two bases."},{"topic":"Area","concept":false,"prompt":"Find the area of the trapezoid.","fields":[{"label":"Area","answer":"44 m²","value":44,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"trapezoid","bottom":15,"top":7,"height":4,"show_dimensions":true,"unit":"m"},"solution":["½ × (15 + 7) × 4 = 44 m²."],"hint":"Split it into a rectangle and two triangles, or average the two bases."}],"id":21},{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"68 ft²","value":68,"tolerance":0.0001,"unit":"ft²","key":"a"}],"diagram":{"type":"lshape","width":11,"height":8,"top_width":7,"right_height":3,"show_dimensions":true,"unit":"ft"},"solution":["7 × 8 + (11 − 7) × 3 = 68 ft²."],"hint":"Split the shape into two rectangles.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"73 cm²","value":73,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"lshape","width":12,"height":9,"top_width":5,"right_height":4,"show_dimensions":true,"unit":"cm"},"solution":["5 × 9 + (12 − 5) × 4 = 73 cm²."],"hint":"Split the shape into two rectangles."},{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"50 m²","value":50,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"lshape","width":10,"height":7,"top_width":6,"right_height":2,"show_dimensions":true,"unit":"m"},"solution":["6 × 7 + (10 − 6) × 2 = 50 m²."],"hint":"Split the shape into two rectangles."}],"id":22},{"topic":"Area","concept":false,"prompt":"Find the area of the parallelogram.","fields":[{"label":"Area","answer":"45 cm²","value":45,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"parallelogram","base":9,"height":5,"shift":2,"show_dimensions":true,"unit":"cm"},"solution":["9 × 5 = 45 cm²."],"hint":"Use the perpendicular height, not a slanted side.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the parallelogram.","fields":[{"label":"Area","answer":"48 m²","value":48,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"parallelogram","base":8,"height":6,"shift":2,"show_dimensions":true,"unit":"m"},"solution":["8 × 6 = 48 m²."],"hint":"Use the perpendicular height, not a slanted side."},{"topic":"Area","concept":false,"prompt":"Find the area of the parallelogram.","fields":[{"label":"Area","answer":"44 ft²","value":44,"tolerance":0.0001,"unit":"ft²","key":"a"}],"diagram":{"type":"parallelogram","base":11,"height":4,"shift":3,"show_dimensions":true,"unit":"ft"},"solution":["11 × 4 = 44 ft²."],"hint":"Use the perpendicular height, not a slanted side."}],"id":23},{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"44 cm²","value":44,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"composite","shape":"house","width":8,"wall_height":4,"roof_height":3,"show_dimensions":true,"unit":"cm"},"solution":["Rectangle: 8 × 4 = 32. Triangle: ½ × 8 × 3 = 12.","Total = 44 cm²."],"hint":"Add the rectangle area and triangle area.","variants":[{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"70 m²","value":70,"tolerance":0.0001,"unit":"m²","key":"a"}],"diagram":{"type":"composite","shape":"house","width":10,"wall_height":5,"roof_height":4,"show_dimensions":true,"unit":"m"},"solution":["Rectangle: 10 × 5 = 50. Triangle: ½ × 10 × 4 = 20.","Total = 70 m²."],"hint":"Add the rectangle area and triangle area."},{"topic":"Area","concept":false,"prompt":"Find the area of the entire figure.","fields":[{"label":"Area","answer":"39 cm²","value":39,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"composite","shape":"house","width":6,"wall_height":4,"roof_height":5,"show_dimensions":true,"unit":"cm"},"solution":["Rectangle: 6 × 4 = 24. Triangle: ½ × 6 × 5 = 15.","Total = 39 cm²."],"hint":"Add the rectangle area and triangle area."}],"id":24}]},{"number":5,"title":"Understanding and Finding Volume","large":false,"problems":[{"topic":"Volume concepts","concept":true,"prompt":"How many 1 cm³ cubes fit inside this larger cube?","fields":[{"label":"Number of unit cubes","answer":"27","value":27,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"cube_units","side":3,"unit_edge":1,"show_grid":true,"unit":"cm"},"solution":["3 × 3 × 3 = 27 cubes."],"hint":"Count cubes in one layer, then count the layers.","variants":[{"topic":"Volume concepts","concept":true,"prompt":"How many 1 cm³ cubes fit inside this larger cube?","fields":[{"label":"Number of unit cubes","answer":"8","value":8,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"cube_units","side":2,"unit_edge":1,"show_grid":true,"unit":"cm"},"solution":["2 × 2 × 2 = 8 cubes."],"hint":"Count cubes in one layer, then count the layers."},{"topic":"Volume concepts","concept":true,"prompt":"How many 1 cm³ cubes fit inside this larger cube?","fields":[{"label":"Number of unit cubes","answer":"64","value":64,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"cube_units","side":4,"unit_edge":1,"show_grid":true,"unit":"cm"},"solution":["4 × 4 × 4 = 64 cubes."],"hint":"Count cubes in one layer, then count the layers."}],"id":25},{"topic":"Volume concepts","concept":true,"prompt":"Fill the prism with 1 cm³ cubes. Cut cubes into two equal blocks to fill the remaining half-unit space.","fields":[{"label":"Whole cubes","answer":"2","value":2,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube blocks","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"2.5 cm³","value":2.5,"tolerance":0.0001,"unit":"cm³","key":"c"}],"diagram":{"type":"rect_prism","length":2.5,"width":1,"height":1,"show_dimensions":true,"show_unit_cubes":true,"show_piece":true,"cut":"half_width","piece_dimensions":[1,1,0.5],"show_fill_process":true,"unit":"cm"},"solution":["2 whole cubes and 1 half-cube blocks fill the prism.","2 + 1 × 0.5 = 2.5 cm³."],"hint":"Each cut block is 1 × 1 × 0.5, so it adds half a cubic unit.","variants":[{"topic":"Volume concepts","concept":true,"prompt":"Fill the prism with 1 m³ cubes. Cut cubes into two equal blocks to fill the remaining half-unit space.","fields":[{"label":"Whole cubes","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube blocks","answer":"1","value":1,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"3.5 m³","value":3.5,"tolerance":0.0001,"unit":"m³","key":"c"}],"diagram":{"type":"rect_prism","length":3.5,"width":1,"height":1,"show_dimensions":true,"show_unit_cubes":true,"show_piece":true,"cut":"half_width","piece_dimensions":[1,1,0.5],"show_fill_process":true,"unit":"m"},"solution":["3 whole cubes and 1 half-cube blocks fill the prism.","3 + 1 × 0.5 = 3.5 m³."],"hint":"Each cut block is 1 × 1 × 0.5, so it adds half a cubic unit."},{"topic":"Volume concepts","concept":true,"prompt":"Fill the prism with 1 cm³ cubes. Cut cubes into two equal blocks to fill the remaining half-unit space.","fields":[{"label":"Whole cubes","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube blocks","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"4.5 cm³","value":4.5,"tolerance":0.0001,"unit":"cm³","key":"c"}],"diagram":{"type":"rect_prism","length":1.5,"width":3,"height":1,"show_dimensions":true,"show_unit_cubes":true,"show_piece":true,"cut":"half_width","piece_dimensions":[1,1,0.5],"show_fill_process":true,"unit":"cm"},"solution":["3 whole cubes and 3 half-cube blocks fill the prism.","3 + 3 × 0.5 = 4.5 cm³."],"hint":"Each cut block is 1 × 1 × 0.5, so it adds half a cubic unit."}],"id":26},{"topic":"Volume concepts","concept":true,"prompt":"Repeat 1 cm³ cubes to fill the prism. Cut cubes diagonally into equal halves to fill the slanted face.","fields":[{"label":"Whole cubes","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube pieces","answer":"3","value":3,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"4.5 cm³","value":4.5,"tolerance":0.0001,"unit":"cm³","key":"c"}],"diagram":{"type":"triangular_prism","base":3,"triangle_height":3,"length":1,"show_dimensions":true,"show_unit_cubes":true,"show_fill_process":true,"cut":"diagonal_half","unit":"cm"},"solution":["3 whole cubes and 3 diagonal half-cubes fill the prism.","3 + 3 × 0.5 = 4.5 cm³."],"hint":"The halves are triangular prisms. Each still has half the volume of one cube.","variants":[{"topic":"Volume concepts","concept":true,"prompt":"Repeat 1 m³ cubes to fill the prism. Cut cubes diagonally into equal halves to fill the slanted face.","fields":[{"label":"Whole cubes","answer":"10","value":10,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube pieces","answer":"5","value":5,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"12.5 m³","value":12.5,"tolerance":0.0001,"unit":"m³","key":"c"}],"diagram":{"type":"triangular_prism","base":5,"triangle_height":5,"length":1,"show_dimensions":true,"show_unit_cubes":true,"show_fill_process":true,"cut":"diagonal_half","unit":"m"},"solution":["10 whole cubes and 5 diagonal half-cubes fill the prism.","10 + 5 × 0.5 = 12.5 m³."],"hint":"The halves are triangular prisms. Each still has half the volume of one cube."},{"topic":"Volume concepts","concept":true,"prompt":"Repeat 1 cm³ cubes to fill the prism. Cut cubes diagonally into equal halves to fill the slanted face.","fields":[{"label":"Whole cubes","answer":"9","value":9,"tolerance":0.0001,"unit":"","key":"a"},{"label":"Half-cube pieces","answer":"9","value":9,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Total volume","answer":"13.5 cm³","value":13.5,"tolerance":0.0001,"unit":"cm³","key":"c"}],"diagram":{"type":"triangular_prism","base":3,"triangle_height":3,"length":3,"show_dimensions":true,"show_unit_cubes":true,"show_fill_process":true,"cut":"diagonal_half","unit":"cm"},"solution":["9 whole cubes and 9 diagonal half-cubes fill the prism.","9 + 9 × 0.5 = 13.5 cm³."],"hint":"The halves are triangular prisms. Each still has half the volume of one cube."}],"id":27},{"topic":"Volume","concept":false,"prompt":"Find the volume of the rectangular prism.","fields":[{"label":"Volume","answer":"108 cm³","value":108,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"rect_prism","length":9,"width":4,"height":3,"show_dimensions":true,"unit":"cm"},"solution":["9 × 4 × 3 = 108 cm³."],"hint":"Multiply the area of one end by the length of the prism.","variants":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the rectangular prism.","fields":[{"label":"Volume","answer":"120 m³","value":120,"tolerance":0.0001,"unit":"m³","key":"a"}],"diagram":{"type":"rect_prism","length":8,"width":3,"height":5,"show_dimensions":true,"unit":"m"},"solution":["8 × 3 × 5 = 120 m³."],"hint":"Multiply the area of one end by the length of the prism."},{"topic":"Volume","concept":false,"prompt":"Find the volume of the rectangular prism.","fields":[{"label":"Volume","answer":"56 ft³","value":56,"tolerance":0.0001,"unit":"ft³","key":"a"}],"diagram":{"type":"rect_prism","length":7,"width":4,"height":2,"show_dimensions":true,"unit":"ft"},"solution":["7 × 4 × 2 = 56 ft³."],"hint":"Multiply the area of one end by the length of the prism."}],"id":28},{"topic":"Volume","concept":false,"prompt":"Find the volume of the triangular prism.","fields":[{"label":"Volume","answer":"16 cm³","value":16,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"triangular_prism","base":4,"triangle_height":4,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":"diagonal_half","unit":"cm"},"solution":["End area = ½ × 4 × 4 = 8 cm².","Volume = 8 × 2 = 16 cm³."],"hint":"Find the triangle area, then multiply by the prism length.","variants":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the triangular prism.","fields":[{"label":"Volume","answer":"13.5 m³","value":13.5,"tolerance":0.0001,"unit":"m³","key":"a"}],"diagram":{"type":"triangular_prism","base":3,"triangle_height":3,"length":3,"show_dimensions":true,"show_unit_cubes":true,"cut":"diagonal_half","unit":"m"},"solution":["End area = ½ × 3 × 3 = 4.5 m².","Volume = 4.5 × 3 = 13.5 m³."],"hint":"Find the triangle area, then multiply by the prism length."},{"topic":"Volume","concept":false,"prompt":"Find the volume of the triangular prism.","fields":[{"label":"Volume","answer":"25 cm³","value":25,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"triangular_prism","base":5,"triangle_height":5,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":"diagonal_half","unit":"cm"},"solution":["End area = ½ × 5 × 5 = 12.5 cm².","Volume = 12.5 × 2 = 25 cm³."],"hint":"Find the triangle area, then multiply by the prism length."}],"id":29},{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"13 cm³","value":13,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"l_prism","width":3.5,"height":3,"top_width":1.5,"right_height":1,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":"half_width","upright":true,"unit":"cm"},"solution":["End area = 1.5 × 3 + (3.5 − 1.5) × 1 = 6.5 cm².","Volume = 6.5 × 2 = 13.0 cm³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length.","variants":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"24 m³","value":24,"tolerance":0.0001,"unit":"m³","key":"a"}],"diagram":{"type":"l_prism","width":4.5,"height":4,"top_width":2.5,"right_height":1,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":"half_width","upright":true,"unit":"m"},"solution":["End area = 2.5 × 4 + (4.5 − 2.5) × 1 = 12.0 m².","Volume = 12.0 × 2 = 24.0 m³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length."},{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"30 cm³","value":30,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"l_prism","width":3.5,"height":4,"top_width":1.5,"right_height":2,"length":3,"show_dimensions":true,"show_unit_cubes":true,"cut":"half_width","upright":true,"unit":"cm"},"solution":["End area = 1.5 × 4 + (3.5 − 1.5) × 2 = 10.0 cm².","Volume = 10.0 × 3 = 30.0 cm³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length."}],"id":30}]},{"number":6,"title":"Understanding Circumference","large":false,"problems":[{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 6-gon: find perimeter P and P ÷ d to six decimal places. Circle reference: C = πd = 2πr.","fields":[{"label":"Perimeter P","answer":"36.000000 cm","value":36,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.000000","value":3,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":6,"radius":6,"diameter":12,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":6,"side_display":"6.000000000","side_length_label":"6.000000000 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 6 × 6.000000000 ≈ 36.000000 cm.","36.000000 ÷ 12 ≈ 3.000000."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter.","variants":[{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 6-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"24.000000 cm","value":24,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.000000","value":3,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":6,"radius":4,"diameter":8,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":4,"side_display":"4.000000000","side_length_label":"4.000000000 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 6 × 4.000000000 ≈ 24.000000 cm.","24.000000 ÷ 8 ≈ 3.000000."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."},{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 6-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"54.000000 cm","value":54,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.000000","value":3,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":6,"radius":9,"diameter":18,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":9,"side_display":"9.000000000","side_length_label":"9.000000000 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 6 × 9.000000000 ≈ 54.000000 cm.","54.000000 ÷ 18 ≈ 3.000000."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."}],"id":31},{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 12-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"37.269942 cm","value":37.269942,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.105829","value":3.1058285,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":12,"radius":6,"diameter":12,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":3.105828541,"side_display":"3.105828541","side_length_label":"3.105828541 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 12 × 3.105828541 ≈ 37.269942 cm.","37.269942 ÷ 12 ≈ 3.105829."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter.","variants":[{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 12-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"24.846628 cm","value":24.846628,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.105829","value":3.1058285,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":12,"radius":4,"diameter":8,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":2.070552361,"side_display":"2.070552361","side_length_label":"2.070552361 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 12 × 2.070552361 ≈ 24.846628 cm.","24.846628 ÷ 8 ≈ 3.105829."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."},{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 12-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"55.904914 cm","value":55.904914,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.105829","value":3.1058285555555556,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":12,"radius":9,"diameter":18,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":4.658742812,"side_display":"4.658742812","side_length_label":"4.658742812 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 12 × 4.658742812 ≈ 55.904914 cm.","55.904914 ÷ 18 ≈ 3.105829."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."}],"id":32},{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 24-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"37.591543 cm","value":37.591543,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.132629","value":3.1326285833333336,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":24,"radius":6,"diameter":12,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":1.566314307,"side_display":"1.566314307","side_length_label":"1.566314307 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 24 × 1.566314307 ≈ 37.591543 cm.","37.591543 ÷ 12 ≈ 3.132629."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter.","variants":[{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 24-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"25.061029 cm","value":25.061029,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.132629","value":3.132628625,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":24,"radius":4,"diameter":8,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":1.044209538,"side_display":"1.044209538","side_length_label":"1.044209538 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 24 × 1.044209538 ≈ 25.061029 cm.","25.061029 ÷ 8 ≈ 3.132629."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."},{"topic":"Circle circumference concepts","concept":true,"prompt":"Regular 24-gon: find perimeter P and P ÷ d to six decimal places.","fields":[{"label":"Perimeter P","answer":"56.387315 cm","value":56.387315,"tolerance":5.5e-7,"unit":"cm","key":"a"},{"label":"P ÷ d","answer":"3.132629","value":3.132628611111111,"tolerance":5.5e-7,"unit":"","key":"b"}],"diagram":{"type":"polygon","n":24,"radius":9,"diameter":18,"show_circle":true,"show_diameter":true,"show_radii":false,"highlight_triangle":false,"side_length":2.34947146,"side_display":"2.349471460","side_length_label":"2.349471460 cm","side_decimals":9,"perimeter_decimals":6,"unit":"cm"},"solution":["P = 24 × 2.349471460 ≈ 56.387315 cm.","56.387315 ÷ 18 ≈ 3.132629."],"hint":"Every side has the same length. Multiply by the number of sides before dividing by the diameter."}],"id":33},{"topic":"Circle circumference concepts","concept":true,"prompt":"For a circle, C = πd = 2πr. Explain why πd and 2πr give the same circumference.","fields":[{"label":"Explain","answer":"The diameter is twice the radius: d = 2r. Substituting 2r for d gives πd = π(2r) = 2πr.","value":null,"tolerance":0,"key":"a"}],"diagram":{"type":"circle","radius":4,"given":"both","label":"r","unit":"","radius_label":"r","diameter_label":"d = 2r","show_radius":true,"show_diameter":true},"solution":["A diameter is made of two radii, so d = 2r."],"hint":"A diameter passes all the way across the circle through its center.","variants":[],"id":34},{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 31.4 cm. Find the diameter. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"10 cm","value":10,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"circle","radius":5,"given":"circumference","label":"C = 31.4 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = C ÷ π = 31.4 ÷ 3.14 = 10 cm."],"hint":"Divide the circumference by π, not π by the circumference.","variants":[{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 47.1 m. Find the diameter. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"15 m","value":15,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"circle","radius":7.5,"given":"circumference","label":"C = 47.1 m","unit":"m","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = C ÷ π = 47.1 ÷ 3.14 = 15 m."],"hint":"Divide the circumference by π, not π by the circumference."},{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 25.12 cm. Find the diameter. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"8 cm","value":8,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"circle","radius":4,"given":"circumference","label":"C = 25.12 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = C ÷ π = 25.12 ÷ 3.14 = 8 cm."],"hint":"Divide the circumference by π, not π by the circumference."}],"id":35},{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 43.96 m. Find the diameter, then the radius. Use π = 3.14.","fields":[{"label":"Diameter","answer":"14 m","value":14,"tolerance":0.0001,"unit":"m","key":"a"},{"label":"Radius","answer":"7 m","value":7,"tolerance":0.0001,"unit":"m","key":"b"}],"diagram":{"type":"circle","radius":7,"given":"circumference","label":"C = 43.96 m","unit":"m","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 43.96 ÷ 3.14 = 14 m.","r = 14 ÷ 2 = 7 m."],"hint":"First divide C by π; then divide the diameter by two.","variants":[{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 25.12 cm. Find the diameter, then the radius. Use π = 3.14.","fields":[{"label":"Diameter","answer":"8 cm","value":8,"tolerance":0.0001,"unit":"cm","key":"a"},{"label":"Radius","answer":"4 cm","value":4,"tolerance":0.0001,"unit":"cm","key":"b"}],"diagram":{"type":"circle","radius":4,"given":"circumference","label":"C = 25.12 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 25.12 ÷ 3.14 = 8 cm.","r = 8 ÷ 2 = 4 cm."],"hint":"First divide C by π; then divide the diameter by two."},{"topic":"Circle circumference","concept":false,"prompt":"The circumference is 56.52 ft. Find the diameter, then the radius. Use π = 3.14.","fields":[{"label":"Diameter","answer":"18 ft","value":18,"tolerance":0.0001,"unit":"ft","key":"a"},{"label":"Radius","answer":"9 ft","value":9,"tolerance":0.0001,"unit":"ft","key":"b"}],"diagram":{"type":"circle","radius":9,"given":"circumference","label":"C = 56.52 ft","unit":"ft","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 56.52 ÷ 3.14 = 18 ft.","r = 18 ÷ 2 = 9 ft."],"hint":"First divide C by π; then divide the diameter by two."}],"id":36}]},{"number":7,"title":"From Triangles to Circle Area","large":false,"problems":[{"topic":"Circle area concepts","concept":true,"prompt":"Estimate the regular 12-gon area using the surrounding circle: A ≈ πr². Use π = 3.14.","fields":[{"label":"Estimated area","answer":"113.04 cm²","value":113.03999999999999,"tolerance":0.0051,"unit":"cm²","key":"a"}],"diagram":{"type":"polygon","n":12,"radius":6,"diameter":12,"show_circle":true,"show_diameter":false,"show_radius":true,"show_radii":true,"highlight_triangle":false,"unit":"cm"},"solution":["3.14 × 6² = 113.04 cm². This is an estimate using the surrounding circle."],"hint":"Use the radius, not the diameter.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"Estimate the regular 12-gon area using the surrounding circle: A ≈ πr². Use π = 3.14.","fields":[{"label":"Estimated area","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"a"}],"diagram":{"type":"polygon","n":12,"radius":4,"diameter":8,"show_circle":true,"show_diameter":false,"show_radius":true,"show_radii":true,"highlight_triangle":false,"unit":"cm"},"solution":["3.14 × 4² = 50.24 cm². This is an estimate using the surrounding circle."],"hint":"Use the radius, not the diameter."},{"topic":"Circle area concepts","concept":true,"prompt":"Estimate the regular 12-gon area using the surrounding circle: A ≈ πr². Use π = 3.14.","fields":[{"label":"Estimated area","answer":"200.96 cm²","value":200.96,"tolerance":0.0051,"unit":"cm²","key":"a"}],"diagram":{"type":"polygon","n":12,"radius":8,"diameter":16,"show_circle":true,"show_diameter":false,"show_radius":true,"show_radii":true,"highlight_triangle":false,"unit":"cm"},"solution":["3.14 × 8² = 200.96 cm². This is an estimate using the surrounding circle."],"hint":"Use the radius, not the diameter."}],"id":37},{"topic":"Circle area concepts","concept":true,"prompt":"Find the highlighted triangle area. Use the labeled radius as its base and the dashed perpendicular height.","fields":[{"label":"Triangle area","answer":"9 cm²","value":9,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"central_triangle","n":12,"radius":6,"radial_base":6,"perpendicular_height":3,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["½ × 6 × 3 = 9 cm². The height is measured to the chosen radial base."],"hint":"Use the base and its matching perpendicular height.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"Find the highlighted triangle area. Use the labeled radius as its base and the dashed perpendicular height.","fields":[{"label":"Triangle area","answer":"4 cm²","value":4,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"central_triangle","n":12,"radius":4,"radial_base":4,"perpendicular_height":2,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["½ × 4 × 2 = 4 cm². The height is measured to the chosen radial base."],"hint":"Use the base and its matching perpendicular height."},{"topic":"Circle area concepts","concept":true,"prompt":"Find the highlighted triangle area. Use the labeled radius as its base and the dashed perpendicular height.","fields":[{"label":"Triangle area","answer":"16 cm²","value":16,"tolerance":0.0001,"unit":"cm²","key":"a"}],"diagram":{"type":"central_triangle","n":12,"radius":8,"radial_base":8,"perpendicular_height":4,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["½ × 8 × 4 = 16 cm². The height is measured to the chosen radial base."],"hint":"Use the base and its matching perpendicular height."}],"id":38},{"topic":"Circle area concepts","concept":true,"prompt":"The regular 12-gon has 12 equal triangles. Find its exact area using the labeled triangle. How much larger is the circle estimate 3.14r²?","fields":[{"label":"12-gon area","answer":"108 cm²","value":108,"tolerance":0.0001,"unit":"cm²","key":"a"},{"label":"Circle estimate minus polygon area","answer":"5.04 cm²","value":5.039999999999992,"tolerance":0.0051,"unit":"cm²","key":"b"}],"diagram":{"type":"central_triangle","n":12,"radius":6,"radial_base":6,"perpendicular_height":3,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["One triangle: ½ × 6 × 3 = 9 cm².","Total: 12 × 9 = 108 cm².","113.04 − 108 = 5.04 cm²."],"hint":"Find one triangle area and multiply by 12.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"The regular 12-gon has 12 equal triangles. Find its exact area using the labeled triangle. How much larger is the circle estimate 3.14r²?","fields":[{"label":"12-gon area","answer":"48 cm²","value":48,"tolerance":0.0001,"unit":"cm²","key":"a"},{"label":"Circle estimate minus polygon area","answer":"2.24 cm²","value":2.240000000000002,"tolerance":0.0051,"unit":"cm²","key":"b"}],"diagram":{"type":"central_triangle","n":12,"radius":4,"radial_base":4,"perpendicular_height":2,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["One triangle: ½ × 4 × 2 = 4 cm².","Total: 12 × 4 = 48 cm².","50.24 − 48 = 2.24 cm²."],"hint":"Find one triangle area and multiply by 12."},{"topic":"Circle area concepts","concept":true,"prompt":"The regular 12-gon has 12 equal triangles. Find its exact area using the labeled triangle. How much larger is the circle estimate 3.14r²?","fields":[{"label":"12-gon area","answer":"192 cm²","value":192,"tolerance":0.0001,"unit":"cm²","key":"a"},{"label":"Circle estimate minus polygon area","answer":"8.96 cm²","value":8.960000000000008,"tolerance":0.0051,"unit":"cm²","key":"b"}],"diagram":{"type":"central_triangle","n":12,"radius":8,"radial_base":8,"perpendicular_height":4,"show_polygon":true,"show_enlarged":true,"unit":"cm"},"solution":["One triangle: ½ × 8 × 4 = 16 cm².","Total: 12 × 16 = 192 cm².","200.96 − 192 = 8.96 cm²."],"hint":"Find one triangle area and multiply by 12."}],"id":39},{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"25.12 cm","value":25.12,"tolerance":0.0051,"unit":"cm","key":"a"},{"label":"Estimated base P ÷ 2","answer":"12.56 cm","value":12.56,"tolerance":0.0051,"unit":"cm","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":4,"base":12.423314164920995,"height":3.8637033051562732,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["P ≈ 2 × 3.14 × 4 = 25.12 cm.","b ≈ 25.12 ÷ 2 = 12.56 cm."],"hint":"The base is half the perimeter, not the diameter.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"31.40 m","value":31.400000000000002,"tolerance":0.0051,"unit":"m","key":"a"},{"label":"Estimated base P ÷ 2","answer":"15.70 m","value":15.700000000000001,"tolerance":0.0051,"unit":"m","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":5,"base":15.529142706151244,"height":4.8296291314453415,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"m"},"solution":["P ≈ 2 × 3.14 × 5 = 31.4 m.","b ≈ 31.4 ÷ 2 = 15.7 m."],"hint":"The base is half the perimeter, not the diameter."},{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"18.84 cm","value":18.84,"tolerance":0.0051,"unit":"cm","key":"a"},{"label":"Estimated base P ÷ 2","answer":"9.42 cm","value":9.42,"tolerance":0.0051,"unit":"cm","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":3,"base":9.317485623690747,"height":2.897777478867205,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["P ≈ 2 × 3.14 × 3 = 18.84 cm.","b ≈ 18.84 ÷ 2 = 9.42 cm."],"hint":"The base is half the perimeter, not the diameter."}],"id":40},{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"43.96 cm","value":43.96,"tolerance":0.0051,"unit":"cm","key":"a"},{"label":"Estimated base P ÷ 2","answer":"21.98 cm","value":21.98,"tolerance":0.0051,"unit":"cm","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":7,"base":21.740799788611742,"height":6.761480784023478,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["P ≈ 2 × 3.14 × 7 = 43.96 cm.","b ≈ 43.96 ÷ 2 = 21.98 cm."],"hint":"The base is half the perimeter, not the diameter.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"50.24 m","value":50.24,"tolerance":0.0051,"unit":"m","key":"a"},{"label":"Estimated base P ÷ 2","answer":"25.12 m","value":25.12,"tolerance":0.0051,"unit":"m","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":8,"base":24.84662832984199,"height":7.7274066103125465,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"m"},"solution":["P ≈ 2 × 3.14 × 8 = 50.24 m.","b ≈ 50.24 ÷ 2 = 25.12 m."],"hint":"The base is half the perimeter, not the diameter."},{"topic":"Circle area concepts","concept":true,"prompt":"First estimate the perimeter with P ≈ 2πr. The rearranged base uses half that perimeter. Use π = 3.14.","fields":[{"label":"Estimated perimeter","answer":"37.68 cm","value":37.68,"tolerance":0.0051,"unit":"cm","key":"a"},{"label":"Estimated base P ÷ 2","answer":"18.84 cm","value":18.84,"tolerance":0.0051,"unit":"cm","key":"b"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":6,"base":18.634971247381493,"height":5.79555495773441,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["P ≈ 2 × 3.14 × 6 = 37.68 cm.","b ≈ 37.68 ÷ 2 = 18.84 cm."],"hint":"The base is half the perimeter, not the diameter."}],"id":41},{"topic":"Circle area concepts","concept":true,"prompt":"The base is half the perimeter. Use P ≈ 2πr to find b. Compare b with the diameter 2r.","fields":[{"label":"Base approaches","answer":"πr","value":null,"tolerance":0,"accepted":["πr","pi r","pi*r","pir"],"key":"a"},{"label":"Compare with diameter","answer":"No. The base approaches πr; the diameter is 2r. Since π > 2, the base is longer.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"polygon_rearrange","n":24,"radius":6,"base":18.795771679687427,"height":5.948669168242862,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["(2πr) ÷ 2 = πr. The factor 2 cancels; π and r remain."],"hint":"Divide the whole product 2 × π × r by 2.","variants":[],"id":42}]},{"number":8,"title":"Why Circle Area Is πr²","large":false,"problems":[{"topic":"Circle area concepts","concept":true,"prompt":"For this 6-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"93.53 cm²","value":93.53074360871936,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.8038 cm","value":0.803847577293368,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"113.04 cm²","value":113.03999999999999,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":6,"radius":6,"base":17.999999999999996,"height":5.196152422706632,"base_display":"18.000000","height_display":"5.196152","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 18.000000, h = 5.196152; b × h ≈ 93.53 cm².","6 − 5.196152 ≈ 0.8038 cm.","3.14 × 6² = 113.04 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"For this 6-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"41.57 cm²","value":41.56921938165305,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.5359 cm","value":0.5358983848622452,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":6,"radius":4,"base":11.999999999999998,"height":3.464101615137755,"base_display":"12.000000","height_display":"3.464102","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 12.000000, h = 3.464102; b × h ≈ 41.57 cm².","4 − 3.464102 ≈ 0.5359 cm.","3.14 × 4² = 50.24 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."},{"topic":"Circle area concepts","concept":true,"prompt":"For this 6-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"166.28 cm²","value":166.2768775266122,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"1.0718 cm","value":1.0717967697244903,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"200.96 cm²","value":200.96,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":6,"radius":8,"base":23.999999999999996,"height":6.92820323027551,"base_display":"24.000000","height_display":"6.928203","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 24.000000, h = 6.928203; b × h ≈ 166.28 cm².","8 − 6.928203 ≈ 1.0718 cm.","3.14 × 8² = 200.96 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."}],"id":43},{"topic":"Circle area concepts","concept":true,"prompt":"For this 12-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"108.00 cm²","value":108,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.2044 cm","value":0.2044450422655899,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"113.04 cm²","value":113.03999999999999,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":6,"base":18.634971247381493,"height":5.79555495773441,"base_display":"18.634971","height_display":"5.795555","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 18.634971, h = 5.795555; b × h ≈ 108.00 cm².","6 − 5.795555 ≈ 0.2044 cm.","3.14 × 6² = 113.04 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"For this 12-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"48.00 cm²","value":48,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.1363 cm","value":0.13629669484372675,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":4,"base":12.423314164920995,"height":3.8637033051562732,"base_display":"12.423314","height_display":"3.863703","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 12.423314, h = 3.863703; b × h ≈ 48.00 cm².","4 − 3.863703 ≈ 0.1363 cm.","3.14 × 4² = 50.24 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."},{"topic":"Circle area concepts","concept":true,"prompt":"For this 12-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"192.00 cm²","value":192,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.2726 cm","value":0.2725933896874535,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"200.96 cm²","value":200.96,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":12,"radius":8,"base":24.84662832984199,"height":7.7274066103125465,"base_display":"24.846628","height_display":"7.727407","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 24.846628, h = 7.727407; b × h ≈ 192.00 cm².","8 − 7.727407 ≈ 0.2726 cm.","3.14 × 8² = 200.96 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."}],"id":44},{"topic":"Circle area concepts","concept":true,"prompt":"For this 24-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"111.81 cm²","value":111.80982748428895,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0513 cm","value":0.05133083175713793,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"113.04 cm²","value":113.03999999999999,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":24,"radius":6,"base":18.795771679687427,"height":5.948669168242862,"base_display":"18.795772","height_display":"5.948669","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 18.795772, h = 5.948669; b × h ≈ 111.81 cm².","6 − 5.948669 ≈ 0.0513 cm.","3.14 × 6² = 113.04 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"For this 24-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"49.69 cm²","value":49.693256659683975,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0342 cm","value":0.03422055450475847,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":24,"radius":4,"base":12.530514453124951,"height":3.9657794454952415,"base_display":"12.530514","height_display":"3.965779","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 12.530514, h = 3.965779; b × h ≈ 49.69 cm².","4 − 3.965779 ≈ 0.0342 cm.","3.14 × 4² = 50.24 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."},{"topic":"Circle area concepts","concept":true,"prompt":"For this 24-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"198.77 cm²","value":198.7730266387359,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0684 cm","value":0.06844110900951694,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"200.96 cm²","value":200.96,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":24,"radius":8,"base":25.061028906249902,"height":7.931558890990483,"base_display":"25.061029","height_display":"7.931559","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 25.061029, h = 7.931559; b × h ≈ 198.77 cm².","8 − 7.931559 ≈ 0.0684 cm.","3.14 × 8² = 200.96 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."}],"id":45},{"topic":"Circle area concepts","concept":true,"prompt":"For this 48-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"112.77 cm²","value":112.77463007812455,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0128 cm","value":0.01284646056837957,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"113.04 cm²","value":113.03999999999999,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":48,"radius":6,"base":18.8361012182812,"height":5.98715353943162,"base_display":"18.836101","height_display":"5.987154","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 18.836101, h = 5.987154; b × h ≈ 112.77 cm².","6 − 5.987154 ≈ 0.0128 cm.","3.14 × 6² = 113.04 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius.","variants":[{"topic":"Circle area concepts","concept":true,"prompt":"For this 48-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"50.12 cm²","value":50.122057812499804,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0086 cm","value":0.008564307045586084,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":48,"radius":4,"base":12.557400812187467,"height":3.991435692954414,"base_display":"12.557401","height_display":"3.991436","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 12.557401, h = 3.991436; b × h ≈ 50.12 cm².","4 − 3.991436 ≈ 0.0086 cm.","3.14 × 4² = 50.24 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."},{"topic":"Circle area concepts","concept":true,"prompt":"For this 48-gon and its rearranged triangles, find the three values.","fields":[{"label":"Area b × h (nearest 0.01)","answer":"200.49 cm²","value":200.48823124999922,"tolerance":0.0051,"unit":"cm²","key":"a"},{"label":"r − h (nearest 0.0001)","answer":"0.0171 cm","value":0.017128614091172167,"tolerance":0.000051,"unit":"cm","key":"b"},{"label":"Circle estimate 3.14r²","answer":"200.96 cm²","value":200.96,"tolerance":0.0051,"unit":"cm²","key":"c"}],"diagram":{"type":"polygon_rearrange","n":48,"radius":8,"base":25.114801624374934,"height":7.982871385908828,"base_display":"25.114802","height_display":"7.982871","show_polygon":true,"show_rearranged":true,"label_dimensions":true,"show_radius_comparison":true,"unit":"cm"},"solution":["b = 25.114802, h = 7.982871; b × h ≈ 200.49 cm².","8 − 7.982871 ≈ 0.0171 cm.","3.14 × 8² = 200.96 cm²."],"hint":"Multiply base by perpendicular height. Then compare the height with the radius."}],"id":46},{"topic":"Circle area concepts","concept":true,"prompt":"Compare the 6-, 12-, 24-, and 48-gons. What happens to r − h as the number of sides doubles? Explain why the height gets closer to the radius.","fields":[{"label":"Explain","answer":"The difference gets smaller and approaches zero. The triangles become narrower, so their perpendicular height gets closer to their radius-length sides.","value":null,"tolerance":0,"key":"a"}],"diagram":{"type":"polygon_rearrange","n":48,"radius":6,"base":18.8361012182812,"height":5.98715353943162,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["The gaps are about 0.8038, 0.2044, 0.0513, and 0.0128 cm. The narrowing triangles have heights approaching 6 cm."],"hint":"Compare your four differences, not just the drawings.","variants":[],"id":47},{"topic":"Circle area concepts","concept":true,"prompt":"As the number of sides grows, complete each statement.","fields":[{"label":"Base approaches","answer":"πr","value":null,"tolerance":0,"accepted":["πr","pi r","pi*r","pir"],"key":"a"},{"label":"Height approaches","answer":"r","value":null,"tolerance":0,"accepted":["r","radius"],"key":"b"},{"label":"Area approaches","answer":"(πr) × r = πr²","value":null,"tolerance":0,"accepted":["πr²","pi r^2","pi*r^2","pir^2","pi r squared"],"key":"c"}],"diagram":{"type":"polygon_rearrange","n":48,"radius":6,"base":18.8361012182812,"height":5.98715353943162,"show_polygon":true,"show_rearranged":true,"label_dimensions":false,"show_radius_comparison":true,"unit":"cm"},"solution":["Base approaches πr and height approaches r. Area therefore approaches (πr) × r = πr²."],"hint":"The area of every rearranged figure is base × height.","variants":[],"id":48}]},{"number":9,"title":"Radius, Diameter, and Circles","large":false,"problems":[{"topic":"Circles","concept":false,"prompt":"Find the radius.","fields":[{"label":"Radius","answer":"9 cm","value":9,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"circle","radius":9,"given":"diameter","label":"18 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = 18 cm","show_radius":true,"show_diameter":true},"solution":["r = 18 ÷ 2 = 9 cm."],"hint":"A radius is half of a diameter.","variants":[{"topic":"Circles","concept":false,"prompt":"Find the radius.","fields":[{"label":"Radius","answer":"12.5 m","value":12.5,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"circle","radius":12.5,"given":"diameter","label":"25 m","unit":"m","radius_label":"r = ?","diameter_label":"d = 25 m","show_radius":true,"show_diameter":true},"solution":["r = 25 ÷ 2 = 12.5 m."],"hint":"A radius is half of a diameter."},{"topic":"Circles","concept":false,"prompt":"Find the radius.","fields":[{"label":"Radius","answer":"6.5 ft","value":6.5,"tolerance":0.0001,"unit":"ft","key":"a"}],"diagram":{"type":"circle","radius":6.5,"given":"diameter","label":"13 ft","unit":"ft","radius_label":"r = ?","diameter_label":"d = 13 ft","show_radius":true,"show_diameter":true},"solution":["r = 13 ÷ 2 = 6.5 ft."],"hint":"A radius is half of a diameter."}],"id":49},{"topic":"Circles","concept":false,"prompt":"Find the diameter.","fields":[{"label":"Diameter","answer":"13 m","value":13,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"circle","radius":6.5,"given":"radius","label":"6.5 m","unit":"m","radius_label":"r = 6.5 m","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 6.5 = 13 m."],"hint":"A diameter is twice a radius.","variants":[{"topic":"Circles","concept":false,"prompt":"Find the diameter.","fields":[{"label":"Diameter","answer":"9 cm","value":9,"tolerance":0.0001,"unit":"cm","key":"a"}],"diagram":{"type":"circle","radius":4.5,"given":"radius","label":"4.5 cm","unit":"cm","radius_label":"r = 4.5 cm","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 4.5 = 9 cm."],"hint":"A diameter is twice a radius."},{"topic":"Circles","concept":false,"prompt":"Find the diameter.","fields":[{"label":"Diameter","answer":"14.5 in.","value":14.5,"tolerance":0.0001,"unit":"in.","key":"a"}],"diagram":{"type":"circle","radius":7.25,"given":"radius","label":"7.25 in.","unit":"in.","radius_label":"r = 7.25 in.","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 7.25 = 14.5 in.."],"hint":"A diameter is twice a radius."}],"id":50},{"topic":"Circles","concept":false,"prompt":"Find the radius and the circle area. Use A = πr² and π = 3.14.","fields":[{"label":"Radius","answer":"7 cm","value":7,"tolerance":0.0001,"unit":"cm","key":"a"},{"label":"Area","answer":"153.86 cm²","value":153.86,"tolerance":0.0051,"unit":"cm²","key":"b"}],"diagram":{"type":"circle","radius":7,"given":"diameter","label":"14 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = 14 cm","show_radius":true,"show_diameter":true},"solution":["r = 14 ÷ 2 = 7 cm.","A = 3.14 × 7² = 153.86 cm²."],"hint":"Halve the diameter before squaring the radius.","variants":[{"topic":"Circles","concept":false,"prompt":"Find the radius and the circle area. Use A = πr² and π = 3.14.","fields":[{"label":"Radius","answer":"5 m","value":5,"tolerance":0.0001,"unit":"m","key":"a"},{"label":"Area","answer":"78.50 m²","value":78.5,"tolerance":0.0051,"unit":"m²","key":"b"}],"diagram":{"type":"circle","radius":5,"given":"diameter","label":"10 m","unit":"m","radius_label":"r = ?","diameter_label":"d = 10 m","show_radius":true,"show_diameter":true},"solution":["r = 10 ÷ 2 = 5 m.","A = 3.14 × 5² = 78.5 m²."],"hint":"Halve the diameter before squaring the radius."},{"topic":"Circles","concept":false,"prompt":"Find the radius and the circle area. Use A = πr² and π = 3.14.","fields":[{"label":"Radius","answer":"8 in.","value":8,"tolerance":0.0001,"unit":"in.","key":"a"},{"label":"Area","answer":"200.96 in.²","value":200.96,"tolerance":0.0051,"unit":"in.²","key":"b"}],"diagram":{"type":"circle","radius":8,"given":"diameter","label":"16 in.","unit":"in.","radius_label":"r = ?","diameter_label":"d = 16 in.","show_radius":true,"show_diameter":true},"solution":["r = 16 ÷ 2 = 8 in..","A = 3.14 × 8² = 200.96 in.²."],"hint":"Halve the diameter before squaring the radius."}],"id":51},{"topic":"Circles","concept":false,"prompt":"Find the diameter and circumference. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"16 in.","value":16,"tolerance":0.0001,"unit":"in.","key":"a"},{"label":"Circumference","answer":"50.24 in.","value":50.24,"tolerance":0.0051,"unit":"in.","key":"b"}],"diagram":{"type":"circle","radius":8,"given":"radius","label":"8 in.","unit":"in.","radius_label":"r = 8 in.","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 8 = 16 in..","C = 3.14 × 16 = 50.24 in.."],"hint":"Double the radius first, then multiply the diameter by π.","variants":[{"topic":"Circles","concept":false,"prompt":"Find the diameter and circumference. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"10 cm","value":10,"tolerance":0.0001,"unit":"cm","key":"a"},{"label":"Circumference","answer":"31.40 cm","value":31.400000000000002,"tolerance":0.0051,"unit":"cm","key":"b"}],"diagram":{"type":"circle","radius":5,"given":"radius","label":"5 cm","unit":"cm","radius_label":"r = 5 cm","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 5 = 10 cm.","C = 3.14 × 10 = 31.4 cm."],"hint":"Double the radius first, then multiply the diameter by π."},{"topic":"Circles","concept":false,"prompt":"Find the diameter and circumference. Use C = πd and π = 3.14.","fields":[{"label":"Diameter","answer":"13 m","value":13,"tolerance":0.0001,"unit":"m","key":"a"},{"label":"Circumference","answer":"40.82 m","value":40.82,"tolerance":0.0051,"unit":"m","key":"b"}],"diagram":{"type":"circle","radius":6.5,"given":"radius","label":"6.5 m","unit":"m","radius_label":"r = 6.5 m","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 2 × 6.5 = 13 m.","C = 3.14 × 13 = 40.82 m."],"hint":"Double the radius first, then multiply the diameter by π."}],"id":52},{"topic":"Circles","concept":false,"prompt":"A circle has circumference 18.84 m. Find its radius and area. Use C = 2πr, A = πr², and π = 3.14.","fields":[{"label":"Radius","answer":"3 m","value":3,"tolerance":0.0001,"unit":"m","key":"a"},{"label":"Area","answer":"28.26 m²","value":28.259999999999998,"tolerance":0.0051,"unit":"m²","key":"b"}],"diagram":{"type":"circle","radius":3,"given":"circumference","label":"C = 18.84 m","unit":"m","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 18.84 ÷ 3.14 = 6; r = 6 ÷ 2 = 3 m.","A = 3.14 × 3² = 28.26 m²."],"hint":"Find the diameter and radius before finding the area.","variants":[{"topic":"Circles","concept":false,"prompt":"A circle has circumference 25.12 cm. Find its radius and area. Use C = 2πr, A = πr², and π = 3.14.","fields":[{"label":"Radius","answer":"4 cm","value":4,"tolerance":0.0001,"unit":"cm","key":"a"},{"label":"Area","answer":"50.24 cm²","value":50.24,"tolerance":0.0051,"unit":"cm²","key":"b"}],"diagram":{"type":"circle","radius":4,"given":"circumference","label":"C = 25.12 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 25.12 ÷ 3.14 = 8; r = 8 ÷ 2 = 4 cm.","A = 3.14 × 4² = 50.24 cm²."],"hint":"Find the diameter and radius before finding the area."},{"topic":"Circles","concept":false,"prompt":"A circle has circumference 12.56 ft. Find its radius and area. Use C = 2πr, A = πr², and π = 3.14.","fields":[{"label":"Radius","answer":"2 ft","value":2,"tolerance":0.0001,"unit":"ft","key":"a"},{"label":"Area","answer":"12.56 ft²","value":12.56,"tolerance":0.0051,"unit":"ft²","key":"b"}],"diagram":{"type":"circle","radius":2,"given":"circumference","label":"C = 12.56 ft","unit":"ft","radius_label":"r = ?","diameter_label":"d = ?","show_radius":true,"show_diameter":true},"solution":["d = 12.56 ÷ 3.14 = 4; r = 4 ÷ 2 = 2 ft.","A = 3.14 × 2² = 12.56 ft²."],"hint":"Find the diameter and radius before finding the area."}],"id":53},{"topic":"Circles","concept":false,"prompt":"Find the circumference. Use C = πd and π = 3.14.","fields":[{"label":"Circumference","answer":"34.54 ft","value":34.54,"tolerance":0.0051,"unit":"ft","key":"a"}],"diagram":{"type":"circle","radius":5.5,"given":"diameter","label":"11 ft","unit":"ft","radius_label":"r = ?","diameter_label":"d = 11 ft","show_radius":true,"show_diameter":true},"solution":["C = 3.14 × 11 = 34.54 ft."],"hint":"Multiply the diameter by π.","variants":[{"topic":"Circles","concept":false,"prompt":"Find the circumference. Use C = πd and π = 3.14.","fields":[{"label":"Circumference","answer":"21.98 m","value":21.98,"tolerance":0.0051,"unit":"m","key":"a"}],"diagram":{"type":"circle","radius":3.5,"given":"diameter","label":"7 m","unit":"m","radius_label":"r = ?","diameter_label":"d = 7 m","show_radius":true,"show_diameter":true},"solution":["C = 3.14 × 7 = 21.98 m."],"hint":"Multiply the diameter by π."},{"topic":"Circles","concept":false,"prompt":"Find the circumference. Use C = πd and π = 3.14.","fields":[{"label":"Circumference","answer":"47.10 cm","value":47.1,"tolerance":0.0051,"unit":"cm","key":"a"}],"diagram":{"type":"circle","radius":7.5,"given":"diameter","label":"15 cm","unit":"cm","radius_label":"r = ?","diameter_label":"d = 15 cm","show_radius":true,"show_diameter":true},"solution":["C = 3.14 × 15 = 47.1 cm."],"hint":"Multiply the diameter by π."}],"id":54}]},{"number":10,"title":"Understanding Ratios and Proportions","large":false,"problems":[{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"a"},{"label":"Cross-product check","answer":"2 × 12 = 24; 3 × 8 = 24.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"2","b":"3","c":"8","d":"12"},"solution":["2 × 12 = 24; 3 × 8 = 24.","The products are equal, so the fractions are equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right.","variants":[{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"a"},{"label":"Cross-product check","answer":"3 × 12 = 36; 4 × 9 = 36.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"3","b":"4","c":"9","d":"12"},"solution":["3 × 12 = 36; 4 × 9 = 36.","The products are equal, so the fractions are equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right."},{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"a"},{"label":"Cross-product check","answer":"5 × 18 = 90; 6 × 15 = 90.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"5","b":"6","c":"15","d":"18"},"solution":["5 × 18 = 90; 6 × 15 = 90.","The products are equal, so the fractions are equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right."}],"id":55},{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Not equal","value":null,"tolerance":0,"accepted":["no","not equal","unequal"],"key":"a"},{"label":"Cross-product check","answer":"3 × 20 = 60; 5 × 9 = 45.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"3","b":"5","c":"9","d":"20"},"solution":["3 × 20 = 60; 5 × 9 = 45.","The products differ, so the fractions are not equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right.","variants":[{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Not equal","value":null,"tolerance":0,"accepted":["no","not equal","unequal"],"key":"a"},{"label":"Cross-product check","answer":"2 × 14 = 28; 7 × 6 = 42.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"2","b":"7","c":"6","d":"14"},"solution":["2 × 14 = 28; 7 × 6 = 42.","The products differ, so the fractions are not equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right."},{"topic":"Ratio concepts","concept":true,"prompt":"Are the two fractions equal? Use the two cross products to check.","fields":[{"label":"Equal or not equal","answer":"Not equal","value":null,"tolerance":0,"accepted":["no","not equal","unequal"],"key":"a"},{"label":"Cross-product check","answer":"4 × 15 = 60; 9 × 8 = 72.","value":null,"tolerance":0,"key":"b"}],"diagram":{"type":"ratio","a":"4","b":"9","c":"8","d":"15"},"solution":["4 × 15 = 60; 9 × 8 = 72.","The products differ, so the fractions are not equal."],"hint":"Compare top-left × bottom-right with bottom-left × top-right."}],"id":56},{"topic":"Ratio concepts","concept":true,"prompt":"Calculate both cross products. Then decide whether the fractions are equal.","fields":[{"label":"4 × 21","answer":"84","value":84,"tolerance":0.0001,"unit":"","key":"a"},{"label":"7 × 12","answer":"84","value":84,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"c"}],"diagram":{"type":"ratio","a":"4","b":"7","c":"12","d":"21"},"solution":["84 = 84."],"hint":"Equal fractions have equal cross products.","variants":[{"topic":"Ratio concepts","concept":true,"prompt":"Calculate both cross products. Then decide whether the fractions are equal.","fields":[{"label":"5 × 24","answer":"120","value":120,"tolerance":0.0001,"unit":"","key":"a"},{"label":"8 × 15","answer":"120","value":120,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"c"}],"diagram":{"type":"ratio","a":"5","b":"8","c":"15","d":"24"},"solution":["120 = 120."],"hint":"Equal fractions have equal cross products."},{"topic":"Ratio concepts","concept":true,"prompt":"Calculate both cross products. Then decide whether the fractions are equal.","fields":[{"label":"3 × 33","answer":"99","value":99,"tolerance":0.0001,"unit":"","key":"a"},{"label":"11 × 9","answer":"99","value":99,"tolerance":0.0001,"unit":"","key":"b"},{"label":"Equal or not equal","answer":"Equal","value":null,"tolerance":0,"accepted":["yes","equal"],"key":"c"}],"diagram":{"type":"ratio","a":"3","b":"11","c":"9","d":"33"},"solution":["99 = 99."],"hint":"Equal fractions have equal cross products."}],"id":57},{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"6","value":6,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"x","b":"15","c":"8","d":"20"},"solution":["20x = 15 × 8 = 120.","x = 120 ÷ 20 = 6."],"hint":"Multiply across each diagonal; then divide to leave x alone.","variants":[{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"7.5","value":7.5,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"x","b":"18","c":"5","d":"12"},"solution":["12x = 18 × 5 = 90.","x = 90 ÷ 12 = 7.5."],"hint":"Multiply across each diagonal; then divide to leave x alone."},{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"6","value":6,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"x","b":"14","c":"9","d":"21"},"solution":["21x = 14 × 9 = 126.","x = 126 ÷ 21 = 6."],"hint":"Multiply across each diagonal; then divide to leave x alone."}],"id":58},{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"21","value":21,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"3","b":"7","c":"9","d":"x"},"solution":["3x = 7 × 9 = 63.","x = 63 ÷ 3 = 21."],"hint":"x is in the bottom-right position; it is multiplied by the top-left number.","variants":[{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"27","value":27,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"4","b":"9","c":"12","d":"x"},"solution":["4x = 9 × 12 = 108.","x = 108 ÷ 4 = 27."],"hint":"x is in the bottom-right position; it is multiplied by the top-left number."},{"topic":"Proportions","concept":false,"prompt":"Solve for x using cross multiplication.","fields":[{"label":"x","answer":"24","value":24,"tolerance":0.0001,"unit":"","key":"a"}],"diagram":{"type":"ratio","a":"5","b":"8","c":"15","d":"x"},"solution":["5x = 8 × 15 = 120.","x = 120 ÷ 5 = 24."],"hint":"x is in the bottom-right position; it is multiplied by the top-left number."}],"id":59},{"topic":"Proportions","concept":false,"prompt":"The table is proportional. Fill in the blanks and find k in y = kx.","fields":[{"label":"y when x = 4","answer":"14","value":14,"tolerance":0.0001,"unit":"","key":"a"},{"label":"y when x = 10","answer":"35","value":35,"tolerance":0.0001,"unit":"","key":"b"},{"label":"k","answer":"3.5","value":3.5,"tolerance":0.0001,"unit":"","key":"c"}],"diagram":{"type":"table","headers":["x","y"],"rows":[[2,7],[4,null],[6,21],[10,null]]},"solution":["k = 7 ÷ 2 = 3.5.","Missing values: 14 and 35."],"hint":"Divide y by x in a complete row; use the same rate in every row.","variants":[{"topic":"Proportions","concept":false,"prompt":"The table is proportional. Fill in the blanks and find k in y = kx.","fields":[{"label":"y when x = 6","answer":"15","value":15,"tolerance":0.0001,"unit":"","key":"a"},{"label":"y when x = 10","answer":"25","value":25,"tolerance":0.0001,"unit":"","key":"b"},{"label":"k","answer":"2.5","value":2.5,"tolerance":0.0001,"unit":"","key":"c"}],"diagram":{"type":"table","headers":["x","y"],"rows":[[2,5],[6,null],[8,20],[10,null]]},"solution":["k = 5 ÷ 2 = 2.5.","Missing values: 15 and 25."],"hint":"Divide y by x in a complete row; use the same rate in every row."},{"topic":"Proportions","concept":false,"prompt":"The table is proportional. Fill in the blanks and find k in y = kx.","fields":[{"label":"y when x = 5","answer":"20","value":20,"tolerance":0.0001,"unit":"","key":"a"},{"label":"y when x = 9","answer":"36","value":36,"tolerance":0.0001,"unit":"","key":"b"},{"label":"k","answer":"4","value":4,"tolerance":0.0001,"unit":"","key":"c"}],"diagram":{"type":"table","headers":["x","y"],"rows":[[3,12],[5,null],[7,28],[9,null]]},"solution":["k = 12 ÷ 3 = 4.","Missing values: 20 and 36."],"hint":"Divide y by x in a complete row; use the same rate in every row."}],"id":60}]},{"number":11,"title":"Ratios and Proportions in Context","large":false,"problems":[{"topic":"Proportions in context","concept":false,"prompt":"A bracelet uses 3 orange beads for every 5 blue beads. It has 18 orange beads. How many blue beads does it have?","fields":[{"label":"Blue beads","answer":"30 beads","value":30,"tolerance":0.0001,"unit":"beads","key":"a"}],"diagram":null,"solution":["18 ÷ 3 = 6 groups.","6 × 5 = 30 blue beads."],"hint":"Scale both parts of the ratio by the same factor.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"A bracelet uses 2 orange beads for every 7 blue beads. It has 12 orange beads. How many blue beads does it have?","fields":[{"label":"Blue beads","answer":"42 beads","value":42,"tolerance":0.0001,"unit":"beads","key":"a"}],"diagram":null,"solution":["12 ÷ 2 = 6 groups.","6 × 7 = 42 blue beads."],"hint":"Scale both parts of the ratio by the same factor."},{"topic":"Proportions in context","concept":false,"prompt":"A bracelet uses 4 orange beads for every 3 blue beads. It has 20 orange beads. How many blue beads does it have?","fields":[{"label":"Blue beads","answer":"15 beads","value":15,"tolerance":0.0001,"unit":"beads","key":"a"}],"diagram":null,"solution":["20 ÷ 4 = 5 groups.","5 × 3 = 15 blue beads."],"hint":"Scale both parts of the ratio by the same factor."}],"id":61},{"topic":"Proportions in context","concept":false,"prompt":"4 identical notebooks cost $6.80. Each costs the same amount. What is the cost of 7 notebooks?","fields":[{"label":"Cost","answer":"$11.90","value":11.9,"tolerance":0.0001,"unit":"dollars","key":"a"}],"diagram":null,"solution":["Each notebook costs $6.80 ÷ 4 = $1.70.","7 × $1.70 = $11.90."],"hint":"Find the cost of one notebook first.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"3 identical notebooks cost $5.25. Each costs the same amount. What is the cost of 8 notebooks?","fields":[{"label":"Cost","answer":"$14.00","value":14,"tolerance":0.0001,"unit":"dollars","key":"a"}],"diagram":null,"solution":["Each notebook costs $5.25 ÷ 3 = $1.75.","8 × $1.75 = $14.00."],"hint":"Find the cost of one notebook first."},{"topic":"Proportions in context","concept":false,"prompt":"5 identical notebooks cost $8.75. Each costs the same amount. What is the cost of 6 notebooks?","fields":[{"label":"Cost","answer":"$10.50","value":10.5,"tolerance":0.0001,"unit":"dollars","key":"a"}],"diagram":null,"solution":["Each notebook costs $8.75 ÷ 5 = $1.75.","6 × $1.75 = $10.50."],"hint":"Find the cost of one notebook first."}],"id":62},{"topic":"Proportions in context","concept":false,"prompt":"A muffin recipe uses 3 cups of flour for 2 batches. How many cups are needed for 5 batches of the same size?","fields":[{"label":"Flour needed","answer":"7.5 cups","value":7.5,"tolerance":0.0001,"unit":"cups","key":"a"}],"diagram":null,"solution":["3 ÷ 2 = 1.5 cups per batch.","1.5 × 5 = 7.5 cups."],"hint":"Keep the amount of flour per batch constant.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"A muffin recipe uses 4.5 cups of flour for 3 batches. How many cups are needed for 7 batches of the same size?","fields":[{"label":"Flour needed","answer":"10.5 cups","value":10.5,"tolerance":0.0001,"unit":"cups","key":"a"}],"diagram":null,"solution":["4.5 ÷ 3 = 1.5 cups per batch.","1.5 × 7 = 10.5 cups."],"hint":"Keep the amount of flour per batch constant."},{"topic":"Proportions in context","concept":false,"prompt":"A muffin recipe uses 6 cups of flour for 4 batches. How many cups are needed for 9 batches of the same size?","fields":[{"label":"Flour needed","answer":"13.5 cups","value":13.5,"tolerance":0.0001,"unit":"cups","key":"a"}],"diagram":null,"solution":["6 ÷ 4 = 1.5 cups per batch.","1.5 × 9 = 13.5 cups."],"hint":"Keep the amount of flour per batch constant."}],"id":63},{"topic":"Proportions in context","concept":false,"prompt":"A cyclist travels 4 miles in 20 minutes at a steady speed. How far will the cyclist travel in 35 minutes?","fields":[{"label":"Distance","answer":"7 miles","value":7,"tolerance":0.0001,"unit":"miles","key":"a"}],"diagram":null,"solution":["4 ÷ 20 = 0.2 mile per minute.","0.2 × 35 = 7 miles."],"hint":"Find distance per minute, then multiply.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"A cyclist travels 6 miles in 30 minutes at a steady speed. How far will the cyclist travel in 45 minutes?","fields":[{"label":"Distance","answer":"9 miles","value":9,"tolerance":0.0001,"unit":"miles","key":"a"}],"diagram":null,"solution":["6 ÷ 30 = 0.2 mile per minute.","0.2 × 45 = 9 miles."],"hint":"Find distance per minute, then multiply."},{"topic":"Proportions in context","concept":false,"prompt":"A cyclist travels 3 miles in 15 minutes at a steady speed. How far will the cyclist travel in 40 minutes?","fields":[{"label":"Distance","answer":"8 miles","value":8,"tolerance":0.0001,"unit":"miles","key":"a"}],"diagram":null,"solution":["3 ÷ 15 = 0.2 mile per minute.","0.2 × 40 = 8 miles."],"hint":"Find distance per minute, then multiply."}],"id":64},{"topic":"Proportions in context","concept":false,"prompt":"On a garden plan, 1 cm represents 4 m. A path is 6.5 cm long on the plan. Find its actual length.","fields":[{"label":"Actual length","answer":"26 m","value":26,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"segment","length":6.5,"unit_length":1,"show_ticks":false,"half_highlight":false,"unit":"cm"},"solution":["6.5 × 4 = 26 m."],"hint":"Every centimeter on the plan represents the same number of meters.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"On a garden plan, 1 cm represents 5 m. A path is 7.2 cm long on the plan. Find its actual length.","fields":[{"label":"Actual length","answer":"36 m","value":36,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"segment","length":7.2,"unit_length":1,"show_ticks":false,"half_highlight":false,"unit":"cm"},"solution":["7.2 × 5 = 36 m."],"hint":"Every centimeter on the plan represents the same number of meters."},{"topic":"Proportions in context","concept":false,"prompt":"On a garden plan, 1 cm represents 3 m. A path is 8.5 cm long on the plan. Find its actual length.","fields":[{"label":"Actual length","answer":"25.5 m","value":25.5,"tolerance":0.0001,"unit":"m","key":"a"}],"diagram":{"type":"segment","length":8.5,"unit_length":1,"show_ticks":false,"half_highlight":false,"unit":"cm"},"solution":["8.5 × 3 = 25.5 m."],"hint":"Every centimeter on the plan represents the same number of meters."}],"id":65},{"topic":"Proportions in context","concept":false,"prompt":"Pack A has 6 pens for $4.50. Pack B has 8 pens for $5.20. Find each price per pen. Which pack has the lower unit price?","fields":[{"label":"Pack A price per pen","answer":"$0.75","value":0.75,"tolerance":0.0001,"unit":"dollars","key":"a"},{"label":"Pack B price per pen","answer":"$0.65","value":0.65,"tolerance":0.0001,"unit":"dollars","key":"b"},{"label":"Lower unit price","answer":"Pack B","value":null,"tolerance":0,"accepted":["Pack B","B"],"key":"c"}],"diagram":null,"solution":["A: $4.50 ÷ 6 = $0.75 per pen.","B: $5.20 ÷ 8 = $0.65 per pen.","Pack B has the lower unit price."],"hint":"Compare prices for one pen, not total package prices.","variants":[{"topic":"Proportions in context","concept":false,"prompt":"Pack A has 4 pens for $3.20. Pack B has 6 pens for $4.50. Find each price per pen. Which pack has the lower unit price?","fields":[{"label":"Pack A price per pen","answer":"$0.80","value":0.8,"tolerance":0.0001,"unit":"dollars","key":"a"},{"label":"Pack B price per pen","answer":"$0.75","value":0.75,"tolerance":0.0001,"unit":"dollars","key":"b"},{"label":"Lower unit price","answer":"Pack B","value":null,"tolerance":0,"accepted":["Pack B","B"],"key":"c"}],"diagram":null,"solution":["A: $3.20 ÷ 4 = $0.80 per pen.","B: $4.50 ÷ 6 = $0.75 per pen.","Pack B has the lower unit price."],"hint":"Compare prices for one pen, not total package prices."},{"topic":"Proportions in context","concept":false,"prompt":"Pack A has 5 pens for $3.50. Pack B has 8 pens for $6.40. Find each price per pen. Which pack has the lower unit price?","fields":[{"label":"Pack A price per pen","answer":"$0.70","value":0.7,"tolerance":0.0001,"unit":"dollars","key":"a"},{"label":"Pack B price per pen","answer":"$0.80","value":0.8,"tolerance":0.0001,"unit":"dollars","key":"b"},{"label":"Lower unit price","answer":"Pack A","value":null,"tolerance":0,"accepted":["Pack A","A"],"key":"c"}],"diagram":null,"solution":["A: $3.50 ÷ 5 = $0.70 per pen.","B: $6.40 ÷ 8 = $0.80 per pen.","Pack A has the lower unit price."],"hint":"Compare prices for one pen, not total package prices."}],"id":66}]},{"number":12,"title":"Prisms and Proportional Graphs","large":true,"problems":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"42 cm³","value":42,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"l_prism","width":4,"height":5,"top_width":2,"right_height":2,"length":3,"show_dimensions":true,"show_unit_cubes":true,"cut":null,"upright":true,"unit":"cm"},"solution":["End area = 2 × 5 + (4 − 2) × 2 = 14 cm².","Volume = 14 × 3 = 42 cm³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length.","variants":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"36 m³","value":36,"tolerance":0.0001,"unit":"m³","key":"a"}],"diagram":{"type":"l_prism","width":5,"height":6,"top_width":2,"right_height":2,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":null,"upright":true,"unit":"m"},"solution":["End area = 2 × 6 + (5 − 2) × 2 = 18 m².","Volume = 18 × 2 = 36 m³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length."},{"topic":"Volume","concept":false,"prompt":"Find the volume of the prism with an L-shaped end.","fields":[{"label":"Volume","answer":"28 cm³","value":28,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"l_prism","width":5,"height":4,"top_width":3,"right_height":1,"length":2,"show_dimensions":true,"show_unit_cubes":true,"cut":null,"upright":true,"unit":"cm"},"solution":["End area = 3 × 4 + (5 − 3) × 1 = 14 cm².","Volume = 14 × 2 = 28 cm³."],"hint":"Split the L-shaped end into rectangles; multiply its total area by length."}],"id":67},{"topic":"Volume","concept":false,"prompt":"Find the volume of the upright prism.","fields":[{"label":"Volume","answer":"24 cm³","value":24,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"t_prism","width":5,"height":4,"top_height":1,"stem_width":1,"length":3,"show_dimensions":true,"show_unit_cubes":true,"upright":true,"unit":"cm"},"solution":["End area = 5 × 1 + 1 × (4 − 1) = 8 cm².","Volume = 8 × 3 = 24 cm³."],"hint":"Split the T-shaped end into two rectangles, then multiply by the prism length.","variants":[{"topic":"Volume","concept":false,"prompt":"Find the volume of the upright prism.","fields":[{"label":"Volume","answer":"46 m³","value":46,"tolerance":0.0001,"unit":"m³","key":"a"}],"diagram":{"type":"t_prism","width":7,"height":5,"top_height":2,"stem_width":3,"length":2,"show_dimensions":true,"show_unit_cubes":true,"upright":true,"unit":"m"},"solution":["End area = 7 × 2 + 3 × (5 − 2) = 23 m².","Volume = 23 × 2 = 46 m³."],"hint":"Split the T-shaped end into two rectangles, then multiply by the prism length."},{"topic":"Volume","concept":false,"prompt":"Find the volume of the upright prism.","fields":[{"label":"Volume","answer":"42 cm³","value":42,"tolerance":0.0001,"unit":"cm³","key":"a"}],"diagram":{"type":"t_prism","width":5,"height":6,"top_height":2,"stem_width":1,"length":3,"show_dimensions":true,"show_unit_cubes":true,"upright":true,"unit":"cm"},"solution":["End area = 5 × 2 + 1 × (6 − 2) = 14 cm².","Volume = 14 × 3 = 42 cm³."],"hint":"Split the T-shaped end into two rectangles, then multiply by the prism length."}],"id":68},{"topic":"Graphing proportions","concept":false,"prompt":"Water enters an empty container at 2 liters per minute. Complete y for x = 0, 1, 3, and 5. Plot the four points and connect them with a straight line. Then read the amount after 4 minutes.","fields":[{"label":"y-values in order","answer":"0, 2, 6, 10","value":null,"tolerance":0,"accepted":["0,2,6,10","0, 2, 6, 10"],"key":"a"},{"label":"Plot the points","answer":"(0, 0), (1, 2), (3, 6), (5, 10)","value":null,"tolerance":0,"key":"b"},{"label":"Water after 4 minutes","answer":"8 liters","value":8,"tolerance":0.0001,"unit":"liters","key":"c"}],"diagram":{"type":"graph","xmax":6,"ymax":12,"xstep":1,"ystep":2,"xlabel":"Time (minutes)","ylabel":"Water (liters)","plot_line":false,"slope":2,"points":[],"expected_points":[[0,0],[1,2],[3,6],[5,10]],"table":{"headers":["x: minutes","y: liters"],"rows":[[0,null],[1,null],[3,null],[5,null]]},"student_plot":true},"solution":["y = 2x. Points: (0, 0), (1, 2), (3, 6), (5, 10).","At x = 4, y = 2 × 4 = 8 liters."],"hint":"The graph begins at (0, 0). Each additional minute adds the same amount of water.","variants":[{"topic":"Graphing proportions","concept":false,"prompt":"Water enters an empty container at 3 liters per minute. Complete y for x = 0, 1, 3, and 5. Plot the four points and connect them with a straight line. Then read the amount after 4 minutes.","fields":[{"label":"y-values in order","answer":"0, 3, 9, 15","value":null,"tolerance":0,"accepted":["0,3,9,15","0, 3, 9, 15"],"key":"a"},{"label":"Plot the points","answer":"(0, 0), (1, 3), (3, 9), (5, 15)","value":null,"tolerance":0,"key":"b"},{"label":"Water after 4 minutes","answer":"12 liters","value":12,"tolerance":0.0001,"unit":"liters","key":"c"}],"diagram":{"type":"graph","xmax":6,"ymax":18,"xstep":1,"ystep":3,"xlabel":"Time (minutes)","ylabel":"Water (liters)","plot_line":false,"slope":3,"points":[],"expected_points":[[0,0],[1,3],[3,9],[5,15]],"table":{"headers":["x: minutes","y: liters"],"rows":[[0,null],[1,null],[3,null],[5,null]]},"student_plot":true},"solution":["y = 3x. Points: (0, 0), (1, 3), (3, 9), (5, 15).","At x = 4, y = 3 × 4 = 12 liters."],"hint":"The graph begins at (0, 0). Each additional minute adds the same amount of water."},{"topic":"Graphing proportions","concept":false,"prompt":"Water enters an empty container at 4 liters per minute. Complete y for x = 0, 1, 3, and 5. Plot the four points and connect them with a straight line. Then read the amount after 4 minutes.","fields":[{"label":"y-values in order","answer":"0, 4, 12, 20","value":null,"tolerance":0,"accepted":["0,4,12,20","0, 4, 12, 20"],"key":"a"},{"label":"Plot the points","answer":"(0, 0), (1, 4), (3, 12), (5, 20)","value":null,"tolerance":0,"key":"b"},{"label":"Water after 4 minutes","answer":"16 liters","value":16,"tolerance":0.0001,"unit":"liters","key":"c"}],"diagram":{"type":"graph","xmax":6,"ymax":24,"xstep":1,"ystep":4,"xlabel":"Time (minutes)","ylabel":"Water (liters)","plot_line":false,"slope":4,"points":[],"expected_points":[[0,0],[1,4],[3,12],[5,20]],"table":{"headers":["x: minutes","y: liters"],"rows":[[0,null],[1,null],[3,null],[5,null]]},"student_plot":true},"solution":["y = 4x. Points: (0, 0), (1, 4), (3, 12), (5, 20).","At x = 4, y = 4 × 4 = 16 liters."],"hint":"The graph begins at (0, 0). Each additional minute adds the same amount of water."}],"id":69},{"topic":"Graphing proportions","concept":false,"prompt":"The graph shows distance traveled at a steady speed. Find the distance per hour. What distance is reached after 3 hours?","fields":[{"label":"Distance per hour","answer":"3 km/h","value":3,"tolerance":0.0001,"unit":"km/h","key":"a"},{"label":"Distance after 3 hours","answer":"9 km","value":9,"tolerance":0.0001,"unit":"km","key":"b"}],"diagram":{"type":"graph","xmax":5,"ymax":15,"xstep":1,"ystep":3,"xlabel":"Time (hours)","ylabel":"Distance (km)","plot_line":true,"slope":3,"points":[[0,0],[1,3],[4,12]],"expected_points":[],"student_plot":false},"solution":["The point (1, 3) means 3 km in 1 hour.","At x = 3, y = 3 × 3 = 9 km."],"hint":"Read the height of the line at x = 1 and x = 3.","variants":[{"topic":"Graphing proportions","concept":false,"prompt":"The graph shows distance traveled at a steady speed. Find the distance per hour. What distance is reached after 3 hours?","fields":[{"label":"Distance per hour","answer":"4 km/h","value":4,"tolerance":0.0001,"unit":"km/h","key":"a"},{"label":"Distance after 3 hours","answer":"12 km","value":12,"tolerance":0.0001,"unit":"km","key":"b"}],"diagram":{"type":"graph","xmax":5,"ymax":20,"xstep":1,"ystep":4,"xlabel":"Time (hours)","ylabel":"Distance (km)","plot_line":true,"slope":4,"points":[[0,0],[1,4],[4,16]],"expected_points":[],"student_plot":false},"solution":["The point (1, 4) means 4 km in 1 hour.","At x = 3, y = 4 × 3 = 12 km."],"hint":"Read the height of the line at x = 1 and x = 3."},{"topic":"Graphing proportions","concept":false,"prompt":"The graph shows distance traveled at a steady speed. Find the distance per hour. What distance is reached after 3 hours?","fields":[{"label":"Distance per hour","answer":"5 km/h","value":5,"tolerance":0.0001,"unit":"km/h","key":"a"},{"label":"Distance after 3 hours","answer":"15 km","value":15,"tolerance":0.0001,"unit":"km","key":"b"}],"diagram":{"type":"graph","xmax":5,"ymax":25,"xstep":1,"ystep":5,"xlabel":"Time (hours)","ylabel":"Distance (km)","plot_line":true,"slope":5,"points":[[0,0],[1,5],[4,20]],"expected_points":[],"student_plot":false},"solution":["The point (1, 5) means 5 km in 1 hour.","At x = 3, y = 5 × 3 = 15 km."],"hint":"Read the height of the line at x = 1 and x = 3."}],"id":70}]}],"metadata":{"version":5,"problem_count":70,"page_count":12,"pi_for_decimal_calculations":3.14,"notes":["All finite regular polygon base lengths equal half the polygon perimeter.","Finite rearranged heights are apothems and approach the radius as the number of sides grows.","The exact 12-gon calculation uses a radial base and its perpendicular height, not a rounded apothem.","Partial-unit checks measure whole units plus cut halves.","Circumference concepts use nine-decimal given side lengths; perimeter is rounded to six decimals before calculating P/d."]}};

return {packetData};
})();

__studyModules["interactives.js"] = (() => {
/* Classroom geometry and proportion visualizations. All geometry is derived from
   mathematical units; the paper problem remains unchanged during exploration. */
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const clamp = (x,a=0,b=1) => Math.min(b,Math.max(a,x));
const lerp = (a,b,t) => a+(b-a)*t;
const ease = t => t*t*(3-2*t);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n,d=3) => Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d}) : '';
const fixed = (n,d=6) => Number(n).toFixed(d);
const wrapAngle = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const svgText = (x,y,t,cls='',anchor='middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
const pts = p => p.map(v=>v.map(n=>+n.toFixed(4)).join(',')).join(' ');
const poly = (p,cls='piece',extra='') => `<polygon points="${pts(p)}" class="${cls}" ${extra}/>`;
const ln = (x1,y1,x2,y2,cls='edge',extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${extra}/>`;

function styles(root) {
  const style = document.createElement('style');
  style.textContent = `
  .lessonviz{--lv-ink:var(--ink,#172b43);--lv-muted:var(--muted,#617084);--lv-accent:var(--accent,#315eaa);--lv-line:var(--border,#cbd4de);--lv-soft:var(--surface-soft,#edf2f8);color:var(--lv-ink);width:100%;font-family:inherit}
  .lessonviz *{box-sizing:border-box}.lessonviz .lv-toolbar{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:0 0 10px}.lessonviz button,.lessonviz select{font:inherit;font-size:13px;border:1px solid var(--lv-line);border-radius:8px;background:var(--surface,#fff);color:var(--lv-ink);min-height:44px;padding:7px 12px;cursor:pointer}.lessonviz button:hover{border-color:var(--lv-accent)}.lessonviz button[aria-pressed=true]{background:var(--lv-accent);border-color:var(--lv-accent);color:white}.lessonviz button:focus-visible,.lessonviz input:focus-visible{outline:3px solid #88a9df;outline-offset:2px}.lessonviz button:disabled{opacity:.45;cursor:default}.lessonviz .lv-push{margin-left:auto}.lessonviz .lv-small{font-size:12px;color:var(--lv-muted)}.lessonviz .lv-status{min-height:20px;font-size:12px;color:var(--lv-muted);margin-bottom:5px}.lessonviz .lv-visual{width:100%;aspect-ratio:800/430;min-height:210px;overflow:hidden}.lessonviz svg{display:block;width:100%;height:100%;overflow:visible}.lessonviz svg text{font-family:inherit;font-size:19px;fill:var(--lv-ink)}.lessonviz svg .small{font-size:15px;fill:var(--lv-muted)}.lessonviz svg .tiny{font-size:13px;fill:var(--lv-muted)}.lessonviz svg .large{font-size:31px;font-weight:600}.lessonviz svg .number{font-size:39px;font-weight:550}.lessonviz svg .formula{font-size:26px;font-weight:500}.lessonviz svg .accenttext{fill:var(--lv-accent);font-weight:600}.lessonviz svg .edge{stroke:var(--lv-ink);stroke-width:1.8;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .minor{stroke:var(--lv-muted);stroke-width:1;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .guide{stroke:var(--lv-muted);stroke-width:1.4;stroke-dasharray:6 5;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .ghost{stroke:var(--lv-line);stroke-width:1.2;fill:none;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}.lessonviz svg .piece{fill:#aac1e1;stroke:var(--lv-ink);stroke-width:1;vector-effect:non-scaling-stroke}.lessonviz svg .alternate{fill:#dee7f2;stroke:var(--lv-ink);stroke-width:1;vector-effect:non-scaling-stroke}.lessonviz svg .highlight{fill:#d4a85b;stroke:var(--lv-ink);stroke-width:1.4;vector-effect:non-scaling-stroke}.lessonviz svg .accentline{stroke:var(--lv-accent);stroke-width:3;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .softfill{fill:var(--lv-soft);stroke:var(--lv-line);stroke-width:1}.lessonviz svg .mutedfill{fill:var(--lv-line)}.lessonviz .lv-playbar{display:flex;align-items:center;gap:9px;margin-top:5px}.lessonviz .lv-playbar input{flex:1;min-width:60px;accent-color:var(--lv-accent);height:32px;touch-action:pan-x}.lessonviz .lv-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:14px}.lessonviz .lv-metric{padding:10px 12px;border:1px solid var(--lv-line);border-radius:9px;background:var(--surface,#fff);line-height:1.4}.lessonviz .lv-metric span{display:block;font-size:11px;color:var(--lv-muted);margin-bottom:2px}.lessonviz .lv-metric strong{font-size:15px;font-weight:600}.lessonviz .lv-caption{font-size:13px;line-height:1.5;margin:10px 0 0;color:var(--lv-muted)}.lessonviz .lv-radius{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--lv-muted)}.lessonviz .lv-radius input{width:90px;accent-color:var(--lv-accent)}.lessonviz .lv-check{margin-top:10px;font-size:12px;color:var(--lv-muted)}
  .lessonviz{position:relative;display:flex;flex-direction:column;flex:1;height:100%;min-height:0;min-width:0}
  .lessonviz .lv-status{flex:none;line-height:1.4;margin:0 0 5px;font-size:12px}
  .lessonviz .lv-visual{flex:1;width:100%;height:0;min-height:190px;aspect-ratio:auto;overflow:hidden}
  .lessonviz .lv-visual svg{width:100%;height:100%;min-height:0;overflow:hidden}
  .lessonviz .lv-footer{display:flex;align-items:center;gap:8px;flex:none;min-height:48px;padding-top:4px}
  .lessonviz .lv-playbar{flex:1;min-width:0;margin:0;gap:8px;order:1}.lessonviz .lv-footer>button{order:0}
  .lessonviz .lv-playbar input{height:44px;min-width:55px;touch-action:pan-x}
  .lessonviz input[type=range]{cursor:pointer;accent-color:var(--lv-accent)}
  .lessonviz input[type=range]::-webkit-slider-thumb{min-width:22px;min-height:22px}
  .lessonviz input[type=range]::-moz-range-thumb{width:22px;height:22px;border:2px solid white;border-radius:50%;background:var(--lv-accent)}
  .lessonviz .lv-options{flex:none;margin-left:auto;order:2}
  .lessonviz .lv-options>summary{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;min-width:88px;padding:8px 12px;border:1px solid var(--lv-line);border-radius:8px;background:var(--surface,#fff);color:var(--lv-ink);font-size:13px;cursor:pointer;list-style:none;touch-action:manipulation}
  .lessonviz .lv-options>summary::-webkit-details-marker{display:none}
  .lessonviz .lv-options>summary::after{content:'⌃';font-size:16px}
  .lessonviz .lv-options[open]>summary{background:var(--lv-accent);border-color:var(--lv-accent);color:white}
  .lessonviz .lv-options[open]>summary::after{content:'⌄'}
  .lessonviz .lv-options>summary:focus-visible{outline:3px solid #88a9df;outline-offset:2px}
  .lessonviz .lv-options-panel{position:absolute;z-index:5;bottom:54px;left:0;right:0;max-height:calc(100% - 60px);overflow:auto;overscroll-behavior:contain;border:1px solid var(--lv-line);border-radius:12px;background:var(--surface,#fff);box-shadow:0 8px 30px #172b4330;padding:14px}
  .lessonviz .lv-options-panel .lv-toolbar{margin-bottom:0}
  .lessonviz .lv-options-panel .lv-metrics{margin-top:12px}
  .lessonviz .lv-options-panel .lv-caption{font-size:14px}
  .lessonviz .lv-options-panel .lv-radius input{height:44px;min-width:100px}
  @media(min-width:1600px) and (min-height:900px){.lessonviz .lv-status{font-size:16px}.lessonviz button,.lessonviz .lv-options>summary{font-size:16px;min-height:48px}.lessonviz .lv-footer{min-height:52px}.lessonviz .lv-options-panel{bottom:58px}.lessonviz .lv-metric strong{font-size:18px}.lessonviz .lv-metric span,.lessonviz .lv-radius{font-size:14px}.lessonviz .lv-options-panel .lv-caption{font-size:16px}}
  @media(max-width:600px){.lessonviz .lv-footer{flex-wrap:wrap}.lessonviz .lv-playbar{flex-basis:100%}.lessonviz .lv-toolbar{gap:5px}.lessonviz button{padding:7px 9px;min-height:44px}.lessonviz .lv-visual{min-height:0}.lessonviz .lv-push{margin-left:0}.lessonviz .lv-metric{padding:8px}.lessonviz .lv-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.lessonviz .lv-radius{width:100%}.lessonviz .lv-radius input{flex:1}}
  `;
  root.append(style);
}
function svgViewport(svg){
  const W=800,H=430,pointers=new Map();let zoom=1,cx=W/2,cy=H/2,gesture=null;
  const rect=()=>svg.getBoundingClientRect();
  function render(){
    const vw=W/zoom,vh=H/zoom;
    if(zoom<=1){cx=W/2;cy=H/2;}else{cx=clamp(cx,vw/2,W-vw/2);cy=clamp(cy,vh/2,H-vh/2);}
    svg.setAttribute('viewBox',`${cx-vw/2} ${cy-vh/2} ${vw} ${vh}`);svg.setAttribute('data-zoom',String(zoom));
    svg.style.cursor=zoom>1?'grab':'default';
  }
  function scaleAt(factor,x=null,y=null){
    const before=zoom,next=clamp(zoom*factor,.75,6);
    if(x!==null){const r=rect(),scale=Math.min(r.width/(W/before),r.height/(H/before));const dx=(x-r.left-r.width/2)/scale,dy=(y-r.top-r.height/2)/scale;cx+=dx*(1-before/next);cy+=dy*(1-before/next);}
    zoom=next;render();
  }
  function action(which){if(which==='zoom-reset'){zoom=1;cx=W/2;cy=H/2;render();}else if(which==='zoom-in')scaleAt(1.25);else if(which==='zoom-out')scaleAt(.8);}
  function begin(){
    const ps=[...pointers.values()],r=rect(),a=ps[0],b=ps[1];
    gesture=ps.length>1?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y),z:zoom,cx,cy,w:r.width,h:r.height,left:r.left,top:r.top}:{x:a.x,y:a.y,z:zoom,cx,cy,w:r.width,h:r.height,left:r.left,top:r.top};
  }
  svg.style.touchAction='none';svg.setAttribute('tabindex','0');svg.setAttribute('aria-label','Mathematical diagram. Scroll over the diagram to zoom, drag when enlarged, or pinch with two fingers.');
  svg.onpointerdown=e=>{if(e.pointerType==='mouse'&&(e.button!==0||zoom<=1))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture?.(e.pointerId);begin();};
  svg.onpointermove=e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const ps=[...pointers.values()],a=ps[0],b=ps[1],g=gesture,scale=Math.min(g.w/(W/g.z),g.h/(H/g.z));
    if(ps.length>1&&g.d){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;zoom=clamp(g.z*Math.hypot(a.x-b.x,a.y-b.y)/g.d,.75,6);const nextScale=scale*zoom/g.z,centerX=g.left+g.w/2,centerY=g.top+g.h/2;cx=g.cx+(g.x-centerX)/scale-(mx-centerX)/nextScale;cy=g.cy+(g.y-centerY)/scale-(my-centerY)/nextScale;}
    else if(zoom>1){cx=g.cx-(a.x-g.x)/scale;cy=g.cy-(a.y-g.y)/scale;}
    render();if(zoom>1)svg.style.cursor='grabbing';
  };
  const end=e=>{pointers.delete(e.pointerId);if(pointers.size)begin();else{gesture=null;render();}};
  svg.onpointerup=end;svg.onpointercancel=end;svg.onlostpointercapture=end;
  svg.onwheel=e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?svg.getBoundingClientRect().height:1);scaleAt(Math.exp(-clamp(delta,-180,180)*.004),e.clientX,e.clientY);};
  svg.onkeydown=e=>{if(e.key==='+'||e.key==='='){action('zoom-in');e.preventDefault();}else if(e.key==='-'){action('zoom-out');e.preventDefault();}else if(e.key==='0'){action('zoom-reset');e.preventDefault();}else if(zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){cx+=({ArrowLeft:-40,ArrowRight:40}[e.key]||0)/zoom;cy+=({ArrowUp:-40,ArrowDown:40}[e.key]||0)/zoom;render();e.preventDefault();}};
  render();return{action,clean(){pointers.clear();svg.onpointerdown=svg.onpointermove=svg.onpointerup=svg.onpointercancel=svg.onlostpointercapture=svg.onwheel=svg.onkeydown=null;}};
}

function frame(container, options={}) {
  const root=document.createElement('section'); root.className='lessonviz';
  root.setAttribute('aria-label','Interactive lesson visualization');
  styles(root);
  const toolbar=document.createElement('div');toolbar.className='lv-toolbar';
  const status=document.createElement('div');status.className='lv-status';status.setAttribute('aria-live','polite');
  const liveControls=document.createElement('div');liveControls.className='lv-live-controls';
  const visual=document.createElement('div');visual.className='lv-visual';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 800 430');svg.setAttribute('role','img');svg.setAttribute('aria-label','Mathematical diagram');visual.append(svg);
  const playbar=document.createElement('div');playbar.className='lv-playbar';
  const metrics=document.createElement('div');metrics.className='lv-metrics';
  const caption=document.createElement('p');caption.className='lv-caption';
  const footer=document.createElement('div');footer.className='lv-footer';
  const optionsDrawer=document.createElement('details');optionsDrawer.className='lv-options';
  const optionsSummary=document.createElement('summary');optionsSummary.textContent='Explore';optionsSummary.setAttribute('aria-label','Explore: open controls, measurements, and explanation');
  const optionsPanel=document.createElement('div');optionsPanel.className='lv-options-panel';optionsPanel.append(toolbar,metrics,caption);
  optionsDrawer.append(optionsSummary,optionsPanel);footer.append(playbar,optionsDrawer);
  root.append(status,liveControls,visual,footer);container.replaceChildren(root);
  root.onkeydown=event=>{if(event.key==='Escape'&&optionsDrawer.open){optionsDrawer.open=false;optionsSummary.focus();event.stopPropagation();}};
  let disposed=false, raf=0;
  const viewport=svgViewport(svg),allowSolutions=options.allowSolutions===true;
  const reduced=options.reducedMotion ?? (typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function animate(from,to,duration,render,done) {
    cancelAnimationFrame(raf);
    if(reduced){render(to);done?.();return;}
    const start=performance.now();
    function tick(now){if(disposed)return;const p=clamp((now-start)/duration);render(lerp(from,to,p));if(p<1)raf=requestAnimationFrame(tick);else{raf=0;done?.();}}
    raf=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;}
  function clean(){disposed=true;stop();viewport.clean();root.remove();}
  clean.zoom=viewport.action;
  const button=(label,callback,parent=toolbar)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=callback;if(parent===toolbar&&(label==='Next step'||label==='Place next piece'))parent=playbar;if(parent===toolbar&&label==='Show area calculation')parent=footer;parent.append(b);return b;};
  const setMetrics=entries=>metrics.innerHTML=entries.map(([label,value])=>`<div class="lv-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  return{root,toolbar,status,liveControls,svg,playbar,metrics,caption,animate,stop,clean,button,setMetrics,reduced,allowSolutions};
}
function transport(f, redraw, maximum=1, duration=2800) {
  let t=0,playing=false;
  const play=f.button('Play',()=>{if(playing){pause();return;}if(t>=maximum-.00001)t=0;playing=true;play.textContent='Pause';f.animate(t,maximum,duration*(maximum-t)/maximum,set,()=>{playing=false;play.textContent='Replay';});},f.playbar);
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max=String(maximum);slider.step='0.001';slider.value='0';slider.setAttribute('aria-label','Animation progress');f.playbar.append(slider);
  const reset=f.button('Reset',()=>{pause();set(0);},f.playbar);
  const pause=()=>{f.stop();playing=false;play.textContent=t>=maximum?'Replay':'Play';};
  function set(v){t=clamp(v,0,maximum);slider.value=t;redraw(t);}
  slider.oninput=()=>{pause();set(Number(slider.value));};
  return {get t(){return t;},set,pause,next(){pause();const next=Math.min(maximum,Math.floor(t+0.001)+1);f.animate(t,next,700,set);},reset(){pause();set(0);},dispose:pause};
}
function polygonSettings(f,d,onChange) {
  const origN=Number(d.n)||12,origR=Number(d.radius)||6,even=d.type==='polygon_rearrange',minSides=even?4:3,maxSides=Math.max(96,origN),step=even?2:1;
  let n=origN,r=origR;
  const sides=document.createElement('label');sides.className='lv-sides-control';
  const sidesName=document.createElement('span');sidesName.className='lv-sides-label';sidesName.textContent='Sides';
  const sideOutput=document.createElement('output');sideOutput.className='lv-sides-value';sideOutput.textContent=String(n);
  const sideInput=document.createElement('input');sideInput.type='range';sideInput.min=String(minSides);sideInput.max=String(maxSides);sideInput.step=String(step);sideInput.value=String(n);sideInput.setAttribute('aria-label',even?'Number of sides, even counts for triangle pairs':'Number of polygon sides');
  const sideNote=document.createElement('span');sideNote.className='lv-sides-note';sideNote.textContent=even?'Even counts · triangle pairs':`${minSides}–${maxSides}`;
  sides.append(sidesName,sideOutput,sideInput,sideNote);f.liveControls.append(sides);
  sideInput.oninput=()=>{n=clamp(minSides+Math.round((Number(sideInput.value)-minSides)/step)*step,minSides,maxSides);refresh();onChange(n,r);};
  const group=document.createElement('div');group.style.display='flex';group.style.gap='5px';group.setAttribute('aria-label','Polygon side shortcuts');f.toolbar.append(group);
  const buttons=[];
  for(const nn of [...new Set([6,12,24,48,origN])].sort((a,b)=>a-b).filter(v=>!even||v%2===0)){const b=f.button(`${nn} sides`,()=>{n=nn;refresh();onChange(n,r);},group);buttons.push([nn,b]);}
  const lab=document.createElement('label');lab.className='lv-radius lv-push';lab.innerHTML=`Radius <input type="range" min="1" max="${Math.max(32,Math.ceil(origR))}" step="0.5" value="${origR}" aria-label="Exploration radius"><output>${fmt(origR)}</output>`;f.toolbar.append(lab);
  const input=lab.querySelector('input'),output=lab.querySelector('output');input.oninput=()=>{r=Number(input.value);refresh();onChange(n,r);};
  const original=f.button('Packet values',()=>{n=origN;r=origR;input.value=r;refresh();onChange(n,r);});
  function refresh(){buttons.forEach(([nn,b])=>b.setAttribute('aria-pressed',String(nn===n)));sideInput.value=String(n);sideOutput.textContent=String(n);sideInput.setAttribute('aria-valuetext',`${n} sides${even?', arranged in equal pairs':''}`);output.textContent=fmt(r);const changed=n!==origN||r!==origR;f.status.textContent=changed?'Exploration — packet values and saved answers stay unchanged.':'Packet values';original.disabled=!changed;}
  refresh();return {get n(){return n;},get r(){return r;}};
}

function mountPerimeter(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6;
  let tr;
  const settings=polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;draw(tr.t);});
  f.caption.textContent='Unroll the straight sides, then compare their total length with one diameter. More sides make the polygon’s perimeter approach the circle’s circumference.';
  function draw(t){
    const scale=640/(TAU*r),rp=r*scale,cx=400,cy=155,side=2*r*Math.sin(Math.PI/n),givenSide=(n===Number(d.n)&&r===Number(d.radius)&&Number.isFinite(Number(d.side_length)))?Number(d.side_length):Number(side.toFixed(9)),P=Number((n*givenSide).toFixed(6)),D=2*r,ratio=Math.round(Math.round(P*1e6)/D)/1e6;
    let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" fill="none" class="guide"/>`;
    const verts=Array.from({length:n},(_,i)=>[cx+rp*Math.cos(i*TAU/n),cy-rp*Math.sin(i*TAU/n)]);
    g+=ln(cx-rp,cy,cx+rp,cy,'accentline')+svgText(cx,cy+27,`diameter = ${fmt(D)} ${d.unit||'cm'}`,'small');
    const rx=cx+rp*Math.cos(Math.PI/3),ry=cy-rp*Math.sin(Math.PI/3);
    g+=ln(cx,cy,rx,ry,'edge')+svgText(rx+8,ry+22,`r = ${fmt(r)}`,'small','start');
    for(let i=0;i<n;i++){
      const a=verts[i],b=verts[(i+1)%n],len=side*scale,sourceAngle=Math.atan2(b[1]-a[1],b[0]-a[0]);
      const targetX=80+i*len,targetY=300;
      const x=lerp(a[0],targetX,t),y=lerp(a[1],targetY,t),ang=sourceAngle+wrapAngle(-sourceAngle)*t;
      const x2=x+len*Math.cos(ang),y2=y+len*Math.sin(ang);
      g+=ln(x,y,x2,y2,i%2?'accentline':'edge');
    }
    g+=svgText(400,27,`${n}-gon inside the circle`,'small');
    if(t<.95)g+=svgText(400,285,`Each side = ${fixed(givenSide,9)} ${d.unit||'cm'}`,'small');
    if(t>.98){const op=(t-.98)/.02;g+=`<g opacity="${op}">${svgText(80,280,'Perimeter P','small','start')}${ln(80,354,80+D*scale,354,'accentline')}${svgText(80+D*scale/2,381,`One diameter: ${fmt(D)} ${d.unit||'cm'}`,'small')}`;
      for(let j=1;j<=3;j++)g+=ln(80+j*D*scale,290,80+j*D*scale,310,'guide')+svgText(80+j*D*scale,326,`${j}d`,'tiny');
      g+=svgText(400,414,f.allowSolutions?`P ÷ d = ${fixed(ratio)};   π ≈ 3.141593`:'Compare the unrolled boundary with one diameter.','accenttext')+'</g>';
    }
    f.svg.innerHTML=g;
    f.setMetrics(f.allowSolutions&&t>=.999 ? [['Polygon perimeter P',`${fixed(P)} ${d.unit||'cm'}`],['Diameter d',`${fmt(D)} ${d.unit||'cm'}`],['Perimeter ÷ diameter',fixed(ratio)],['Circle relationship','C = πd = 2πr']] : [['Number of equal sides',String(n)],['Length of each side',`${fixed(givenSide,9)} ${d.unit||'cm'}`],['Diameter d',`${fmt(D)} ${d.unit||'cm'}`],['Find the perimeter first','Number of sides × side length']]);
  }
  tr=transport(f,draw);tr.set(0);return f.clean;
}

function mountRearrange(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6;let tr;
  polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;draw(tr.t);});
  f.caption.textContent=f.allowSolutions?'Each triangle keeps its size. Together they form a parallelogram: base = half the polygon perimeter, height = the polygon’s center-to-side distance. As the number of sides increases, the base approaches πr and the height approaches r.':'Each triangle keeps its size. Compare the bottom edge with the polygon boundary. Compare the rearranged height with the original radius, and describe what changes as the number of sides grows.';
  function draw(t){
    const s=2*r*Math.sin(Math.PI/n),h=r*Math.cos(Math.PI/n),b=n*s/2,scale=138/r,originalValues=n===Number(d.n)&&r===Number(d.radius);
    const center=[400,228],left=400-(b+s/2)*scale/2,bottom=312;
    const phase=0,rad=r*scale;
    let g=`<circle cx="${center[0]}" cy="${center[1]}" r="${rad}" fill="none" class="ghost" opacity="${1-t*.75}"/>`;
    if(t<.02)g+=ln(center[0],center[1],center[0]+rad,center[1],'accentline')+svgText(center[0]+rad/2,center[1]-12,`r = ${fmt(r)}`,'small');
    for(let i=0;i<n;i++){
      const a=phase+i*TAU/n,j=Math.floor(i/2),up=i%2===0;
      const targetApex=up?[(j+.5)*s,h]:[(j+1)*s,0];
      const targetAngle=up?Math.atan2(-h,-s/2):Math.atan2(h,s/2);
      const rotation=wrapAngle(targetAngle-a)*t;
      const apex=[lerp(center[0],left+targetApex[0]*scale,t),lerp(center[1],bottom-targetApex[1]*scale,t)];
      const angleA=a+rotation,angleB=a+TAU/n+rotation;
      const triangle=[apex,[apex[0]+rad*Math.cos(angleA),apex[1]-rad*Math.sin(angleA)],[apex[0]+rad*Math.cos(angleB),apex[1]-rad*Math.sin(angleB)]];
      g+=poly(triangle,up?'piece':'alternate',`style="stroke:#8ca3b9;stroke-width:${Math.min(.8,4.8/n)}"`);
    }
    if(t>.75){const op=(t-.75)/.25,top=bottom-h*scale,xright=left+(b+s/2)*scale;
      g+=`<g opacity="${op}">`+ln(left,bottom+25,left+b*scale,bottom+25,'accentline')+ln(left,bottom+19,left,bottom+31,'minor')+ln(left+b*scale,bottom+19,left+b*scale,bottom+31,'minor');
      g+=svgText(left+b*scale/2,bottom+53,f.allowSolutions?`base = P/2 = ${fixed(b)} ${d.unit||'cm'}`:d.label_dimensions&&originalValues?`base = ${fmt(Number(d.base),6)} ${d.unit||'cm'}`:'base','small');
      g+=ln(xright+22,bottom,xright+22,top,'accentline')+svgText(xright+36,(bottom+top)/2,'h','accenttext','start');
      g+=ln(left+s*scale/2, bottom-r*scale, xright+45,bottom-r*scale,'guide');
      g+=svgText(400,bottom-r*scale-14,f.allowSolutions?`dashed level: r = ${fmt(r)};   height gap r − h = ${fixed(r-h)}`:`dashed level: radius = ${fmt(r)}; compare the gap`,'small');
      g+=svgText(400,412,f.allowSolutions?'Base approaches πr. Height approaches r. Area approaches πr × r.':'Describe what the base and height approach.','small')+'</g>';
    } else g+=svgText(400,32,`${n} equal triangles — same pieces, new arrangement`,'small');
    f.svg.innerHTML=g;
    const estimating=(problem.fields||[]).some(field=>/estimated perimeter/i.test(field.label));
    f.setMetrics(!f.allowSolutions ? [['Radius',`${fmt(r)} ${d.unit||'cm'}`],...(d.label_dimensions&&originalValues?[['Given polygon base',`${fmt(Number(d.base),6)} ${d.unit||'cm'}`],['Given polygon height',`${fmt(Number(d.height),6)} ${d.unit||'cm'}`]]:[]),['Think about the change','Compare the edges and heights']] : estimating ? [['Circle estimate 2 × 3.14 × r',`${fmt(2*3.14*r,4)} ${d.unit||'cm'}`],['Estimated base: 3.14 × r',`${fmt(3.14*r,4)} ${d.unit||'cm'}`],['Finite polygon base P/2',`${fixed(b)} ${d.unit||'cm'}`],['Polygon height h',`${fixed(h)} ${d.unit||'cm'}`]] : [['Base b = P/2',`${fixed(b)} ${d.unit||'cm'}`],['Height h',`${fixed(h)} ${d.unit||'cm'}`],['Radius − height',`${fixed(r-h)} ${d.unit||'cm'}`],['Polygon area b × h',`${fixed(b*h)} square ${d.unit||'cm'}`]]);
  }
  tr=transport(f,draw,1,3200);tr.set(0);return f.clean;
}

function mountParallelogram(container,problem,options) {
  const f=frame(container,options),d=problem.diagram,b=Number(d.base),h=Number(d.height),shift=Number(d.shift)||Math.min(2,b/3);let tr;
  f.status.textContent='Cut along the dashed height, then slide the triangle to the other end.';
  f.caption.textContent=f.allowSolutions?'The rearranged rectangle has the same base and perpendicular height. Every piece is kept, so the area is unchanged: A = base × height.':'Follow the cut and compare the resulting rectangle with the original parallelogram. Which measurements stay the same? Use that comparison to explain your answer.';
  f.button('Cut and move',()=>{tr.pause();f.animate(tr.t,1,2200,tr.set);});
  f.button('Original shape',()=>tr.reset());
  function draw(t){
    const scale=Math.min(550/(b+shift),180/h),x=400-(b+shift)*scale/2,y=300;
    const map=([a,z])=>[x+a*scale,y-z*scale];
    let g=svgText(400,45,t>.98?'Same pieces form a rectangle':'A parallelogram can be rearranged','small');
    g+=poly([[shift,0],[b,0],[b+shift,h],[shift,h]].map(map),'alternate');
    const moving=[[0,0],[shift,0],[shift,h]].map(([a,z])=>map([a+b*t,z+Math.sin(Math.PI*t)*.38*h]));g+=poly(moving,'highlight');
    g+=ln(x+shift*scale,y,x+shift*scale,y-h*scale,'guide');
    if(t>.03&&t<.98)g+=`<path d="M ${x+shift*scale*.6} ${y-h*scale*.65} Q 400 ${y-h*scale-120} ${x+(b+shift*.6)*scale} ${y-h*scale*.65}" class="guide"/>`;
    const basex=x+shift*scale*t;
    g+=ln(basex,y+25,basex+b*scale,y+25,'accentline')+svgText(basex+b*scale/2,y+52,`base = ${fmt(b)} ${d.unit||'units'}`,'small');
    const hx=x+(b+shift)*scale+35;
    g+=ln(hx,y,hx,y-h*scale,'accentline')+svgText(hx+12,y-h*scale/2,`h = ${fmt(h)}`,'small','start');
    g+=svgText(400,405,f.allowSolutions?'No pieces added. No pieces lost. Same area.':'Compare the original shape and the rectangle.','accenttext');
    f.svg.innerHTML=g;f.setMetrics([['Original base',`${fmt(b)} ${d.unit||'units'}`],['Perpendicular height',`${fmt(h)} ${d.unit||'units'}`],['Corresponding rectangle',`${fmt(b)} by ${fmt(h)}`]]);
  }
  tr=transport(f,draw);tr.set(0);return f.clean;
}

function mountCentral(container,problem,options) {
  const f=frame(container,options),d=problem.diagram,r=Number(d.radius)||6,n=Number(d.n)||12;
  const base=Number(d.radial_base)||r,alt=Number(d.perpendicular_height)||r*Math.sin(TAU/n),unit=d.unit||'cm';let count=1,reveal=false;
  f.status.textContent='The enlarged triangle uses a radius as its base. Its marked height is perpendicular to that base.';
  const show=f.allowSolutions&&f.button('Show area calculation',()=>{reveal=!reveal;show.textContent=reveal?'Hide calculation':'Show area calculation';draw();});
  const label=document.createElement('label');label.className='lv-radius';label.innerHTML=`Triangles <input type="range" min="1" max="${n}" value="1" step="1" aria-label="Number of triangles counted"><output>1</output>`;f.toolbar.append(label);
  label.querySelector('input').oninput=e=>{count=Number(e.target.value);label.querySelector('output').textContent=count;draw();};
  f.caption.textContent='Use ½ × base × perpendicular height for one triangle. Add all 12 equal triangle areas to get the polygon’s exact area. The polygon stays slightly smaller than its surrounding circle.';
  function draw(){
    const cx=190,cy=210,rad=120,theta=TAU/n;
    const verts=Array.from({length:n},(_,i)=>[cx+rad*Math.cos(i*theta),cy-rad*Math.sin(i*theta)]);
    let g=`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" class="ghost"/>`;
    for(let i=0;i<n;i++)g+=poly([[cx,cy],verts[i],verts[(i+1)%n]],i<count?'highlight':'alternate','style="stroke:none"');
    for(const v of verts)g+=ln(cx,cy,...v,'minor',`style="stroke:#8ca3b9;stroke-width:${Math.min(.8,9.6/n)}"`);
    g+=poly(verts,'edge');
    const scale=280/r,x=425,y=288,apexx=x+r*Math.cos(theta)*scale,apexy=y-alt*scale;
    g+=svgText(cx,47,'The 12-gon','small')+svgText(565,47,'One triangle, enlarged','small');
    g+=poly([[x,y],[x+r*scale,y],[apexx,apexy]],'piece');
    g+=ln(apexx,apexy,apexx,y,'guide')+ln(apexx-12,y,apexx-12,y-12,'minor')+ln(apexx-12,y-12,apexx,y-12,'minor');
    g+=svgText(x+r*scale/2,y+30,`base = ${fmt(base)} ${unit}`,'small');
    g+=svgText(745,(apexy+y)/2,`h = ${fmt(alt)} ${unit}`,'small');
    if(f.allowSolutions&&reveal){const one=.5*base*alt;g+=svgText(400,375,`One triangle: ½ × ${fmt(base)} × ${fmt(alt)} = ${fmt(one)} square ${unit}`,'formula');g+=svgText(400,410,`${count} ${count===1?'triangle':'triangles'}: ${count} × ${fmt(one)} = ${fmt(count*one)} square ${unit}`,'accenttext');}
    f.svg.innerHTML=g;f.setMetrics([['Counted triangles',`${count} of ${n}`],['Triangle base',`${fmt(base)} ${unit}`],['Triangle perpendicular height',`${fmt(alt)} ${unit}`],['Circle comparison',f.allowSolutions?`A ≈ 3.14 × ${fmt(r)}²`:'Use the given circle formula']]);
  }
  f.playbar.hidden=true;draw();return f.clean;
}

function mountRatioGuide(container,problem,options){
  const f=frame(container,options),d=problem.diagram,given=[d.a,d.b,d.c,d.d].map(String),hasX=given.some(v=>v.toLowerCase()==='x');let tr;
  f.status.textContent='The letters mark positions. Apply the same movement to your given numbers.';
  f.caption.textContent='Multiply across each diagonal. Compare the two products yourself. If a factor is unknown, use the inverse operation to isolate it.';
  f.button('Next step',()=>tr.next());f.button('Start again',()=>tr.reset());
  function draw(t){
    const initial=[[245,135],[245,220],[555,135],[555,220]],target=[[225,280],[490,280],[565,280],[300,280]],letters=['a','b','c','d'],p=clamp(t);
    let g=svgText(400,45,`${given[0]}/${given[1]} ${hasX?'=':'?'} ${given[2]}/${given[3]}`,'formula');
    if(t<1)g+=`<g opacity="${1-p}">${ln(208,170,282,170)}${ln(518,170,592,170)}${svgText(400,180,'?','large')}</g>`;
    if(t<1&&p>0)g+=`<g opacity="${Math.sin(p*Math.PI)}">${ln(260,140,540,208,'accentline')}${ln(260,208,540,140,'accentline')}</g>`;
    for(let i=0;i<4;i++)g+=svgText(lerp(initial[i][0],target[i][0],p),lerp(initial[i][1],target[i][1],p),letters[i],'number');
    g+=`<g opacity="${p}">${svgText(263,280,'×','large')}${svgText(528,280,'×','large')}${svgText(400,280,'?','large')}</g>`;
    g+=svgText(400,367,t>=1?'Find both products using your numbers.':'Watch how the two diagonals pair the positions.','small');
    g+=svgText(400,410,'The original problem stays yours to solve.','tiny');f.svg.innerHTML=g;f.metrics.hidden=true;
  }
  tr=transport(f,draw,1,1800);tr.set(0);return f.clean;
}

function mountRatio(container,problem,options) {
  if(options.allowSolutions!==true)return mountRatioGuide(container,problem,options);
  const f=frame(container,options),d=problem.diagram,raw=[d.a,d.b,d.c,d.d].map(String),unknown=raw.findIndex(x=>x.trim().toLowerCase()==='x');
  const v=raw.map(Number),hasX=unknown>=0;let tr;
  const max=hasX?4:3;
  const partner=[3,2,1,0][unknown],coeff=hasX?v[partner]:null;
  const rhs=hasX?([0,3].includes(unknown)?v[1]*v[2]:v[0]*v[3]):null;
  const result=hasX?rhs/coeff:null;
  const left=v[0]*v[3],right=v[1]*v[2],same=!hasX&&Math.abs(left-right)<1e-9;
  const titles=hasX?['Start with the proportion','Multiply across the diagonals','Simplify the products','Divide both sides by the coefficient','The value of x']:['Compare the two fractions','Multiply across the diagonals','Compare the cross-products','Decide whether the fractions are equal'];
  f.button('Next step',()=>tr.next());f.button('Start again',()=>tr.reset());
  f.caption.textContent='Cross-multiplication compares a × d with b × c. For a proportion, these products are equal. To find x, divide by the number multiplying x.';
  function draw(t){
    const step=Math.min(max,Math.floor(t+.00001));f.status.textContent=titles[step];
    let g='';
    const initial=[[245,126],[245,205],[555,126],[555,205]],product=[[230,260],[480,260],[555,260],[305,260]];
    if(t<1){
      const p=t;
      g+=`<g opacity="${1-p}">${ln(208,158,282,158)}${ln(518,158,592,158)}${svgText(400,169,hasX?'=':'?','large')}</g>`;
      if(p<.5)g+=`<g opacity="${Math.sin(p*2*Math.PI)}">${ln(260,130,540,194,'accentline')}${ln(260,194,540,130,'accentline')}</g>`;
      for(let i=0;i<4;i++)g+=svgText(lerp(initial[i][0],product[i][0],p),lerp(initial[i][1],product[i][1],p),raw[i],'number');
      g+=`<g opacity="${p}">${svgText(268,260,'×','large')}${svgText(517,260,'×','large')}${svgText(400,260,hasX?'=':'?','large')}</g>`;
      g+=svgText(400,365,'a × d      and      b × c','small');
    } else if(t<2){
      const p=t-1;
      g+=`<g opacity="${1-p}">`;
      for(let i=0;i<4;i++)g+=svgText(product[i][0],product[i][1],raw[i],'number');
      g+=svgText(268,260,'×','large')+svgText(517,260,'×','large')+'</g>';
      g+=svgText(400,260,hasX?'=':'?','large');
      const l=hasX&&[0,3].includes(unknown)?`${fmt(coeff)}x`:fmt(hasX?rhs:left);
      const rr=hasX&&[1,2].includes(unknown)?`${fmt(coeff)}x`:fmt(hasX?rhs:right);
      g+=`<g opacity="${p}">${svgText(267,260,l,'number')}${svgText(517,260,rr,'number')}</g>`;
      g+=svgText(400,365,'Multiply each pair.','small');
    } else if(hasX){
      const ul=[0,3].includes(unknown),ux=ul?267:517,nx=ul?517:267;
      if(t<3){
        const p=t-2;
        g+=svgText(lerp(ux-17,500,p),lerp(260,305,p),fmt(coeff),'number');
        g+=svgText(lerp(ux+22,270,p),260,'x','number');
        g+=svgText(lerp(nx,500,p),lerp(260,224,p),fmt(rhs),'number');
        g+=svgText(400,260,'=','large');
        g+=ln(460,249,540,249,'edge',`opacity="${p}"`);
        g+=svgText(400,365,`Divide both sides by ${fmt(coeff)}.`, 'small');
      }else{
        const p=t-3;
        g+=svgText(270,260,'x','number')+svgText(400,260,'=','large');
        g+=`<g opacity="${1-p}">${svgText(500,lerp(224,260,p),fmt(rhs),'number')}${svgText(500,lerp(305,260,p),fmt(coeff),'number')}${ln(460,249,540,249)}</g>`;
        g+=`<g opacity="${p}">${svgText(500,260,fmt(result,6),'number accenttext')}</g>`;
        g+=svgText(400,365,`${fmt(rhs)} ÷ ${fmt(coeff)} = ${fmt(result,6)}`,'small');
      }
    }else{
      const p=clamp(t-2);g+=svgText(267,260,fmt(left),'number')+svgText(517,260,fmt(right),'number');
      g+=svgText(400,260,p>.5?(same?'=':'≠'):'?','large');
      if(p>.5)g+=svgText(400,365,same?'Equal cross-products → equal fractions.':'Different cross-products → unequal fractions.','accenttext');
    }
    const original=`${raw[0]}/${raw[1]} ${hasX?'=':'?'} ${raw[2]}/${raw[3]}`;
    g+=svgText(400,50,original,'formula');
    const dots=Array.from({length:max+1},(_,i)=>`<circle cx="${400+(i-max/2)*27}" cy="410" r="4" fill="${i<=step?'var(--lv-accent)':'var(--lv-line)'}"/>`).join('');g+=dots;
    f.svg.innerHTML=g;
    f.metrics.hidden=true;
  }
  tr=transport(f,draw,max,6500);tr.set(0);return f.clean;
}

function mountGrid(container,problem,options) {
  const d=problem.diagram;if(d.shade_half)return false;
  const f=frame(container,options),w=Number(d.width),h=Number(d.height),half=d.piece==='half_square';
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>120){f.clean();return false;}
  const total=w*h*(half?2:1);let tr;
  f.status.textContent=half?'Two half-square pieces have the same area as one unit square.':'Count the unit squares without leaving gaps or overlaps.';
  f.caption.textContent=half?'Each small triangle is half of one unit square. Cutting a unit square changes the number of pieces, not its total area.':'Area counts square units. A row-and-column arrangement helps us count by multiplication.';
  f.button('Count all pieces',()=>{tr.pause();f.animate(tr.t,total,Math.min(5000,total*150),tr.set);});
  function draw(t){
    const count=Math.min(total,Math.floor(t+.00001)),s=Math.min(550/w,250/h),x=400-w*s/2,y=80;
    let g='';let k=0;
    for(let row=0;row<h;row++)for(let col=0;col<w;col++){
      const xx=x+col*s,yy=y+row*s;
      if(half){g+=poly([[xx,yy],[xx+s,yy],[xx+s,yy+s]],k++<count?'piece':'softfill');g+=poly([[xx,yy],[xx+s,yy+s],[xx,yy+s]],k++<count?'highlight':'softfill');}
      else{g+=`<rect x="${xx}" y="${yy}" width="${s}" height="${s}" class="${k++<count?'piece':'softfill'}"/>`;}
    }
    g+=svgText(400,y+h*s+37,`${w} units across`,'small')+svgText(x-12,y+h*s/2,`${h}`,'small','end');
    g+=svgText(400,400,f.allowSolutions?`${count} ${half?'half-square pieces':'unit squares'} counted`:'Count the highlighted pieces yourself.','accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['One piece',half?'½ square unit':'1 square unit'],['Pieces counted',String(count)],['Area of counted pieces',`${fmt(count/(half?2:1))} square units`]]:[['One piece',half?'½ square unit':'1 square unit'],['Your task','Count the pieces and find their total area']]);
  }
  tr=transport(f,draw,total,Math.min(5000,total*150));tr.set(0);return f.clean;
}


function mountPolygonArea(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6,reveal=false;
  polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;draw();});
  const revealButton=f.allowSolutions&&f.button('Compare areas',()=>{reveal=!reveal;revealButton.textContent=reveal?'Hide area values':'Compare areas';draw();});
  f.playbar.hidden=true;
  f.caption.textContent='The polygon lies inside its corresponding circle. Use the radius of the surrounding circle in A ≈ 3.14r² to estimate the polygon’s area. More sides make the estimate closer.';
  function draw(){
    const cx=400,cy=214,rp=145;
    const vv=Array.from({length:n},(_,i)=>[cx+rp*Math.cos(i*TAU/n),cy-rp*Math.sin(i*TAU/n)]);
    let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" fill="none" class="guide"/>`;
    for(let i=0;i<n;i++)g+=poly([[cx,cy],vv[i],vv[(i+1)%n]],i%2?'alternate':'piece','style="stroke:none"');
    for(const v of vv)g+=ln(cx,cy,...v,'minor',`style="stroke:#8ca3b9;stroke-width:${Math.min(.8,9.6/n)}"`);
    g+=poly(vv,'edge');
    g+=ln(cx,cy,cx+rp,cy,'accentline')+svgText(cx+rp/2,cy-13,`r = ${fmt(r)} ${d.unit||'cm'}`,'small');
    g+=svgText(400,35,`${n}-gon and its surrounding circle`,'small');
    g+=svgText(400,410,`Circle formula: A = πr²`,'formula');
    f.svg.innerHTML=g;
    const actual=n*r*r*Math.sin(TAU/n)/2;
    f.setMetrics(f.allowSolutions&&reveal?[['Circle estimate using 3.14',`${fmt(3.14*r*r,4)} square ${d.unit||'cm'}`],['Polygon area from its triangles',`${fixed(actual)} square ${d.unit||'cm'}`]]:[['Radius',`${fmt(r)} ${d.unit||'cm'}`],['Circle estimate setup',f.allowSolutions?`3.14 × ${fmt(r)} × ${fmt(r)}`:'Use the radius in the given formula']]);
  }
  draw();return f.clean;
}

// Exact unit-cell clipping lets every cut piece keep its actual area or volume.
function signedArea(v){return v.reduce((sum,p,i)=>{const q=v[(i+1)%v.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2;}
function clipEdge(subject,a,b,keepLeft=true){
  if(!subject.length)return [];
  const side=p=>((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*(keepLeft?1:-1);
  const out=[];
  for(let i=0;i<subject.length;i++){
    const p=subject[i],q=subject[(i+1)%subject.length],cp=side(p),cq=side(q),pin=cp>=-1e-9,qin=cq>=-1e-9;
    if(pin)out.push(p);
    if(pin!==qin){const t=cp/(cp-cq);out.push([lerp(p[0],q[0],t),lerp(p[1],q[1],t)]);}
  }
  return out.filter((p,i)=>!i||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>1e-8);
}
function unitCells(shape){
  const cells=[],xmin=Math.floor(Math.min(...shape.map(p=>p[0]))),ymin=Math.floor(Math.min(...shape.map(p=>p[1]))),xmax=Math.ceil(Math.max(...shape.map(p=>p[0]))),ymax=Math.ceil(Math.max(...shape.map(p=>p[1])));
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
    const box=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
    let p=shape;
    for(let i=0;i<4;i++)p=clipEdge(p,box[i],box[(i+1)%4]);
    const area=Math.abs(signedArea(p));
    if(area>1e-8)cells.push({x,y,points:p,local:p.map(v=>[v[0]-x,v[1]-y]),area});
  }
  return cells;
}
function complementPiece(piece){
  const square=[[0,0],[1,0],[1,1],[0,1]],left=signedArea(piece)>0;
  for(let i=0;i<piece.length;i++){
    const a=piece[i],b=piece[(i+1)%piece.length];
    const boundary=(Math.abs(a[0]-b[0])<1e-8&&(Math.abs(a[0])<1e-8||Math.abs(a[0]-1)<1e-8))||(Math.abs(a[1]-b[1])<1e-8&&(Math.abs(a[1])<1e-8||Math.abs(a[1]-1)<1e-8));
    if(!boundary)return clipEdge(square,a,b,!left);
  }
  return [];
}
function drawPrism(points,z0,z1,project,cls='piece',extra=''){
  if(!points.length)return '';
  // The front is z=0. Side faces are painted first and the front face last.
  let out='';
  const orient=signedArea(points)>=0?1:-1;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1];
    if(orient*(.55*dy-.35*dx)>-1e-8)out+=poly([project(a[0],a[1],z0),project(b[0],b[1],z0),project(b[0],b[1],z1),project(a[0],a[1],z1)],cls,extra);
  }
  return out+poly(points.map(p=>project(p[0],p[1],z0)),cls,extra);
}
function cutControls(f,draw,pieces){
  const cutMs=800,pieceMs=480,totalMs=cutMs+pieces*pieceMs;
  let clock=0,playing=false;
  const phase=ms=>ms<=cutMs?ms/cutMs:1+(ms-cutMs)/(pieces*pieceMs);
  function render(ms){clock=clamp(ms,0,totalMs);slider.value=phase(clock);draw(phase(clock));}
  function pause(){f.stop();playing=false;play.textContent=clock>=totalMs?'Replay':'Play';}
  function runTo(target){f.stop();playing=true;play.textContent='Pause';f.animate(clock,target,Math.abs(target-clock),render,()=>{playing=false;play.textContent=clock>=totalMs?'Replay':'Play';});}
  f.button('1 · Cut a unit',()=>{pause();render(0);runTo(cutMs);});
  f.button('2 · Fill the shape',()=>{pause();if(clock<cutMs||clock>=totalMs)render(cutMs);runTo(totalMs);});
  f.button('Place next piece',()=>{pause();const next=Math.min(pieces,Math.floor(Math.max(0,clock-cutMs)/pieceMs+1e-8)+1);runTo(cutMs+next*pieceMs);});
  const play=f.button('Play',()=>{if(playing){pause();return;}if(clock>=totalMs)render(0);runTo(totalMs);},f.playbar);
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='2';slider.step='0.001';slider.value='0';slider.setAttribute('aria-label','Animation progress');f.playbar.append(slider);
  f.button('Reset',()=>{pause();render(0);},f.playbar);
  function set(t){render(t<=1?t*cutMs:cutMs+(t-1)*pieces*pieceMs);}
  slider.oninput=()=>{pause();set(Number(slider.value));};
  return{get t(){return phase(clock);},set,pause,reset(){pause();render(0);}};
}
function mountLineUnits(container,problem,options){
  const d=problem.diagram,unit=d.unit||'cm',pieceUnit=Number(d.unit_length)||1;
  if(d.half_highlight)return false;
  const shape=d.type==='bent_path'?(d.points||[]).map(p=>p.map(Number)):[[0,0],[Number(d.length),0]];
  if(shape.length<2)return false;
  const edges=[],pieces=[];let fullLength=0;
  for(let i=0;i<shape.length-1;i++){
    const a=shape[i],b=shape[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<1e-8)continue;
    edges.push({a,b,length});fullLength+=length;
    for(let t=0;t<length-1e-8;t+=pieceUnit){const end=Math.min(length,t+pieceUnit);pieces.push({a:[lerp(a[0],b[0],t/length),lerp(a[1],b[1],t/length)],b:[lerp(a[0],b[0],end/length),lerp(a[1],b[1],end/length)],length:end-t});}
  }
  if(!pieces.length||pieces.length>80)return false;
  const f=frame(container,options),partial=pieces.find(p=>p.length<pieceUnit-1e-8),short=partial?.length||pieceUnit/2;
  const xmin=Math.min(...shape.map(p=>p[0])),xmax=Math.max(...shape.map(p=>p[0])),ymin=Math.min(...shape.map(p=>p[1])),ymax=Math.max(...shape.map(p=>p[1]));
  const scale=Math.min(560/Math.max(1,xmax-xmin),165/Math.max(1,ymax-ymin),90),tx=400-(xmax+xmin)*scale/2,ty=275+(ymax+ymin)*scale/2;
  const project=p=>[tx+p[0]*scale,ty-p[1]*scale],source=[140,115],sourceLength=pieceUnit*scale;
  const fullCount=pieces.filter(p=>Math.abs(p.length-pieceUnit)<1e-8).length,partCount=pieces.length-fullCount;
  f.caption.textContent='Length is measured along the whole path. Cut a unit line into shorter straight pieces when a full unit does not fit; keep the pieces the same length as they move.';
  f.status.textContent=partial?'A whole unit will not fit in the final gap. Cut it, then use the needed part.':'Place equal unit lengths end to end, with no gaps or overlaps.';
  function draw(t){
    const cutting=clamp(t),progress=clamp(t-1)*pieces.length,count=Math.min(pieces.length,Math.floor(progress+1e-8)),fraction=progress-count,active=pieces[count],placingWhole=t>1&&active?.length>=pieceUnit-1e-8;
    let g=svgText(140+sourceLength/2,45,`One ${fmt(pieceUnit)} ${unit} unit line`,'small');
    const cutAt=short*scale,space=18*cutting;
    if(placingWhole){g+=ln(source[0],source[1],source[0]+sourceLength,source[1],fraction>0?'ghost':'accentline');}
    else {if(!(t>1&&fraction>0))g+=ln(source[0],source[1],source[0]+cutAt,source[1],'accentline');
      g+=ln(source[0]+cutAt+space,source[1],source[0]+sourceLength+space,source[1],'edge');
      if(cutting>0)g+=ln(source[0]+cutAt+space/2,88,source[0]+cutAt+space/2,142,'guide');}
    g+=svgText(400,170,t<1?'Cut the unit where a shorter piece is needed.':'Move each straight piece into the path.','small');
    for(const e of edges){const a=project(e.a),b=project(e.b);g+=ln(...a,...b,'ghost');}
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i],a=project(p.a),b=project(p.b),half=p.length<pieceUnit-1e-8;
      if(i<count)g+=ln(...a,...b,half?'accentline':'edge',`stroke-width="${half?5:4}"`);
      if(i===count&&fraction>0){const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),x=lerp(source[0],a[0],fraction),y=lerp(source[1],a[1],fraction),ang=angle*fraction;g+=ln(x,y,x+p.length*scale*Math.cos(ang),y+p.length*scale*Math.sin(ang),'accentline');}
      const delta=7,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);g+=ln(a[0]-dy/len*delta,a[1]+dx/len*delta,a[0]+dy/len*delta,a[1]-dx/len*delta,'minor');
      if(i===pieces.length-1)g+=ln(b[0]-dy/len*delta,b[1]+dx/len*delta,b[0]+dy/len*delta,b[1]-dx/len*delta,'minor');
    }
    const placedLength=pieces.slice(0,count).reduce((a,p)=>a+p.length,0);
    g+=svgText(400,410,!f.allowSolutions?'Count whole units and cut pieces to find the length.':count===pieces.length?`${fullCount} whole unit${fullCount===1?'':'s'}${partCount?` + ${partCount} cut piece${partCount===1?'':'s'}`:''} fill the path.`:`${count} piece${count===1?'':'s'} placed`,'accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['One full unit',`${fmt(pieceUnit)} ${unit}`],['Cut piece',`${fmt(short)} ${unit}`],['Length placed so far',`${fmt(placedLength)} ${unit}`],['Total length',count===pieces.length?`${fmt(fullLength)} ${unit}`:'Fill the path to reveal']]:[['One full unit',`${fmt(pieceUnit)} ${unit}`],['Cut piece',`${fmt(short)} ${unit}`],['Your task','Count and combine the pieces']]);
  }
  const tr=cutControls(f,draw,pieces.length);tr.set(0);return f.clean;
}
function mountAreaUnits(container,problem,options){
  const d=problem.diagram,unit=d.unit||'cm';
  let shape;
  if(d.type==='grid_triangle')shape=[[0,0],[Number(d.base),0],[0,Number(d.height)]];
  else if(d.type==='grid_polygon')shape=(d.points||[]).map(p=>p.map(Number));
  else shape=[[0,0],[Number(d.width),0],[Number(d.width),Number(d.height)],[0,Number(d.height)]];
  if(shape.length<3||shape.some(p=>p.some(x=>!Number.isFinite(x))))return false;
  const cells=unitCells(shape);if(!cells.length||cells.length>100)return false;
  const f=frame(container,options),whole=cells.filter(p=>Math.abs(p.area-1)<1e-8),parts=cells.filter(p=>p.area<1-1e-8),sample=parts[0]?.local||[[0,0],[1,0],[0,1]],other=complementPiece(sample);
  const ordered=[...whole,...parts],w=Math.max(...shape.map(p=>p[0])),h=Math.max(...shape.map(p=>p[1])),scale=Math.min(400/Math.max(w,1),230/Math.max(h,1),70),left=330+(400-w*scale)/2,bottom=325;
  const src=[115,220],map=(p,dx=0,dy=0)=>[left+(p[0]+dx)*scale,bottom-(p[1]+dy)*scale];
  const source=(p,dx=0)=>[src[0]+p[0]*scale+dx,src[1]-p[1]*scale];
  f.status.textContent='A cut piece keeps its area. Place whole squares first, then fill the remaining spaces with cut pieces.';
  f.caption.textContent='The source unit and the target figure use the same scale. Each highlighted piece comes from one unit square. Two triangular half-squares have the same area as one whole square.';
  function draw(t){
    const cut=clamp(t),progress=clamp(t-1)*ordered.length,count=Math.min(ordered.length,Math.floor(progress+1e-8)),fraction=progress-count,gap=18*cut,active=ordered[count],placingWhole=t>1&&active?.area>=1-1e-8;
    let g=svgText(150,45,`One 1 ${unit}² square`,'small')+svgText(535,45,'Fill without gaps or overlaps','small');
    if(placingWhole){g+=poly([[0,0],[1,0],[1,1],[0,1]].map(p=>source(p)),fraction>0?'ghost':'piece');}
    else {g+=poly(other.map(p=>source(p,-gap/2)),'alternate');if(!(t>1&&fraction>0))g+=poly(sample.map(p=>source(p,gap/2)),'highlight');}
    if(cut===0)g+=poly([[0,0],[1,0],[1,1],[0,1]].map(p=>source(p)),'edge');
    g+=svgText(150,255,placingWhole?'Use a new whole unit.':t>1&&active?'Repeat the cut for this piece.':cut<.5?'Start with a whole unit.':'Cut the unit into parts.','small');
    g+=svgText(150,281,'Pieces keep their area.','tiny');
    for(const c of cells)g+=poly(c.points.map(p=>map(p)),'softfill');
    for(let i=0;i<count;i++){const c=ordered[i];g+=poly(c.points.map(p=>map(p)),c.area<1-1e-8?'highlight':'piece');}
    if(count<ordered.length&&fraction>0){const c=ordered[count];g+=poly(c.local.map((p,i)=>{const a=source(p,c.area<1-1e-8?gap/2:0),b=map(c.points[i]);return[lerp(a[0],b[0],fraction),lerp(a[1],b[1],fraction)];}),c.area<1-1e-8?'highlight':'piece');}
    g+=poly(shape.map(p=>map(p)),'edge');
    const doneWhole=ordered.slice(0,count).filter(p=>Math.abs(p.area-1)<1e-8).length,doneParts=count-doneWhole,area=ordered.slice(0,count).reduce((s,c)=>s+c.area,0),total=cells.reduce((s,c)=>s+c.area,0);
    g+=svgText(400,392,f.allowSolutions?`${doneWhole} whole square${doneWhole===1?'':'s'} + ${doneParts} cut piece${doneParts===1?'':'s'} placed`:'Count whole squares and cut pieces to find the area.','accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['Whole squares placed',String(doneWhole)],['Cut pieces placed',String(doneParts)],['Area placed so far',`${fmt(area)} ${unit}²`],['Total area',count===ordered.length?`${fmt(total)} ${unit}²`:'Fill the shape to reveal']]:[['Unit square','1 square unit'],['Cut piece','One half of a unit square'],['Your task','Combine the areas of all pieces']]);
  }
  const tr=cutControls(f,draw,ordered.length);tr.set(0);return f.clean;
}
function prismShape(d){
  if(d.type==='triangular_prism')return{shape:[[0,0],[Number(d.base),0],[0,Number(d.triangle_height)]],depth:Number(d.length)};
  if(d.type==='l_prism')return{shape:[[0,0],[Number(d.width),0],[Number(d.width),Number(d.right_height)],[Number(d.top_width),Number(d.right_height)],[Number(d.top_width),Number(d.height)],[0,Number(d.height)]],depth:Number(d.length)};
  if(d.type==='t_prism'){
    const w=Number(d.width),h=Number(d.height),stem=Number(d.stem_width),bar=Number(d.top_height??d.bar_height),l=(w-stem)/2;
    return{shape:[[l,0],[l+stem,0],[l+stem,h-bar],[w,h-bar],[w,h],[0,h],[0,h-bar],[l,h-bar]],depth:Number(d.length)};
  }
  if(d.type==='cube_units'||d.type==='half_cubes')return{shape:[[0,0],[Number(d.side),0],[Number(d.side),Number(d.side)],[0,Number(d.side)]],depth:Number(d.side)};
  return{shape:[[0,0],[Number(d.length),0],[Number(d.length),Number(d.height)],[0,Number(d.height)]],depth:Number(d.width)};
}
function mountVolumeUnits(container,problem,options){
  const d=problem.diagram,{shape,depth}=prismShape(d),unit=d.unit||'cm';
  if(!Number.isFinite(depth)||depth<=0||shape.some(p=>p.some(v=>!Number.isFinite(v))))return false;
  const cells=unitCells(shape),pieces=[];
  for(let z=0;z<depth-1e-8;z++)for(const c of cells)pieces.push({...c,z,depth:Math.min(1,depth-z),volume:c.area*Math.min(1,depth-z)});
  if(!pieces.length||pieces.length>180)return false;
  const partial=pieces.find(p=>p.area<1-1e-8),sample=partial?.local||[[0,0],[1,0],[0,1]],other=complementPiece(sample);
  const ordered=[...pieces.filter(p=>Math.abs(p.volume-1)<1e-8),...pieces.filter(p=>p.volume<1-1e-8)],w=Math.max(...shape.map(p=>p[0])),h=Math.max(...shape.map(p=>p[1])),scale=Math.min(350/(w+.55*depth),230/(h+.35*depth),65),left=340+(350-(w+.55*depth)*scale)/2,bottom=330;
  const f=frame(container,options),src=[110,215];let layer=0;
  const project=(x,y,z)=>[left+scale*(x+.55*z),bottom-scale*(y+.35*z)],source=(x,y,z,shift=0)=>[src[0]+scale*(x+.55*z)+shift,src[1]-scale*(y+.35*z)];
  const layerButton=f.button('Show one depth layer',()=>{layer=layer?0:1;layerButton.textContent=layer?'Show all depth layers':'Show one depth layer';draw(tr.t);});
  f.status.textContent=partial?'One cube measures 1 unit in each direction. Cut pieces fill the spaces where a whole cube will not fit.':'One cube measures 1 unit in each direction. Count the cubes in every depth layer.';
  if(d.show_dimensions&&!d.show_fill_process){
    const measure=(label,value)=>`${label} ${fmt(Number(value))} ${unit}`;
    let givens=[];
    if(d.type==='triangular_prism')givens=[measure('triangle base',d.base),measure('triangle height',d.triangle_height),measure('prism depth',d.length)];
    if(d.type==='l_prism')givens=[measure('overall width',d.width),measure('overall height',d.height),measure('prism depth',d.length),measure('upright arm width',d.top_width),measure('lower arm height',d.right_height)];
    if(d.type==='t_prism')givens=[measure('overall width',d.width),measure('overall height',d.height),measure('prism depth',d.length),measure('stem width',d.stem_width),measure('top bar height',d.top_height??d.bar_height)];
    if(d.type==='rect_prism')givens=[measure('length',d.length),measure('width',d.width),measure('height',d.height)];
    if(givens.length){f.status.textContent=`Given: ${givens.join(' · ')}.`;f.status.style.lineHeight='1.6';}
  }
  f.caption.textContent=partial?'Each block is a real part of a unit cube. Blue blocks are whole cubes; gold blocks are cut pieces. Two half-cube pieces have the same volume as one whole cube. Count every depth layer.':'Count the unit cubes in every depth layer. The reference cube and the larger prism use the same scale, and each unit cube has volume 1 cubic unit.';
  function draw(t){
    const cut=clamp(t),progress=clamp(t-1)*ordered.length,count=Math.min(ordered.length,Math.floor(progress+1e-8)),fraction=progress-count,gap=18*cut,active=ordered[count],placingWhole=t>1&&active?.volume>=1-1e-8;
    let g=svgText(150,43,`One 1 ${unit}³ cube`,'small')+svgText(535,43,layer?'Front depth layer only':'Fill the complete prism','small');
    if(placingWhole||!partial){g+=drawPrism([[0,0],[1,0],[1,1],[0,1]],0,1,source,t>1&&fraction>0?'ghost':'piece');}
    else {g+=drawPrism(other,0,1,(x,y,z)=>source(x,y,z,-gap/2),'alternate');if(!(t>1&&fraction>0))g+=drawPrism(sample,0,1,(x,y,z)=>source(x,y,z,gap/2),'highlight');}
    g+=svgText(150,255,placingWhole?'Use a new whole cube.':!partial?'Use whole unit cubes.':t>1&&active?'Repeat the cut for this piece.':cut<.5?'Start with a whole cube.':'Cut into equal-volume parts.','small');
    g+=svgText(150,282,'Same scale as the larger prism','tiny');
    const visible=ordered.slice(0,count).filter(p=>!layer||p.z===0).sort((a,b)=>b.z-a.z||a.y-b.y||a.x-b.x);
    // Ghost unit boundaries expose the full container before any filling occurs.
    const ghosts=pieces.filter(p=>!layer||p.z===0).sort((a,b)=>b.z-a.z||a.y-b.y||a.x-b.x);
    for(const p of ghosts)g+=drawPrism(p.points,p.z,p.z+p.depth,project,'ghost');
    for(const p of visible)g+=drawPrism(p.points,p.z,p.z+p.depth,project,p.volume<1-1e-8?'highlight':'piece');
    if(count<ordered.length&&fraction>0){const p=ordered[count];if(!layer||p.z===0){const moving=(x,y,z)=>{const a=source(x-p.x,y-p.y,z-p.z,p.volume<1-1e-8?gap/2:0),b=project(x,y,z);return[lerp(a[0],b[0],fraction),lerp(a[1],b[1],fraction)];};g+=drawPrism(p.points,p.z,p.z+p.depth,moving,p.volume<1-1e-8?'highlight':'piece');}}
    const placed=ordered.slice(0,count),whole=placed.filter(p=>Math.abs(p.volume-1)<1e-8).length,partialCount=count-whole,volume=placed.reduce((s,p)=>s+p.volume,0),total=pieces.reduce((s,p)=>s+p.volume,0);
    g+=svgText(400,391,f.allowSolutions?`${whole} whole cube${whole===1?'':'s'} + ${partialCount} cut piece${partialCount===1?'':'s'} placed`:'Count whole cubes and cut pieces to find the volume.','accenttext');
    g+=svgText(400,418,layer?'Layer view changes the picture; counts still include all layers.':`${fmt(depth)} unit${depth===1?'':'s'} deep — cubes have 1-unit edges`,'tiny');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['Whole cubes placed',String(whole)],['Cut pieces placed',String(partialCount)],['Volume placed so far',`${fmt(volume)} ${unit}³`],['Total volume',count===ordered.length?`${fmt(total)} ${unit}³`:'Fill the prism to reveal']]:[['One whole cube','1 cubic unit'],['Your task','Count all depth layers and combine the pieces']]);
  }
  const tr=cutControls(f,draw,ordered.length,Math.min(9000,4000+pieces.length*65));tr.set(0);return f.clean;
}

function mountCompositeArea(container,problem,options){
  const d=problem.diagram,unit=d.unit||'units',kind=d.type==='L_area'||d.type==='lshape'?'L':d.type==='trapezoid'?'trapezoid':'house';
  let pieces,areas,bounds,givens,guide;
  if(kind==='L'){
    const w=Number(d.width),h=Number(d.height),tw=Number(d.top_width),rh=Number(d.right_height),gap=Math.min(w,h)*.35;
    if(!(w>tw&&h>rh&&tw>0&&rh>0))return false;
    pieces=[{v:[[0,0],[tw,0],[tw,h],[0,h]],dx:-gap/2,dy:0,label:'Rectangle A'},{v:[[tw,0],[w,0],[w,rh],[tw,rh]],dx:gap/2,dy:0,label:'Rectangle B'}];
    areas=[tw*h,(w-tw)*rh];bounds=[-gap/2,w+gap/2,h];
    givens=`Given: overall width ${fmt(w)} ${unit}; height ${fmt(h)} ${unit}; upright width ${fmt(tw)} ${unit}; lower height ${fmt(rh)} ${unit}.`;
    guide='Cut the L-shape into two rectangles. Find any missing side by subtraction, then add the two rectangle areas.';
  }else if(kind==='trapezoid'){
    const B=Number(d.bottom),b=Number(d.top),h=Number(d.height),q=(B-b)/2,gap=Math.min(B,h)*.35;
    if(!(B>b&&b>0&&h>0))return false;
    pieces=[{v:[[0,0],[q,0],[q,h]],dx:-gap,dy:0,label:'Triangle A'},{v:[[q,0],[q+b,0],[q+b,h],[q,h]],dx:0,dy:0,label:'Rectangle'},{v:[[q+b,0],[B,0],[q+b,h]],dx:gap,dy:0,label:'Triangle B'}];
    areas=[q*h/2,b*h,q*h/2];bounds=[-gap,B+gap,h];
    givens=`Given: lower base ${fmt(B)} ${unit}; upper base ${fmt(b)} ${unit}; perpendicular height ${fmt(h)} ${unit}.`;
    guide='Cut along the two perpendicular heights. The center is a rectangle and each end is a right triangle. The three areas add to the original area.';
  }else{
    const w=Number(d.width),h=Number(d.wall_height),rh=Number(d.roof_height),gap=Math.min(w,h+rh)*.35;
    if(!(w>0&&h>0&&rh>0))return false;
    pieces=[{v:[[0,0],[w,0],[w,h],[0,h]],dx:-(w+gap)/2,dy:0,label:'Rectangle'},{v:[[0,h],[w,h],[w/2,h+rh]],dx:(w+gap)/2,dy:-h,label:'Triangle'}];
    areas=[w*h,w*rh/2];bounds=[-(w+gap)/2,w+(w+gap)/2,h+rh];
    givens=`Given: width ${fmt(w)} ${unit}; wall height ${fmt(h)} ${unit}; roof height ${fmt(rh)} ${unit}.`;
    guide='Separate the roof triangle from the wall rectangle. Moving them preserves every length and area. Find each area, then add.';
  }
  const f=frame(container,options),scale=Math.min(620/(bounds[1]-bounds[0]),235/bounds[2]),x=400-(bounds[0]+bounds[1])*scale/2,y=325;let tr;
  f.status.textContent=givens;f.caption.textContent=guide;
  f.button('Next step',()=>tr.next());f.button('Put pieces back',()=>tr.reset());
  function draw(t){
    let g=svgText(400,35,t<.01?'Find the smaller shapes inside the figure':'Same pieces, separated for measuring','small');
    const map=([a,b])=>[x+a*scale,y-b*scale];
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i],v=p.v.map(([a,b])=>[a+p.dx*t,b+p.dy*t]);
      g+=poly(v.map(map),i%2?'highlight':'piece',`data-composite-piece="${i}"`);
      if(t>.7){const mid=v.reduce((c,p)=>[c[0]+p[0]/v.length,c[1]+p[1]/v.length],[0,0]),xy=map(mid);g+=svgText(xy[0],xy[1],p.label,'small');}
    }
    g+=svgText(400,385,f.allowSolutions&&t>=.999?`${areas.map(a=>fmt(a)).join(' + ')} = ${fmt(areas.reduce((a,b)=>a+b,0))} square ${unit}`:'Find each piece’s area, then combine the areas.','accenttext');
    g+=svgText(400,416,'Rectangles: A = bh. Triangles: A = ½bh.','small');
    f.svg.innerHTML=g;
    f.setMetrics(f.allowSolutions&&t>=.999?[...areas.map((a,i)=>[pieces[i].label,`${fmt(a)} square ${unit}`]),['Total area',`${fmt(areas.reduce((a,b)=>a+b,0))} square ${unit}`]]:[['Pieces preserve area','No gaps, overlaps, or pieces lost'],['Try it','Use the given measurements for each smaller shape']]);
  }
  tr=transport(f,draw,1,2200);tr.set(0);return f.clean;
}
function mountCircle(container,problem,options){
  const f=frame(container,options),d=problem.diagram,r=Number(d.radius)||4,cx=400,cy=210,rp=142;
  const radiusLabel=d.radius_label||(d.given==='radius'?`r = ${d.label}`:'r = ?'),diameterLabel=d.diameter_label||(d.given==='diameter'?`d = ${d.label}`:'d = ?');
  f.status.textContent='A radius reaches from the center to the circle. A diameter passes through the center.';
  f.caption.textContent='Use the given information and the formula in your problem. Scroll over the diagram to zoom, drag to pan, or pinch with two fingers.';
  f.playbar.hidden=true;
  let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" fill="none" class="edge"/>`;
  if(d.show_diameter!==false)g+=ln(cx-rp,cy,cx+rp,cy,'accentline')+svgText(cx,cy+28,diameterLabel,'small');
  if(d.show_radius!==false){const a=-Math.PI/3,xx=cx+rp*Math.cos(a),yy=cy+rp*Math.sin(a);g+=ln(cx,cy,xx,yy,'edge')+svgText(xx+8,(cy+yy)/2,radiusLabel,'small','start');}
  if(d.given==='circumference')g+=svgText(cx,42,d.label,'formula');
  f.svg.innerHTML=g;f.metrics.hidden=true;return f.clean;
}

function mountInteractive(container, problem, options={}) {
  if(!container||!problem?.diagram)return false;
  const type=problem.diagram.type;
  if(type==='circle')return mountCircle(container,problem,options);
  if(type==='L_area'||type==='trapezoid'||(type==='composite'&&problem.diagram.shape==='house')||(type==='lshape'&&/area/i.test((problem.topic||'')+' '+(problem.prompt||''))))return mountCompositeArea(container,problem,options);
  if(type==='polygon')return problem.diagram.show_radii&&!problem.diagram.show_diameter?mountPolygonArea(container,problem,options):mountPerimeter(container,problem,options);
  if(type==='polygon_rearrange')return mountRearrange(container,problem,options);
  if(type==='central_triangle')return mountCentral(container,problem,options);
  if(type==='parallelogram_cut')return mountParallelogram(container,problem,options);
  if(type==='ratio')return mountRatio(container,problem,options);
  if(type==='segment'||type==='bent_path')return mountLineUnits(container,problem,options);
  if(type==='grid_polygon'||type==='grid_triangle')return mountAreaUnits(container,problem,options);
  if(type==='grid_rectangle')return problem.diagram.show_fill_process||!Number.isInteger(Number(problem.diagram.width))?mountAreaUnits(container,problem,options):mountGrid(container,problem,options);
  if(type==='cube_units'||((type==='rect_prism'||type==='triangular_prism'||type==='l_prism'||type==='t_prism')&&problem.diagram.show_unit_cubes))return mountVolumeUnits(container,problem,options);
  return false;
}

return {mountInteractive};
})();

__studyModules["app.js"] = (() => {
const {createProgressState,recordCheck,recordSelfReview,summarizeProgress,makeReportText,makeReportCSV,makeBackup,validateBackup} = __studyModules["progress.js"];

const {createAutoAdvance} = __studyModules["advance.js"];

const {getExample,MAX_EXAMPLE_INDEX} = __studyModules["generators.js"];

const {diagramMarkup} = __studyModules["generated-diagrams.js"];

const {packetData} = __studyModules["packet-data.js"];

const STORAGE_KEY = 'study-for-test-1-v2';
const LEGACY_STORAGE_KEY = 'study-for-test-1-v1';
const REVISED_PROBLEM_IDS = new Set([2,3,4,14,15,16,26,27,29,30,31,32,33,67,68,69,70]);
const app = document.querySelector('#app');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const prose = value => escapeHTML(value).replace(/\n/g,'<br>');
let data, problems = [], interactiveModule, cleanupInteractive;
let hintOpen = false;
let saveTimer, toastTimer;
let presentationMode = null, presentationReturnFocus = null;
let migratedProgress = false;
let dialogState = null, pendingImport = null, reportName = '';
let downloadURLs = [];
const expandedSolutions = new Set();
const initial = {view:'lesson',question:1,page:0,variants:{},exampleIndices:{},answers:{},plots:{},lines:{},checked:{},plotChecked:{},theme:'light',autoNext:true,progress:createProgressState()};
let state = {...initial};
function migrateProgress(previous) {
  const migrated = {...previous};
  for (const key of ['variants','answers','plots','lines','checked','plotChecked']) {
    migrated[key] = Object.fromEntries(Object.entries(previous[key] || {}).filter(([entry])=>!REVISED_PROBLEM_IDS.has(Number(entry.split(':')[0]))));
  }
  return migrated;
}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  const legacy = saved === null ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
  state = {...initial,...(legacy ? migrateProgress(JSON.parse(legacy)) : JSON.parse(saved || '{}'))};
  if (legacy) { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); migratedProgress = true; }
} catch { /* Storage is optional. */ }
for (const key of ['variants','exampleIndices','answers','plots','lines','checked','plotChecked']) if (!state[key] || typeof state[key] !== 'object') state[key] = {};
if (!['lesson','packet','practice'].includes(state.view)) state.view = 'lesson';
if (!['light','dark'].includes(state.theme)) state.theme = 'light';
if (!state.progress || state.progress.version !== 1 || !state.progress.records || typeof state.progress.records !== 'object') state.progress = createProgressState();
if (typeof state.autoNext !== 'boolean') state.autoNext = true;
document.body.classList.toggle('dark',state.theme === 'dark');
const autoAdvance = createAutoAdvance({onAdvance:pending=> {
  if (Number(state.question) !== Number(pending.id) || variantIndex() !== pending.variant || document.querySelector('#study-dialog').open || document.hidden) return cancelAdvance();
  selectProblem(pending.target,state.view,state.view === 'packet');
}});

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.classList.remove('visible'),2600);
}
function applyPresentation() {
  const stage = document.querySelector('#visual-stage');
  if (presentationMode === 'visual' && !stage) presentationMode = null;
  document.body.classList.toggle('presentation-mode',presentationMode === 'page');
  document.body.classList.toggle('visual-focus-open',presentationMode === 'visual');
  document.querySelector('#focus-close')?.remove();
  document.querySelector('#focus-backdrop')?.remove();
  if (stage) {
    stage.classList.toggle('is-enlarged',presentationMode === 'visual');
    if (presentationMode === 'visual') { stage.setAttribute('role','dialog'); stage.setAttribute('aria-modal','true'); stage.setAttribute('aria-label','Enlarged visualization'); }
    else { stage.removeAttribute('role'); stage.removeAttribute('aria-modal'); stage.removeAttribute('aria-label'); }
  }
  if (!presentationMode) return;
  if (presentationMode === 'visual') {
    const backdrop = document.createElement('div'); backdrop.id = 'focus-backdrop'; backdrop.setAttribute('aria-hidden','true');
    backdrop.addEventListener('click',closePresentation); document.body.append(backdrop);
  }
  const close = document.createElement('button'); close.id = 'focus-close'; close.type = 'button';
  close.textContent = presentationMode === 'visual' ? 'Close visualization ×' : 'Exit presentation ×';
  close.addEventListener('click',closePresentation); document.body.append(close);
}
function openPresentation(mode) {
  presentationReturnFocus = document.activeElement; presentationMode = mode; applyPresentation();
  document.querySelector('#focus-close')?.focus();
}
function closePresentation() {
  presentationMode = null; applyPresentation();
  if (presentationReturnFocus?.isConnected) presentationReturnFocus.focus();
  presentationReturnFocus = null;
}
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave,150);
}
function flushSave() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); updateSavedStatus(); refreshDownloadLinks(); }
  catch { document.querySelector('#save-status').textContent = 'Saving is unavailable. Download a backup from Progress before closing this tab.'; }
}
function updateSavedStatus() {
  const count = Object.values(state.answers).filter(value=>String(value).trim()).length;
  document.querySelector('#save-status').textContent = count ? `${count} ${count === 1 ? 'answer' : 'answers'} saved on this browser.` : 'Answers stay on this browser.';
}
function original(id = state.question) { return problems.find(p=>Number(p.id) === Number(id)) || problems[0]; }
function variantIndex(id = state.question) {
  const p = original(id); const v = Number(state.variants[id] || 0);
  return p && Number.isInteger(v) && v >= 0 && v <= MAX_EXAMPLE_INDEX ? v : 0;
}
function current(id = state.question) {
  const p = original(id); const v = variantIndex(id);
  return getExample(p,v);
}
function highestExample(id) {
  let highest = Math.max(variantIndex(id),Number(state.exampleIndices[id]) || 0);
  for (const map of [state.answers,state.plots,state.progress.records]) for (const key of Object.keys(map)) {
    const [problem,index] = key.split(':').map(Number);
    if (problem === Number(id) && Number.isInteger(index) && index > highest && index <= MAX_EXAMPLE_INDEX) highest = index;
  }
  return Math.min(MAX_EXAMPLE_INDEX,highest);
}
function chooseExample(id,index) {
  const selected = Math.max(0,Math.min(MAX_EXAMPLE_INDEX,Number(index) || 0));
  state.variants[id] = selected;
  state.exampleIndices[id] = Math.max(highestExample(id),selected);
}
function keyFor(id,field='') { return `${id}:${variantIndex(id)}${field ? ':'+field : ''}`; }
function pageFor(id = state.question) { return data.pages.findIndex(page=>page.problems.some(p=>Number(p.id) === Number(id))); }
function saveURL() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('problem',String(state.question));
    url.searchParams.set('view',state.view);
    url.searchParams.set('example',String(variantIndex()));
    url.hash = '';
    history.replaceState(null,'',url);
  } catch { /* File previews may not support URL history. */ }
}
function selectProblem(id,view = state.view,scroll = false) {
  if (!data) return;
  if (!original(id)) return;
  cancelAdvance();
  state.question = Number(id); state.page = Math.max(0,pageFor(id)); state.view = view;
  if (view === 'practice' && variantIndex(id) === 0) chooseExample(id,Math.min(MAX_EXAMPLE_INDEX,highestExample(id)+1));
  hintOpen = false;
  render(); persist(); saveURL();
  if (scroll) requestAnimationFrame(()=>document.querySelector(`[data-card-id="${id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));
}
function setView(view) {
  if (!data) return;
  cancelAdvance();
  state.view = view;
  if (view === 'practice' && variantIndex() === 0) chooseExample(state.question,Math.min(MAX_EXAMPLE_INDEX,highestExample(state.question)+1));
  hintOpen = false;
  render(); persist(); saveURL();
}
function nextExample(id) {
  cancelAdvance();
  const highest = highestExample(id);
  if (highest >= MAX_EXAMPLE_INDEX) { notify('You have reached the last example for this problem. Your earlier answers are still saved.'); return; }
  chooseExample(id,highest+1);
  state.question = Number(id); state.page = pageFor(id); hintOpen = false;
  render(); persist(); saveURL();
}
function formatNumber(n) { return Number(n.toFixed(7)).toString(); }
function parseNumber(value) {
  const raw = String(value).trim().replace(/,/g,'').replace(/[−–]/g,'-').replace(/[⁄∕]/g,'/');
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(raw)) return Number(raw);
  let match = raw.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (match && Number(match[2]) !== 0) return Number(match[1])/Number(match[2]);
  match = raw.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (match && Number(match[3]) !== 0) return Number(match[1]) + (match[1].startsWith('-') ? -1 : 1)*Number(match[2])/Number(match[3]);
  return NaN;
}
function normalize(value) { return String(value).toLowerCase().trim().replace(/[.!?]+$/,'').replace(/π/g,'pi').replace(/²/g,'^2').replace(/squared/g,'^2').replace(/[∠\s*×;:°]/g,''); }
function evaluate(field,value) {
  if (!String(value ?? '').trim()) return {status:'blank',message:'Add an answer first.'};
  if (field.value !== null && field.value !== undefined && Number.isFinite(Number(field.value))) {
    const parsed = parseNumber(value);
    if (!Number.isFinite(parsed)) return {status:'incorrect',message:'Enter a number or a fraction.'};
    const tolerance = field.tolerance === undefined ? .005 : Number(field.tolerance);
    return Math.abs(parsed-Number(field.value)) <= tolerance + 1e-10 ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Take another look. Use the hint if you need it.'};
  }
  if (Array.isArray(field.accepted) && field.accepted.length) {
    const lists = field.accepted.filter(answer=>String(answer).includes(',')).map(answer=>String(answer).split(',').map(parseNumber)).filter(values=>values.every(Number.isFinite));
    if (lists.length) {
      const cells = String(value).split(',');
      if (cells.some(cell=>!cell.trim())) return {status:'blank',message:'Complete every table value first.'};
      const parsed = cells.map(parseNumber);
      const ok = lists.some(expected=>expected.length === parsed.length && parsed.every((n,i)=>Number.isFinite(n)&&Math.abs(n-expected[i])<1e-7));
      return ok ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Check each table value against the constant ratio.'};
    }
    const ok = field.accepted.some(answer=>normalize(answer) === normalize(value));
    return ok ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Take another look. Use the hint if you need it.'};
  }
  return {status:'review',message:'Your explanation is saved. Review your reasoning.'};
}
function answerFields(p,compact = false) {
  return `<div class="answer-fields">${(p.fields || []).map((field,index)=> {
    const key = keyFor(p.id,field.key);
    const value = state.answers[key] || '';
    const result = state.checked[key] ? state.progress.records[keyFor(p.id)]?.fields?.[field.key] === 'self-reviewed' ? {status:'self-reviewed',message:'Self-reviewed.'} : evaluate(field,value) : null;
    const textField = (field.value === null || field.value === undefined) && !(field.accepted || []).length;
    const prefix = (p.fields || []).length > 1 ? `${String.fromCharCode(97+index)}. ` : '';
    const inputID = `answer-${p.id}-${variantIndex(p.id)}-${field.key}`;
    if (isPlotField(p,field)) return compact ? `<div class="answer-field"><label>${prefix}${prose(field.label)}</label><div class="plot-field-note">${(state.plots[keyFor(p.id)] || []).length ? `${(state.plots[keyFor(p.id)] || []).length} points saved on your graph.` : 'Add your points directly on the graph.'}</div>${state.plotChecked[keyFor(p.id)] ? `<span class="field-feedback">${escapeHTML(graphFeedback(p))}</span>` : ''}</div>` : '';
    if (p.diagram?.type === 'graph' && p.diagram.table && index === 0) {
      const values = String(value).split(',');
      const t = p.diagram.table;
      if (!compact) return `<div class="answer-field table-answer-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}"><label>${prefix}${prose(field.label)}</label><table class="answer-table horizontal-answer-table"><tbody><tr><th scope="row">${escapeHTML(t.headers[0])}</th>${t.rows.map(row=>`<th scope="col">${escapeHTML(row[0])}</th>`).join('')}</tr><tr><th scope="row">${escapeHTML(t.headers[1])}</th>${t.rows.map((row,i)=>`<td><input data-table-key="${escapeHTML(key)}" data-table-index="${i}" data-problem-id="${p.id}" inputmode="text" value="${escapeHTML((values[i] || '').trim())}" aria-label="${escapeHTML(t.headers[1])} when ${escapeHTML(t.headers[0])} is ${escapeHTML(row[0])}" autocomplete="off"></td>`).join('')}</tr></tbody></table>${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}</div>`;
      return `<div class="answer-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}"><label>${prefix}${prose(field.label)}</label><table class="answer-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((row,i)=>`<tr><th scope="row">${escapeHTML(row[0])}</th><td><input data-table-key="${escapeHTML(key)}" data-table-index="${i}" data-problem-id="${p.id}" inputmode="text" value="${escapeHTML((values[i] || '').trim())}" aria-label="${escapeHTML(t.headers[1])} when ${escapeHTML(t.headers[0])} is ${escapeHTML(row[0])}" autocomplete="off"></td></tr>`).join('')}</tbody></table>${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}</div>`;
    }
    return `<div class="answer-field answer-line-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}">
      <div class="answer-line"><label for="${escapeHTML(inputID)}">${prefix}${prose(field.label || 'Your answer')}</label><span class="answer-equals" aria-hidden="true">=</span><div class="input-row">
      ${textField ? `<textarea id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" rows="1" aria-label="${escapeHTML(field.label || 'Your answer')}">${escapeHTML(value)}</textarea>` : `<input id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" value="${escapeHTML(value)}" inputmode="text" title="${field.value !== null && field.value !== undefined ? 'Enter a number, negative number, or fraction such as -3/4' : escapeHTML(field.label || 'Your answer')}" autocomplete="off" aria-label="${escapeHTML(field.label || 'Your answer')}">`}${field.unit ? `<span class="unit">${escapeHTML(field.unit)}</span>` : ''}</div></div>
      ${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}
function isPlotField(p,field) { return p.diagram?.type === 'graph' && p.diagram.student_plot && /plot.*point/i.test(field.label || ''); }
function canShowSolutions(p) { return variantIndex(p.id) > 0; }
function originalHint(p) {
  const specific = {
    18:'Compare the two outlines and the positions of the pieces. Refer to the measurements labeled in the diagram.',
    34:'Trace the radius and diameter in the diagram. Describe the relationship you observe before comparing the expressions.',
    42:'Use the relationship stated in the question. Keep the symbols until you have simplified your expression.',
    47:'Look at the values you calculated in the preceding questions. Describe a pattern, then connect it to the picture.',
    48:'Use the preceding comparison. State a base, a height, and an area expression that agree with your observations.'
  };
  if (specific[p.id]) return specific[p.id];
  const topic = String(p.topic || '').toLowerCase();
  if (topic.includes('angle')) return 'Find the vertex and rays. Look for straight lines and marked corners, then relate the labeled angles.';
  if (topic.includes('perimeter')) return 'Trace the outside boundary once. Use the labeled measurements to identify any missing side lengths.';
  if (topic.includes('volume')) return 'Identify the base and the prism length, or identify one layer of unit pieces. Keep track of whole and partial units.';
  if (topic.includes('circle') || topic.includes('circles')) return 'Identify the marked radius or diameter and the quantity being requested. Use the relationships provided in the question and keep the units consistent.';
  if (topic.includes('area')) return 'Identify one square unit. Look for a way to divide or rearrange the figure without gaps or overlaps.';
  if (topic.includes('graph')) return 'Match each table column to its axis. Read the scale carefully before placing or reading a point.';
  if (topic.includes('ratio') || topic.includes('proportion')) return 'Match corresponding quantities in the same order. Check whether the comparison stays consistent.';
  return 'Identify one unit in the drawing. Compare each whole or partial piece with that unit before counting.';
}
function solutionsMarkup(p) {
  if (!canShowSolutions(p)) return '';
  const open = expandedSolutions.has(keyFor(p.id));
  const review = (p.fields || []).filter(field=>state.progress.records[keyFor(p.id)]?.fields?.[field.key] === 'review');
  return `<section class="inline-solution"><button class="soft-button inline-solution-toggle" type="button" data-action="steps" data-id="${p.id}" aria-expanded="${open}" aria-controls="steps-${p.id}-${variantIndex(p.id)}">${open ? 'Hide' : 'Show'} step-by-step solution</button>${open ? `<div class="inline-solution-body" id="steps-${p.id}-${variantIndex(p.id)}"><ol>${(p.solution || []).map(line=>`<li>${prose(line)}</li>`).join('')}</ol><div class="example-answers">${(p.fields || []).map(field=>`<p><strong>${escapeHTML(field.label)}:</strong> ${prose(field.answer)}</p>`).join('')}</div>${review.map(field=>`<div class="inline-reflection"><p>Compare your explanation of “${escapeHTML(field.label)}” with these steps. Different wording can express the same idea.</p><button class="outline-button" data-action="self-review-inline" data-id="${p.id}" data-key="${escapeHTML(field.key)}">My explanation matches</button></div>`).join('')}</div>` : ''}</section>`;
}
function showInlineSolution(id,toggle = false) {
  if (!canShowSolutions(current(id))) return;
  cancelAdvance();
  const key = keyFor(id);
  if (toggle && expandedSolutions.has(key)) expandedSolutions.delete(key); else expandedSolutions.add(key);
  render();
}
function checkAnswers(id) {
  const p = current(id);
  cancelAdvance();
  for (const field of p.fields || []) {
    if (isPlotField(p,field)) state.plotChecked[keyFor(id)] = true;
    else state.checked[keyFor(id,field.key)] = true;
  }
  const record = recordCheck(state.progress,{id:p.id,variant:variantIndex(id),fields:fieldStatuses(p)});
  render(); persist();
  if (record.complete) scheduleAdvance(p);
  else if (Object.values(record.fields).includes('review')) notify(canShowSolutions(p) ? 'Open the example steps to review your explanation.' : 'Your explanation is saved. Review your reasoning using the question and diagram.');
}
function fieldStatuses(p) {
  const previous = state.progress.records[keyFor(p.id)];
  return (p.fields || []).map(field=> {
    let status = isPlotField(p,field) ? graphStatus(p) : evaluate(field,state.answers[keyFor(p.id,field.key)] || '').status;
    if (status === 'review' && previous?.fields?.[field.key] === 'self-reviewed') status = 'self-reviewed';
    return {key:field.key,status};
  });
}
function graphStatus(p) {
  const expected = expectedPoints(p), points = state.plots[keyFor(p.id)] || [];
  if (!points.length) return 'blank';
  const matching = points.length === expected.length && expected.every(pt=>points.some(a=>Math.abs(a[0]-pt[0])<1e-7&&Math.abs(a[1]-pt[1])<1e-7));
  return matching && state.lines[keyFor(p.id)] ? 'correct' : 'incorrect';
}
function invalidateProgress(id,fieldKey) {
  cancelAdvance();
  const record = state.progress.records[keyFor(id)];
  if (!record) return;
  if (fieldKey) record.fields[fieldKey] = 'blank';
  else for (const field of current(id).fields || []) if (isPlotField(current(id),field)) record.fields[field.key] = 'blank';
  record.complete = false;
}
function cancelAdvance() {
  autoAdvance.cancel();
  const banner = document.querySelector('#advance-banner'); if (banner) banner.hidden = true;
}
function scheduleAdvance(p) {
  const index = problems.findIndex(item=>Number(item.id) === Number(p.id));
  const target = problems[index+1];
  if (!target || !state.autoNext) { notify('All answers checked. Your progress is saved.'); return; }
  if (Number(state.question) !== Number(p.id)) { state.question = Number(p.id); state.page = pageFor(p.id); }
  const pending = {id:p.id,variant:variantIndex(p.id),target:target.id};
  autoAdvance.start(pending,3000);
  const banner = document.querySelector('#advance-banner');
  banner.innerHTML = `<span>Problem ${p.id} complete. Next problem in 3 seconds.</span><div><button type="button" data-advance="stay">Stay here</button><button type="button" data-advance="review">Review</button><button type="button" data-advance="next">Next now →</button></div>`;
  banner.hidden = false;
}
function progressStatus(id,variant = 0) {
  const record = state.progress.records[`${id}:${variant}`];
  if (!record) return {text:'Not checked',className:'status-unstarted',symbol:'○'};
  if (record.complete) return {text:Object.values(record.fields || {}).includes('self-reviewed') ? 'Complete · self-reviewed' : 'Correct',className:'status-complete',symbol:'✓'};
  if (Object.values(record.fields || {}).includes('incorrect')) return {text:'Needs another try',className:'status-missed',symbol:'!'};
  if (Object.values(record.fields || {}).includes('review')) return {text:'Self-review needed',className:'status-review',symbol:'↺'};
  return {text:'In progress',className:'status-started',symbol:'•'};
}
function checkSummary(p) {
  const record = state.progress.records[keyFor(p.id)];
  if (!record) return '';
  const status = progressStatus(p.id,variantIndex(p.id));
  const needsReview = Object.values(record.fields || {}).includes('review');
  return `<div class="check-summary ${status.className}" role="status"><span>${status.symbol} ${status.text} · ${record.attempts} ${record.attempts === 1 ? 'check' : 'checks'}</span>${needsReview ? `<button class="soft-button small-button" data-action="review" data-id="${p.id}">Review explanation</button>` : ''}</div>`;
}
function sourceFor(p) { const v = variantIndex(p.id); return `./diagrams/q${String(p.id).padStart(2,'0')}${v ? '-v'+v : ''}.svg`; }
function geometryMarkup(p) {
  return p.generated ? diagramMarkup(p,{answer:false}) : `<img class="diagram-image" src="${sourceFor(p)}" alt="Diagram for problem ${p.id}: ${escapeHTML(p.topic || '')}">`;
}
function problemTags(p) { return `${variantIndex(p.id) ? `<span class="variant-tag">Extra example ${variantIndex(p.id)}</span>` : (p.concept ? '<span class="concept-tag">Concept check</span>' : '')}`; }
function toolbar(packet = false) {
  const pg = data.pages[state.page];
  return `<div class="workspace-toolbar"><div class="section-select-wrap"><span class="eyebrow">${packet ? 'Your virtual packet' : state.view === 'practice' ? 'Extra practice' : 'Explore the lesson'}</span><select class="section-select" id="section-select" aria-label="Choose a section">${data.pages.map((page,index)=>`<option value="${index}" ${index === state.page ? 'selected' : ''}>${escapeHTML(page.title)}</option>`).join('')}</select></div><div class="toolbar-right"><span class="page-count">Page ${state.page+1} of ${data.pages.length}</span></div></div><div class="question-jump"><span class="jump-label">Problems</span>${pg.problems.map(p=>`<button type="button" data-action="jump" data-id="${p.id}" class="${Number(p.id) === Number(state.question) ? 'active' : ''} ${hasAnswers(p.id) ? 'answered' : ''}" aria-label="Problem ${p.id}" aria-current="${Number(p.id) === Number(state.question) ? 'true' : 'false'}">${p.id}</button>`).join('')}</div>`;
}
function hasAnswers(id) { const prefix = keyFor(id)+':'; return Object.entries(state.answers).some(([key,value])=>key.startsWith(prefix)&&String(value).trim()); }
function renderLesson() {
  const p = current();
  const isGraph = p.diagram?.type === 'graph';
  const visual = p.diagram ? isGraph ? graphMarkup(p) : geometryMarkup(p) : `<div class="text-visual"><div class="text-visual-symbol" aria-hidden="true">${(p.topic || '').toLowerCase().includes('ratio') ? 'a : b' : 'x'}</div><p>${prose(p.prompt)}</p></div>`;
  app.innerHTML = toolbar()+`<div class="lesson-layout"><section class="visual-panel" aria-label="Problem visualization"><div class="visual-topbar"><span class="eyebrow">${isGraph ? p.diagram.student_plot ? 'Your graph' : 'Read the graph' : p.diagram ? 'See the mathematics' : 'Think it through'}</span><div class="visual-tools"><button type="button" data-action="zoom-out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-action="zoom-reset" title="Reset zoom" aria-label="Reset zoom">↺</button><button type="button" data-action="zoom-in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-action="visual-fullscreen" title="Enlarge visualization" aria-label="Enlarge visualization">⛶</button></div></div><div id="visual-stage" class="visual-stage">${visual}</div><div class="visual-note" id="visual-note">${isGraph && p.diagram.student_plot ? 'Tap the grid or enter coordinates below it.' : 'The picture and question use the same measurements.'}</div></section>
    <section class="problem-panel ${isGraph ? 'graph-problem-panel' : ''}" aria-label="Problem ${p.id}"><div class="problem-content"><div class="problem-topline"><span class="problem-number">PROBLEM ${p.id}</span>${problemTags(p)}</div><h1 class="problem-prompt">${prose(p.prompt)}</h1>${answerFields(p)}${checkSummary(p)}${solutionsMarkup(p)}</div><div class="problem-footer"><div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check answers</button><button class="outline-button" data-action="hint" data-id="${p.id}">Hint</button><button class="soft-button" data-action="packet" data-id="${p.id}">Packet ↗</button></div><div class="example-controls"><button class="outline-button small-button" data-action="example" data-id="${p.id}" ${highestExample(p.id) >= MAX_EXAMPLE_INDEX ? 'disabled' : ''}>New example ↻</button>${variantIndex() ? `<button class="quiet-button" data-action="original" data-id="${p.id}">Packet original</button>` : ''}<span>${variantIndex() ? `Example ${variantIndex()}` : 'Practice with new values'}</span></div><div class="compact-nav"><button class="outline-button" data-action="previous" ${Number(p.id) === Number(problems[0].id) ? 'disabled' : ''} aria-label="Previous problem">← Previous</button><label class="auto-next-label"><input type="checkbox" data-auto-next ${state.autoNext ? 'checked' : ''}> Auto-next</label><button class="outline-button" data-action="next" ${Number(p.id) === Number(problems.at(-1).id) ? 'disabled' : ''}>Next →</button></div></div></section></div>`;
  mountLessonInteractive(p);
}
function reviewAnswers(p) { return checkSummary(p); }
function mountLessonInteractive(p) {
  const container = document.querySelector('#visual-stage');
  if (p.diagram?.type === 'graph' || !interactiveModule?.mountInteractive) return;
  const fallback = container.innerHTML;
  try {
    const result = interactiveModule.mountInteractive(container,p,{variantIndex:variantIndex(p.id),allowSolutions:canShowSolutions(p),theme:state.theme,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
    if (typeof result === 'function') {
      cleanupInteractive = result;
      container.classList.add('interactive');
      document.querySelector('#visual-note').textContent = 'Explore with the controls. Changed measurements are labeled as exploration; your packet question stays the same.';
    } else container.innerHTML = fallback;
  } catch (error) {
    container.innerHTML = fallback;
    console.warn('Interactive lesson unavailable; using the packet diagram.',error);
  }
}
function renderPacket() {
  const page = data.pages[state.page];
  app.innerHTML = toolbar(true)+`<section class="packet-sheet"><div class="packet-heading"><div><h1>${escapeHTML(data.title || 'Study for Test 1 Packet')}</h1><p>${escapeHTML(page.title)} · Page ${page.number || state.page+1}</p></div><button class="outline-button small-button" data-action="original-page">Use packet originals</button></div><div class="packet-grid ${page.large ? 'large-problems' : ''}" data-problem-count="${page.problems.length}">${page.problems.map(base=> {
    const p = current(base.id); const graph = p.diagram?.type === 'graph';
    return `<article class="packet-card ${graph ? 'graph-card' : ''} ${Number(p.id) === Number(state.question) ? 'is-selected' : ''}" data-card-id="${p.id}"><div class="problem-topline"><span class="problem-number">${p.id}.</span>${problemTags(p)}</div><h2 class="problem-prompt">${prose(p.prompt)}</h2><div ${graph ? 'class="graph-packet-grid"' : ''}>${p.diagram ? graph ? graphMarkup(p) : `<div class="diagram-wrap">${geometryMarkup(p)}</div>` : ''}<div>${answerFields(p,true)}${solutionsMarkup(p)}<div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check</button><button class="soft-button" data-action="lesson" data-id="${p.id}">Go to Visualization ↗</button><button class="outline-button" data-action="example" data-id="${p.id}" ${highestExample(p.id) >= MAX_EXAMPLE_INDEX ? 'disabled' : ''}>New example ↻</button>${variantIndex(p.id) ? `<button class="outline-button" data-action="original" data-id="${p.id}">Original</button>` : ''}</div>${reviewAnswers(p)}</div></div></article>`;
  }).join('')}</div></section><div class="packet-bottom"><button class="outline-button" data-action="page-previous" ${state.page === 0 ? 'disabled' : ''}>← Previous page</button><span>Packet originals and extra practice. Answers save as you go.</span><button class="primary-button" data-action="page-next" ${state.page === data.pages.length-1 ? 'disabled' : ''}>Next page →</button></div>`;
}
function graphMarkup(p) {
  const d = p.diagram; const key = keyFor(p.id);
  const points = Array.isArray(state.plots[key]) ? state.plots[key] : [];
  const xmax = Number(d.xmax || 6), ymax = Number(d.ymax || 12);
  const xstep = Number(d.xstep || 1), ystep = Number(d.ystep || 1);
  const nx = Math.round(xmax/xstep), ny = Math.round(ymax/ystep);
  const cell = Math.min(450/Math.max(1,nx),340/Math.max(1,ny));
  const gw = nx*cell, gh = ny*cell; const x0 = (560-gw)/2+12, y0 = 372;
  const pos = (x,y)=>[x0+x/xstep*cell,y0-y/ystep*cell];
  const grid = Array.from({length:nx+1},(_,i)=>`<line x1="${x0+i*cell}" y1="${y0-gh}" x2="${x0+i*cell}" y2="${y0}" class="graph-grid"/><text x="${x0+i*cell}" y="${y0+21}" text-anchor="middle" class="graph-tick">${formatNumber(i*xstep)}</text>`).join('')+Array.from({length:ny+1},(_,j)=>`<line x1="${x0}" y1="${y0-j*cell}" x2="${x0+gw}" y2="${y0-j*cell}" class="graph-grid"/>${j ? `<text x="${x0-12}" y="${y0-j*cell+4}" text-anchor="end" class="graph-tick">${formatNumber(j*ystep)}</text>` : ''}`).join('');
  let givenLine = '';
  if (d.plot_line && Number.isFinite(Number(d.slope))) {
    const slope = Number(d.slope); const endX = slope > 0 ? Math.min(xmax,ymax/slope) : xmax;
    givenLine = `<polyline class="graph-line" points="${pos(0,0).join(',')} ${pos(endX,endX*slope).join(',')}"/>`;
  }
  if (Array.isArray(d.points) && d.points.length) givenLine += d.points.map(pt=>`<circle class="graph-point" cx="${pos(pt[0],pt[1])[0]}" cy="${pos(pt[0],pt[1])[1]}" r="5"/>`).join('');
  const joined = state.lines[key] && points.length > 1 ? `<polyline class="graph-line" points="${[...points].sort((a,b)=>a[0]-b[0]).map(pt=>pos(...pt).join(',')).join(' ')}"/>` : '';
  const expected = expectedPoints(p);
  const overlay = canShowSolutions(p) && expandedSolutions.has(keyFor(p.id)) && d.student_plot && expected.length ? `<polyline fill="none" stroke="#b16f32" stroke-width="2.2" stroke-dasharray="6 5" points="${expected.map(pt=>pos(...pt).join(',')).join(' ')}"/>${expected.map(pt=>`<circle cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="7" fill="none" stroke="#b16f32" stroke-width="2"/>`).join('')}` : '';
  return `<div class="graph-plot-wrap"><div class="graph-shell"><svg viewBox="0 0 560 440" role="img" aria-label="${escapeHTML(d.student_plot ? 'Interactive graph. Tap grid intersections to place points.' : 'Graph for this problem.')}" data-graph-id="${p.id}" data-graph-origin-x="${x0}" data-graph-origin-y="${y0}" data-graph-cell="${cell}" data-graph-xstep="${xstep}" data-graph-ystep="${ystep}" data-graph-xmax="${xmax}" data-graph-ymax="${ymax}" data-graph-editable="${Boolean(d.student_plot)}">${grid}<line x1="${x0}" y1="${y0}" x2="${x0+gw+10}" y2="${y0}" class="graph-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0-gh-10}" class="graph-axis"/><path d="M${x0+gw+5},${y0-4} L${x0+gw+10},${y0} L${x0+gw+5},${y0+4} M${x0-4},${y0-gh-5} L${x0},${y0-gh-10} L${x0+4},${y0-gh-5}" fill="none" class="graph-axis"/><text x="${x0+gw/2}" y="${y0+50}" text-anchor="middle" class="graph-label">${escapeHTML(d.xlabel || 'x')}</text><text x="${x0-50}" y="${y0-gh/2}" text-anchor="middle" class="graph-label" transform="rotate(-90 ${x0-50} ${y0-gh/2})">${escapeHTML(d.ylabel || 'y')}</text>${givenLine}${overlay}${joined}${points.map(pt=>`<circle class="graph-point" cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="6"/>`).join('')}</svg></div>${d.student_plot ? `<div class="graph-controls"><label><input type="checkbox" data-join-id="${p.id}" ${state.lines[key] ? 'checked' : ''}> Join my points</label><button class="soft-button small-button" data-action="check-graph" data-id="${p.id}">Check graph</button><button class="outline-button small-button" data-action="clear-graph" data-id="${p.id}">Clear points</button></div><div class="graph-coordinate-entry" data-problem-id="${p.id}"><label>x <input class="coordinate-input" data-coordinate="x" type="text" inputmode="text" min="0" max="${xmax}" step="${xstep}" aria-label="Point x coordinate"></label><label>y <input class="coordinate-input" data-coordinate="y" type="text" inputmode="text" min="0" max="${ymax}" step="${ystep}" aria-label="Point y coordinate"></label><button class="outline-button small-button" type="button" data-action="add-coordinate" data-id="${p.id}">Add point</button></div><div class="point-chips">${points.map((pt,index)=>`<button type="button" data-action="remove-point" data-id="${p.id}" data-index="${index}" aria-label="Remove point ${pt.join(', ')}">(${pt.map(formatNumber).join(', ')}) ×</button>`).join('')}</div><p class="graph-tip">Tap a grid intersection to place or remove a point.</p>${state.plotChecked[key] ? `<p class="graph-feedback">${escapeHTML(graphFeedback(p))}</p>` : ''}` : ''}</div>`;
}
function expectedPoints(p) {
  if (Array.isArray(p.diagram?.expected_points)) return p.diagram.expected_points;
  return [];
}
function graphFeedback(p) {
  const key = keyFor(p.id), actual = state.plots[key] || [], expected = expectedPoints(p);
  if (!expected.length) return 'Use the table to check each coordinate you plotted.';
  const equal = (a,b)=>Math.abs(a[0]-b[0])<1e-7 && Math.abs(a[1]-b[1])<1e-7;
  const missing = expected.filter(pt=>!actual.some(a=>equal(a,pt)));
  const extra = actual.filter(pt=>!expected.some(a=>equal(a,pt)));
  if (!missing.length && !extra.length) return state.lines[key] ? 'Your points and connecting line are correct.' : 'All points are correct. Turn on “Join my points” to connect them.';
  return `${actual.length ? 'Check the coordinates in your table.' : 'Start by placing the table’s points.'} ${missing.length ? `${missing.length} ${missing.length === 1 ? 'point is' : 'points are'} still missing.` : ''} ${extra.length ? `${extra.length} ${extra.length === 1 ? 'point needs' : 'points need'} another look.` : ''}`.trim();
}
function render() {
  if (typeof cleanupInteractive === 'function') { cleanupInteractive(); cleanupInteractive = null; }
  state.page = Math.max(0,Math.min(data.pages.length-1,pageFor(state.question)));
  document.body.dataset.view = state.view;
  document.querySelectorAll('[data-view]').forEach(button=> {
    const active = button.dataset.view === state.view; button.classList.toggle('active',active); button.setAttribute('aria-current',active ? 'page' : 'false');
  });
  const stepsButton = document.querySelector('#solutions-toggle');
  stepsButton.hidden = !canShowSolutions(current());
  stepsButton.setAttribute('aria-pressed',String(expandedSolutions.has(keyFor(state.question))));
  document.querySelector('#theme-toggle').setAttribute('aria-label',`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
  state.view === 'packet' ? renderPacket() : renderLesson();
  app.querySelectorAll('.answer-line textarea').forEach(sizeAnswer);
  applyPresentation();
  app.setAttribute('aria-busy','false'); updateSavedStatus();
}

function dialogFrame(title,body,footer = '') {
  return `<div class="dialog-header"><h2 id="dialog-title">${escapeHTML(title)}</h2><button class="icon-button" type="button" data-dialog-action="close" aria-label="Close dialog">×</button></div><div class="dialog-body">${body}</div>${footer ? `<div class="dialog-footer">${footer}</div>` : ''}`;
}
function openDialog(kind,options = {}) {
  if (!data) return;
  cancelAdvance();
  if (kind === 'help') {
    const id = options.id || state.question, extra = canShowSolutions(current(id));
    if (extra && ['solution','review'].includes(options.tab)) { closeDialog(); showInlineSolution(id); return; }
    if (options.tab === 'solution') options = {...options,tab:'hint'};
  }
  dialogState = {kind,...options};
  renderDialog();
  const dialog = document.querySelector('#study-dialog');
  if (!dialog.open) dialog.showModal();
}
function closeDialog() {
  const dialog = document.querySelector('#study-dialog');
  if (dialog.open) dialog.close();
  dialogState = null; pendingImport = null;
  releaseDownloadURLs();
}
function renderDialog() {
  if (!dialogState) return;
  const summary = summarizeProgress(state.progress,problems,state.variants);
  let markup = '';
  if (dialogState.kind === 'contents') {
    markup = dialogFrame('Table of contents',`<p class="dialog-intro">Choose a packet problem. Your original and extra-example answers are saved separately.</p><div class="toc-list">${data.pages.map((page,index)=> {
      const complete = page.problems.filter(p=>state.progress.records[`${p.id}:0`]?.complete).length;
      return `<details class="toc-section" ${index === state.page ? 'open' : ''}><summary><span>${escapeHTML(page.title)}<small>Problems ${page.problems[0].id}–${page.problems.at(-1).id}</small></span><span class="toc-count">${complete}/${page.problems.length} complete</span></summary><div class="toc-problem-list">${page.problems.map(p=> {
        const status = progressStatus(p.id), extras = Object.entries(state.progress.records).filter(([key,entry])=>key.startsWith(p.id+':')&&Number(key.split(':')[1])>0&&entry.complete).length;
        return `<button type="button" class="toc-problem ${status.className}" data-dialog-action="jump" data-id="${p.id}" data-variant="0"><strong>${p.id}. ${escapeHTML(p.topic || '')}</strong><span>${status.symbol} ${status.text}${extras ? ` · ${extras} extras complete` : ''}</span></button>`;
      }).join('')}</div></details>`;
    }).join('')}</div>`,`<span>${summary.overall.mainComplete} of ${summary.overall.mainTotal} packet problems complete</span><button class="soft-button" data-dialog-action="progress">View progress</button>`);
  } else if (dialogState.kind === 'progress') {
    const total = summary.overall;
    markup = dialogFrame('Your progress',`<p class="dialog-intro">Saved on this browser. Correct answers and self-reviewed explanations count as complete; untouched answers are never graded.</p><div class="progress-overview"><div><strong>${total.mainComplete} / ${total.mainTotal}</strong><span>Packet complete</span></div><div><strong>${total.extraComplete}</strong><span>Extra examples complete</span></div><div><strong>${total.totalAttempts}</strong><span>Answer checks</span></div></div>${summary.recommendedId ? `<button class="primary-button recommended-button" data-dialog-action="jump" data-id="${summary.recommendedId}" data-variant="${summary.recommendedVariant}">Recommended: problem ${summary.recommendedId}${summary.recommendedVariant ? `, extra ${summary.recommendedVariant}` : ''} →</button>` : '<p>Every packet problem is complete. Generate another example whenever you want more practice.</p>'}<h3>What to review</h3>${summary.targetedReview.length ? `<div class="review-list">${summary.targetedReview.map(item=>`<button class="review-item" data-dialog-action="jump" data-id="${item.id}" data-variant="${item.variant}"><strong>Problem ${item.id}${item.variant ? ` · Extra ${item.variant}` : ''}: ${escapeHTML(item.topic)}</strong><span>${escapeHTML(item.reason)} ${escapeHTML(item.hint)}</span></button>`).join('')}</div>` : '<p>No checked answers currently need another try. Keep going with the recommended problem.</p>'}<details class="skill-details"><summary>Skill summary</summary><div class="skill-list">${summary.topics.map(skill=>`<div class="skill-card"><strong>${escapeHTML(skill.topic)}</strong><span>${skill.mainComplete}/${skill.mainTotal} packet · ${skill.extraComplete} extra complete</span>${skill.missedIds.length ? `<small>Review: ${skill.missedIds.join(', ')}</small>` : ''}</div>`).join('')}</div></details><section class="report-section"><h3>Save or share your work</h3><p>Reports include your answers and checks. A JSON backup moves your saved work to another device. Nothing is sent automatically.</p><label class="report-name-label" for="report-name">Student name (optional)</label><input id="report-name" maxlength="100" value="${escapeHTML(reportName)}" autocomplete="off"><div class="report-actions"><a class="outline-button" data-report-link="text" href="#" download="Study_for_Test_1_Progress.txt">Download report</a><a class="outline-button" data-report-link="csv" href="#" download="Study_for_Test_1_Progress.csv">Download CSV</a><a class="outline-button" data-report-link="backup" href="#" download="Study_for_Test_1_Backup.json">Download backup</a><button class="outline-button" data-dialog-action="restore">Restore backup</button></div></section>`,`<label class="auto-next-label"><input type="checkbox" data-dialog-auto-next ${state.autoNext ? 'checked' : ''}> Automatically move on after a fully correct check</label>`);
  } else if (dialogState.kind === 'help') {
    const p = current(dialogState.id), tab = dialogState.tab === 'review' ? 'review' : 'hint';
    const record = state.progress.records[keyFor(p.id)];
    const review = (p.fields || []).filter(field=>record?.fields?.[field.key] === 'review');
    const guidance = canShowSolutions(p) ? p.hint : originalHint(p);
    const body = tab === 'hint' ? `<div class="hint-box"><strong>A place to start</strong><p>${prose(guidance)}</p></div>` : review.length ? review.map(field=>`<section class="reflection-card"><h3>${escapeHTML(field.label)}</h3><p><strong>Your explanation:</strong> ${prose(state.answers[keyFor(p.id,field.key)] || '')}</p><p>${prose(guidance)}</p><p>Check that you addressed every part, used the measurements and units consistently, and explained why your reasoning works. Ask your teacher if you are unsure.</p><button class="primary-button" data-dialog-action="self-review" data-key="${escapeHTML(field.key)}">I reviewed my reasoning</button></section>`).join('') : '<p>No explanation is waiting for review. Check your answers first.</p>';
    markup = dialogFrame(`Problem ${p.id} · ${variantIndex(p.id) ? 'Extra example '+variantIndex(p.id) : 'Packet original'}`,`<div class="help-tabs"><button class="${tab === 'hint' ? 'primary-button' : 'outline-button'}" data-dialog-action="help-tab" data-tab="hint">Concept hint</button>${review.length ? `<button class="${tab === 'review' ? 'primary-button' : 'outline-button'}" data-dialog-action="help-tab" data-tab="review">Review reasoning</button>` : ''}</div>${body}`);
  } else if (dialogState.kind === 'restore' && pendingImport) {
    const imported = summarizeProgress(pendingImport.progress || createProgressState(),problems,pendingImport.variants);
    const answers = Object.values(pendingImport.answers || {}).filter(value=>String(value).trim()).length;
    markup = dialogFrame('Restore this backup?',`<p>This backup contains <strong>${answers} saved ${answers === 1 ? 'answer' : 'answers'}</strong> and <strong>${imported.overall.mainComplete} completed packet ${imported.overall.mainComplete === 1 ? 'problem' : 'problems'}</strong>.</p><p>Restoring replaces the answers, graphs, and progress currently saved in this browser. Download your current backup first if you want to keep both.</p><p>You will resume at problem ${pendingImport.question || imported.recommendedId || problems[0].id}.</p>`,`<a class="outline-button" data-report-link="backup" href="#" download="Study_for_Test_1_Backup.json">Download current backup</a><button class="outline-button" data-dialog-action="close">Cancel</button><button class="primary-button" data-dialog-action="confirm-restore">Replace progress</button>`);
  }
  document.querySelector('#dialog-content').innerHTML = markup;
  refreshDownloadLinks();
}
function releaseDownloadURLs() {
  const previous = downloadURLs; downloadURLs = [];
  if (previous.length) setTimeout(()=>previous.forEach(url=>URL.revokeObjectURL(url)),30000);
}
function refreshDownloadLinks() {
  if (!data || !dialogState || !['progress','restore'].includes(dialogState.kind)) return;
  const links = document.querySelectorAll('#study-dialog [data-report-link]');
  if (!links.length) return;
  releaseDownloadURLs();
  for (const link of links) {
    const kind = link.dataset.reportLink;
    const contents = kind === 'text' ? makeReportText({data,state,studentName:reportName}) : kind === 'csv' ? makeReportCSV({data,state,studentName:reportName}) : JSON.stringify(makeBackup({state}),null,2);
    const type = kind === 'text' ? 'text/plain;charset=utf-8' : kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
    const url = URL.createObjectURL(new Blob([contents],{type}));
    downloadURLs.push(url); link.href = url;
  }
}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.querySelector('.brand').addEventListener('click',event=> { event.preventDefault(); selectProblem(problems[0]?.id || 1,'lesson'); });
document.querySelector('#contents-toggle').addEventListener('click',()=>openDialog('contents'));
document.querySelector('#progress-toggle').addEventListener('click',()=>openDialog('progress'));
document.querySelector('#solutions-toggle').addEventListener('click',()=>showInlineSolution(state.question,true));
document.querySelector('#theme-toggle').addEventListener('click',()=> {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.body.classList.toggle('dark',state.theme === 'dark'); persist(); if (data) render();
});
document.querySelector('#fullscreen-toggle').addEventListener('click',async()=> {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { openPresentation('page'); }
});
document.addEventListener('fullscreenchange',()=> { const active = Boolean(document.fullscreenElement); document.querySelector('#fullscreen-toggle').setAttribute('aria-label',active ? 'Exit full screen' : 'Enter full screen'); });
document.querySelector('#download-toggle').addEventListener('click',()=> { document.querySelector('#download-menu').hidden = !document.querySelector('#download-menu').hidden; });
document.addEventListener('click',event=> { if (!event.target.closest('#download-toggle,#download-menu,[data-action="download"]')) document.querySelector('#download-menu').hidden = true; });
document.querySelector('#reset-progress').addEventListener('click',()=> {
  if (!data) return;
  if (!confirm('Clear all saved answers and plotted points for this study packet on this browser?')) return;
  cancelAdvance();
  for (const key of ['answers','plots','lines','checked','plotChecked']) state[key] = {};
  state.progress = createProgressState();
  render(); persist(); notify('Saved answers cleared.');
});
app.addEventListener('input',event=> {
  cancelAdvance();
  if (event.target.matches('[data-table-key]')) {
    const input = event.target;
    const key = input.dataset.tableKey;
    const values = [...input.closest('tbody').querySelectorAll('input')].map(el=>el.value.trim());
    state.answers[key] = values.some(Boolean) ? values.join(', ') : '';
    state.checked[key] = false;
    invalidateProgress(input.dataset.problemId,key.split(':').at(-1)); updateInlineSummary(input.dataset.problemId);
    const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
    persist(); return;
  }
  const input = event.target.closest('[data-answer-key]');
  if (!input) return;
  if (input.tagName === 'TEXTAREA') sizeAnswer(input);
  state.answers[input.dataset.answerKey] = input.value; state.checked[input.dataset.answerKey] = false;
  invalidateProgress(input.dataset.problemId,input.dataset.answerKey.split(':').at(-1)); updateInlineSummary(input.dataset.problemId);
  const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
  persist();
});
function sizeAnswer(input) { input.style.height = 'auto'; input.style.height = `${Math.max(38,input.scrollHeight)}px`; }
function updateInlineSummary(id) {
  const summary = app.querySelector(`[data-card-id="${id}"] .check-summary`) || (Number(state.question) === Number(id) ? app.querySelector('.problem-panel .check-summary') : null);
  if (summary) summary.outerHTML = checkSummary(current(id));
}
app.addEventListener('change',event=> {
  if (event.target.id === 'section-select') { const page = data.pages[Number(event.target.value)]; selectProblem(page.problems[0].id,state.view); }
  if (event.target.matches('[data-auto-next]')) { state.autoNext = event.target.checked; cancelAdvance(); persist(); }
  if (event.target.matches('[data-join-id]')) { invalidateProgress(event.target.dataset.joinId); state.lines[keyFor(event.target.dataset.joinId)] = event.target.checked; state.plotChecked[keyFor(event.target.dataset.joinId)] = false; render(); persist(); }
});
app.addEventListener('pointerdown',event=> {
  const svg = event.target.closest('svg[data-graph-editable="true"]');
  if (!svg) return;
  event.preventDefault();
  const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
  const matrix = svg.getScreenCTM(); if (!matrix) return;
  const local = point.matrixTransform(matrix.inverse());
  const x = Math.round((local.x-Number(svg.dataset.graphOriginX))/Number(svg.dataset.graphCell))*Number(svg.dataset.graphXstep);
  const y = Math.round((Number(svg.dataset.graphOriginY)-local.y)/Number(svg.dataset.graphCell))*Number(svg.dataset.graphYstep);
  if (x < 0 || y < 0 || x > Number(svg.dataset.graphXmax) || y > Number(svg.dataset.graphYmax)) return;
  const key = keyFor(svg.dataset.graphId); const points = state.plots[key] || [];
  const existing = points.findIndex(pt=>Math.abs(pt[0]-x)<1e-7&&Math.abs(pt[1]-y)<1e-7);
  if (existing >= 0) points.splice(existing,1); else points.push([Number(x.toFixed(7)),Number(y.toFixed(7))]);
  invalidateProgress(svg.dataset.graphId); state.plots[key] = points; state.plotChecked[key] = false; render(); persist();
});
app.addEventListener('click',async event=> {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const id = Number(button.dataset.id || state.question); const action = button.dataset.action;
  if (action === 'jump') selectProblem(id,state.view,state.view === 'packet');
  else if (action === 'lesson') selectProblem(id,'lesson');
  else if (action === 'packet') selectProblem(id,'packet',true);
  else if (action === 'check') checkAnswers(id);
  else if (action === 'hint') openDialog('help',{id,tab:'hint'});
  else if (action === 'review') openDialog('help',{id,tab:'review'});
  else if (action === 'steps') showInlineSolution(id,true);
  else if (action === 'self-review-inline') {
    const p = current(id), field = p.fields.find(f=>f.key === button.dataset.key);
    if (!canShowSolutions(p) || !field || field.value !== null || field.accepted?.length || evaluate(field,state.answers[keyFor(id,field.key)] || '').status !== 'review') return;
    const record = recordSelfReview(state.progress,{id,variant:variantIndex(id),fieldKeys:[field.key]}); render(); persist(); if (record?.complete) scheduleAdvance(p);
  }
  else if (action === 'example') nextExample(id);
  else if (action === 'original') { chooseExample(id,0); selectProblem(id,state.view === 'practice' ? 'lesson' : state.view); }
  else if (action === 'original-page') { cancelAdvance(); data.pages[state.page].problems.forEach(p=>state.variants[p.id]=0); render(); persist(); }
  else if (action === 'previous' || action === 'next') { const index = problems.findIndex(p=>Number(p.id) === Number(state.question)); const p = problems[index+(action === 'next' ? 1 : -1)]; if (p) selectProblem(p.id); }
  else if (action === 'page-previous' || action === 'page-next') { const page = data.pages[state.page+(action === 'page-next' ? 1 : -1)]; if (page) { selectProblem(page.problems[0].id,'packet'); window.scrollTo({top:0,behavior:'smooth'}); } }
  else if (action === 'download') document.querySelector('#download-menu').hidden = false;
  else if (action.startsWith('zoom-')) {
    if (typeof cleanupInteractive?.zoom === 'function') { cleanupInteractive.zoom(action); return; }
    const image = document.querySelector('#visual-stage .diagram-image');
    if (image) { let z = Number(image.dataset.zoom || 1); z = action === 'zoom-reset' ? 1 : Math.max(.5,Math.min(2,z+(action === 'zoom-in' ? .2 : -.2))); image.dataset.zoom = z; image.style.transform = `scale(${z})`; }
    else notify('Use the controls in this visualization, or enlarge it.');
  } else if (action === 'visual-fullscreen') {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('#visual-stage').requestFullscreen(); } catch { openPresentation('visual'); }
  } else if (action === 'check-graph') checkAnswers(id);
  else if (action === 'clear-graph') { invalidateProgress(id); state.plots[keyFor(id)] = []; state.plotChecked[keyFor(id)] = false; render(); persist(); }
  else if (action === 'remove-point') { invalidateProgress(id); (state.plots[keyFor(id)] || []).splice(Number(button.dataset.index),1); state.plotChecked[keyFor(id)] = false; render(); persist(); }
  else if (action === 'add-coordinate') {
    const group = button.closest('.graph-coordinate-entry'), p = current(id), d = p.diagram;
    const x = parseNumber(group.querySelector('[data-coordinate="x"]').value), y = parseNumber(group.querySelector('[data-coordinate="y"]').value);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x<0 || y<0 || x>d.xmax || y>d.ymax || Math.abs(x/d.xstep-Math.round(x/d.xstep))>1e-7 || Math.abs(y/d.ystep-Math.round(y/d.ystep))>1e-7) { notify('Enter coordinates at a labeled grid intersection.'); return; }
    const points = state.plots[keyFor(id)] || [];
    if (points.some(pt=>Math.abs(pt[0]-x)<1e-7&&Math.abs(pt[1]-y)<1e-7)) { notify('That point is already on your graph.'); return; }
    invalidateProgress(id); state.plots[keyFor(id)] = [...points,[x,y]]; state.plotChecked[keyFor(id)] = false; render(); persist();
    app.querySelector(`.graph-coordinate-entry[data-problem-id="${id}"] [data-coordinate="x"]`)?.focus();
  }
});
document.addEventListener('keydown',event=> {
  if (event.key === 'Escape') { document.querySelector('#download-menu').hidden = true; if (document.querySelector('#study-dialog').open) return; cancelAdvance(); if (presentationMode) { event.preventDefault(); closePresentation(); } }
  if (event.key === 'Tab' && presentationMode === 'visual') {
    const focusable = [...document.querySelectorAll('#visual-stage button:not([disabled]),#visual-stage input:not([disabled]),#visual-stage select:not([disabled]),#visual-stage textarea:not([disabled]),#visual-stage [tabindex="0"],#focus-close')];
    const currentIndex = focusable.indexOf(document.activeElement);
    if (focusable.length && (currentIndex < 0 || (!event.shiftKey && currentIndex === focusable.length-1) || (event.shiftKey && currentIndex === 0))) {
      event.preventDefault(); focusable[event.shiftKey ? focusable.length-1 : 0].focus();
    }
  }
  if (event.altKey && ['ArrowLeft','ArrowRight'].includes(event.key) && data && !document.querySelector('#study-dialog').open) {
    event.preventDefault(); const i = problems.findIndex(p=>Number(p.id) === Number(state.question));
    const p = problems[i+(event.key === 'ArrowRight' ? 1 : -1)]; if (p) selectProblem(p.id);
  }
});
document.querySelector('#advance-banner').addEventListener('click',event=> {
  const action = event.target.closest('[data-advance]')?.dataset.advance;
  if (!action) return;
  if (action === 'next') autoAdvance.nextNow();
  else if (action === 'review') { const id = autoAdvance.pending?.id || state.question; cancelAdvance(); openDialog('help',{id,tab:'solution'}); }
  else { cancelAdvance(); notify('Staying here. Your checked answers are saved.'); }
});
document.querySelector('#study-dialog').addEventListener('cancel',event=> { event.preventDefault(); closeDialog(); });
document.querySelector('#study-dialog').addEventListener('click',event=> {
  const button = event.target.closest('[data-dialog-action]'); if (!button) return;
  const action = button.dataset.dialogAction;
  if (action === 'close') closeDialog();
  else if (action === 'progress') openDialog('progress');
  else if (action === 'jump') { const id = Number(button.dataset.id), variant = Number(button.dataset.variant || 0); closeDialog(); chooseExample(id,variant); selectProblem(id,variant ? 'practice' : 'lesson'); }
  else if (action === 'help-tab') openDialog('help',{id:dialogState.id,tab:button.dataset.tab});
  else if (action === 'self-review') {
    const p = current(dialogState.id), field = p.fields.find(f=>f.key === button.dataset.key);
    if (!field || field.value !== null || field.accepted?.length || evaluate(field,state.answers[keyFor(p.id,field.key)] || '').status !== 'review') return;
    const record = recordSelfReview(state.progress,{id:p.id,variant:variantIndex(p.id),fieldKeys:[field.key]});
    persist(); render();
    if (record?.complete) { closeDialog(); scheduleAdvance(p); } else renderDialog();
  } else if (action === 'restore') document.querySelector('#restore-input').click();
  else if (action === 'confirm-restore' && pendingImport) {
    const restored = pendingImport, imported = summarizeProgress(restored.progress || createProgressState(),problems,restored.variants);
    state = {...state,...restored,question:restored.question || imported.recommendedId || problems[0].id,view:restored.view || 'lesson',progress:restored.progress || createProgressState()};
    for (const key of ['answers','plots','lines','checked','plotChecked','variants','exampleIndices']) state[key] = restored[key] || {};
    if (typeof state.autoNext !== 'boolean') state.autoNext = true;
    reportName = state.studentName || ''; state.page = pageFor(state.question);
    closeDialog(); document.body.classList.toggle('dark',state.theme === 'dark'); render(); saveURL(); flushSave(); notify('Backup restored. Your progress is saved on this browser.');
  }
});
document.querySelector('#study-dialog').addEventListener('input',event=> {
  if (event.target.id === 'report-name') { reportName = event.target.value.slice(0,100); state.studentName = reportName; refreshDownloadLinks(); persist(); }
});
document.querySelector('#study-dialog').addEventListener('change',event=> {
  if (event.target.matches('[data-dialog-auto-next]')) { state.autoNext = event.target.checked; cancelAdvance(); refreshDownloadLinks(); persist(); render(); }
});
document.querySelector('#restore-input').addEventListener('change',async event=> {
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
  cancelAdvance();
  try {
    if (file.size > 4000000) throw Error('This backup is too large. Choose a Study for Test 1 JSON backup under 4 MB.');
    pendingImport = validateBackup(await file.text(),problems);
    openDialog('restore');
  } catch (error) { pendingImport = null; notify(`Backup not restored: ${error.message}`); }
});
window.addEventListener('pagehide',flushSave);
window.addEventListener('beforeunload',flushSave);
document.addEventListener('visibilitychange',()=> { if (document.hidden) { cancelAdvance(); flushSave(); } });

async function start() {
  try {
    data = packetData;
    if (!data || !Array.isArray(data.pages) || !data.pages.length) throw Error('The packet has no pages.');
    problems = data.pages.flatMap(page=>page.problems);
    reportName = typeof state.studentName === 'string' ? state.studentName.slice(0,100) : '';
    const url = new URL(window.location.href); const problem = Number(url.searchParams.get('problem')); const view = url.searchParams.get('view'); const example = Number(url.searchParams.get('example'));
    if (problem && problems.some(p=>Number(p.id) === problem)) state.question = problem;
    if (['lesson','packet','practice'].includes(view)) state.view = view;
    if (!problems.some(p=>Number(p.id) === Number(state.question))) state.question = problems[0].id;
    if (url.searchParams.has('example') && Number.isInteger(example) && example >= 0 && example <= MAX_EXAMPLE_INDEX) chooseExample(state.question,example);
    if (state.view === 'practice' && variantIndex() === 0) chooseExample(state.question,Math.min(MAX_EXAMPLE_INDEX,highestExample(state.question)+1));
    state.page = Math.max(0,pageFor()); render(); saveURL();
    window.studyPacketBoot?.ready();
    if (migratedProgress) notify('Packet updated. Saved answers for unchanged problems are still here.');
  } catch (error) {
    app.setAttribute('aria-busy','false');
    app.innerHTML = `<section class="error-state"><h1>The packet could not open.</h1><p>Your saved answers are safe on this browser. Reload to try again.</p><button class="primary-button" onclick="location.reload()">Reload</button></section>`;
    console.error(error);
    window.studyPacketBoot?.fail(error);
    return;
  }
  Promise.resolve(__studyModules["interactives.js"]).then(module=> {
    interactiveModule = module;
    if (state.view !== 'packet' && document.querySelector('#visual-stage')) mountLessonInteractive(current());
  }).catch(error=>console.warn('Interactive lessons are unavailable; the packet diagrams remain usable.',error));
}
start();

return {};
})();
})();
