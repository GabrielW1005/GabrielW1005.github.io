from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from matplotlib import get_data_path
FONTBASE=get_data_path()+"/fonts/ttf/"
pdfmetrics.registerFont(TTFont("SchoolSerif",FONTBASE+"STIXGeneral.ttf"))
pdfmetrics.registerFont(TTFont("SchoolSerif-Bold",FONTBASE+"STIXGeneralBol.ttf"))
pdfmetrics.registerFontFamily("SchoolSerif",normal="SchoolSerif",bold="SchoolSerif-Bold",italic="SchoolSerif",boldItalic="SchoolSerif-Bold")
from pathlib import Path
import json, math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'generated'; OUT.mkdir(parents=True,exist_ok=True)
DATA=json.loads((ROOT/'problems.json').read_text())
W,H=612,792
BLUE=HexColor('#1d4e89'); ORANGE=HexColor('#a64b12'); RED=HexColor('#b21f2d'); GRAY=HexColor('#5d6570'); PALE=HexColor('#e7eaee')

def para(c,txt,x,top,width,size=10.5,leading=11.6,color=black,bold=False):
    s=ParagraphStyle('p',fontName='SchoolSerif-Bold' if bold else 'SchoolSerif',fontSize=size,leading=leading,textColor=color)
    p=Paragraph(txt,s); a,h=p.wrap(width,500); p.drawOn(c,x,top-h); return h

def txt(c,t,x,y,size=10,font='SchoolSerif',color=black,align='left'):
    c.setFont(font,size);c.setFillColor(color)
    {'left':c.drawString,'center':c.drawCentredString,'right':c.drawRightString}[align](x,y,t)

def line(c,x1,y1,x2,y2,color=black,width=.8,dash=None):
    c.setStrokeColor(color);c.setLineWidth(width);c.setDash(dash or []);c.line(x1,y1,x2,y2);c.setDash([])

def arrow(c,x1,y1,x2,y2,color=black,width=1):
    line(c,x1,y1,x2,y2,color,width)
    a=math.atan2(y2-y1,x2-x1);s=3.3
    path=c.beginPath();path.moveTo(x2,y2);path.lineTo(x2-s*math.cos(a-.5),y2-s*math.sin(a-.5));path.lineTo(x2-s*math.cos(a+.5),y2-s*math.sin(a+.5));path.close()
    c.setFillColor(color);c.drawPath(path,fill=1,stroke=0)

def polygon(c,pts,fill=PALE,stroke=GRAY):
    p=c.beginPath();p.moveTo(*pts[0]);[p.lineTo(*q) for q in pts[1:]];p.close()
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.8);c.drawPath(p,fill=1,stroke=1)

def circle(c,x,y,r,fill=white,stroke=GRAY):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.8);c.circle(x,y,r,stroke=1,fill=1)

def rect(c,x,y,w,h,fill=PALE):
    c.setFillColor(fill);c.setStrokeColor(GRAY);c.setLineWidth(.8);c.rect(x,y,w,h,fill=1,stroke=1)

def f(n):
    return f'{n:g}'

def value(p,k):
    return '?' if p['unknown']==k else f(p[k])

def label(c,p,k,x,y,color=black,unit=None,align='left'):
    unit=unit if unit is not None else ('N' if k.startswith('F') else 'm')
    txt(c,f'{k} = {value(p,k)} {unit}',x,y,9.6,color=color,align=align)

