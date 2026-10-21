from pathlib import Path
import json, math, re, html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color, black, white, HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Mono','DejaVuSansMono.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
W,H=612,792
M=42; CW=W-2*M
INK=HexColor('#17202a');GRAY=HexColor('#505962');LINE=HexColor('#b9c0c5');PALE=HexColor('#f4f5f5')
APP='https://gabrielw1005.github.io/physics-packet-lab/'

def clean(t):
 return str(t).replace('−','-').replace('–','-').replace('—',' - ').replace('‑','-')
def esc(t): return html.escape(clean(t))
def para(c,t,x,y,w,size=11,leading=None,bold=False,color=INK):
 st=ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=leading or size*1.35,textColor=color,spaceAfter=0)
 p=Paragraph(t,st); ww,hh=p.wrap(w,1000)
 p.drawOn(c,x,y-hh)
 return y-hh

def h(c,t,x,y,size=13):
 return para(c,t,x,y,CW,size, size*1.2,True)
def rule(c,y,x=M,w=CW):
 c.setStrokeColor(LINE); c.setLineWidth(.6);c.line(x,y,x+w,y)
def footer(c,series,page,total):
 rule(c,36)
 c.setFont('Body',8);c.setFillColor(GRAY);c.drawString(M,23,series)
 c.drawRightString(W-M,23,f'{page} / {total}')
def header(c,kicker,title,page,total,subtitle=None):
 c.setFillColor(GRAY);c.setFont('Bold',9);c.drawString(M,758,kicker.upper())
 y=para(c,title,M,745,CW,20,24,True)
 if subtitle:y=para(c,subtitle,M,y-6,CW,10.5,14,color=GRAY)
 return y-13

def lines(c,y,n=2,gap=17,x=M+3,w=CW-6):
 for i in range(n):rule(c,y-i*gap,x,w)
 return y-n*gap

def bullet(c,title,text,y,x=M,w=CW,size=11):
 return para(c,f'<b>{title}</b> {text}',x,y,w,size)-8

def box(c,title,body,x,y,w,size=11):
 st=ParagraphStyle('b',fontName='Body',fontSize=size,leading=size*1.35,textColor=INK)
 p=Paragraph(f'<b>{title}</b><br/>{body}',st);_,ph=p.wrap(w-20,1000)
 c.setFillColor(PALE);c.setStrokeColor(LINE);c.roundRect(x,y-ph-20,w,ph+20,4,fill=1,stroke=1)
 p.drawOn(c,x+10,y-ph-10)
 return y-ph-20

def grid_table(c,headers,rows,x,y,widths,size=10.8,rowpadding=7):
 data=[]
 for r in [headers]+rows:
  data.append([Paragraph(esc(v).replace('\n','<br/>'),ParagraphStyle('t',fontName='Bold' if len(data)==0 else 'Body',fontSize=size,leading=size*1.3,textColor=INK)) for v in r])
 t=Table(data,colWidths=widths,hAlign='LEFT')
 t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),PALE),('LINEBELOW',(0,0),(-1,0),.8,LINE),('LINEBELOW',(0,1),(-1,-1),.35,LINE),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),rowpadding),('BOTTOMPADDING',(0,0),(-1,-1),rowpadding)]))
 _,th=t.wrap(sum(widths),1000); t.drawOn(c,x,y-th);return y-th

