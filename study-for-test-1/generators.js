/* Deterministic practice: the index is a seed, so saved work always reopens the same problem. */
export const MAX_EXAMPLE_INDEX = 1000000;
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

export function getExample(base,index=0) {
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
