from pathlib import Path
import json, math, re, html, os
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
FONT_CANDIDATES=[
 Path(os.environ.get('PHYSICS_PACKET_FONT_DIR','/nonexistent')),
 Path('/usr/share/fonts/truetype/liberation'),
 Path('/usr/share/fonts/truetype/liberation2'),
 Path('/usr/share/fonts/truetype/msttcorefonts'),
 Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/opt/codex/runtimes/codex-primary-runtime'))/'dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype',
]
def font_file(filename):
 for directory in FONT_CANDIDATES:
  candidate=directory/filename
  if candidate.is_file():return str(candidate)
 raise FileNotFoundError(f'Missing {filename}. Install Liberation Serif, Liberation Sans Narrow, and Liberation Mono, or set PHYSICS_PACKET_FONT_DIR to a folder containing them.')
for name,file in [('Body','LiberationSerif-Regular.ttf'),('BodyBold','LiberationSerif-Bold.ttf'),('BodyItalic','LiberationSerif-Italic.ttf'),('Head','LiberationSansNarrow-Bold.ttf'),('HeadItalic','LiberationSansNarrow-BoldItalic.ttf'),('Sans','LiberationSansNarrow-Regular.ttf'),('Mono','LiberationMono-Regular.ttf')]:
 pdfmetrics.registerFont(TTFont(name,font_file(file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
W,H=612,792;M=45;CW=W-2*M;GAP=25;COL=(CW-GAP)/2
APP='https://gabrielw1005.github.io/physics-packet-lab/'

def clean(t):
 return str(t).replace('−','-').replace('–','-').replace('—',' - ').replace('‑','-').replace('’',"'").replace('“','"').replace('”','"')
def esc(t):return html.escape(clean(t))
def para(c,t,x,y,w,size=12,leading=None,font='Body'):
 st=ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.24,textColor=black)
 t=re.sub(r' {2,}',lambda m:'&nbsp;'*len(m.group()),t)
 p=Paragraph(t,st);_,hh=p.wrap(w,1000);p.drawOn(c,x,y-hh);return y-hh

def text(c,t,x,y,size=12,font='Body',align='left'):
 c.setFillColor(black);c.setFont(font,size)
 getattr(c,{'left':'drawString','center':'drawCentredString','right':'drawRightString'}[align])(x,y,clean(t))
def heading(c,t,x,y,size=14):text(c,t,x,y,size,'Head')
def header(c,label,title,page,total):
 text(c,label,M,755,15,'Head');text(c,f'GRADE 8   •   {page} / {total}',W-M,756,10,'Head','right')
 c.setStrokeColor(black);c.setLineWidth(.6);c.line(M,747,W-M,747)
 text(c,title,M,722,19,'HeadItalic')
 return 703

def footer(c,series,page,total,app=False):
 if app:
  text(c,APP,M,28,8.5,'Sans');c.linkURL(APP,(M,24,W-M,36),relative=0)
 text(c,str(page),M,17,9,'Head');text(c,series,W-M,17,9,'Sans','right')

def arrow(c,x1,y1,x2,y2,width=1.4,head=6):
 c.setStrokeColor(black);c.setFillColor(black);c.setLineWidth(width);c.line(x1,y1,x2,y2)
 a=math.atan2(y2-y1,x2-x1);path=c.beginPath();path.moveTo(x2,y2)
 path.lineTo(x2-head*math.cos(a-.45),y2-head*math.sin(a-.45));path.lineTo(x2-head*math.cos(a+.45),y2-head*math.sin(a+.45));path.close();c.drawPath(path,fill=1,stroke=0)

def frac(c,n,d,cx,y,size=13,w=None):
 # y is fraction bar position.
 fw=w or max(pdfmetrics.stringWidth(clean(n),'Body',size),pdfmetrics.stringWidth(clean(d),'Body',size))+9
 text(c,n,cx,y+5,size,align='center');text(c,d,cx,y-size-3,size,align='center')
 c.setLineWidth(.6);c.line(cx-fw/2,y,cx+fw/2,y);return fw

def cart(c,x,y,w=44,h=23,label=''):
 c.setStrokeColor(black);c.setFillColor(white);c.setLineWidth(.8);c.rect(x,y,w,h,fill=0,stroke=1)
 c.circle(x+10,y-4,4,fill=0,stroke=1);c.circle(x+w-10,y-4,4,fill=0,stroke=1)
 if label:text(c,label,x+w/2,y+7,11,align='center')
def point(c,x,y,r=2.5):c.circle(x,y,r,fill=1,stroke=0)

def mini_graph(c,g,x,y,w,h):
 left=x+30;right=x+w-7;bottom=y-h+25;top=y-18
 xx=g['x'];yy=g['y'];xmin=0;xmax=max(xx);ymin=min(0,min(yy));ymax=max(yy)
 if ymax==ymin:ymax=ymin+1
 X=lambda v:left+(v-xmin)/(xmax-xmin)*(right-left)
 Y=lambda v:bottom+(v-ymin)/(ymax-ymin)*(top-bottom)
 c.setStrokeColor(Color(.72,.72,.72));c.setLineWidth(.35)
 for v in sorted(set(yy+[0])):
  c.line(left,Y(v),right,Y(v));text(c,str(v),left-5,Y(v)-3,9,'Sans','right')
 for v in sorted(set(xx)):
  c.setStrokeColor(Color(.72,.72,.72));c.line(X(v),bottom,X(v),top);text(c,str(v),X(v),bottom-12,9,'Sans','center')
 c.setStrokeColor(black);c.setLineWidth(.7);c.line(left,bottom,right,bottom);c.line(left,bottom,left,top)
 text(c,g['yLabel'],left,y-8,10,'Head');text(c,g['xLabel'],(left+right)/2,bottom-24,9,'Sans','center')
 c.setStrokeColor(black);c.setLineWidth(1.4)
 for i in range(len(xx)-1):c.line(X(xx[i]),Y(yy[i]),X(xx[i+1]),Y(yy[i+1]))
 for xv,yv in zip(xx,yy):point(c,X(xv),Y(yv),2)

def compact_table(c,tb,x,y,w):
 data=[[tb['headers'][0]]+[r[0] for r in tb['rows']],[tb['headers'][1]]+[r[1] for r in tb['rows']]]
 first=92;cols=[first]+[(w-first)/(len(data[0])-1)]*(len(data[0])-1)
 pp=[]
 for i,row in enumerate(data):
  pp.append([Paragraph(esc(v),ParagraphStyle('t',fontName='BodyBold' if j==0 else 'Body',fontSize=10.6,leading=12)) for j,v in enumerate(row)])
 t=Table(pp,colWidths=cols);t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),1),('RIGHTPADDING',(0,0),(-1,-1),1),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LINEBELOW',(0,0),(-1,0),.5,black)]))
 _,hh=t.wrap(w,1000);t.drawOn(c,x,y-hh);return y-hh

