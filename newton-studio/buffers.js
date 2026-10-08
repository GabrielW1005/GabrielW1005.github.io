/* Fixed-capacity graph storage. Rows are reused after the buffer wraps. */
(function(root){
'use strict';
class SampleBuffer{
 constructor(capacity=3600){
  if(!Number.isInteger(capacity)||capacity<2)throw Error('Sample capacity must be at least two.');
  this.capacity=capacity;this.length=0;this.start=0;this.revision=0;
  this.rows=Array.from({length:capacity},()=>({t:0,x:0,y:0,vx:0,vy:0,speed:0,ax:0,ay:0,acceleration:0,distance:0,displacement:0,angle:0,omega:0,mass:0,fx:0,fy:0}));
 }
 next(){const index=(this.start+this.length)%this.capacity;if(this.length<this.capacity)this.length++;else this.start=(this.start+1)%this.capacity;this.revision++;return this.rows[index];}
 get(index){return index>=0&&index<this.length?this.rows[(this.start+index)%this.capacity]:undefined;}
 clear(){this.length=0;this.start=0;this.revision++;}
 map(fn){const result=new Array(this.length);for(let i=0;i<this.length;i++)result[i]=fn(this.get(i),i);return result;}
 *[Symbol.iterator](){for(let i=0;i<this.length;i++)yield this.get(i);}
}
root.NewtonBuffers={SampleBuffer};if(typeof module!=='undefined')module.exports=root.NewtonBuffers;
})(typeof window!=='undefined'?window:globalThis);