def formula_guide():
 fn=OUT/'Physics_Quick_Guide.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Formula and Concept Guide')
 y=header(c,'Physical Science • Grade 8','Formula & concept guide',1,2,'Page 1: choose the relationship, keep the units, and track direction.')
 y=box(c,'Start every calculation','1. List what you know.  2. Identify what you need.<br/>3. Choose a formula.  4. Substitute numbers with units.<br/>5. Calculate.  6. Check the size, unit, and direction of the answer.',M,y,CW,11)-14
 y=grid_table(c,['Find','Relationship','Units / what it means'],[
 ['Displacement','Δx = final position - initial position','Signed change in position (m). Distance is the whole path length.'],
 ['Average speed','speed = total distance ÷ total time','m/s; direction is not included. Include all travel and stopping time.'],
 ['Average velocity','vavg = displacement ÷ total time','m/s with a direction or a + / - sign.'],
 ['Acceleration','a = (vf - vi) ÷ t','m/s²; vf = final velocity, vi = initial velocity; t is elapsed time.'],
 ['Final velocity','vf = vi + a × t','m/s; use a constant acceleration during the stated interval.'],
 ['Net force','Fnet = sum of signed forces','N. Choose a positive direction before adding forces on ONE object.'],
 ['Force / acceleration','Fnet = m × a\na = Fnet ÷ m\nm = Fnet ÷ a','N; kg; m/s². Use NET force, not automatically the applied force.'],
 ['Weight','weight = m × g','N. In this packet, g ≈ 10 m/s² on Earth. Mass is in kg.'],
 ['Momentum','p = m × v','kg·m/s, with direction. p is momentum; v is velocity.']
 ],M,y,[110,177,241],10.6,7)-13
 y=para(c,'<b>Useful rearrangements:</b> distance = speed × time; time = distance ÷ speed. For momentum: v = p ÷ m and m = p ÷ v.',M,y,CW,11)-13
 y=box(c,'Use changes, not clock readings','<b>Elapsed time = final time - initial time.</b> From 4 s to 11 s, the elapsed time is 11 - 4 = <b>7 s</b>.<br/>For a straight segment on a position-time graph: velocity = change in position ÷ change in time. Speed is the size of that result.',M,y,CW,10.7)
 footer(c,'Motion & Forces • Student reference',1,2);c.showPage()
 y=header(c,'Physical Science • Grade 8','Explain it & solve it',2,2,'Page 2: use the model that matches the situation.')
 y=grid_table(c,['Core idea','What to remember'],[
 ['Velocity & acceleration','Velocity is speed with direction. Acceleration is a change in speed OR direction. Turning at constant speed still means accelerating.'],
 ['Net force & inertia','Balanced forces give zero acceleration: rest OR constant velocity. Inertia resists changes in motion; more mass means more inertia.'],
 ['Newton’s three laws','1st: zero net force means constant velocity. 2nd: net force = mass × acceleration. 3rd: two interacting objects exert equal, opposite forces on EACH OTHER.'],
 ['Gravity & friction','Mass measures amount of matter (kg); weight is gravitational force (N). Friction opposes sliding (or its tendency) between surfaces. Air resistance opposes motion through air.']
 ],M,y,[121,407],10.6,6)-12
 y=h(c,'Worked example 1 • Slowing down',M,y,12)
 y=para(c,'A cyclist travels east at 7 m/s, then slows to 3 m/s in 2 s. Take east as positive.<br/><b>1.</b> Change in velocity: 3 - 7 = -4 m/s.<br/><b>2.</b> Divide by time: a = -4 ÷ 2 = <b>-2 m/s²</b> (west).<br/><b>3.</b> Check: acceleration is opposite the eastward velocity, so speed decreases.<br/><b>A negative acceleration does not always mean slowing down.</b> If velocity is also negative, negative acceleration makes the speed increase.',M,y-5,CW,10.7,14.2)-13
 y=h(c,'Worked example 2 • Opposing forces',M,y,12)
 y=para(c,'A 12 kg cart is pushed right with 18 N; friction is 6 N left.<br/><b>1.</b> Choose right as positive.  <b>2.</b> Fnet = 18 + (-6) = 12 N.<br/><b>3.</b> a = 12 ÷ 12 = <b>1 m/s² right</b>.<br/><b>4.</b> Check: the cart accelerates toward the greater force.',M,y-5,CW,10.7,14.2)-13
 y=h(c,'Momentum challenge • Two carts stick together',M,y,12)
 y=para(c,'If outside forces have negligible effect during the collision:<br/><b>1.</b> Add initial momenta: ptotal = m₁v₁ + m₂v₂ (keep signs).<br/><b>2.</b> Add masses: mtotal = m₁ + m₂.<br/><b>3.</b> Shared final velocity = ptotal ÷ mtotal.<br/>Example: 1 kg at 3 m/s meets 2 kg at rest. vfinal = (1 × 3 + 2 × 0) ÷ (1 + 2) = <b>1 m/s</b> in the original direction.',M,y-5,CW,10.7,14.2)-13
 y=box(c,'Read a graph','<b>Distance-time:</b> slope = speed; steeper means faster; flat means stopped.<br/><b>Speed-time:</b> change in speed ÷ time gives acceleration along a fixed direction. Flat means steady speed; the object may still turn.<br/>Speed graphs do not show direction; signed position and velocity graphs can.',M,y,CW,10.4)
 if y<44: print('WARNING guide p2 low',y)
 footer(c,'Motion & Forces • Student reference',2,2);c.showPage();c.save();return fn