FORMULAS={
1:['<b>Distance</b> = add all path lengths.','<b>Displacement</b> = final position - initial position.'],
2:['<b>Average speed</b> = total distance ÷ total elapsed time.','<b>Distance</b> = speed × time.   Velocity is speed with direction.'],
3:['<b>a</b> = (v<sub>f</sub> - v<sub>i</sub>) ÷ Δt     <b>v<sub>f</sub></b> = v<sub>i</sub> + a × Δt     <b>Δt</b> = final time - initial time','v<sub>i</sub> = initial velocity; v<sub>f</sub> = final velocity. Right/east is positive.'],
4:['<b>Slope</b> = change in vertical value ÷ change in time.','Distance-time slope gives average speed for that interval. For straight motion in the<br/>positive direction, speed-time slope gives acceleration.'],
5:['<b>Weight</b> = mass × g. Use g = 10 m/s² on Earth.','At steady velocity, <b>F<sub>net</sub> = 0</b>. Static friction adjusts up to its maximum.'],
6:['<b>F<sub>net</sub></b> = rightward forces - leftward forces. Choose right as positive.','<b>F<sub>net</sub> = 0</b> means constant velocity, which can include rest.'],
7:['<b>F<sub>net</sub> = ma</b>       <b>a = F<sub>net</sub> ÷ m</b>       <b>m = F<sub>net</sub> ÷ a</b>','Force: N     Mass: kg     Acceleration: m/s²'],
8:['<b>Momentum: p = mv.</b> For carts that stick: <b>v<sub>f</sub> = (m<sub>1</sub>v<sub>1</sub> + m<sub>2</sub>v<sub>2</sub>) ÷ (m<sub>1</sub> + m<sub>2</sub>).</b>','Use this collision model when external forces have negligible effect during collision.<br/>A third-law force pair is equal and opposite and acts on two different objects.']
}