def diagram(c,p,x,y,w=261,h=66):
    # y is lower edge. Fixed design coordinates 0..260 x 0..66.
    c.saveState(); c.translate(x,y)
    typ=p['type']
    if typ in ('lever','seesaw'):
        left,right=48,217
        ful=left+(right-left)*p['r1']/(p['r1']+p['r2'])
        base=29
        polygon(c,[(ful-9,11),(ful+9,11),(ful,base)])
        line(c,left,base,right,base,GRAY,3)
        arrow(c,left,base+22,left,base+1,BLUE)
        if typ=='seesaw':
            arrow(c,right,base+22,right,base+1,ORANGE)
        else:
            arrow(c,right,base+1,right,base+22,ORANGE)
        label(c,p,'F1',3,57,BLUE)
        if typ=='seesaw': txt(c,'load = 360 N',160,57,9.6,color=ORANGE)
        else: label(c,p,'F2',160,57,ORANGE)
        if typ=='seesaw':
            txt(c,'1.80 m',(.5*(left+ful)),16,9,align='center');txt(c,'0.60 m',(.5*(right+ful)),16,9,align='center')
            txt(c,'slow tilt: left falls 0.45 m; right rises 0.15 m',2,1,9.6)
        else:
            label(c,p,'d1',2,0,BLUE);label(c,p,'d2',161,0,ORANGE)
            txt(c,'vertical fall',left,15,9,align='center');txt(c,'vertical rise',right,15,9,align='center')
    elif typ=='ramp':
        polygon(c,[(25,14),(208,14),(208,44)])
        # ratio 2.4 / .4 is drawn to scale
        polygon(c,[(101,27),(125,31),(122,47),(98,43)],white)
        arrow(c,120,46,171,55,BLUE)
        arrow(c,225,14,225,44,ORANGE)
        c.saveState();c.translate(27,20);c.rotate(math.degrees(math.atan2(30,183)));label(c,p,'d1',0,0,BLUE);c.restoreState()
        label(c,p,'d2',163,0,ORANGE)
        label(c,p,'F1',139,58,BLUE);label(c,p,'F2',6,57,ORANGE)
    elif typ=='fixed':
        line(c,80,64,139,64,GRAY,2);line(c,109,64,109,52)
        circle(c,109,43,10);circle(c,109,43,2,GRAY)
        line(c,99,43,99,9);line(c,119,43,119,14)
        rect(c,109,2,20,12)
        arrow(c,83,39,83,13,BLUE);arrow(c,137,5,137,31,ORANGE)
        label(c,p,'F1',0,53,BLUE);label(c,p,'F2',169,53,ORANGE)
        label(c,p,'d1',0,0,BLUE);label(c,p,'d2',169,0,ORANGE)
        txt(c,'fixed',109,57,9,align='center')
    elif typ=='movable':
        line(c,80,64,141,64,GRAY,2);circle(c,111,25,11);circle(c,111,25,2,GRAY)
        line(c,100,64,100,25);line(c,122,25,122,56)
        line(c,111,14,111,11);rect(c,99,0,24,11)
        arrow(c,140,20,140,55,BLUE);arrow(c,87,2,87,19,ORANGE)
        label(c,p,'F1',168,54,BLUE);label(c,p,'F2',0,37,ORANGE)
        label(c,p,'d1',168,0,BLUE);label(c,p,'d2',0,0,ORANGE)
        txt(c,'2 supporting strands',0,54,9)
    elif typ=='wheel':
        cx,cy,R=101,34,27;ratio=max(p['r1'],p['r2'])/min(p['r1'],p['r2']);r=R/ratio
        circle(c,cx,cy,R);circle(c,cx,cy,r,PALE)
        line(c,cx-R,cy,cx+R,cy,GRAY,.5);line(c,cx,cy-R,cx,cy+R,GRAY,.5)
        if not p.get('reverse'):
            arrow(c,cx-R,cy,cx-R,cy+21,BLUE)
            line(c,cx+r,cy,cx+r,8);rect(c,cx+r-7,0,14,8)
            label(c,p,'F1',0,53,BLUE);label(c,p,'F2',165,53,ORANGE)
            label(c,p,'d1',0,0,BLUE);label(c,p,'d2',165,0,ORANGE)
            txt(c,'rim path',2,15,9,color=BLUE);txt(c,'rope rise',168,15,9,color=ORANGE)
        else:
            arrow(c,cx-r,cy,cx-r,cy+21,BLUE);arrow(c,cx+R,cy,cx+R,cy+21,ORANGE)
            label(c,p,'F1',0,53,BLUE);label(c,p,'F2',166,53,ORANGE)
            label(c,p,'d1',0,0,BLUE);label(c,p,'d2',166,0,ORANGE)
            txt(c,'axle rim path',2,15,9,color=BLUE);txt(c,'wheel rim path',166,15,9,color=ORANGE)
    elif typ=='gears':
        circle(c,91,34,8);circle(c,131,34,32);circle(c,131,34,12)
        for center,r,n in [(91,8,12),(131,32,48)]:
            for i in range(n):
                a=2*math.pi*i/n;line(c,center+(r-1)*math.cos(a),34+(r-1)*math.sin(a),center+(r+1)*math.cos(a),34+(r+1)*math.sin(a),GRAY,.65)
        line(c,91,34,79,34,BLUE,1.4);circle(c,79,34,2,BLUE)
        line(c,143,34,143,9);rect(c,136,0,14,9)
        txt(c,'12 teeth',37,16,9);txt(c,'48 teeth',169,31,9)
        label(c,p,'F1',0,55,BLUE);label(c,p,'F2',173,55,ORANGE)
        label(c,p,'d1',0,0,BLUE);label(c,p,'d2',173,0,ORANGE)
    elif typ=='screw':
        line(c,107,7,107,58,GRAY,4)
        for yy in range(11,58,5):line(c,103,yy-2,111,yy+2,GRAY)
        line(c,78,7,136,7,GRAY,2)
        rect(c,82,26,50,8);line(c,136,10,136,47,GRAY);line(c,78,10,78,47,GRAY)
        line(c,84,59,130,59,BLUE,2);circle(c,84,59,2.3,BLUE)
        arrow(c,147,22,147,44,ORANGE)
        label(c,p,'F1',0,48,BLUE);label(c,p,'F2',171,48,ORANGE)
        label(c,p,'d1',0,0,BLUE);label(c,p,'d2',171,0,ORANGE)
        txt(c,'one full turn',0,15,9,color=BLUE);txt(c,'platform rise',169,15,9,color=ORANGE)
    elif typ=='wedge':
        line(c,65,11,180,11,GRAY)
        polygon(c,[(73,11),(73,29),(178,11)])
        rect(c,113,22,28,18);line(c,111,23,111,58,GRAY);line(c,144,23,144,58,GRAY)
        arrow(c,37,18,69,18,BLUE);arrow(c,159,30,159,50,ORANGE)
        label(c,p,'F1',0,53,BLUE);label(c,p,'F2',173,53,ORANGE)
        label(c,p,'d1',0,0,BLUE);label(c,p,'d2',173,0,ORANGE)
    elif typ=='hydraulic':
        rect(c,49,29,49,13,HexColor('#edf4fb'));rect(c,160,23,48,26,HexColor('#edf4fb'))
        line(c,67,29,67,42,BLUE,2);line(c,67,35.5,40,35.5,BLUE,1.3);line(c,40,28,40,43,BLUE,1.3)
        line(c,188,23,188,49,ORANGE,2);line(c,188,36,217,36,ORANGE,1.3);line(c,217,24,217,48,ORANGE,1.3)
        line(c,98,35,122,35,GRAY);line(c,122,35,122,14,GRAY);line(c,122,14,147,14,GRAY);line(c,147,14,147,36,GRAY);line(c,147,36,160,36,GRAY)
        arrow(c,24,17,56,17,BLUE);arrow(c,210,17,229,17,ORANGE)
        label(c,p,'F1',0,57,BLUE);label(c,p,'F2',174,57,ORANGE)
        label(c,p,'d1',0,0,BLUE);label(c,p,'d2',174,0,ORANGE)
        txt(c,'water',135,3,9,align='center')
    c.restoreState()

