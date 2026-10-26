import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseNumber} from '../packet-core.js';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function handleControlInput('),source.indexOf("$('parameters').addEventListener"));
let applied=null;
const scope=vm.createContext({parseNumber,parameterChange:(key,value)=>applied={kind:'parameter',key,value},explorationChange:(key,value)=>applied={kind:'experiment',key,value}});
vm.runInContext(code,scope);
function input(raw,{min=-20,max=20,type='text',parameter=false}={}){return{value:raw,type,min:String(min),max:String(max),dataset:parameter?{param:'acceleration'}:{experiment:'acceleration'},setCustomValidity(message){this.error=message;},reportValidity(){this.reported=true;}};}
for(const[raw,value]of[['-3/4',-.75],['-.5',-.5],['-2.5',-2.5],['3/4',.75],['1/-2',-.5],['-1 1/2',-1.5],['3/40',.075]]){
 for(const parameter of[false,true]){const el=input(raw,{parameter});applied=null;assert.equal(scope.handleControlInput({target:el}),true);assert.equal(applied,null,'Typing must not replace a partly entered denominator');assert.equal(el.value,raw);assert.equal(scope.handleControlInput({target:el},true),true);assert.equal(applied.value,value);assert.equal(applied.kind,parameter?'parameter':'experiment');}
}
for(const raw of ['-','1/','1/0','1/2/3','hello','']){const el=input(raw);applied=null;assert.equal(scope.handleControlInput({target:el},true),false);assert.equal(applied,null);assert.ok(el.error);assert.equal(el.value,raw,'Invalid entry remains available for correction');}
for(const[raw,expected]of[['99999',20],['-99999',-20],['Infinity',20],['-Infinity',-20]]){assert.equal(scope.handleControlInput({target:input(raw)},true),true);assert.equal(applied.value,expected);}
assert.equal(scope.handleControlInput({target:input('1.7',{type:'range'})}),true);assert.equal(applied.value,1.7);
const sync=source.slice(source.indexOf('function setControlValue('),source.indexOf('function parameterChange('));vm.runInContext(sync,scope);
const slider={type:'range',step:'.1',min:'-5',value:'0'};scope.setControlValue(slider,-.75);assert.equal(slider.step,'any');assert.equal(slider.value,-.75);
console.log('PASS: signed fractions/decimals in experiment and edit-value controls; partial entry preserved; invalid fractions rejected; limits and sliders retained.');
