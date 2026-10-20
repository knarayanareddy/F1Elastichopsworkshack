// Original musical identities. Genres are creative assignments, not driver tastes.
const definitions=[
 ['NOR','Papaya Aurora','Melodic trance',132,45,'trance',['#ff974f','#eaff67','#fb5fc0'],'aurora',11],
 ['VER','Midnight Voltage','Driving trance',136,38,'drive',['#6989ff','#63e5ff','#d1ff72'],'tunnel',23],
 ['LEC','Crimson Reverie','Melodic trance',130,41,'trance',['#ff4c85','#f8a4ff','#ffb157'],'petals',37],
 ['PIA','Peach Orbit','Progressive dance',128,40,'house',['#ffc285','#ff7dba','#82e4ff'],'orbit',47],
 ['SAI','Scarlet Frequency','Acid trance',138,43,'acid',['#ff663f','#f7ed76','#e06aff'],'grid',59],
 ['PER','Blue Hour','Deep progressive',126,47,'house',['#48bcff','#7a83ff','#76ffd1'],'waves',67],
 ['RUS','Silver Current','Uplifting trance',140,40,'trance',['#b9faff','#5ad9d0','#c4a5ff'],'rays',79],
 ['HAM','Violet Motion','Electro dance',130,37,'acid',['#c17aff','#fc69a7','#8affd9'],'orbit',89],
 ['GAS','Ultraviolet Drift','Psychedelic trance',140,36,'psy',['#bd61ff','#ff70dc','#5fe4ff'],'tunnel',101],
 ['ALO','Emerald Afterglow','Progressive trance',128,43,'trance',['#57edb5','#c9f47b','#5bbdff'],'aurora',113],
 ['HUL','Ice Circuit','Minimal dance',132,38,'drive',['#c2e8ff','#78b1ff','#f5fb88'],'grid',127],
 ['RIC','Electric Smile','Disco house',124,45,'house',['#6fc9ff','#ffae60','#e5ff70'],'petals',139],
 ['STR','Green Mirage','Deep dance',126,42,'house',['#58cc9d','#c2f684','#72dfee'],'waves',151],
 ['ALB','Azure Velocity','Liquid trance',134,47,'trance',['#46b9ff','#a38aff','#6ff5cb'],'rays',163],
 ['OCO','Pink Resonance','Psy-trance',138,39,'psy',['#fa70cb','#b091ff','#88ffe6'],'petals',173],
 ['SAR','Coastal Signal','Balearic dance',128,43,'house',['#8edcff','#91a8ff','#ffe09a'],'waves',181],
 ['TSU','Chromatic Rush','Cyber trance',140,37,'psy',['#8b91ff','#ff85ee','#a2ff83'],'tunnel',193],
 ['MAG','White Heat','Hard groove',136,40,'drive',['#e8f3f3','#ff8055','#c2f87d'],'grid',211],
 ['BOT','Lime Acid','Acid house',128,38,'acid',['#c2ff54','#65efbe','#bd91ff'],'orbit',223],
 ['ZHO','Jade Skyline','Cosmic trance',132,42,'trance',['#78f0be','#d6ff74','#849eff'],'aurora',239]
];
export const SCALES={trance:[0,2,3,5,7,8,10],house:[0,2,3,5,7,9,10],acid:[0,1,3,5,7,8,10],psy:[0,1,3,5,7,8,10],drive:[0,2,3,5,7,8,10],melodic:[0,2,3,5,7,8,10],groove:[0,2,3,5,7,8,10],breaks:[0,2,3,5,7,8,10]};
const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
export const PROFILES=definitions.map(([code,title,genre,bpm,root,style,palette,pattern,seed],index)=>({code,title,genre,bpm,root,style,palette,pattern,seed,index,key:names[root%12]+(style==='house'?' Dorian':style==='acid'||style==='psy'?' Phrygian':' minor'),
 progression:[[0,5,3,6],[0,3,5,4],[0,6,3,5],[0,4,5,3]][index%4],
 motif:Array.from({length:16},(_,i)=>((i*(index%3+1)+Math.floor(i/4)*(index%5+1)+seed)%7)),
 rhythm:Array.from({length:16},(_,i)=>i%2===0||((i+seed)%5===0)),
 bassPattern:Array.from({length:16},(_,i)=>i%4===2||(style==='psy'&&i%4!==0)||((i+seed)%7===0))}));
export const PROFILE_BY_CODE=Object.fromEntries(PROFILES.map(p=>[p.code,p]));
export const midiHz=m=>440*2**((m-69)/12);
export function scaleNote(profile,degree,octave=0){const scale=SCALES[profile.style],i=((degree%7)+7)%7;return profile.root+12*octave+12*Math.floor(degree/7)+scale[i]}
export function sectionAt(bar){return ['DRIVE','LIFT','BREAK','DROP'][Math.floor((bar%32)/8)]}
export function musicalStep(profile,index,telemetry={},intensity=.65,boost=false){
 const step=index%16,bar=Math.floor(index/16),section=boost?'DROP':sectionAt(bar),chord=profile.progression[Math.floor(bar/2)%4],gear=Number.isFinite(telemetry.gear)?telemetry.gear:5,style=profile.style;
 const energy=Math.max(.15,Math.min(1,intensity+(boost?.2:0))),breakdown=section==='BREAK'&&bar%8<4&&!boost;
 const kickPattern=style==='breaks'?[0,3,6,10]:[0,4,8,12],leadPattern=style==='house'?[3,7,10,14]:style==='melodic'?[2,6,10,14]:style==='groove'?[2,7,10,15]:null;
 const bass=style==='psy'?step%4!==0:style==='breaks'?[0,2,7,8,10,14].includes(step):style==='acid'?[0,2,6,8,10,14].includes(step):style==='melodic'?[0,6,8,14].includes(step):profile.bassPattern[step];
 return {step,bar,section,chord,kick:kickPattern.includes(step)&&!breakdown,clap:(step===4||step===12)&&!breakdown,
  hat:style==='breaks'?step%2===1:step%4===2||((style==='psy'||style==='groove'||section==='DROP')&&energy>.45&&step%2===1),openHat:step===14&&bar%2===1,
  tom:(style==='groove'||style==='drive')&&[3,6,11,14].includes(step)&&!breakdown,
  bass:bass&&!breakdown,bassMidi:scaleNote(profile,chord+(step===14?4:0)),
  lead:(leadPattern?leadPattern.includes(step):profile.rhythm[step])&&(energy>.3||step%4===2),leadMidi:scaleNote(profile,chord+profile.motif[(step+Math.floor(bar/4))%16],gear>=7?3:2),
  pad:step===0,chordMidi:[0,2,4].map(n=>scaleNote(profile,chord+n,2)),energy,boost};
}