def packet(data):
 fn=OUT/'Physical_Science_Packet.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Practice Packet')
 for sec in data['sections']:
  n=sec['number'];y=header(c,'Physical Science Practice',sec['title'],n,8)
  for f in FORMULAS[n]:y=para(c,f,M,y,CW,11.5,14.5)-4
  heading(c,'Math Skills',M,y-10,12.5);wy=y-28
  for i,p in enumerate(sec['warmups']):
   prompt=re.sub(r'\.\s*[A-Za-z]\s*=\s*_+', '.', p['prompt'])
   prompt=re.sub(r'\s*=\s*_+', '', prompt).strip()
   prompt=re.sub(r'_+','',prompt)
   para(c,f'<b>{p["id"]}.</b> {esc(prompt)}',M+i*(CW/3),wy,CW/3-12,11.8,14.7)
  heading(c,'Practice',M,wy-59,12.5)
  start=wy-76;bottom=63;rowh=(start-bottom)/2
  for i,p in enumerate(sec['problems']):
   x=M+(i%2)*(COL+GAP);py=start-(i//2)*rowh
   py=para(c,f'<b>{p["id"]}. {esc(p["title"])}</b>',x,py,COL,11.9,14.7)-6
   py=para(c,esc(p['prompt']),x,py,COL,12,15)-8
   if p.get('table') and p['id']!='P14':py=compact_table(c,p['table'],x,py,COL)
   if p['id']=='P14':mini_graph(c,p['graph'],x,py,COL,108);py-=108
   low=start-(i//2+1)*rowh+9
   if py<low:print('OVERFLOW packet',p['id'],py,low)
  footer(c,'Motion and Forces',n,8,True);c.showPage()
 c.save();return fn

def formula_guide():
 fn=OUT/'Physics_Quick_Guide.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Quick Guide')
 header(c,'Quick Guide','Describing Motion',1,2)
 # Motion path
 heading(c,'1. Distance and displacement',M,691,13)
 para(c,'<b>Distance:</b> the whole path.  <b>Displacement:</b> finish - start.',M,679,CW,12)
 x0=M+35;x1=M+220;xf=M+151;y=629
 arrow(c,x0,y,x1,y);text(c,'8 m east',M+127,y+9,11,align='center')
 arrow(c,x1,y-24,xf,y-24);text(c,'3 m west',M+192,y-40,11,align='center')
 point(c,x0,y);text(c,'start: 0 m',x0,y-17,10,align='center');point(c,xf,y-24);text(c,'finish: +5 m',xf,y-55,10,align='center')
 para(c,'Distance = 8 + 3 = <b>11 m</b><br/>Displacement = 5 - 0 = <b>5 m east</b>',M+290,636,230,12,17)
 # Speed
 heading(c,'2. Speed and velocity',M,557,13)
 text(c,'average speed =',M,530,12);frac(c,'total distance','total elapsed time',M+157,529,12)
 para(c,'Example: 150 m in 100 s<br/>150 ÷ 100 = <b>1.5 m/s</b>',M+289,541,230,12,17)
 text(c,'Distance = speed × time',M,488,12,'BodyBold');text(c,'Time = distance ÷ speed',M+280,488,12,'BodyBold')
 arrow(c,M+20,465,M+90,465);text(c,'2 m/s east',M+118,461,11)
 arrow(c,M+330,465,M+260,465);text(c,'2 m/s west',M+347,461,11)
 para(c,'Same speed. Different velocities because direction is different.',M,449,CW,12)
 # Acceleration
 heading(c,'3. Acceleration: a change in velocity',M,417,13)
 text(c,'a =',M,389,14,'BodyItalic');frac(c,'final velocity - initial velocity','elapsed time',M+132,389,12,223)
 para(c,'<b>Elapsed time = final time - initial time.</b><br/>From 2 s to 6 s: 6 - 2 = 4 s.',M+293,402,229,11.8,16)
 para(c,'Example: a cyclist goes east from 3 m/s to 9 m/s in 4 s.',M,361,CW,12)
 text(c,'1. Find the change: 9 - 3 = 6 m/s',M,333,12);text(c,'2. Divide: 6 ÷ 4 = 1.5 m/s² east',M+269,333,12)
 para(c,'v<sub>i</sub> = initial velocity; v<sub>f</sub> = final velocity. <b>v<sub>f</sub> = v<sub>i</sub> + a × elapsed time.</b><br/>Acceleration opposite velocity slows an object. A minus sign shows direction,<br/>not always slowing.',M,323,CW,11.7,15)
 # graphs
 heading(c,'4. Read the axes before reading the graph',M,262,13)
 mini_graph(c,{'x':[0,10,20],'y':[0,15,15],'xLabel':'Time (s)','yLabel':'Total distance (m)'},M,248,236,122)
 mini_graph(c,{'x':[0,2,4],'y':[1,3,5],'xLabel':'Time (s)','yLabel':'Speed (m/s)'},M+281,248,236,122)
 para(c,'Slope = speed. Flat means stopped.<br/>First 10 s: 15 ÷ 10 = <b>1.5 m/s</b>.',M,115,245,11.7,15)
 para(c,'For straight motion in the positive direction:<br/>(5 - 1) ÷ 4 = <b>1 m/s²</b>.',M+281,115,241,11.7,15)
 para(c,'A speed graph does not show direction. Constant speed can still include turning.',M,71,CW,11.5)
 footer(c,'Motion and Forces • Quick Guide',1,2);c.showPage()
 # Force page
 header(c,'Quick Guide','Forces and Momentum',2,2)
 heading(c,'1. Combine forces, then find acceleration',M,691,13)
 cart(c,M+89,627,65,29,'12 kg');arrow(c,M+89,642,M+53,642);text(c,'6 N left',M+56,659,11,align='center');arrow(c,M+154,642,M+262,642);text(c,'18 N right',M+207,659,11,align='center')
 para(c,'<b>F<sub>net</sub> = ma; a = F<sub>net</sub> ÷ m</b><br/><b>m = F<sub>net</sub> ÷ a</b><br/>1. F<sub>net</sub> = 18 - 6 = <b>12 N right</b>.<br/>2. a = 12 ÷ 12 = <b>1 m/s² right</b>.',M+290,677,230,11.8,16)
 para(c,'<b>Zero net force:</b> rest or constant velocity. <b>Inertia:</b> resistance to a change in motion.<br/>More mass means more inertia. Use net force, not just one push or pull.',M,603,CW,11.8,15)
 heading(c,'2. Gravity and friction',M,556,13)
 para(c,'<b>Weight = mass × g</b>     Earth: g ≈ 10 m/s²<br/>A 3 kg bag weighs 3 × 10 = <b>30 N</b>.<br/>Mass is measured in <b>kg</b>; weight in <b>N</b>.',M,541,290,12,17)
 c.setStrokeColor(black);c.rect(M+383,531,32,35,stroke=1,fill=0);arrow(c,M+399,531,M+399,493);text(c,'weight: 30 N',M+399,479,11,align='center')
 para(c,'Friction opposes sliding. Static friction adjusts to the push, up to its limit.<br/>A 7 N push on a resting crate is balanced by <b>7 N</b> of friction if its limit is higher.',M,462,CW,11.7,15)
 heading(c,'3. Action and reaction act on different objects',M,417,13)
 cart(c,M+73,360,56,29,'A');cart(c,M+129,360,56,29,'B')
 arrow(c,M+73,374,M+16,374);arrow(c,M+185,374,M+242,374)
 text(c,'40 N on A',M+44,399,10.7,align='center');text(c,'40 N on B',M+214,399,10.7,align='center')
 para(c,'During a push; ignore friction.<br/>Equal forces act on different carts.<br/>With equal net forces: lighter means<br/>more acceleration.',M+275,398,247,11.5,14)
 para(c,'<b>Turning at steady speed:</b> velocity changes direction. Net force points toward the<br/>center; tire-road static friction can supply this inward force.',M,336,CW,11.8,15)
 heading(c,'4. Momentum and carts that stick together',M,287,13)
 text(c,'p = mass × velocity',M,264,13,'BodyBold');text(c,'Momentum unit: kg·m/s',M+292,264,12)
 cart(c,M+17,212,49,25,'1 kg');arrow(c,M+67,226,M+113,226);text(c,'3 m/s',M+91,242,11,align='center');cart(c,M+142,212,49,25,'2 kg');text(c,'at rest',M+166,249,11,align='center')
 arrow(c,M+219,226,M+274,226);cart(c,M+315,212,80,25,'3 kg');arrow(c,M+396,226,M+450,226);text(c,'1 m/s',M+425,242,11,align='center')
 para(c,'When external forces have negligible effect during the brief collision:',M,188,CW,11.8)
 para(c,'1. Add momentum: (1 × 3) + (2 × 0) = <b>3 kg·m/s</b>.<br/>2. Add the masses: 1 + 2 = <b>3 kg</b>.<br/>3. Shared velocity = total momentum ÷ total mass = 3 ÷ 3 = <b>1 m/s right</b>.',M,165,CW,12,18)
 para(c,'<b>Every calculation:</b> formula → substitute → calculate → unit and direction.',M,82,CW,12)
 footer(c,'Motion and Forces • Quick Guide',2,2);c.showPage();c.save();return fn

def practice(c,items,y):
 text(c,'Practice:',M,y,12,'BodyBold')
 positions=[M+64,M+231,M+398] if len(items)==3 else [M+64,M+300]
 for item,x in zip(items,positions):text(c,item,x,y,12)

def math_guide():
 fn=OUT/'Math_Review_Guide.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Math Skills Review')
 header(c,'Math Skills','Numbers, Decimals, and Fractions',1,2)
 heading(c,'1. Negative numbers: move on the number line',M,692,13)
 left=M+35;right=W-M-35;yy=647
 arrow(c,left-10,yy,right+10,yy,1)
 for i in range(-5,6):
  xx=left+(i+5)/10*(right-left);c.setLineWidth(.6);c.line(xx,yy-4,xx,yy+4);text(c,str(i),xx,yy-18,10.5,align='center')
 xx=lambda v:left+(v+5)/10*(right-left)
 arrow(c,xx(2),yy+18,xx(-3),yy+18,1.4);text(c,'subtract 5: move left',xx(-.5),yy+29,11,align='center')
 para(c,'<b>2 - 5 = -3</b>     Subtracting a negative means add: <b>4 - (-3) = 4 + 3 = 7</b>.',M,610,CW,12)
 para(c,'Multiply/divide: same signs → positive; different signs → negative.<br/>(-3) × (-2) = 6        (-12) ÷ 3 = -4',M,585,CW,12,16)
 practice(c,['A. 9 + (-14)','B. 2 - (-5)','C. -18 ÷ 6'],535)
 heading(c,'2. Decimals: line up places; estimate the answer',M,507,13)
 text(c,'Subtract',M+10,483,11.5,'Head');text(c,'Multiply',M+186,483,11.5,'Head');text(c,'Divide',M+370,483,11.5,'Head')
 for s,yy in [('  6.00',457),('- 2.75',438),('  3.25',413)]:text(c,s,M+20,yy,13,'Mono')
 c.setLineWidth(.6);c.line(M+20,432,M+84,432)
 para(c,'1.2 × 0.4<br/>12 × 4 = 48<br/>Two decimal places:<br/><b>0.48</b>',M+186,467,160,12,17)
 para(c,'7.2 ÷ 0.6<br/>Shift both decimals:<br/>72 ÷ 6 = <b>12</b>',M+370,467,151,12,17)
 practice(c,['D. 5.4 - 1.85','E. 0.3 × 8','F. 4.5 ÷ 0.5'],374)
 heading(c,'3. Fractions are division',M,344,13)
 frac(c,'3','4',M+11,316,13,20);text(c,'= 3 ÷ 4 = 0.75',M+29,311,13)
 # fraction picture: three of four equal parts
 for i in range(4):
  c.setFillColor(Color(.78,.78,.78) if i<3 else white);c.setStrokeColor(black);c.rect(M+244+i*35,301,35,24,fill=1,stroke=1)
 text(c,'3 of 4 equal parts',M+314,286,11,align='center')
 text(c,'Add: use the same denominator.',M,274,12)
 text(c,'1/2 + 1/4 = 2/4 + 1/4 = 3/4',M+220,274,12)
 text(c,'Multiply tops and bottoms.',M,248,12);text(c,'(2/3) × (3/4) = 6/12 = 1/2',M+220,248,12)
 text(c,'Divide: flip the second fraction.',M,222,12);text(c,'(3/4) ÷ (1/2) = (3/4) × (2/1) = 1.5',M+220,222,12)
 para(c,'A fraction bar groups the entire top: <b>(9 - 3)/2 = 6/2 = 3</b>.',M,201,CW,12)
 practice(c,['G. 3/5 as a decimal','H. (9 - 3)/2'],165)
 text(c,'I. (1/2) × (2/3)',M+64,141,12);text(c,'J. (2/3) ÷ (1/3)',M+300,141,12)
 heading(c,'Check',M,100,12)
 para(c,'A -5; B 7; C -3; D 3.55; E 2.4; F 9; G 0.6; H 3; I 1/3; J 2.',M,88,CW,10.8)
 footer(c,'Motion and Forces • Math Review',1,2);c.showPage()
 # Math page2
 header(c,'Math Skills','Equations, Order, and Units',2,2)
 heading(c,'1. Solve an equation: do the same thing to both sides',M,692,13)
 text(c,'x + 7 = 19',M+91,655,15,'BodyBold','center');text(c,'4x = 18',M+361,655,15,'BodyBold','center')
 arrow(c,M+91,642,M+91,610,1);text(c,'subtract 7 from both sides',M+112,623,11.5)
 arrow(c,M+361,642,M+361,610,1);text(c,'divide both sides by 4',M+377,623,11.5)
 text(c,'x = 12',M+91,590,15,'BodyBold','center');text(c,'x = 4.5',M+361,590,15,'BodyBold','center')
 text(c,'Check: 12 + 7 = 19.',M+40,565,12);text(c,'Check: 4 × 4.5 = 18.',M+310,565,12)
 para(c,'Undo addition with subtraction. Undo multiplication with division.<br/>For x/5 = 3, multiply both sides by 5: <b>x = 15</b>.',M,544,CW,12,16)
 practice(c,['K. x + 8 = 15','L. 6x = 21','M. x/4 = 2.5'],494)
 heading(c,'2. Substitute, then follow the order',M,465,13)
 para(c,'Parentheses → exponents → multiply/divide → add/subtract.<br/>Work left to right within each multiplication/division or addition/subtraction step.',M,452,CW,11.5,14)
 text(c,'a =',M+5,392,15,'BodyItalic');frac(c,'2 - 8','3',M+62,395,14,46);arrow(c,M+103,391,M+148,391);frac(c,'-6','3',M+186,395,14,38);arrow(c,M+227,391,M+273,391);text(c,'-2',M+295,387,16,'BodyBold')
 para(c,'Do not enter 2 - 8 ÷ 3; that loses the parentheses.<br/>In acceleration, divide the change in velocity by the elapsed time.',M,374,CW,12,16)
 practice(c,['N. (4 - 10)/2','O. 3 + 0.5 × 8'],325)
 heading(c,'3. Convert units before calculating',M,295,13)
 text(c,'minutes',M+18,265,12,'BodyBold');arrow(c,M+80,269,M+153,269);text(c,'seconds',M+164,265,12,'BodyBold');text(c,'× 60',M+116,282,11,align='center')
 text(c,'grams',M+304,265,12,'BodyBold');arrow(c,M+347,269,M+419,269);text(c,'kilograms',M+430,265,12,'BodyBold');text(c,'÷ 1,000',M+383,282,11,align='center')
 text(c,'1.5 min × 60 = 90 s',M+19,236,12);text(c,'750 g ÷ 1,000 = 0.75 kg',M+304,236,12)
 para(c,'<b>1 km = 1,000 m.</b> For m/s, use meters and seconds. For F = ma, use kilograms.<br/><b>m/s²</b> means “meters per second, each second.” It describes acceleration.',M,214,CW,12,16)
 practice(c,['P. 2.5 min in seconds','Q. 400 g in kilograms'],163)
 text(c,'R. 0.8 km in meters',M+64,140,12)
 para(c,'<b>Finish:</b> round only at the end. Include the unit and direction when needed.',M,120,CW,11.8)
 heading(c,'Check',M,88,12);para(c,'K 7; L 3.5; M 10; N -3; O 7; P 150 s; Q 0.4 kg; R 800 m.',M,76,CW,10.8)
 footer(c,'Motion and Forces • Math Review',2,2);c.showPage();c.save();return fn