def math_guide():
 fn=OUT/'Math_Review_Guide.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Prerequisite Math Review')
 y=header(c,'Physical Science • Grade 8','Math review: number skills',1,2,'Use this page when signs, decimals, or fractions get in the way of the science.')
 y=h(c,'1  Positive and negative numbers',M,y,13)
 y=para(c,'On a number line, positive is right of zero and negative is left. In physics, a sign can show direction: for example, east + and west -.',M,y-6,CW,11)-8
 y=grid_table(c,['Operation','How to do it','Example'],[
 ['Add different signs','Subtract sizes; keep the sign of the number farther from zero.','14 + (-9) = 5\n-14 + 9 = -5'],
 ['Subtract','Add the opposite of the second number.','4 - 11 = 4 + (-11) = -7\n4 - (-3) = 4 + 3 = 7'],
 ['Multiply or divide','Same signs → positive. Different signs → negative.','(-12) ÷ 3 = -4\n(-3) × (-2) = 6']
 ],M,y,[116,242,170],10.7,7)-8
 y=para(c,'<b>Try:</b>  A. 9 + (-14) = ______   B. 2 - (-5) = ______   C. -18 ÷ 6 = ______',M,y,CW,10.6)-18
 y=h(c,'2  Decimals',M,y,13)
 y=para(c,'<b>Add/subtract:</b> line up decimal points. Add zeros when helpful: 6.00 - 2.75 = <b>3.25</b>.<br/><b>Multiply:</b> multiply whole numbers first, then place the decimal. For 1.2 × 0.4, do 12 × 4 = 48; two decimal places gives <b>0.48</b>.<br/><b>Divide:</b> shift both decimal points the same amount so the divisor is a whole number: 7.2 ÷ 0.6 = 72 ÷ 6 = <b>12</b>.',M,y-6,CW,11,15)-8
 y=para(c,'<b>Estimate first:</b> 9.6 ÷ 3 should be a little more than 3, not 32 or 0.32.<br/><b>Try:</b>  D. 5.4 - 1.85 = ______   E. 0.3 × 8 = ______   F. 4.5 ÷ 0.5 = ______',M,y,CW,10.6,14.5)-19
 y=h(c,'3  Fractions are division',M,y,13)
 y=para(c,'<b>Meaning:</b> 3/4 means 3 ÷ 4 = <b>0.75</b>. A fraction bar groups the whole numerator: (12 - 4)/2 = 8/2 = <b>4</b>.<br/><b>Multiply:</b> multiply tops and bottoms: (2/3) × (3/4) = 6/12 = <b>1/2</b>.<br/><b>Divide:</b> multiply by the reciprocal (flip the second fraction): (3/4) ÷ (1/2) = (3/4) × (2/1) = 6/4 = <b>1.5</b>.<br/><b>Add/subtract:</b> use the same denominator first: 1/2 + 1/4 = 2/4 + 1/4 = <b>3/4</b>.',M,y-6,CW,11,15)-8
 y=para(c,'<b>Try:</b>  G. 3/5 = ______ (decimal)   H. (9 - 3)/2 = ______<br/>I. (1/2) × (2/3) = ______   J. (2/3) ÷ (1/3) = ______',M,y,CW,10.6,15)-12
 y=box(c,'Check your practice','A -5; B 7; C -3; D 3.55; E 2.4; F 9; G 0.6; H 3; I 1/3; J 2.',M,y,CW,10.3)
 if y<44: print('WARNING math p1 low',y)
 footer(c,'Motion & Forces • Prerequisite math',1,2);c.showPage()
 y=header(c,'Physical Science • Grade 8','Math review: equations & units',2,2,'A letter stands for a number. Undo operations to find its value.')
 y=h(c,'4  One-step equations: keep both sides equal',M,y,13)
 y=grid_table(c,['Equation','Undo it on BOTH sides','Solution'],[
 ['x + 7 = 19','Subtract 7: x = 19 - 7','x = 12'],
 ['x - 6 = 11','Add 6: x = 11 + 6','x = 17'],
 ['4x = 18','Divide by 4: x = 18 ÷ 4','x = 4.5'],
 ['x/5 = 3','Multiply by 5: x = 3 × 5','x = 15']
 ],M,y-7,[126,282,120],10.8,6)-9
 y=para(c,'<b>Check by substitution:</b> for 4x = 18, replace x with 4.5. Since 4 × 4.5 = 18, the solution works.<br/><b>Try:</b> K. x + 8 = 15   L. 6x = 21   M. x/4 = 2.5',M,y,CW,10.8,15)-17
 y=h(c,'5  Substitute carefully; follow the order',M,y,13)
 y=para(c,'Work in this order: <b>parentheses</b>, then multiply/divide from left to right, then add/subtract from left to right.<br/>Example: a = (vf - vi)/t, where vf = 2, vi = 8, t = 3.<br/><b>1.</b> Write a = (2 - 8)/3.  <b>2.</b> Subtract inside parentheses: -6/3.<br/><b>3.</b> Divide: a = <b>-2</b>. In this physics formula, the unit is m/s².<br/><b>Do not enter</b> 2 - 8 ÷ 3; that leaves out the grouping.',M,y-6,CW,11,15)-8
 y=para(c,'<b>Try:</b> N. (4 - 10)/2 = ______   O. 3 + 0.5 × 8 = ______',M,y,CW,10.8)-17
 y=h(c,'6  Match units before you calculate',M,y,13)
 y=para(c,'<b>1 minute = 60 seconds • 1 kilometer = 1,000 meters • 1,000 grams = 1 kilogram.</b><br/>To get m/s, divide meters by seconds. Convert a time in minutes before using it with meters: 1.5 min × 60 = <b>90 s</b>.<br/>To use Fnet = ma, convert mass to kg: 750 g ÷ 1,000 = <b>0.75 kg</b>.<br/><b>m/s²</b> means “meters per second, each second.” It is a unit of acceleration, not a request to square the final answer.',M,y-6,CW,11,15)-8
 y=para(c,'<b>Try:</b> P. 2.5 min = ______ s   Q. 400 g = ______ kg<br/>R. 0.8 km = ______ m',M,y,CW,10.8,15)-17
 y=para(c,'<b>Finish well:</b> Keep calculator digits until the end. Round to two decimal places if needed: 10 ÷ 3 ≈ 3.33. Write the <b>unit</b> and <b>direction</b> when needed. Distance and speed cannot be negative.',M,y,CW,11,15)-12
 y=box(c,'Check your practice','K 7; L 3.5; M 10; N -3; O 7; P 150 s; Q 0.4 kg; R 800 m.',M,y,CW,10.3)
 if y<44:print('WARNING math p2 low',y)
 footer(c,'Motion & Forces • Prerequisite math',2,2);c.showPage();c.save();return fn

