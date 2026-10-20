import React,{useEffect,useRef} from 'react';
import {circuitMap} from './model.js';
import {PROFILE_BY_CODE} from './profiles.js';
import {flashRequest} from './genres.js';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const rgba=(c,a)=>`rgba(${c.map(Math.round).join(',')},${Math.max(0,Math.min(1,a))})`;
export default function DanceFloor({data,stateRef,onSelect}){
 const canvas=useRef(null),host=useRef(null),select=useRef(onSelect);select.current=onSelect;
 useEffect(()=>{
  const el=canvas.current,node=host.current,ctx=el.getContext('2d');if(!ctx||!node)return;
  let w=1,h=1,map,raf,alive=true,last=performance.now(),points=[],lastFormation='',lastTime=-1,lastFlash=-10000,flashUntil=0;const trails=new Map();let palette=PROFILE_BY_CODE.NOR.palette.map(rgb);
  const resize=()=>{if(!alive||!node.isConnected)return;w=node.clientWidth;h=node.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.6);el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);map=circuitMap(data.reference,w,h);trails.clear()};const observer=new ResizeObserver(resize);observer.observe(node);resize();
  const path=()=>{ctx.beginPath();map.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()};
  const pattern=(name,p,beat,bands,weight,calm,energy)=>{
   if(weight<.005)return;if(calm)beat=0;const extent=Math.max(w,h),phase=calm?0:beat*.07,seed=p.seed,mid=calm?0:bands.mid,low=calm?0:bands.low;
   ctx.save();ctx.globalAlpha=weight;ctx.translate(w*.5,h*.51);ctx.lineWidth=1.15;
   if(name==='checker'||name==='grid'){
    ctx.rotate(name==='checker'?-.32:-.13);ctx.scale(1,.65);const tile=38+(seed%3)*6;
    for(let y=-9;y<10;y++)for(let x=-14;x<15;x++){
     const wave=Math.sin((x+y)*.7+phase*2),accent=(x+2*y+Math.floor(beat/2))%7===0;
     ctx.strokeStyle=rgba(palette[(x+y+60)%3],.06);ctx.strokeRect(x*tile,y*tile,tile-4,tile-4);
     if(name==='checker'&&(wave>.55||accent)){ctx.fillStyle=rgba(palette[(x+2*y+60)%3],.025+(accent?.07:0)+low*.07);ctx.fillRect(x*tile,y*tile,tile-4,tile-4)}
    }
   }else if(name==='tunnel'){
    for(let i=0;i<16;i++){const travel=calm?i/16:((i/16+beat/48)%1),r=(.06+travel**1.5)*extent*.85;ctx.strokeStyle=rgba(palette[i%3],.035+(1-travel)*.16+mid*.04);ctx.lineWidth=1+(1-travel)*1.4;ctx.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3+phase*.12+(seed%7)*.09;const x=Math.cos(a)*r,y=Math.sin(a)*r*.62;n?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
   }else if(name==='kaleido'||name==='petals'){
    const petals=5+seed%4;for(let j=0;j<9;j++){ctx.beginPath();const size=(j+1)*extent*.038;for(let n=0;n<=144;n++){const a=n/144*Math.PI*2,r=size*(.78+.22*Math.sin(a*petals+phase*2))*(1+low*.09),x=Math.cos(a+phase*.18)*r,y=Math.sin(a+phase*.18)*r*.72;n?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=rgba(palette[j%3],.08+mid*.1);ctx.stroke()}
   }else if(name==='orbit'){
    for(let i=0;i<14;i++){ctx.save();ctx.rotate(phase*.3+i*Math.PI/9);ctx.strokeStyle=rgba(palette[i%3],.07+low*.07);ctx.beginPath();ctx.ellipse(0,0,w*(.15+i*.018),h*(.12+i*.007),0,0,Math.PI*2);ctx.stroke();ctx.restore()}
   }else if(name==='vortex'||name==='rays'){
    for(let i=0;i<36;i++){const a=i/36*Math.PI*2+phase*.5;ctx.strokeStyle=rgba(palette[i%3],.04+mid*.08);ctx.beginPath();const inner=50+low*20;ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);if(name==='vortex')ctx.quadraticCurveTo(Math.cos(a+.8)*extent*.35,Math.sin(a+.8)*extent*.22,Math.cos(a+1.1)*extent,Math.sin(a+1.1)*extent*.7);else ctx.lineTo(Math.cos(a)*extent,Math.sin(a)*extent);ctx.stroke()}
   }else{
    for(let i=-10;i<=10;i++){ctx.strokeStyle=rgba(palette[(i+12)%3],.055+mid*.08);ctx.lineWidth=name==='aurora'?2:1;ctx.beginPath();for(let x=-w/2;x<=w/2;x+=8){const y=i*18+Math.sin(x/(75+seed%40)+phase+i*.27)*(30+low*65)+Math.cos(x*.009-phase*.4)*20;x===-w/2?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
   }
   ctx.restore();
  };
  const click=e=>{const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let best=null,distance=28;for(const p of points){const d=Math.hypot(x-p.x,y-p.y);if(d<distance){best=p;distance=d}}if(best)select.current(best.code)};el.addEventListener('click',click);
  const draw=now=>{
   if(!alive)return;raf=requestAnimationFrame(draw);const s=stateRef.current;if(!s||!map)return;
   const dt=Math.min(.06,(now-last)/1000),p=s.profile,calm=s.calm,beat=s.musicBeat||0,bands=s.bands||{low:0,mid:0,high:0},energy=s.intensity||.75,drop=s.dropState==='drop',kick=calm?0:s.kick||0;last=now;
   const next=p.palette.map(rgb);for(let i=0;i<3;i++)for(let c=0;c<3;c++)palette[i][c]+=(next[i][c]-palette[i][c])*(1-Math.exp(-dt*5));
   if(flashRequest(beat,{enabled:s.flashes,calm,playing:s.playing})&&now-lastFlash>750){lastFlash=now;flashUntil=now+65}
   const accent=!calm&&s.flashes&&s.playing&&now<flashUntil?(flashUntil-now)/65:0;
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#060710';ctx.fillRect(0,0,w,h);
   const halo=ctx.createRadialGradient(w*.5,h*.53,20,w*.5,h*.53,w*.69);halo.addColorStop(0,rgba(palette[0],calm?.08:.12+bands.low*.16));halo.addColorStop(.6,rgba(palette[2],calm?.025:.065+bands.mid*.04));halo.addColorStop(1,'#060710');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
   const plan=s.vj||{from:p.pattern,to:p.pattern,mix:0};pattern(plan.from,p,beat,bands,1-plan.mix,calm,energy);if(plan.to!==plan.from)pattern(plan.to,p,beat,bands,plan.mix,calm,energy);
   // Slow sweeping cones plus thin beat/spectrum-reactive lasers; never a full-screen white flash.
   if(!calm){
    const count=4+Math.floor(energy*3);for(let i=0;i<count;i++){const x=w*(.08+i*.84/(count-1)),tip=w*(.5+Math.sin(beat*.035+i*1.8+p.seed)*.44),beam=ctx.createLinearGradient(x,0,tip,h);beam.addColorStop(0,rgba(palette[i%3],.09+bands.mid*.11+(drop?.03:0)));beam.addColorStop(1,rgba(palette[i%3],0));ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(tip-w*.075,h);ctx.lineTo(tip+w*.075,h);ctx.closePath();ctx.fill();
     ctx.strokeStyle=rgba(palette[(i+1)%3],.16+bands.high*.30);ctx.lineWidth=.7+bands.high;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(tip,h);ctx.stroke();ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(tip+w*.055,h);ctx.stroke();
    }
   }
   // Mirrorball highlights vary smoothly with the spectrum rather than strobing.
   const ballX=w*.5,ballY=h*.16,r=Math.min(25,w*.035);ctx.save();ctx.translate(ballX,ballY);ctx.rotate(calm?0:beat*.012);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle='#181727';ctx.fill();ctx.strokeStyle=rgba(palette[1],.55);ctx.stroke();for(let y=-r+4;y<r;y+=6)for(let x=-r+3;x<r;x+=6){if(x*x+y*y<r*r){ctx.fillStyle=rgba(palette[Math.abs(Math.round(x+y))%3],.2+Math.abs(Math.sin(x+y+(calm?0:beat*.05)))*.25);ctx.fillRect(x,y,3,3)}}ctx.restore();
   ctx.save();ctx.lineJoin='round';ctx.lineCap='round';path();ctx.strokeStyle='#0b0c19';ctx.lineWidth=w<500?19:25;ctx.stroke();path();ctx.shadowColor=rgba(palette[0],.8);ctx.shadowBlur=calm?8:14+bands.low*18;ctx.strokeStyle=rgba(palette[0],calm?.55:.68+kick*.17);ctx.lineWidth=2.4+kick*.7;ctx.stroke();ctx.shadowBlur=0;
   path();ctx.setLineDash([3,8]);ctx.lineDashOffset=calm?0:-beat*8;ctx.strokeStyle=rgba(palette[1],.65);ctx.lineWidth=1.3;ctx.stroke();ctx.setLineDash([]);
   // Sixteen illuminated gates turn the actual track outline into a step sequencer.
   const step=Math.floor(beat*4)%16;for(let i=0;i<16;i++){const n=Math.floor(i/16*(map.points.length-1)),a=map.points[n],b=map.points[Math.min(map.points.length-1,n+1)],angle=Math.atan2(b[1]-a[1],b[0]-a[0]),lit=!calm&&s.playing&&i===step;ctx.save();ctx.translate(...a);ctx.rotate(angle);ctx.fillStyle=rgba(palette[i%3],lit?.95:.16+accent*.55);ctx.shadowColor=rgba(palette[i%3],.9);ctx.shadowBlur=lit&&!calm?12:0;ctx.fillRect(-2,-12,4,24);ctx.restore()}
   ctx.restore();
   // Read the actual output spectrum. Silent/muted music has a flat radial meter.
   const levels=s.spectrum||[],cx=w*.51,cy=h*.54;ctx.save();ctx.translate(cx,cy);for(let i=0;i<48;i++){const a=i/48*Math.PI*2-Math.PI/2,v=(levels[i*3+2]||0)/255,len=calm?3:3+v*43;ctx.strokeStyle=rgba(palette[i%3],.25+v*.5);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Math.cos(a)*43,Math.sin(a)*43);ctx.lineTo(Math.cos(a)*(43+len),Math.sin(a)*(43+len));ctx.stroke()}
   ctx.strokeStyle=rgba(palette[1],.13+kick*.24);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,calm?49:50+(1-kick)*28,0,Math.PI*2);ctx.stroke();ctx.fillStyle=rgba(palette[0],.95);ctx.font=`600 ${w<500?22:30}px 'Space Grotesk Variable',sans-serif`;ctx.textAlign='center';ctx.fillText(p.code,0,6);ctx.font='7px monospace';ctx.fillStyle='#b1a2c5';ctx.fillText(p.genre.toUpperCase(),0,23);ctx.restore();
   const starCount=calm?12:drop?94:65;for(let i=0;i<starCount;i++){const a=i*2.399+p.seed,travel=calm?.5:((beat*.035+i*.073)%1),radius=40+travel*Math.max(w,h)*.66,x=cx+Math.cos(a+(calm?0:beat*.009))*radius,y=cy+Math.sin(a+(calm?0:beat*.009))*radius*.62;ctx.strokeStyle=rgba(palette[i%3],calm?.10:(1-travel)*(.17+bands.high*.30));ctx.lineWidth=i%7===0?2:1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(calm?0:Math.cos(a)*(drop?14:4)),y+(calm?0:Math.sin(a)*(drop?9:3)));ctx.stroke()}
   if(lastFormation!==s.formation||Math.abs(s.elapsed-lastTime)>2){trails.clear();lastFormation=s.formation}points=[];
   for(const row of s.rows){if(!row.available)continue;const[x,y]=map.point(row.x,row.y),focus=row.code===p.code,color=focus?palette[0]:rgb(PROFILE_BY_CODE[row.code].palette[0]);let trail=trails.get(row.code)||[];
    if(s.elapsed!==lastTime){trail.push([x,y]);if(trail.length>(focus?40:17))trail.shift();trails.set(row.code,trail)}
    if(!calm&&trail.length>1){ctx.beginPath();trail.forEach(([tx,ty],i)=>i?ctx.lineTo(tx,ty):ctx.moveTo(tx,ty));ctx.lineWidth=focus?3:1.3;ctx.strokeStyle=rgba(color,focus?.5:.23);ctx.stroke()}
    points.push({code:row.code,x,y});ctx.save();ctx.translate(x,y);
    if(focus){ctx.beginPath();ctx.arc(0,0,calm?14:15+kick*10,0,Math.PI*2);ctx.fillStyle=rgba(color,.08);ctx.fill();ctx.strokeStyle=rgba(color,.8);ctx.lineWidth=1.3;ctx.stroke();if(!calm){ctx.beginPath();ctx.arc(0,0,22+(1-kick)*28,0,Math.PI*2);ctx.strokeStyle=rgba(color,kick*.40);ctx.stroke()}}
    ctx.rotate(Math.atan2(-row.dy,row.dx)+Math.PI/2);ctx.shadowColor=rgba(color,.9);ctx.shadowBlur=focus?18:7;ctx.fillStyle=rgba(color,focus?1:.85);ctx.fillRect(-2.8,-6.5,5.6,13);ctx.fillRect(-5,-5,10,2);ctx.fillRect(-5,4,10,2);ctx.shadowBlur=0;ctx.fillStyle='#05050c';for(const tx of [-5,3])for(const ty of [-4,3])ctx.fillRect(tx,ty,2,3);ctx.restore();
    if(s.labels||focus){ctx.font=`${focus?'700':'500'} ${w<500?8:9}px monospace`;const tw=ctx.measureText(row.code).width;ctx.fillStyle='#090814e6';ctx.fillRect(x+8,y-15,tw+7,13);ctx.fillStyle=rgba(color,focus?1:.88);ctx.textAlign='left';ctx.fillText(row.code,x+11,y-5)}
   }
   // Opt-in, low-rate accents stay around the track/corners, never a white-out.
   if(accent>0){ctx.save();ctx.lineWidth=1+accent*2;ctx.strokeStyle=rgba(palette[1],accent*.7);ctx.strokeRect(8,8,w-16,h-16);for(const [x,y] of [[18,18],[w-18,18],[18,h-18],[w-18,h-18]]){ctx.beginPath();ctx.arc(x,y,3+accent*7,0,Math.PI*2);ctx.fillStyle=rgba(palette[1],accent*.5);ctx.fill()}ctx.restore()}
   lastTime=s.elapsed;el.dataset.ready='true';el.dataset.driver=p.code;el.dataset.genre=p.genreId;el.dataset.pattern=plan.mix>.5?plan.to:plan.from;el.dataset.patternMix=plan.mix.toFixed(3);el.dataset.cars=String(points.length);el.dataset.time=s.elapsed.toFixed(3);el.dataset.formation=s.formation;el.dataset.calm=String(calm);el.dataset.beat=beat.toFixed(3);el.dataset.clock=s.clockMode;el.dataset.flashes=String(!!s.flashes&&!calm);el.dataset.flashPulse=accent.toFixed(3);el.dataset.section=s.section;
  };raf=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();el.removeEventListener('click',click)};
 },[data,stateRef]);
 return <div className="afterhours-floor" ref={host}><canvas ref={canvas} aria-label="Interactive 2D dance-floor map of twenty recorded best laps"/><div className="ah-floor-coordinate">52°23′N / 4°32′E <span>ZANDVOORT, REIMAGINED</span></div><div className="ah-floor-hint">CLICK A CAR · CHANGE THE SOUND</div></div>;
}