def teacher_key(data):
 fn=OUT/'Teacher_Answer_Key.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Teacher Answer Key')
 for page in range(4):
  y=header(c,'Teacher Reference','Answers and Worked Calculations',page+1,4)
  y=para(c,'32 main problems: 16 quantitative and 16 conceptual. Math warm-ups are additional.',M,y,CW,11.5)-19
  for sec in data['sections'][page*2:page*2+2]:
   heading(c,f'Topic {sec["number"]}: {sec["title"]}',M,y,13);y-=19
   warm='; '.join(f'{p["id"]}: {clean(p["answer"])}' for p in sec['warmups'])
   y=para(c,'<b>Math Skills:</b> '+esc(warm),M,y,CW,11.2,14)-8
   for p in sec['problems']:
    y=para(c,f'<b>{p["id"]}.</b> {esc(p["answer"])}',M,y,CW,11.7,14.5)-3
    if p['type']=='quantitative':y=para(c,' '.join(esc(st) for st in p['steps']),M+18,y,CW-18,11.2,14)-8
    else:y-=5
   sources=sec.get('sourceNotes',[])
   if isinstance(sources,list):sources='; '.join(map(str,sources))
   y=para(c,'<b>Source alignment:</b> '+esc(sources),M,y,CW,9.5,12)-19
  if page==3:y=para(c,'<b>Teaching reminders:</b> Balanced forces can act on a moving object. Third-law partners act on different objects. During a collision, conserve system momentum only when outside forces have negligible effect.',M,y,CW,10.8,13.5)
  if y<43:print('OVERFLOW key',page+1,y)
  footer(c,'Motion and Forces • Teacher Answer Key',page+1,4);c.showPage()
 c.save();return fn

if __name__=='__main__':
 data=json.loads((ROOT/'content/packet.json').read_text())
 for p in [packet(data),formula_guide(),math_guide(),teacher_key(data)]:print(p)
