"""Two-page balance worksheet; exact geometric scales and vector math/diagrams."""
from pathlib import Path
from functools import lru_cache
import argparse
import math
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['mathtext.fontset']='stix'
from matplotlib.textpath import TextPath
from matplotlib.path import Path as MplPath
from matplotlib.font_manager import FontProperties
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('WorksheetSerif','/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('WorksheetSerifBold','/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))

parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'worksheet.pdf')
OUT=parser.parse_args().output
OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=612,792
c=canvas.Canvas(str(OUT),pagesize=(W,H))
c.setTitle('8th Grade Physical Science - Homework 1 - Due November 13, 2026')
c.setAuthor('Gabriel Woodsum')

@lru_cache(None)
def equation(expr,size=18):
    return TextPath((0,0),'$'+expr+'$',size=size,prop=FontProperties(family='STIXGeneral'))

def eq(expr,x,y,size=18,center=True):
    drawing=equation(expr,size);box=drawing.get_extents();path=c.beginPath();current=(0,0)
    for v,kind in drawing.iter_segments(curves=True,simplify=False):
        if kind==MplPath.MOVETO:path.moveTo(*v);current=tuple(v)
        elif kind==MplPath.LINETO:path.lineTo(*v);current=tuple(v)
        elif kind==MplPath.CURVE3:
            qx,qy,ex,ey=v;px,py=current
            path.curveTo(px+2*(qx-px)/3,py+2*(qy-py)/3,ex+2*(qx-ex)/3,ey+2*(qy-ey)/3,ex,ey);current=(ex,ey)
        elif kind==MplPath.CURVE4:path.curveTo(*v);current=tuple(v[-2:])
        elif kind==MplPath.CLOSEPOLY:path.close()
    c.saveState();c.translate(x-box.x0-(box.width/2 if center else 0),y-box.y0)
    c.setFillColor(colors.black);c.drawPath(path,fill=1,stroke=0);c.restoreState()

def text(s,x,y,size=12,bold=False,center=False):
    c.setFillColor(colors.black)
    c.setFont('WorksheetSerifBold' if bold else 'WorksheetSerif',size)
    (c.drawCentredString if center else c.drawString)(x,y,s)

def header(title,page):
    text('8th Grade Physical Science - Homework 1',42,755,18,True)
    text('Due: Friday, November 13, 2026',42,732,14,True)
    text(title,42,712,15,True)
    text(str(page)+' / 2',570,31,10,center=True)

def line(x1,y1,x2,y2,width=1,color=colors.black):
    c.setStrokeColor(color);c.setLineWidth(width);c.line(x1,y1,x2,y2)

def dimension(a,b,label,offset=8,size=13):
    x1,y1=a;x2,y2=b
    dx,dy=x2-x1,y2-y1;dist=math.hypot(dx,dy);nx,ny=-dy/dist,dx/dist
    line(x1,y1,x2,y2,.65)
    for x,y in (a,b):line(x-3*nx,y-3*ny,x+3*nx,y+3*ny,.8)
    # Small white backing keeps a label readable without adding a second path.
    cx,cy=(x1+x2)/2+nx*offset,(y1+y2)/2+ny*offset
    text(label,cx,cy-4,size,center=True)

def weight(x,top,m,label,size_factor=6.3,rotate=0):
    side=math.sqrt(m)*size_factor
    c.setFillColor(colors.HexColor('#f4f4f4'));c.setStrokeColor(colors.black);c.setLineWidth(1)
    c.rect(x-side/2,top-side,side,side,stroke=1,fill=1)
    text(label,x,top-side-16,13,center=True)
    return side

def lever(num,ml,dl,mr,dr,unknown,x,y):
    text(f'{num}. Find the missing '+('mass.' if unknown.startswith('m') else 'distance.'),x,y+220,14,True)
    # One common drawing scale across all lever diagrams: 3.25 pt per cm.
    scale=3.25;cx=x+126;cy=y+155
    pivot=cx+(dl-dr)*scale/2
    left=pivot-dl*scale;right=pivot+dr*scale
    c.setFillColor(colors.HexColor('#dddddd'));c.setStrokeColor(colors.black)
    c.rect(left-5,cy-3,right-left+10,6,stroke=1,fill=1)
    path=c.beginPath();path.moveTo(pivot,cy-4);path.lineTo(pivot-11,cy-25);path.lineTo(pivot+11,cy-25);path.close()
    c.setFillColor(colors.HexColor('#eeeeee'));c.drawPath(path,stroke=1,fill=1)
    dimension((left,cy+18),(pivot,cy+18),'d = ?' if unknown=='dl' else f'{dl} cm')
    dimension((pivot,cy+18),(right,cy+18),'d = ?' if unknown=='dr' else f'{dr} cm')
    for xx,m,key in ((left,ml,'ml'),(right,mr,'mr')):
        line(xx,cy-3,xx,cy-22,.8)
        weight(xx,cy-22,m,'m = ?' if unknown==key else f'{m} kg')

