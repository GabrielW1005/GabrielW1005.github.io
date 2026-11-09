/** Setup edits snap to a grid; motion and computed balance remain continuous. */
export function snapValue(value,step,min=-Infinity,max=Infinity){
 if(!Number.isFinite(value)||!(step>0))return value;
 const lower=Number.isFinite(min)?Math.ceil(min/step-1e-9)*step:-Infinity;
 const upper=Number.isFinite(max)?Math.floor(max/step+1e-9)*step:Infinity;
 const snapped=Math.round(value/step)*step;
 const bounded=lower<=upper?Math.min(upper,Math.max(lower,snapped)):Math.min(max,Math.max(min,value));
 return Number(bounded.toFixed(12));
}
export function answerRounding(value,task='balance'){
 if(!Number.isFinite(value))return {value,text:'—',places:2,approximate:false};
 const abs=Math.abs(value);
 const places=task==='force'?0:task==='distance'||(abs>0&&abs<.1)?Math.min(10,Math.max(2,2-Math.floor(Math.log10(abs||1)))):2;
 const rounded=Number(value.toFixed(places));
 const approximate=Math.abs(value-rounded)>1e-10*Math.max(1,abs);
 return {value:rounded,text:String(Object.is(rounded,-0)?0:rounded),places,approximate};
}
export function displayValue(value,task='balance'){
 const r=answerRounding(value,task);return (r.approximate?'≈ ':'')+r.text;
}
export function matchesRoundedAnswer(value,target,task='balance'){
 if(!Number.isFinite(value)||!Number.isFinite(target))return false;
 if(task==='force')return Number.isInteger(value)&&value===target;
 // Accept the exact result or exactly the instructed rounded result; do not
 // widen a physical tolerance to hide visibly incorrect rounded distances.
 const r=answerRounding(target,task),epsilon=1e-9*Math.max(1,Math.abs(target));
 return (target===0||value!==0)&&(Math.abs(value-target)<=epsilon||Math.abs(value-r.value)<=epsilon);
}