SHORT={
1:'Find F<sub>1</sub> for this equal-arm lever. The input falls 0.24 m as the 72 N load rises 0.24 m.',
2:'Find F<sub>1</sub>. The long input arm falls 0.60 m as the 320 N load rises 0.15 m.',
3:'Find F<sub>1</sub> to balance the 360 N weight. Use the slow-tilt distances below in F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub>.',
4:'Find the push F<sub>1</sub> parallel to the ramp. The 300 N load moves 2.40 m along it and rises 0.40 m.',
5:'Find F<sub>1</sub>. Pull the rope down 0.35 m to lift an 84 N load by 0.35 m.',
6:'Find F<sub>1</sub>. Pull 0.80 m of rope upward to lift the 180 N load by 0.40 m.',
7:'Find F<sub>1</sub> at the wheel rim. Your hand travels 0.96 m while the axle lifts a 240 N load by 0.12 m.',
8:'Find F<sub>2</sub>. A 24 N input turns the crank through 0.80 m of path; the rope rises 0.20 m. Crank and drum radii are equal.',
9:'Find F<sub>1</sub>. One handle turn travels 0.24 m and raises a guided 600 N platform by 0.006 m.',
10:'Find d<sub>1</sub>, the horizontal push distance. A 65 N push raises the guided 390 N load by 0.020 m.',
11:'Find F<sub>2</sub>. Push the small plunger with 18 N through 0.16 m. The large plunger moves 0.040 m.',
12:'Find d<sub>2</sub>. Drive the small axle with 200 N through 0.080 m. The larger wheel produces 40 N.'}