def compact_data(c,tb,x,y,w):
 heads=tb['headers'];rows=tb['rows']
 data=[[heads[0]]+[r[0] for r in rows],[heads[1]]+[r[1] for r in rows]]
 first=138
 return grid_table(c,data[0],[data[1]],x,y,[first]+[(w-first)/len(rows)]*len(rows),9.8,4)

def mini_graph(c,g,x,y,w,h):
 # y is top; labels and tick marks included in the supplied rectangle.
 left=x+35;right=x+w-8;bottom=y-h+25;top=y-19
 xx=g['x'];yy=g['y'];xmin=0;xmax=max(xx);ymin=0;ymax=max(yy)
 def X(v):return left+(v-xmin)/(xmax-xmin)*(right-left)
 def Y(v):return bottom+(v-ymin)/(ymax-ymin)*(top-bottom)
 c.setStrokeColor(LINE);c.setLineWidth(.4)
 for v in sorted(set(yy+[0])):
  c.line(left,Y(v),right,Y(v));c.setFont('Body',8);c.setFillColor(GRAY);c.drawRightString(left-5,Y(v)-3,str(v))
 for v in sorted(set(xx)):
  c.line(X(v),bottom,X(v),top);c.drawCentredString(X(v),bottom-12,str(v))
 c.setStrokeColor(INK);c.setLineWidth(.8);c.line(left,bottom,right,bottom);c.line(left,bottom,left,top)
 c.setFillColor(INK);c.setFont('Bold',9);c.drawString(left,y-9,g['yLabel']);c.setFont('Body',8);c.drawCentredString((left+right)/2,bottom-23,g['xLabel'])
 c.setLineWidth(1.7)
 for i in range(len(xx)-1):c.line(X(xx[i]),Y(yy[i]),X(xx[i+1]),Y(yy[i+1]))
 for xv,yv in zip(xx,yy):c.circle(X(xv),Y(yv),2.4,fill=1,stroke=0)