def ramp(num,length,height,block,counter,unknown,x,y):
    text(f'{num}. Find the '+('ramp length.' if unknown=='length' else 'missing mass.'),x,y+226,14,True)
    base=math.sqrt(length*length-height*height)
    scale=min(118/base,95/height)
    bx,by=x+10,y+53
    tx,ty=bx+base*scale,by+height*scale
    ux,uy=base/length,height/length;nx,ny=-uy,ux
    # Scale is identical horizontally and vertically within each ramp.
    path=c.beginPath();path.moveTo(bx,by);path.lineTo(tx,by);path.lineTo(tx,ty);path.close()
    c.setFillColor(colors.HexColor('#f5f5f5'));c.setStrokeColor(colors.black);c.setLineWidth(.9);c.drawPath(path,stroke=1,fill=1)
    line(bx,by,tx,ty,1.7)
    # A square block resting on the actual slope, area proportional to mass.
    side=math.sqrt(block)*4.2
    dist=length*scale*.40
    px,py=bx+ux*dist,by+uy*dist
    p=[(px-ux*side/2,py-uy*side/2),(px+ux*side/2,py+uy*side/2),
       (px+ux*side/2+nx*side,py+uy*side/2+ny*side),(px-ux*side/2+nx*side,py-uy*side/2+ny*side)]
    path=c.beginPath();path.moveTo(*p[0])
    for pt in p[1:]:path.lineTo(*pt)
    path.close();c.setFillColor(colors.HexColor('#e7e7e7'));c.drawPath(path,stroke=1,fill=1)
    # Label outside the rotated block so the numbers always remain upright.
    labelx,labely=px+nx*(side+16),py+ny*(side+16)
    text('m = ?' if unknown=='block' else f'{block} kg',labelx,labely,13,center=True)
    # Rope follows a true tangent to one top pulley, then hangs vertically.
    radius=7
    hanging_side=math.sqrt(counter)*4.2
    rope_height=side/2
    extension=max(10,(radius+hanging_side/2+8-nx*(rope_height-radius))/ux)
    pcx=tx+nx*(rope_height-radius)+ux*extension;pcy=ty+ny*(rope_height-radius)+uy*extension
    enter=(pcx+nx*radius,pcy+ny*radius)
    attachment=(px+ux*side/2+nx*rope_height,py+uy*side/2+ny*rope_height)
    line(*attachment,*enter,1)
    line(tx,ty,pcx,pcy,.8,colors.HexColor('#666666'))
    c.setFillColor(colors.white);c.setStrokeColor(colors.black);c.setLineWidth(1.1);c.circle(pcx,pcy,radius,stroke=1,fill=1)
    c.circle(pcx,pcy,1.4,stroke=1,fill=1)
    hx=pcx+radius;hytop=by+33
    line(hx,pcy,hx,hytop,1)
    weight(hx,hytop,counter,'m = ?' if unknown=='counter' else f'{counter} kg',4.2)
    # Diagonal dimension runs just inside the ramp, away from the box/rope.
    off=15
    a=(bx-nx*off,by-ny*off);b=(tx-nx*off,ty-ny*off)
    line(*a,*b,.65)
    for xx,yy in (a,b):line(xx-3*nx,yy-3*ny,xx+3*nx,yy+3*ny,.65)
    label='L = ?' if unknown=='length' else f'L = {length} m'
    # Rotate the label with the diagonal, showing the full ramp length once.
    c.saveState();c.translate((a[0]+b[0])/2-nx*9,(a[1]+b[1])/2-ny*9);c.rotate(math.degrees(math.atan2(uy,ux)))
    text(label,0,-4,13,center=True);c.restoreState()
    hdx=max(tx,hx+hanging_side/2)+18
    dimension((hdx,by),(hdx,ty),'',0)
    text(f'h = {height} m',hdx+6,(by+ty)/2-4,13)

header('Lever Balance',1)
text('Conservation of energy for an ideal machine:',42,693,12)
eq(r'F_1d_1=F_2d_2\quad\Rightarrow\quad m_1g d_1=m_2g d_2',306,674,18)
eq(r'\frac{m_1g d_1}{g}=\frac{m_2g d_2}{g}\quad\Rightarrow\quad m_1d_1=m_2d_2',306,636,18)
text('Divide by g, the gravitational acceleration. It is the same on both sides.',306,618,11,center=True)
text('For levers, use distances from the fulcrum; the shared rotation factor cancels.',306,600,11,center=True)
text('Massless beams. Diagrams drawn to scale.',42,578,11)
lever(1,6,40,12,20,'mr',42,317)
lever(2,15,16,10,24,'dr',318,317)
lever(3,16,30,24,20,'ml',42,63)
lever(4,8,40,20,16,'dl',318,63)
c.showPage()

header('Ramp Balance',2)
eq(r'm_1d_1=m_2d_2',306,687,19)
eq(r'm_{\mathrm{hanging}}\,L=m_{\mathrm{on\ ramp}}\,h',306,654,20)
text('L = diagonal ramp length     h = vertical height',306,633,12,center=True)
text('Frictionless ramps; ideal ropes and pulleys. Diagrams drawn to scale.',306,613,11,center=True)
ramp(5,10,6,30,18,'counter',42,332)
ramp(6,13,5,39,15,'block',318,332)
ramp(7,20,12,35,21,'length',42,69)
ramp(8,25,20,40,32,'length',318,69)
c.save()
print(OUT)
