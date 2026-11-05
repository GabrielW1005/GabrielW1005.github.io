from pathlib import Path
import math
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from matplotlib import get_data_path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'generated'; OUT.mkdir(parents=True,exist_ok=True)
FONTBASE=Path(get_data_path())/'fonts/ttf'
pdfmetrics.registerFont(TTFont('SchoolSerif',str(FONTBASE/'STIXGeneral.ttf')))
pdfmetrics.registerFont(TTFont('SchoolSerif-Bold',str(FONTBASE/'STIXGeneralBol.ttf')))
pdfmetrics.registerFontFamily('SchoolSerif',normal='SchoolSerif',bold='SchoolSerif-Bold',italic='SchoolSerif',boldItalic='SchoolSerif-Bold')
BLUE=HexColor('#1d4e89'); ORANGE=HexColor('#a64b12'); RED=HexColor('#b21f2d'); GRAY=HexColor('#5d6570'); PALE=HexColor('#e7eaee'); WATER=HexColor('#dcecf5')
DATA=[
 {'id':1,'title':'Lever','type':'lever','mass':20,'F1':50,'F2':200,'ma':4},
 {'id':2,'title':'Ramp','type':'ramp','mass':18,'F1':45,'F2':180,'ma':4},
 {'id':3,'title':'Movable pulley','type':'pulley','mass':14,'F1':70,'F2':140,'ma':2},
 {'id':4,'title':'Wheel and axle','type':'wheel','mass':24,'F1':48,'F2':240,'ma':5},
 {'id':5,'title':'Geared winch','type':'gears','mass':16,'F1':40,'F2':160,'ma':4},
 {'id':6,'title':'Screw','type':'screw','mass':30,'F1':10,'F2':300,'ma':30},
 {'id':7,'title':'Wedge','type':'wedge','mass':21,'F1':35,'F2':210,'ma':6},
 {'id':8,'title':'Linked syringes','type':'hydraulic','mass':20,'F1':40,'F2':200,'ma':5}
]

def txt(c,s,x,y,size=11,color=black,bold=False,align='left'):
 s=s.replace('₁','1')
 c.setFont('SchoolSerif-Bold' if bold else 'SchoolSerif',size);c.setFillColor(color)
 {'left':c.drawString,'center':c.drawCentredString,'right':c.drawRightString}[align](x,y,s)

def para(c,s,x,top,w,size=11.5,leading=15,color=black):
 p=Paragraph(s,ParagraphStyle('p',fontName='SchoolSerif',fontSize=size,leading=leading,textColor=color))
 _,h=p.wrap(w,300);p.drawOn(c,x,top-h);return h

def line(c,x1,y1,x2,y2,color=GRAY,width=1):
 c.setStrokeColor(color);c.setLineWidth(width);c.line(x1,y1,x2,y2)

def arrow(c,x1,y1,x2,y2,color=BLUE,width=1.4):
 line(c,x1,y1,x2,y2,color,width);a=math.atan2(y2-y1,x2-x1);s=5
 p=c.beginPath();p.moveTo(x2,y2);p.lineTo(x2-s*math.cos(a-.45),y2-s*math.sin(a-.45));p.lineTo(x2-s*math.cos(a+.45),y2-s*math.sin(a+.45));p.close()
 c.setFillColor(color);c.drawPath(p,fill=1,stroke=0)

def rect(c,x,y,w,h,fill=PALE,stroke=GRAY):
 c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(1);c.rect(x,y,w,h,fill=1,stroke=1)

def circle(c,x,y,r,fill=white,stroke=GRAY):
 c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(1);c.circle(x,y,r,fill=1,stroke=1)

def poly(c,pts,fill=PALE):
 p=c.beginPath();p.moveTo(*pts[0]);[p.lineTo(*q) for q in pts[1:]];p.close();c.setFillColor(fill);c.setStrokeColor(GRAY);c.drawPath(p,fill=1,stroke=1)

def dim(c,x1,y1,x2,y2,label,color=GRAY,offset=-14):
 line(c,x1,y1,x2,y2,color,.7)
 if y1==y2:
  line(c,x1,y1-3,x1,y1+3,color,.7);line(c,x2,y2-3,x2,y2+3,color,.7);txt(c,label,(x1+x2)/2,y1+offset,10.5,color,align='center')
 else:
  line(c,x1-3,y1,x1+3,y1,color,.7);line(c,x2-3,y2,x2+3,y2,color,.7);txt(c,label,x1+7,(y1+y2)/2-3,10.5,color)

def mass(c,m,x,y,w=36,h=27):
 rect(c,x-w/2,y,w,h,HexColor('#f1e5d8'),ORANGE);txt(c,f'{m} kg',x,y+h+7,11,ORANGE,align='center')