def packet(data):
 fn=OUT/'Physical_Science_Packet.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Grade 8 Motion and Forces Practice Packet')
 for sec in data['sections']:
  num=sec['number'];y=header(c,f'Motion & Forces • Grade 8 • Topic {num}',esc(sec['title']),num,8,esc(sec['subtitle']))
  c.setFont('Body',10);c.setFillColor(INK);c.drawString(M,y-1,'Name: ____________________________________    Date: ______________')
  y-=18
  y=para(c,'Show your steps and units for calculations. Use complete ideas for explanations.',M,y,CW,9.7,13)-8
  warm=sec['warmups'];warmtext='   '.join(f'<b>{i+1}.</b> {esc(w["prompt"])}' for i,w in enumerate(warm))
  y=box(c,'Math warm-up • just the math',warmtext,M,y,CW,10.2)-12
  avail=y-60;stats=[]
  for p in sec['problems']:
   plot=p['id']=='P14';tw=CW-223 if plot else CW-12
   st=ParagraphStyle('m',fontName='Body',fontSize=11,leading=14.6)
   pr=Paragraph(esc(p['prompt']),st);_,ph=pr.wrap(tw,1000)
   extra=42 if p.get('table') and not plot else 0
   base=max(ph,90) if plot else ph
   stats.append((p,pr,ph,extra,base,plot))
  fixed=sum(22+base+ex+10 for _,_,_,ex,base,_ in stats)
  free=avail-fixed
  if free<70:print('WARNING writing space',num,free)
  weights=[1.3 if p['type']=='quantitative' else 1 for p,_,_,_,_,_ in stats]
  for (p,pr,ph,extra,base,plot),weight in zip(stats,weights):
   c.setFillColor(INK);c.setFont('Bold',11);c.drawString(M,y-11,f'{p["id"]}  {clean(p["title"])}')
   tag='CALCULATE' if p['type']=='quantitative' else 'EXPLAIN';c.setFont('Body',8);c.setFillColor(GRAY);c.drawRightString(W-M,y-10,tag)
   y-=22;pr.drawOn(c,M+6,y-ph)
   if plot:mini_graph(c,p['graph'],W-M-211,y+1,211,90)
   y-=base+5
   if p.get('table') and not plot:y=compact_data(c,p['table'],M+6,y,CW-12)-3
   space=max(12,free*weight/sum(weights));n=max(1,int(space//18));bottom=y-space
   for li in range(n):rule(c,y-12-li*18,M+6,CW-12)
   y=bottom-5
  c.setFont('Body',8);c.setFillColor(GRAY);c.drawString(M,44,'Explore these problems: '+APP)
  c.linkURL(APP,(M,40,W-M,52),relative=0)
  footer(c,'Motion & Forces • Practice packet',num,8);c.showPage()
 c.save();return fn

def teacher_key(data):
 fn=OUT/'Teacher_Answer_Key.pdf';c=canvas.Canvas(str(fn),pagesize=(W,H));c.setTitle('Physical Science Teacher Answer Key')
 for page in range(4):
  y=header(c,'Teacher reference','Answers & teaching notes',page+1,4,'32 main problems: 16 quantitative + 16 conceptual. Math warm-ups are additional.')
  for sec in data['sections'][2*page:2*page+2]:
   y=h(c,f'Topic {sec["number"]} • {esc(sec["title"])}',M,y,12)
   warm='; '.join(f'{i+1}. {clean(w["answer"])}' for i,w in enumerate(sec['warmups']))
   y=para(c,'<b>Warm-up:</b> '+esc(warm),M,y-5,CW,10.2,13)-6
   for p in sec['problems']:
    y=para(c,f'<b>{p["id"]}.</b> {esc(p["answer"])}',M,y,CW,10.8,14.5)-4
    if p['type']=='quantitative':
     y=para(c,' '.join(esc(st) for st in p['steps']),M+19,y,CW-19,10.4,13.8)-7
   source=sec.get('sourceNotes',[])
   if isinstance(source,list):source='; '.join(map(str,source))
   y=para(c,'<b>Curriculum alignment:</b> '+esc(source),M,y,CW,8.6,11.5,color=GRAY)-14
   rule(c,y+5)
  if page==3:
   y=para(c,'<b>Teaching reminders:</b> Signs show chosen directions. Balanced forces can act on a moving object. Third-law partners act on different objects; they are not the two forces that cancel on one object. For collisions, conserve system momentum only when outside forces have negligible effect during the collision.',M,y,CW,9.3,12.3)
  if y<45:print('WARNING teacher low',page+1,y)
  footer(c,'Motion & Forces • Teacher answer key',page+1,4);c.showPage()
 c.save();return fn

if __name__=='__main__':
 formula_guide();math_guide()
 p=ROOT/'content/packet.json'
 if p.exists():
  data=json.loads(p.read_text());packet(data);teacher_key(data)
 for fn in OUT.glob('*.pdf'):print(fn)
