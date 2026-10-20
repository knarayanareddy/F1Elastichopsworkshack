import {PROFILE_BY_CODE} from './profiles.js';
// Original synth arrangements inspired by broad electronic genres, not artist recordings.
export const GENRES=[
 {id:'signature',name:'Driver signature',short:'Signature',tag:'20 PERSONAL MIXES',description:'Keep each driver’s original musical identity.',color:'#e7ff6a'},
 {id:'trance',name:'Uplifting trance',short:'Trance',tag:'SUPERSAWS / EUPHORIA',description:'Wide supersaws, rolling arpeggios and soaring pads.',bpm:138,style:'trance',color:'#b68aff',palette:['#9b75ff','#63f2ff','#ff82d6'],patterns:['tunnel','petals','rays'],leadWave:'sawtooth',bassWave:'sawtooth',spread:9,swing:0,leadLength:1.8},
 {id:'psy',name:'Psytrance',short:'Psytrance',tag:'ROLLING / HYPNOTIC',description:'Rolling sixteenths, gated motifs and kaleidoscopic geometry.',bpm:144,style:'psy',color:'#e0ff64',palette:['#c4ff5c','#c176ff','#55ffdc'],patterns:['kaleido','tunnel','petals'],leadWave:'square',bassWave:'sawtooth',spread:0,swing:0,leadLength:.85},
 {id:'acid',name:'Acid techno',short:'Acid',tag:'303 / WAREHOUSE',description:'Resonant acid bass, sharp hats and industrial laser grids.',bpm:136,style:'acid',color:'#91ff79',palette:['#9eff5e','#ff6bba','#95a6ff'],patterns:['grid','rays','tunnel'],leadWave:'square',bassWave:'sawtooth',spread:0,swing:0,leadLength:1.05},
 {id:'house',name:'Disco house',short:'House',tag:'SWING / CHORD STABS',description:'Swung hats, offbeat bass and bright chord stabs.',bpm:124,style:'house',color:'#ffb96d',palette:['#ffb65b','#ff77bd','#84eaff'],patterns:['checker','orbit','waves'],leadWave:'triangle',bassWave:'triangle',spread:0,swing:.16,leadLength:2.2},
 {id:'melodic',name:'Melodic techno',short:'Melodic',tag:'DEEP / CINEMATIC',description:'Deep pulses, restrained motifs and evolving atmospheric pads.',bpm:126,style:'melodic',color:'#73dbff',palette:['#65ddff','#bd86ff','#85ffd0'],patterns:['aurora','orbit','waves'],leadWave:'sine',bassWave:'triangle',spread:4,swing:0,leadLength:3.4},
 {id:'groove',name:'Hardgroove',short:'Groove',tag:'PERCUSSION / DRIVE',description:'Syncopated percussion, tom fills and a muscular low end.',bpm:140,style:'groove',color:'#ff8762',palette:['#ff8958','#ffdc79','#bc85ff'],patterns:['rays','grid','checker'],leadWave:'triangle',bassWave:'sawtooth',spread:0,swing:.05,leadLength:.95},
 {id:'breaks',name:'Drum & bass',short:'D&B',tag:'BREAKS / BASS PRESSURE',description:'Broken kick patterns, fast snares and filtered bass movement.',bpm:172,style:'breaks',color:'#ff79cd',palette:['#ff72cf','#98ff73','#7f9aff'],patterns:['vortex','rays','kaleido'],leadWave:'sawtooth',bassWave:'square',spread:5,swing:0,leadLength:1.4}
];
export const GENRE_BY_ID=Object.fromEntries(GENRES.map(g=>[g.id,g]));
const keys=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const blend=(a,b,f)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-f)+parseInt(b.slice(i,i+2),16)*f).toString(16).padStart(2,'0')).join('');
export function resolveMix(code='NOR',genreId='signature'){
 const p=PROFILE_BY_CODE[code]||PROFILE_BY_CODE.NOR,id=GENRE_BY_ID[genreId]?genreId:'signature';
 const fallback={drive:'groove',trance:'trance',house:'house',acid:'acid',psy:'psy'}[p.style]||'trance',g=GENRE_BY_ID[id==='signature'?fallback:id];
 const signature=id==='signature',style=signature?p.style:g.style;
 return {...p,mixId:p.code+'/'+id,genreId:id,style,genre:signature?p.genre:g.name,bpm:signature?p.bpm:g.bpm+[-2,0,2][p.index%3],
  key:keys[p.root%12]+(style==='house'?' Dorian':['acid','psy'].includes(style)?' Phrygian':' minor'),
  palette:signature?p.palette:p.palette.map((c,i)=>blend(c,g.palette[i],.58)),
  patterns:[...new Set([signature?p.pattern:g.patterns[0],...g.patterns])],
  pattern:signature?p.pattern:g.patterns[0],sound:g,remixTitle:signature?p.title:`${p.title} / ${g.short}`};
}
export function visualPlan(profile,beat,auto=true,calm=false){
 const patterns=profile.patterns||[profile.pattern],phrase=Math.floor(Math.max(0,beat)/16),phase=(Math.max(0,beat)%16)/16;
 if(calm||!auto)return {from:patterns[0],to:patterns[0],mix:0,phrase:0};
 return {from:patterns[phrase%patterns.length],to:patterns[(phrase+1)%patterns.length],mix:Math.max(0,(phase-.70)/.30),phrase};
}
// Flash accents are opt-in and localized. The renderer adds a wall-clock
// cooldown too, so a tempo/driver change cannot create a burst of flashes.
export function flashRequest(beat,{enabled=false,calm=false,playing=false}={}){
 return enabled&&!calm&&playing&&beat>=0&&beat%2<.10;
}
export function frequencyBands(spectrum){
 const mean=(a,b)=>{let n=0;for(let i=a;i<b;i++)n+=(spectrum?.[i]||0)/255;return n/(b-a)};
 return {low:mean(2,15),mid:mean(15,65),high:mean(65,180)};
}