def diagram(c,p,x,y):
 c.saveState();c.translate(x,y);typ=p['type']
 if typ=='lever':
  a,b,ful=32,232,192
  poly(c,[(ful-11,39),(ful+11,39),(ful,61)])
  line(c,a,61,b,61,GRAY,4);mass(c,20,b,63,30,27)
  arrow(c,a,112,a,65);txt(c,'F₁ = ?',a,124,12,BLUE,align='center')
  dim(c,a,30,ful,30,'1.20 m');dim(c,ful,30,b,30,'0.30 m')
 elif typ=='ramp':
  x0,y0=23,29;run=190;rise=run/math.sqrt(15)
  poly(c,[(x0,y0),(x0+run,y0),(x0+run,y0+rise)])
  angle=math.degrees(math.atan2(rise,run));bx=118;by=y0+(bx-x0)*rise/run
  c.saveState();c.translate(bx,by);c.rotate(angle);rect(c,-18,0,36,29,HexColor('#f1e5d8'),ORANGE);c.restoreState()
  txt(c,'18 kg',120,104,11,ORANGE,align='center')
  arrow(c,63,72,102,82);txt(c,'F₁ = ?',45,90,12,BLUE)
  c.saveState();c.translate(43,39);c.rotate(angle);txt(c,'2.00 m',0,0,11,BLUE);c.restoreState()
  dim(c,231,y0,231,y0+rise,'0.50 m',ORANGE)
 elif typ=='pulley':
  line(c,78,145,196,145,GRAY,3);cx,cy,r=133,69,22
  line(c,cx-r,145,cx-r,cy,GRAY,1.7);line(c,cx+r,cy,cx+r,139,GRAY,1.7)
  circle(c,cx,cy,r);circle(c,cx,cy,4,GRAY);line(c,cx,cy-r,cx,24)
  rect(c,cx-20,0,40,24,HexColor('#f1e5d8'),ORANGE);txt(c,'14 kg',cx,8,11,ORANGE,align='center')
  arrow(c,182,89,182,133);txt(c,'F₁ = ?',182,153,12,BLUE,align='center')
  txt(c,'2 supporting strands',0,109,10.8)
 elif typ=='wheel':
  cx,cy,R,r=118,89,48,9.6
  circle(c,cx,cy,R);circle(c,cx,cy,r,PALE)
  line(c,cx-R,cy,cx+R,cy,GRAY,.6);line(c,cx,cy-R,cx,cy+R,GRAY,.6)
  arrow(c,cx-R,cy+32,cx-R,cy-10);txt(c,'F₁ = ?',8,131,12,BLUE)
  line(c,cx+r,cy,cx+r,28,ORANGE,1.3);rect(c,cx+r-21,0,42,28,HexColor('#f1e5d8'),ORANGE);txt(c,'24 kg',cx+r,9,11,ORANGE,align='center')
  line(c,cx,cy,cx+R*.71,cy+R*.71,BLUE,.8);txt(c,'r = 0.20 m',166,130,10.8,BLUE)
  line(c,cx+r,cy,cx+48,cy-14,ORANGE,.7);txt(c,'r = 0.040 m',167,67,10.8,ORANGE)
 elif typ=='gears':
  c1,c2,y0,r1,r2=66,166,90,20,80
  # Fit gear ratio 1:4, with equal-radius input crank and output drum.
  r1=16;r2=64;c1=66;c2=146
  for cx,r,n in [(c1,r1,12),(c2,r2,48)]:
   circle(c,cx,y0,r)
   for i in range(n):
    a=2*math.pi*i/n;line(c,cx+(r-1.4)*math.cos(a),y0+(r-1.4)*math.sin(a),cx+(r+1.4)*math.cos(a),y0+(r+1.4)*math.sin(a),GRAY,.7)
  rad=22;circle(c,c2,y0,rad,white,ORANGE);line(c,c1,y0,c1-rad,y0,BLUE,2);circle(c,c1-rad,y0,3,BLUE)
  arrow(c,c1-rad,y0-25,c1-rad,y0+13);txt(c,'F₁ = ?',0,123,12,BLUE)
  line(c,c2+rad,y0,c2+rad,25,ORANGE,1.2);rect(c,c2+rad-20,0,40,25,HexColor('#f1e5d8'),ORANGE);txt(c,'16 kg',c2+rad,8,11,ORANGE,align='center')
  txt(c,'12 teeth',c1,57,10.6,align='center');txt(c,'48 teeth',219,104,10.6)
  txt(c,'Equal crank and drum radii',130,-12,10.8,align='center')
 elif typ=='screw':
  line(c,135,22,135,138,GRAY,6)
  for yy in range(26,139,7):line(c,130,yy-3,140,yy+3,GRAY,1)
  line(c,83,22,187,22,GRAY,2);line(c,87,25,87,102,GRAY);line(c,183,25,183,102,GRAY)
  rect(c,85,70,100,9);rect(c,113,80,44,31,HexColor('#f1e5d8'),ORANGE);txt(c,'30 kg',135,91,11,ORANGE,align='center')
  line(c,96,140,171,140,BLUE,3);circle(c,96,140,3,BLUE)
  txt(c,'F₁ = ?',40,154,12,BLUE);txt(c,'One turn: 0.30 m',6,121,10.8,BLUE)
  arrow(c,218,65,218,86,ORANGE);txt(c,'Rise:',224,87,10.5,ORANGE);txt(c,'0.010 m',224,72,10.5,ORANGE)
 elif typ=='wedge':
  poly(c,[(42,36),(42,70),(246,36)])
  line(c,129,57,129,132);line(c,174,50,174,132)
  circle(c,151,57,5,white);line(c,151,62,151,66);mass(c,21,151,66,37,29)
  arrow(c,2,49,38,49);txt(c,'F₁ = ?',0,72,12,BLUE)
  arrow(c,201,90,201,113,ORANGE);txt(c,'Rise: 0.040 m',166,128,10.5,ORANGE)
  dim(c,42,20,246,20,'Push: 0.24 m',BLUE)
 elif typ=='hydraulic':
  # Both water-piston interfaces are at the same level; ignore head effects.
  sx,sy,sw=45,45,28;ox,ow=156,28*math.sqrt(5);piston=96
  rect(c,sx,sy,sw,piston-sy,WATER);rect(c,ox,sy,ow,piston-sy,WATER)
  line(c,sx+sw,52,ox,52,BLUE,5);line(c,sx+sw,52,ox,52,WATER,3)
  rect(c,sx,piston,sw,5,PALE);rect(c,ox,piston,ow,5,PALE)
  mass(c,4,sx+sw/2,piston+8,23,20)
  rect(c,ox+ow/2-27,piston+8,54,31,HexColor('#f1e5d8'),ORANGE);txt(c,'m = ?',ox+ow/2,143,12,ORANGE,align='center')
  txt(c,'Area = 1 cm²',sx+sw/2,25,11,BLUE,align='center');txt(c,'Area = 5 cm²',ox+ow/2,25,11,ORANGE,align='center')
  txt(c,'water',116,62,10.5,align='center')
 c.restoreState()

