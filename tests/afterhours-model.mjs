import fs from 'node:fs';import crypto from 'node:crypto';
import {PROFILES,PROFILE_BY_CODE,musicalStep,scaleNote,midiHz,sectionAt} from '../frontend/src/afterhours/profiles.js';
import {danceFrame,circuitMap} from '../frontend/src/afterhours/model.js';
const checks=[],measurements={},started=Date.now();const check=(name,ok=true)=>{checks.push({name,passed:!!ok});if(!ok)throw new Error(name)};
try{
 const d=await fetch((process.env.PITLANE_TEST_URL||'http://127.0.0.1:8000')+'/api/afterhours').then(r=>r.json());
 check('Twenty distinct profiles cover the twenty real driver laps',PROFILES.length===20&&new Set(PROFILES.map(p=>p.code)).size===20&&d.drivers.every(v=>PROFILE_BY_CODE[v.code]));
 const hashes=new Set();
 for(const p of PROFILES){
  check(`${p.code}: original musical and visual identity`,p.title.length>5&&p.bpm>=120&&p.bpm<=140&&p.palette.length===3&&p.pattern&&p.key&&p.motif.length===16);
  const score=Array.from({length:128},(_,i)=>musicalStep(p,i,{gear:6,speed:240,throttle:90,available:true},.65));hashes.add(crypto.createHash('sha256').update(JSON.stringify({score,bpm:p.bpm,palette:p.palette})).digest('hex'));
  check(`${p.code}: pitched parts stay finite and in audible register`,score.every(s=>[s.leadMidi,s.bassMidi,...s.chordMidi].every(n=>Number.isFinite(midiHz(n))&&midiHz(n)>20&&midiHz(n)<5000)));
  check(`${p.code}: dance rhythm has kicks, bass, percussion and melody`,score.some(s=>s.kick)&&score.some(s=>s.bass)&&score.some(s=>s.clap)&&score.some(s=>s.hat)&&score.some(s=>s.lead)&&score.some(s=>s.pad));
  check(`${p.code}: telemetry changes register without inventing notes`,musicalStep(p,6,{gear:8},.65).leadMidi-musicalStep(p,6,{gear:3},.65).leadMidi===12);
 }
 check('All twenty score/palette fingerprints differ',hashes.size===20);check('Arrangement evolves through four musical sections',[0,8,16,24].map(sectionAt).join(',')==='DRIVE,LIFT,BREAK,DROP');
 const spread=danceFrame(d,0,'spread'),aligned=danceFrame(d,0,'aligned');check('Dance formation distributes all twenty independent lap phases',new Set(spread.map(r=>r.progress.toFixed(3))).size===20&&spread.every(r=>r.available));check('Aligned starts really align at zero',aligned.every(r=>r.lap_time===0&&r.offset_s===0&&r.available));
 let frames=0;for(let t=0;t<300;t+=.5){for(const r of danceFrame(d,t,'spread')){frames++;if(!r.available||r.lap_time<0||r.lap_time>=r.lap_time_s||!Number.isFinite(r.x)||!Number.isFinite(r.y))throw new Error('Invalid looping observation')}}
 check('Five-minute dance playback keeps every car within its recorded lap',frames===12000);measurements.observed_driver_frames=frames;
 const a=danceFrame(d,12,'aligned'),b=danceFrame(d,12+d.drivers[0].lap_time_s,'aligned');check('A car loops its own measured duration, not a fabricated common lap',Math.abs(a[0].x-b[0].x)<1e-6&&Math.abs(a[0].y-b[0].y)<1e-6);
 const map=circuitMap(d.reference,900,500);check('Circuit mapping produces finite stage coordinates',d.reference.trace.x.every((x,i)=>map.point(x,d.reference.trace.y[i]).every(Number.isFinite)));
 console.log('PASS',checks.length,'Afterhours music/data model checks',measurements);
}finally{fs.writeFileSync('qa/afterhours-model-results.json',JSON.stringify({created_at:new Date().toISOString(),passed:checks.filter(c=>c.passed).length,total:checks.length,duration_ms:Date.now()-started,measurements,checks},null,2))}
