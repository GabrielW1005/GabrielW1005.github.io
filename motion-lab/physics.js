/* Motion Lab: SI units, arc-length coordinates, ideal track constraint.
   Works both as a browser script and as a dependency-free Node module. */
(function(root) {
  'use strict';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function ease(t) { t=clamp(t,0,1); return t*t*t*(10+t*(-15+6*t)); }
  function easeD(t) { return t<=0 || t>=1 ? 0 : 30*t*t*(t-1)*(t-1); }
  function easeDD(t) { return t<=0 || t>=1 ? 0 : 60*t*(2*t*t-3*t+1); }
  function geometry(kind,height,x) {
    let y=0, slope=0, second=0;
    function ramp(start,length,delta) {
      const t=(x-start)/length;
      y+=delta*ease(t); slope+=delta/length*easeD(t); second+=delta/(length*length)*easeDD(t);
    }
    if(kind==='ramp') { y=height; ramp(10,32,-height); }
    if(kind==='valley') { y=height; ramp(8,22,-height); ramp(42,22,height); }
    if(kind==='hill') { ramp(10,22,height); ramp(42,22,-height); }
    return {y,slope,second};
  }
  class Track {
    constructor(kind='valley',height=8) {
      this.kind=kind; this.height=height; this.minX=-20; this.maxX=90; this.dx=0.01;
      const count=Math.round((this.maxX-this.minX)/this.dx)+1;
      this.arc=new Float64Array(count);
      const f=x=>Math.hypot(1,this.atX(x).slope);
      for(let i=1;i<count;i++) {
        const x=this.minX+(i-1)*this.dx;
        this.arc[i]=this.arc[i-1]+this.dx/6*(f(x)+4*f(x+this.dx/2)+f(x+this.dx));
      }
      this.origin=this.arc[Math.round(-this.minX/this.dx)];
    }
    atX(x) { return geometry(this.kind,this.height,x); }
    sAtX(x) {
      if(x<=this.minX) return x-this.minX-this.origin;
      if(x>=this.maxX) return this.arc.at(-1)+x-this.maxX-this.origin;
      const u=(x-this.minX)/this.dx, i=Math.floor(u), t=u-i;
      return this.arc[i]*(1-t)+this.arc[i+1]*t-this.origin;
    }
    atS(s) {
      const a=s+this.origin;
      let x;
      if(a<=0) x=this.minX+a;
      else if(a>=this.arc.at(-1)) x=this.maxX+a-this.arc.at(-1);
      else {
        let lo=0, hi=this.arc.length-1;
        while(hi-lo>1) { const mid=(lo+hi)>>1; if(this.arc[mid]<=a) lo=mid; else hi=mid; }
        x=this.minX+(lo+(a-this.arc[lo])/(this.arc[hi]-this.arc[lo]))*this.dx;
      }
      const g=this.atX(x), norm=Math.hypot(1,g.slope);
      return {x,...g,tx:1/norm,ty:g.slope/norm,curvature:g.second/(norm*norm*norm)};
    }
  }
  function baseAcceleration(track,s,settings,input) {
    return (input.motor || 0)*settings.motor - settings.gravity*track.atS(s).ty;
  }
  function acceleration(track,s,v,settings,input) {
    const a=baseAcceleration(track,s,settings,input);
    if(!input.brake) return a;
    if(Math.abs(v)<1e-10) return Math.abs(a)<=settings.brake ? 0 : a-Math.sign(a)*settings.brake;
    return a-Math.sign(v)*settings.brake;
  }
  function rk(track,s,v,dt,settings,input,brakeSign) {
    const a=q=>baseAcceleration(track,q,settings,input)-(input.brake ? settings.brake*brakeSign : 0);
    const a1=a(s), v2=v+a1*dt/2, a2=a(s+v*dt/2);
    const v3=v+a2*dt/2, a3=a(s+v2*dt/2);
    const v4=v+a3*dt, a4=a(s+v3*dt);
    return {s:s+dt/6*(v+2*v2+2*v3+v4),v:v+dt/6*(a1+2*a2+2*a3+a4)};
  }
  class Simulation {
    constructor(track,settings={},x=6,v=0) {
      this.track=track; this.settings={gravity:9.81,motor:2,brake:6,...settings};
      this.s=track.sAtX(x); this.startS=this.s; this.v=v; this.t=0; this.distance=0; this.a=0;
    }
    step(dt,input={motor:0,brake:false}) {
      const s0=this.s, v0=this.v, base=baseAcceleration(this.track,s0,this.settings,input);
      this.a=acceleration(this.track,s0,v0,this.settings,input);
      if(input.brake && Math.abs(v0)<1e-10 && Math.abs(base)<=this.settings.brake) {
        this.v=0; this.t+=dt; this.a=0; return;
      }
      const sign=Math.abs(v0)>1e-10 ? Math.sign(v0) : Math.sign(base);
      let end=rk(this.track,s0,v0,dt,this.settings,input,sign);
      if(v0*end.v<0) {
        // Locate the reversal/stop inside this step. This also keeps distance
        // correct when a turning point falls between two simulation samples.
        let lo=0, hi=dt;
        for(let i=0;i<32;i++) { const mid=(lo+hi)/2; if(rk(this.track,s0,v0,mid,this.settings,input,sign).v*v0>0) lo=mid; else hi=mid; }
        const eventTime=(lo+hi)/2, at=rk(this.track,s0,v0,eventTime,this.settings,input,sign);
        this.distance+=Math.abs(at.s-s0); this.s=at.s; this.v=0; this.t+=eventTime;
        const remaining=dt-eventTime;
        if(remaining>1e-12) this.step(remaining,input);
        return;
      }
      this.s=end.s; this.v=Math.abs(end.v)<1e-11 ? 0 : end.v;
      this.distance+=Math.abs(this.s-s0); this.t+=dt;
      this.a=acceleration(this.track,this.s,this.v,this.settings,input);
    }
    snapshot(input={motor:0,brake:false}) {
      const p=this.track.atS(this.s), a=acceleration(this.track,this.s,this.v,this.settings,input);
      return {t:this.t,s:this.s,x:p.x,y:p.y,v:this.v,speed:Math.abs(this.v),distance:this.distance,displacement:this.s-this.startS,a,
        vx:this.v*p.tx,vy:this.v*p.ty,
        ax:a*p.tx-this.v*this.v*p.curvature*p.ty,ay:a*p.ty+this.v*this.v*p.curvature*p.tx};
    }
  }
  const targetSpeed=t=>t<2 ? 2*t : t<5 ? 4 : t<7 ? 2*(7-t) : 0;
  const api={Track,Simulation,geometry,acceleration,targetSpeed,clamp};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MotionPhysics=api;
})(typeof globalThis==='undefined'?this:globalThis);