def solutions(p):
 n=p['id'];f2=p['F2'];f1=p['F1'];ma=p['ma']
 if n==1: ratio='1.20 ÷ 0.30';expr='(200 × 0.30) ÷ 1.20'
 elif n==2:ratio='2.00 ÷ 0.50';expr='(180 × 0.50) ÷ 2.00'
 elif n==3:ratio='2 supporting strands';expr='140 ÷ 2'
 elif n==4:ratio='0.20 ÷ 0.040';expr='(240 × 0.040) ÷ 0.20'
 elif n==5:ratio='48 ÷ 12';expr='160 ÷ 4'
 elif n==6:ratio='0.30 ÷ 0.010';expr='(300 × 0.010) ÷ 0.30'
 elif n==7:ratio='0.24 ÷ 0.040';expr='(210 × 0.040) ÷ 0.24'
 else:
  return ['F<sub>in</sub> = 4 × 10 = 40 N','MA = 5 ÷ 1 = <b>5</b>','F<sub>out</sub> = 5 × 40 = 200 N','m = 200 ÷ 10 = <b>20 kg</b>']
 return [f'Load force = {p["mass"]} × 10 = {f2} N',f'MA = {ratio} = <b>{ma}</b>',f'F<sub>1</sub> = {expr} = <b>{f1} N</b>']

def build(key=False):
 name='8th_Grade_Work_and_Simple_Machines'+('_Answer_Key' if key else '')+'.pdf'
 c=canvas.Canvas(str(OUT/name),pagesize=(612,792));c.setTitle('8th Grade Physical Science - Simple Machines'+(' - Answer Key' if key else ''));c.setAuthor('Gabriel Woodsum')
 for pg in [1,2]:
  txt(c,'8th Grade Physical Science - Simple Machines',30,760,17,bold=True)
  if key:txt(c,'ANSWER KEY',582,739,11,RED,bold=True,align='right')
  else:txt(c,'Name: ______________________________  Date: ______________',30,739,11.5)
  txt(c,'Ideal machines. Use g = 10 N/kg. Ignore friction and liquid height differences.',30,718,11)
  para(c,'F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub> &nbsp;&nbsp;&nbsp; MA = F<sub>out</sub> / F<sub>in</sub> = d<sub>in</sub> / d<sub>out</sub>',30,708,552,12.5,15)
  for i,p in enumerate(DATA[(pg-1)*4:pg*4]):
   col=i%2;row=i//2;x=30+col*286;top=671-row*313
   txt(c,f'{p["id"]}. {p["title"]}',x,top,14,bold=True)
   diagram(c,p,x,top-190)
   ans=top-222
   if key:
    for st in solutions(p):ans-=para(c,st,x,ans,266,11.5,15,RED)+4
   else:
    unknown='m = __________ kg' if p['id']==8 else 'F<sub>1</sub> = __________ N'
    para(c,unknown+' &nbsp;&nbsp;&nbsp; MA = __________',x,ans,266,12.5,16)
    if p['id']==8:txt(c,'Find the balanced output mass.',x,ans-43,11)
  txt(c,f'{pg} / 2',582,23,9.5,GRAY,align='right')
  c.showPage()
 c.save();return OUT/name

if __name__=='__main__':
 for p in DATA:assert abs(p['F2']/p['F1']-p['ma'])<1e-8
 for key in [False,True]:print(build(key))
