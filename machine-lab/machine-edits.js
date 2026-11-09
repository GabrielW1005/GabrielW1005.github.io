/** Editable setup values. Ramp height and horizontal run are independent. */
import {normalizeConfig} from './physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const horizontalRun=c=>Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height));
export const setupEntry=value=>Number(value.toPrecision(10)).toString();
export const setupValue=(c,key)=>key==='rampRun'?horizontalRun(c):c[key];
export function editSetup(c,key,value){
 if(!Number.isFinite(value))return {...c};
 if(c.type==='ramp'&&key==='rampRun'){
  const low=Math.sqrt(Math.max(0,.3**2-c.height**2)),high=Math.sqrt(Math.max(0,5**2-c.height**2));
  return normalizeConfig({...c,length:Math.hypot(clamp(value,low,high),c.height)});
 }
 if(c.type==='ramp'&&key==='height'){
  const run=horizontalRun(c),low=Math.max(.1,Math.sqrt(Math.max(0,.3**2-run**2))),high=Math.min(2,Math.sqrt(Math.max(0,5**2-run**2)));
  const height=clamp(value,low,Math.max(low,high));
  return normalizeConfig({...c,height,length:Math.hypot(run,height)});
 }
 return normalizeConfig({...c,[key]:value});
}
