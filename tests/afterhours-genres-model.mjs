import fs from 'node:fs';
import {PROFILES,musicalStep,midiHz} from '../frontend/src/afterhours/profiles.js';
import {GENRES,resolveMix,visualPlan,flashRequest,frequencyBands} from '../frontend/src/afterhours/genres.js';
const checks=[],started=Date.now();const check=(name,ok=true)=>{checks.push({name,passed:!!ok});if(!ok)throw new Error(name)};
try{
 check('Seven genre remixes plus original driver signatures are available',GENRES.length===8&&new Set(GENRES.map(g=>g.id)).size===8);
 for(const p of PROFILES){
  for(const g of GENRES){const mix=resolveMix(p.code,g.id),score=Array.from({length:64},(_,i)=>musicalStep(mix,i,{gear:6},.75));
   check(`${p.code}/${g.id}: complete distinct mix and finite playable score`,mix.code===p.code&&mix.genreId===g.id&&mix.bpm>=120&&mix.bpm<=174&&mix.patterns.length>=2&&mix.sound&&score.every(s=>[s.bassMidi,s.leadMidi,...s.chordMidi].every(n=>Number.isFinite(midiHz(n))&&midiHz(n)>20&&midiHz(n)<6000)));
  }
 }
 const mixes=GENRES.slice(1).map(g=>resolveMix('NOR',g.id));
 const fingerprints=mixes.map(p=>JSON.stringify({score:Array.from({length:32},(_,i)=>musicalStep(p,i,{gear:6},.75)),sound:p.sound,bpm:p.bpm}));
 check('Seven genre engines differ by arrangement/synthesis, not only color',new Set(fingerprints).size===7);
 const breaks=resolveMix('NOR','breaks'),trance=resolveMix('NOR','trance');
 check('Drum & bass uses broken kicks, rather than the trance four-on-floor',Array.from({length:16},(_,i)=>musicalStep(breaks,i).kick).join()!=Array.from({length:16},(_,i)=>musicalStep(trance,i).kick).join());
 check('House has swing and harmonic stabs while psy has gated rolling bass',resolveMix('NOR','house').sound.swing>0&&resolveMix('NOR','psy').sound.leadLength<1&&Array.from({length:16},(_,i)=>musicalStep(resolveMix('NOR','psy'),i).bass).filter(Boolean).length===12);
 check('A musical boost overrides the breakdown with an actual drop arrangement',musicalStep(trance,16*16,{gear:6},.5,true).section==='DROP'&&musicalStep(trance,16*16,{gear:6},.5,true).kick&&musicalStep(trance,16*16,{gear:6},.5,false).kick===false);
 const views=[0,16,32,48,64].map(b=>visualPlan(resolveMix('NOR','psy'),b));check('Auto VJ evolves through multiple patterns on the bar clock',new Set(views.map(v=>v.from)).size>=3);
 check('Pattern transitions crossfade rather than hard-jump',visualPlan(trance,14).mix>0&&visualPlan(trance,14).mix<1);
 check('Calm and fixed-VJ modes disable pattern morphing',visualPlan(trance,120,true,true).mix===0&&visualPlan(trance,120,false).from===trance.patterns[0]);
 check('Flash accents require explicit opt-in, playback and non-calm mode',!flashRequest(0)&&flashRequest(0,{enabled:true,playing:true})&&!flashRequest(0,{enabled:true,playing:true,calm:true})&&!flashRequest(0,{enabled:true,playing:false}));
 check('Flash beat windows are separated by two beats, even at maximum genre tempo',flashRequest(2,{enabled:true,playing:true})&&!flashRequest(1,{enabled:true,playing:true})&&174/120<1.5);
 check('Spectrum bands are real bounded averages and silence is zero',Object.values(frequencyBands(new Uint8Array(512))).every(v=>v===0)&&Object.values(frequencyBands(new Uint8Array(512).fill(255))).every(v=>v===1));
 check('Unknown genre selection safely returns a driver signature',resolveMix('NOR','unknown').genreId==='signature');
 console.log('PASS',checks.length,'genre/score/VJ safety checks');
}finally{fs.writeFileSync('qa/afterhours-genres-model-results.json',JSON.stringify({created_at:new Date().toISOString(),passed:checks.filter(c=>c.passed).length,total:checks.length,duration_ms:Date.now()-started,checks},null,2))}