def key_lines(p):
    u=p['unknown'];a,b,c_,d=[p[k] for k in ('F1','F2','d1','d2')]
    sub=lambda k: k[0]+f'<sub>{k[1]}</sub>'
    sym={ 'F1':'F<sub>1</sub> = F<sub>2</sub>d<sub>2</sub> / d<sub>1</sub>', 'F2':'F<sub>2</sub> = F<sub>1</sub>d<sub>1</sub> / d<sub>2</sub>', 'd1':'d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub> / F<sub>1</sub>', 'd2':'d<sub>2</sub> = F<sub>1</sub>d<sub>1</sub> / F<sub>2</sub>'}[u]
    known={'F1':(b,d,c_),'F2':(a,c_,d),'d1':(b,d,a),'d2':(a,c_,b)}[u]
    unit='N' if u.startswith('F') else 'm'
    numeric=f'{sym} = ({f(known[0])} × {f(known[1])}) ÷ {f(known[2])} = <b>{f(p[u])} {unit}</b>'
    # Split algebra and substitution to preserve readable size.
    algebra=sym
    numeric=f'{sub(u)} = ({f(known[0])} × {f(known[1])}) ÷ {f(known[2])} = <b>{f(p[u])} {unit}</b>'
    ma=f'MA = {f(b)} ÷ {f(a)} = {f(c_)} ÷ {f(d)} = <b>{f(b/a)}</b>'
    side='input' if c_>d else ('output' if d>c_ else 'neither')
    force='smaller' if a<b else ('larger' if a>b else 'equal')
    compare=f'Farther: <b>{side}</b>. Input force: <b>{force}</b>.'
    work=f'{"Tilt work" if p["id"]==3 else "Work"}: {f(a)} × {f(c_)} = {f(b)} × {f(d)} = <b>{f(a*c_)} J</b>'
    return [algebra,numeric,ma,compare,work]


