/** Movable tool windows. Coordinates stay inside the workspace/viewport. */
export function initPanels(){
 const workspace=document.getElementById('workspace');
 if(!workspace||workspace.dataset.panelsReady)return;
 workspace.dataset.panelsReady='true';
 const panels=[...document.querySelectorAll('[data-floating-panel]')];
 let z=10,resizeFrame=0;
 const clamp=(n,lo,hi)=>Math.min(Math.max(n,lo),Math.max(lo,hi));
 const visible=panel=>panel.tagName==='DIALOG'?panel.open:!panel.hidden&&panel.getBoundingClientRect().width>0;
 const bounds=panel=>panel.tagName==='DIALOG'?{left:0,top:0,width:innerWidth,height:innerHeight}:workspace.getBoundingClientRect();
 function place(panel,x,y){
  const b=bounds(panel),r=panel.getBoundingClientRect(),inset=panel.tagName==='DIALOG'?6:4;
  x=clamp(x,inset,b.width-r.width-inset);y=clamp(y,inset,b.height-r.height-inset);
  panel.style.left=`${Math.round(x)}px`;panel.style.top=`${Math.round(y)}px`;
  panel.style.right='auto';panel.style.bottom='auto';
  if(panel.tagName==='DIALOG'){panel.style.position='fixed';panel.style.margin='0';}
  panel.dataset.positioned='true';
 }
 function reset(panel){
  for(const key of ['left','top','right','bottom','margin','position','z-index'])panel.style.removeProperty(key);
  delete panel.dataset.positioned;
 }
 function front(panel){if(panel.tagName!=='DIALOG')panel.style.zIndex=String(++z);}
 function keepInBounds(){
  resizeFrame=0;
  for(const panel of panels){if(!visible(panel)||!panel.dataset.positioned)continue;const b=bounds(panel),r=panel.getBoundingClientRect();place(panel,r.left-b.left,r.top-b.top);}
 }
 const scheduleBounds=()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(keepInBounds);};
 for(const panel of panels){
  const handle=panel.querySelector('[data-panel-handle]');if(!handle)continue;
  handle.title='Drag to move. Arrow keys move this panel; Home resets its position.';
  let drag=null;
  handle.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button,input,select,a'))return;
   const r=panel.getBoundingClientRect(),b=bounds(panel);front(panel);
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left-b.left,top:r.top-b.top};
   handle.setPointerCapture(event.pointerId);panel.classList.add('panel-dragging');event.preventDefault();
  });
  handle.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   place(panel,drag.left+event.clientX-drag.x,drag.top+event.clientY-drag.y);event.preventDefault();
  });
  const release=event=>{
   if(!drag||event.pointerId!==drag.id)return;
   if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
   drag=null;panel.classList.remove('panel-dragging');
  };
  handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);
  handle.addEventListener('lostpointercapture',()=>{drag=null;panel.classList.remove('panel-dragging');});
  handle.addEventListener('keydown',event=>{
   if(event.target!==handle)return;
   if(event.key==='Home'){reset(panel);event.preventDefault();return;}
   const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
   if(!direction)return;
   const r=panel.getBoundingClientRect(),b=bounds(panel),distance=event.shiftKey?30:10;
   front(panel);place(panel,r.left-b.left+direction[0]*distance,r.top-b.top+direction[1]*distance);event.preventDefault();
  });
  panel.addEventListener('pointerdown',()=>front(panel));
 }
 const byId=id=>document.getElementById(id);
 const showSettings=()=>{byId('settingsPanel').hidden=false;byId('controls').open=true;front(byId('settingsPanel'));scheduleBounds();};
 byId('settingsBtn').addEventListener('click',()=>byId('settingsPanel').hidden?showSettings():byId('settingsPanel').hidden=true);
 document.querySelectorAll('[data-open-settings]').forEach(button=>button.addEventListener('click',showSettings));
 byId('closeSettings').addEventListener('click',()=>{byId('settingsPanel').hidden=true;});
 byId('closeSteps').addEventListener('click',()=>{byId('steps').hidden=true;byId('stepsBtn').textContent='Show steps';});
 function hideToggle(checkbox){const input=byId(checkbox);input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}
 byId('closePlotPanel').addEventListener('click',()=>hideToggle('graphToggle'));
 byId('closeComparePanel').addEventListener('click',()=>hideToggle('charts'));
 byId('closeAcceleration').addEventListener('click',()=>hideToggle('accelerations'));
 byId('resetLayoutBtn').addEventListener('click',()=>panels.forEach(reset));
 for(const [childId,panelId]of[['steps','stepsWindow'],['accelerationReadout','accelerationWindow']]){
  const child=byId(childId),panel=byId(panelId);
  const sync=()=>{panel.hidden=child.hidden;if(!panel.hidden){front(panel);scheduleBounds();}};
  new MutationObserver(sync).observe(child,{attributes:true,attributeFilter:['hidden']});sync();
 }
 new ResizeObserver(scheduleBounds).observe(workspace);
 const panelSizes=new ResizeObserver(scheduleBounds);panels.forEach(panel=>panelSizes.observe(panel));
 window.addEventListener('resize',scheduleBounds);
}
