const GOLD = '#ffd68b', CYAN = '#7ee2ef', INK = '#0b1727', WHITE = '#f4f3ed', SOFT = '#b8c9d4';
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = n => { n = clamp(n); return n*n*(3-2*n); };
const lerp = (a,b,t) => a + (b-a)*t;
const traitValue = (e,k) => (e?.genes?.[k] || [0,0]).reduce((a,b)=>a+b,0);
const gene = (e,k) => { const letter = {horns:'H', claws:'K', fur:'F'}[k]; return (e?.genes?.[k] || [0,0]).map(v=>v ? letter : letter.toLowerCase()); };

/** A magnified teaching model. Nimbles are fictional dual-mode organisms. */
export class ReproductionView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.elapsed = 0;
    this.duration = 10;
    this._active = false;
    this.done = false;
    this.mode = 'sexual';
    this.stage = '';
  }
  get active() { return this._active; }
  start(mode, parentA, parentB, child, onComplete) {
    this.mode = mode === 'asexual' ? 'asexual' : 'sexual';
    this.parentA = parentA; this.parentB = parentB; this.child = child;
    this.onComplete = typeof onComplete === 'function' ? onComplete : ()=>{};
    this.elapsed = 0; this.done = false; this._active = true;
    this.draw();
  }
  update(dt) {
    if (!this._active) return;
    this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, Number(dt)||0));
    if (this.elapsed >= this.duration) this.finish();
  }
  finish() {
    if (this.done) return;
    this.elapsed = this.duration; this.done = true; this._active = false;
    const callback = this.onComplete; this.onComplete = null;
    callback?.(this.child);
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const w = Math.max(280, bounds.width || 680), h = Math.max(300, bounds.height || 470);
    const dpr = Math.min(1.5, globalThis.devicePixelRatio || 1);
    if (this.canvas.width !== Math.round(w*dpr) || this.canvas.height !== Math.round(h*dpr)) {
      this.canvas.width = Math.round(w*dpr); this.canvas.height = Math.round(h*dpr);
    }
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.w = w; this.h = h;
  }
  text(text,x,y,size=16,color=WHITE,align='center',weight=400) {
    const c=this.ctx; c.font=`${weight} ${size}px system-ui, sans-serif`;
    c.textAlign=align; c.textBaseline='middle'; c.fillStyle=color; c.fillText(text,x,y);
  }
  wrap(text,x,y,width,size=16,color=SOFT,line=22) {
    const c=this.ctx; c.font=`400 ${size}px system-ui,sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=color;
    const words=text.split(' '), lines=[]; let s='';
    for (const word of words) { const test=s?`${s} ${word}`:word; if(c.measureText(test).width>width&&s){lines.push(s);s=word;}else s=test; }
    if(s)lines.push(s); lines.forEach((v,i)=>c.fillText(v,x,y+i*line)); return lines.length*line;
  }
  round(x,y,w,h,r,fill,stroke) {const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  chromosome(x,y,size,color,angle=0) {
    const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle=color;c.lineWidth=size*.26;c.lineCap='round';c.beginPath();c.moveTo(-size*.35,-size*.5);c.lineTo(size*.35,size*.5);c.moveTo(size*.35,-size*.5);c.lineTo(-size*.35,size*.5);c.stroke();c.restore();
  }
  nucleus(x,y,r,color,alpha=1) {
    const c=this.ctx;c.save();c.globalAlpha=alpha;const grad=c.createRadialGradient(x-r*.2,y-r*.2,0,x,y,r);grad.addColorStop(0,color+'77');grad.addColorStop(1,color+'15');c.fillStyle=grad;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=1.5;c.stroke();c.strokeStyle=color;c.lineWidth=Math.max(2,r*.12);c.lineCap='round';c.beginPath();c.moveTo(x-r*.28,y-r*.33);c.lineTo(x-r*.12,y+r*.3);c.moveTo(x+r*.18,y-r*.25);c.lineTo(x+r*.32,y+r*.2);c.stroke();c.restore();
  }
  egg(x,y,r,stage=0) {
    const c=this.ctx,t=this.elapsed;
    c.save();
    const halo=c.createRadialGradient(x,y,r*.7,x,y,r*1.28);halo.addColorStop(0,'#ffcba822');halo.addColorStop(.72,'#ffcba814');halo.addColorStop(1,'#ffcba800');c.fillStyle=halo;c.beginPath();c.arc(x,y,r*1.28,0,Math.PI*2);c.fill();
    c.strokeStyle=stage>1?'#8cebe0':'#ffe0b8';c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.strokeStyle='#d6a7ac88';c.lineWidth=6;c.beginPath();c.arc(x,y,r*.91,0,Math.PI*2);c.stroke();
    const body=c.createRadialGradient(x-r*.32,y-r*.3,r*.05,x,y,r*.9);body.addColorStop(0,'#eeb99e');body.addColorStop(.55,'#bb8190');body.addColorStop(1,'#775f82');c.fillStyle=body;c.beginPath();c.arc(x,y,r*.86,0,Math.PI*2);c.fill();
    for(let i=0;i<26;i++){const a=i*2.399+Math.sin(t*.3+i)*.05,d=(.28+((i*17)%57)/100)*r;c.fillStyle=i%3?'#ffdeb044':'#80669666';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,2+(i%3),0,Math.PI*2);c.fill();}
    for(let i=0;i<44;i++){const a=i*Math.PI*2/44;c.fillStyle='#ffe7c366';c.beginPath();c.arc(x+Math.cos(a)*r,y+Math.sin(a)*r,1.5,0,Math.PI*2);c.fill();}
    c.restore();
  }
  sperm(x,y,angle,scale,phase,alpha=1) {
    const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
    c.strokeStyle=CYAN;c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(-8,0);for(let q=0;q<=46;q+=2){c.lineTo(-8-q,Math.sin(q*.22-phase*8)*Math.min(7,q*.22));}c.stroke();
    c.strokeStyle='#d5fbff';c.lineWidth=3;c.beginPath();c.moveTo(-8,0);c.lineTo(-16,0);c.stroke();
    c.fillStyle='#abeaf5';c.beginPath();c.ellipse(0,0,9,5.4,0,0,Math.PI*2);c.fill();c.fillStyle='#4e9eb9';c.beginPath();c.ellipse(-2,0,4,3.3,0,0,Math.PI*2);c.fill();c.fillStyle='#e5fdff';c.beginPath();c.ellipse(4,-1,3.5,2.2,0,0,Math.PI*2);c.fill();c.restore();
  }
  cells(x,y,r,phase) {
    const c=this.ctx;
    const split=smooth((phase-.05)/.95), four=smooth((phase-1.12)/.85);
    c.strokeStyle='#ffdba9aa';c.lineWidth=3;c.beginPath();c.arc(x,y,r*1.1,0,Math.PI*2);c.stroke();
    const spots=four>0 ? [[-1,-1],[1,-1],[-1,1],[1,1]] : [[-1,0],[1,0]];
    const rad=four>0?lerp(r*.65,r*.46,four):lerp(r*.91,r*.61,split);
    for(let i=0;i<spots.length;i++){
      const [dx,dy]=spots[i],cx=x+dx*r*.48*split,cy=y+dy*r*.48*four;
      const g=c.createRadialGradient(cx-rad*.25,cy-rad*.25,0,cx,cy,rad);g.addColorStop(0,'#e6bda6');g.addColorStop(1,'#977b9c');c.fillStyle=g;c.strokeStyle='#f7d8be';c.lineWidth=2;c.beginPath();c.arc(cx,cy,rad,0,Math.PI*2);c.fill();c.stroke();
      this.nucleus(cx,cy,rad*.32,'#a2eeea',.9);
    }
  }
  creature(x,y,r) {
    const c=this.ctx;const fur=traitValue(this.child,'fur'),horns=traitValue(this.child,'horns'),claws=traitValue(this.child,'claws'),coat=traitValue(this.child,'coat');
    c.save();c.translate(x,y);const bob=Math.sin(this.elapsed*6)*2;c.translate(0,bob);
    c.strokeStyle=['#d6a067','#a0bc8a','#bedee4'][coat]||'#a0bc8a';c.lineWidth=8+fur*3;c.lineCap='round';c.beginPath();c.moveTo(-r*.7,r*.1);c.quadraticCurveTo(-r*1.4,-r*.1,-r*1.2,-r*.7);c.stroke();
    const body=c.createRadialGradient(-r*.3,-r*.4,0,0,0,r);body.addColorStop(0,['#f4c487','#bfdaa0','#d8f3ec'][coat]||'#bfdaa0');body.addColorStop(1,['#c68e58','#7f9d69','#91b6c0'][coat]||'#7f9d69');c.fillStyle=body;c.strokeStyle='#e8e6bc';c.lineWidth=2;c.beginPath();c.ellipse(0,0,r*.84,r*.62,0,0,Math.PI*2);c.fill();
    if(fur){c.strokeStyle='#e4ebc3';c.lineWidth=2;for(let i=0;i<13;i++){let a=Math.PI+i*Math.PI/12;c.beginPath();c.moveTo(Math.cos(a)*r*.78,Math.sin(a)*r*.58);c.lineTo(Math.cos(a)*(r*.85+fur*3),Math.sin(a)*(r*.65+fur*3));c.stroke();}}
    for(const dx of [-.44,.4]){c.fillStyle='#718363';c.beginPath();c.ellipse(dx*r,r*.58,r*.16,r*.28,-.2,0,Math.PI*2);c.fill();if(claws){c.strokeStyle='#fff0cb';c.lineWidth=2.5;for(let j=0;j<3;j++){c.beginPath();c.moveTo(dx*r-7+j*5,r*.77);c.lineTo(dx*r-7+j*5,r*.8+claws*5);c.stroke();}}}
    c.fillStyle='#9aad81';c.beginPath();c.ellipse(r*.35,-r*.64,r*.16,r*.35,.5,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(-r*.3,-r*.64,r*.16,r*.35,-.5,0,Math.PI*2);c.fill();
    if(horns){c.fillStyle='#fff0c8';for(const dx of [-.43,.43]){c.beginPath();c.moveTo(r*dx-5,-r*.44);c.quadraticCurveTo(r*dx-15,-r*(.8+horns*.15),r*dx+4,-r*(.8+horns*.25));c.quadraticCurveTo(r*dx-2,-r*.66,r*dx+5,-r*.44);c.fill();}}
    c.fillStyle='#152934';for(const dx of [-.3,.3]){c.beginPath();c.ellipse(dx*r,-r*.12,r*.08,r*.12,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(dx*r+1,-r*.16,2,0,Math.PI*2);c.fill();c.fillStyle='#152934';}c.fillStyle='#725b64';c.beginPath();c.ellipse(0,r*.11,r*.1,r*.07,0,0,Math.PI*2);c.fill();c.restore();
  }
  inheritance(y) {
    const {w}=this,c=this.ctx, sexual=this.mode==='sexual';
    const gap=10, margin=16, card=(w-margin*2-gap*2)/3;
    ['horns','claws','fur'].forEach((k,i)=>{
      const x=margin+i*(card+gap),a=gene(this.parentA,k),b=gene(this.parentB,k),ch=gene(this.child,k);
      this.round(x,y,card,82,10,'#102338','#345061');
      this.text(k[0].toUpperCase()+k.slice(1),x+card/2,y+17,16,SOFT,'center',600);
      if(sexual){
        const mid=x+card/2;this.text(ch[0],mid-11,y+43,25,GOLD,'center',700);this.text(ch[1],mid+11,y+43,25,CYAN,'center',700);
        this.text(`${a.join('')} + ${b.join('')}`,mid,y+66,16,SOFT);
      }else{this.text(ch.join(''),x+card/2,y+43,25,GOLD,'center',700);this.text(`Copy of ${a.join('')}`,x+card/2,y+66,16,SOFT);}
    });
  }
  draw() {
    this.resize();const c=this.ctx,{w,h}=this,t=this.elapsed,sexual=this.mode==='sexual';
    c.clearRect(0,0,w,h);const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b1727');bg.addColorStop(1,'#142b3e');c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let i=0;i<35;i++){const x=(i*97.9+Math.sin(t*.1+i)*8)%w,y=(i*63.3+t*(i%3+1))%h;c.fillStyle=i%3?'#89d8e414':'#ffd68b18';c.beginPath();c.arc(x,y,1+i%2,0,Math.PI*2);c.fill();}
    const narrow=w<460, font=narrow?18:21;
    let title,detail;
    if(sexual){
      if(t<2.7){title='Gametes meet';detail='A small sperm swims toward one large egg.';}
      else if(t<4.2){title='Fertilization';detail='One sperm fuses with the egg. Other sperm cannot enter.';}
      else if(t<5.9){title='One fertilized egg: the zygote';detail='Genetic material from both parents combines.';}
      else if(t<8.7){title='Growth begins by mitosis';detail='One cell divides into 2 cells, then 4 cells.';}
      else {title='A new Nimble';detail='One allele per gene came from each parent.';}
    }else{
      if(t<2.5){title='Asexual reproduction';detail='One parent copies its DNA. No sperm or egg joins.';}
      else if(t<5.4){title='Mitosis separates DNA copies';detail='Each new nucleus receives a matching set of DNA.';}
      else if(t<8.4){title='The offspring separates';detail='This model uses budding to form a new individual.';}
      else {title='A clonal offspring';detail='Alleles match the parent, except for possible mutation.';}
    }
    this.stage=title;
    this.text(title,w/2,28,font,WHITE,'center',700);
    this.wrap(detail,w/2,59,w-40,16,SOFT,21);
    const cardsY=h-122, top=narrow?105:96,bottom=cardsY-24,cy=(top+bottom)/2;
    const radius=Math.min(w*.17,(bottom-top)*.40,88),cx=sexual?w*.58:w*.5;
    if(sexual){
      if(t<5.9){
        this.egg(cx,cy,radius,t>4.2?2:0);
        const approach=smooth(t/3.15),join=smooth((t-3.15)/.95);
        for(let i=0;i<7;i++){
          const a= Math.PI+(i-3)*.27,startX=cx+Math.cos(a)*(radius+140+i*8),startY=cy+Math.sin(a)*(radius+110);
          const endX=cx+Math.cos(a)*(radius+16),endY=cy+Math.sin(a)*(radius+16);
          const x=lerp(startX,endX,approach),y=lerp(startY,endY,approach)+Math.sin(t*3+i)*4*(1-approach);
          if(i===3){if(t<4.2)this.sperm(lerp(x,cx-radius*.48,join),y,0,.8,t,1-join*.9);}else if(t<4.7)this.sperm(x,y,Math.atan2(cy-y,cx-x),.64,t+i,t>3.3?.30: .7);
        }
        if(t<3.6){this.text('Sperm',Math.max(48,cx-radius-105),cy+radius*.8,16,CYAN);this.text('Egg',cx,cy-radius-17,16,GOLD);}
        const combine=smooth((t-4.2)/1.5);
        this.nucleus(cx+lerp(radius*.25,0,combine),cy, radius*.25,GOLD,1-combine*.4);
        if(t>3.8)this.nucleus(cx+lerp(-radius*.46,0,combine),cy,radius*.21,CYAN,smooth((t-3.8)/.5));
        if(t>4.2){c.strokeStyle='#9ce8e4';c.lineWidth=2;c.beginPath();c.arc(cx,cy,radius+8,0,Math.PI*2*smooth((t-4.2)/.5));c.stroke();}
      }else if(t<8.7){this.cells(cx,cy,radius,(t-5.9)/1.22);this.text(t<7.15?'1 → 2 cells':'2 → 4 cells',cx,cy+radius+22,16,'#b9ece7');}
      else {this.creature(w/2,cy,radius*.74);this.text('Fertilization → embryo → growth',w/2,cy+radius+17,16,CYAN);}
    }else{
      const separation=smooth((t-2.4)/3),bud=smooth((t-5.4)/2.7);
      if(t<8.4){
        const bodyRadius=radius*.98;this.egg(cx-radius*.15,cy,bodyRadius,0);
        if(t<2.5){this.nucleus(cx-radius*.15,cy,radius*.35,GOLD);for(let i=0;i<3;i++){this.chromosome(cx+(i-1)*radius*.2,cy+radius*.18,radius*.15,GOLD,t*.1);}}
        else{
          this.nucleus(cx-radius*.15-separation*radius*.30,cy,radius*.23,GOLD);
          this.nucleus(cx-radius*.15+separation*radius*.65,cy,radius*.23,GOLD);
          c.strokeStyle='#98d5d4';c.lineWidth=1;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(cx-radius*.65,cy+i*7);c.quadraticCurveTo(cx,cy+i*15,cx+radius*.6,cy+i*7);c.stroke();}
          if(bud>0){c.fillStyle='#a790a4';c.strokeStyle='#ffdbaf';c.lineWidth=3;c.beginPath();c.ellipse(cx+radius*.65+bud*radius*.45,cy,radius*(.25+bud*.26),radius*(.3+bud*.23),0,0,Math.PI*2);c.fill();c.stroke();this.nucleus(cx+radius*.65+bud*radius*.45,cy,radius*.17,GOLD);}
        }
        this.text(t<2.5?'DNA is copied':'Matching DNA copies separate',w/2,cy+radius+22,16,GOLD);
      }else{this.creature(w/2,cy,radius*.74);this.text('One parent · no fertilization',w/2,cy+radius+17,16,GOLD);}
    }
    this.inheritance(cardsY);
    this.text(sexual?'Gold: egg parent · Cyan: sperm parent':'DNA copy model · rare mutations may occur',w/2,h-26,16,SOFT);
    c.fillStyle='#284358';c.fillRect(0,h-5,w,5);c.fillStyle=sexual?CYAN:GOLD;c.fillRect(0,h-5,w*clamp(t/this.duration),5);
  }
}