def header(c,page,key):
    txt(c,'8th Grade Physical Science - Work & Simple Machines',30,763,16,'SchoolSerif-Bold')
    if key:txt(c,'ANSWER KEY',582,744,10,'SchoolSerif-Bold',RED,align='right')
    else:txt(c,'Name: __________________________________  Date: ______________',30,744,11)
    if page==1:
        para(c,'<b>Conservation of energy:</b> an ideal machine has equal input and output work. It trades force for distance without creating energy. Assume no friction, negligible machine mass, and slow, steady motion. Real friction turns some input energy into heat; total energy is conserved.',30,731,552,10.5,11.6)
        para(c,'<b>1 = input; 2 = output.</b> F is force (N); d is distance in the force direction (m). For levers, use vertical rise/fall. Work is measured in joules (J).',30,692,552,10.5,11.6)
        para(c,'<b>F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub></b> &nbsp;&nbsp;&nbsp; MA = F<sub>2</sub> / F<sub>1</sub> = d<sub>1</sub> / d<sub>2</sub> &nbsp;&nbsp;&nbsp; F<sub>1</sub> = (F<sub>2</sub> × d<sub>2</sub>) ÷ d<sub>1</sub>',30,665,552,12,13)
        para(c,'<b>Example:</b> F<sub>1</sub> = (160 × 0.30) ÷ 1.20 = 40 N. Both works = 48 J; MA = 4. The input moves 4 times as far, so the input force is 1/4 as large.',30,646,552,10.5,11.6)
        para(c,'<b>Each problem:</b> use F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub>, find the missing value and MA, then compare distance and force.',30,619,552,10.5,11.6)
        return 594,182
    else:
        para(c,'<b>For every problem:</b> F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub>; MA = F<sub>2</sub> / F<sub>1</sub> = d<sub>1</sub> / d<sub>2</sub>. Find the missing value and MA. Which travels farther: input, output, or neither? Is the input force smaller, equal, or larger?',30,729,552,10.5,11.6)
        para(c,'The six simple machines are lever, inclined plane, pulley, wheel and axle, screw, and wedge. The geared winch is a compound machine. Linked syringes are a related hydraulic machine.',30,689,552,10.5,11.6)
        return 652,201


def build(key=False):
    name='8th_Grade_Work_and_Simple_Machines'+('_Answer_Key' if key else '')+'.pdf'
    c=canvas.Canvas(str(OUT/name),pagesize=(612,792))
    c.setTitle('8th Grade Physical Science - Work & Simple Machines'+(' - Answer Key' if key else ''))
    c.setAuthor('Gabriel Woodsum')
    for pg in (1,2):
        top,rowh=header(c,pg,key)
        for ii,p in enumerate(DATA[(pg-1)*6:pg*6]):
            col=ii%2;row=ii//2;x=30+col*285; t=top-row*rowh;cw=267
            txt(c,f"{p['id']}. {p['title']}",x,t,11.8,'SchoolSerif-Bold')
            para(c,SHORT[p['id']],x,t-6,cw,10.5,11.4)
            diag_y=t-102
            diagram(c,p,x,diag_y)
            ans_top=diag_y-8
            if key:
                for st in key_lines(p):
                    hh=para(c,st,x,ans_top,cw,10.2,10.7,RED);ans_top-=hh+1
            else:
                para(c,'F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub>: ______________________________',x,ans_top,cw,10.4,11)
                para(c,f"{p['unknown'][0]}<sub>{p['unknown'][1]}</sub> = ______________ &nbsp;&nbsp;&nbsp; MA = ______________",x,ans_top-17,cw,10.4,11)
                para(c,'Farther: input / output / neither',x,ans_top-34,cw,10.4,11)
                para(c,'Input force: smaller / equal / larger than output',x,ans_top-48,cw,10.4,11)
            if p['id']==3:
                # Keep supplementary static-work fact next to the seesaw.
                pass
        # Footer: compact science reminder, page info, optional supplemental URL.
        if pg==1:
            txt(c,('Seesaw #3: at rest, work = 0. Balance: 120 × 1.80 = 360 × 0.60 = 216 N m.' if key else 'Seesaw #3: at rest, work = 0. Balance: F1 × 1.80 m = 360 N × 0.60 m.'),30,36,9.8)
        else:
            txt(c,'MA > 1: force advantage. MA = 1: equal forces. MA < 1: output moves farther with less force.',30,36,9.8)
        txt(c,'Optional app: GabrielW1005.github.io/machine-lab/',30,21,9, color=GRAY)
        txt(c,f'{pg} / 2',582,21,9,color=GRAY,align='right')
        c.showPage()
    c.save();return OUT/name

if __name__=='__main__':
    for p in DATA:
        assert abs(p['F1']*p['d1']-p['F2']*p['d2'])<1e-8
    for key in (False,True):print(build(key))
