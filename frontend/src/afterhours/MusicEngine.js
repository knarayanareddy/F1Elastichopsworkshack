import {musicalStep,midiHz,sectionAt} from './profiles.js';
import {resolveMix} from './genres.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function noise(ctx,seed,seconds=.5){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate),x=b.getChannelData(0),rnd=random(seed);for(let i=0;i<x.length;i++)x[i]=rnd()*2-1;return b}
function impulse(ctx,seed){const b=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.8),ctx.sampleRate),rnd=random(seed);for(let ch=0;ch<2;ch++){const x=b.getChannelData(ch);for(let i=0;i<x.length;i++)x[i]=(rnd()*2-1)*Math.pow(1-i/x.length,2.7)*.5}return b}
function gain(ctx,value=1){const n=ctx.createGain();n.gain.value=value;return n}
function envelope(ctx,t,duration,level,attack=.007,release=.1){const n=gain(ctx,0);n.gain.setValueAtTime(.00001,t);n.gain.linearRampToValueAtTime(level,t+attack);n.gain.exponentialRampToValueAtTime(Math.max(.00002,level*.55),t+Math.max(attack+.01,duration-release));n.gain.exponentialRampToValueAtTime(.00001,t+duration);return n}
function voiceBus(ctx,out,profile,layers){
 const root=gain(ctx,0),duck=gain(ctx,1),channels=Object.fromEntries(['drums','bass','lead','pads'].map(k=>[k,gain(ctx,layers[k]?1:0)])),nodes=[root,duck,...Object.values(channels)],sources=new Set(),sound=profile.sound;
 root.connect(out);channels.drums.connect(root);duck.connect(root);
 const bassTone=ctx.createBiquadFilter();bassTone.type='lowpass';bassTone.frequency.value=600;bassTone.Q.value=profile.style==='acid'?7:1.3;channels.bass.connect(bassTone);bassTone.connect(duck);nodes.push(bassTone);
 const tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=2200;tone.Q.value=1.1;channels.lead.connect(tone);tone.connect(duck);nodes.push(tone);
 const delay=ctx.createDelay(2),feedback=gain(ctx,.23),wet=gain(ctx,.16),delayTone=ctx.createBiquadFilter();delay.delayTime.value=60/profile.bpm*.75;delayTone.type='lowpass';delayTone.frequency.value=3400;tone.connect(delay);delay.connect(delayTone);delayTone.connect(feedback);feedback.connect(delay);delayTone.connect(wet);wet.connect(duck);nodes.push(delay,feedback,wet,delayTone);
 const reverb=ctx.createConvolver(),reverbGain=gain(ctx,profile.style==='melodic'?.33:.23);reverb.buffer=impulse(ctx,profile.seed);channels.pads.connect(duck);channels.pads.connect(reverb);reverb.connect(reverbGain);reverbGain.connect(duck);nodes.push(reverb,reverbGain);
 const white=noise(ctx,profile.seed);
 const track=(source,t,end,cleanup)=>{sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();cleanup?.()};source.start(t);source.stop(end)};
 const note=(midi,t,duration,level,type='sawtooth',channel='lead',spread=0,pan=0)=>{
  const env=envelope(ctx,t,duration,level,channel==='pads'?.22:.006,channel==='pads'?Math.min(1,duration*.4):duration*.75),panner=ctx.createStereoPanner();panner.pan.value=pan;env.connect(panner);panner.connect(channels[channel]);const detunes=spread?[-spread,0,spread]:[0];let left=detunes.length;
  for(const detune of detunes){const osc=ctx.createOscillator();osc.type=type;osc.frequency.value=midiHz(midi);osc.detune.value=detune;osc.connect(env);track(osc,t,t+duration+.02,()=>{if(--left===0){env.disconnect();panner.disconnect()}})}
 };
 const percussion=(t,duration,level,type,freq)=>{const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=envelope(ctx,t,duration,level,.002,duration*.85);src.buffer=white;filter.type=type;filter.frequency.value=freq;filter.Q.value=.7;src.connect(filter);filter.connect(env);env.connect(channels.drums);track(src,t,t+duration+.02,()=>{filter.disconnect();env.disconnect()})};
 const kick=(t,energy)=>{const osc=ctx.createOscillator(),env=envelope(ctx,t,.34,.64*(.65+energy*.35),.003,.28);osc.type='sine';osc.frequency.setValueAtTime(150,t);osc.frequency.exponentialRampToValueAtTime(48+(profile.seed%5),t+.075);osc.frequency.exponentialRampToValueAtTime(40,t+.31);osc.connect(env);env.connect(channels.drums);track(osc,t,t+.36,()=>env.disconnect());percussion(t,.017,.025,'highpass',6500);duck.gain.setValueAtTime(.26,t);duck.gain.exponentialRampToValueAtTime(1,t+.23)};
 const riser=(start,end)=>{if(end<=start+.1)return;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=gain(ctx,0);src.buffer=white;src.loop=true;filter.type='highpass';filter.frequency.setValueAtTime(500,start);filter.frequency.exponentialRampToValueAtTime(10500,end);env.gain.setValueAtTime(.00001,start);env.gain.linearRampToValueAtTime(.075,end-.03);env.gain.exponentialRampToValueAtTime(.00001,end+.07);src.connect(filter);filter.connect(env);env.connect(channels.drums);track(src,start,end+.10,()=>{env.disconnect();filter.disconnect()})};
 const schedule=(index,t,telemetry,intensity,boost=false,shift=false)=>{
  const step=musicalStep(profile,index,telemetry,intensity,boost),sixteenth=60/profile.bpm/4,swing=(index%2?sound.swing||0:0)*sixteenth,at=t+swing,speed=telemetry.available?telemetry.speed:180,throttle=telemetry.available?telemetry.throttle:65,rpm=telemetry.available?telemetry.rpm:10000;
  tone.frequency.setTargetAtTime(clamp(750+speed*5+throttle*15+(boost?1200:0),700,6800),at,.055);tone.Q.setTargetAtTime(profile.style==='acid'?3+rpm/6000:.6+rpm/12000,at,.1);wet.gain.setTargetAtTime(telemetry.brake>0?.26:.14,at,.12);
  bassTone.frequency.setTargetAtTime(profile.style==='acid'?300+throttle*11:profile.style==='breaks'?320+speed*2:profile.style==='psy'?420:650,at,.04);
  if(step.kick)kick(at,step.energy);
  if(step.clap){percussion(at,profile.style==='breaks'?.19:.14,.15,'bandpass',profile.style==='breaks'?1900:1400);percussion(at+.012,.10,.08,'highpass',1800)}
  if(step.hat)percussion(at,.045,.048+(profile.seed%4)*.006,'highpass',7500);
  if(step.openHat)percussion(at,.18,.045,'highpass',8500);
  if(step.tom)note(48+(step.step%3)*5,at,.13,.10,'sine','drums',0,step.step%2?.35:-.35);
  if(shift)percussion(at,.06,.045,'bandpass',2400);
  if(boost&&step.step===0)percussion(at,.42,.075,'highpass',5000);
  if(step.bass)note(step.bassMidi,at,sixteenth*(profile.style==='psy'?.78:profile.style==='breaks'?1.8:1.4),profile.style==='psy'?.145:.125,sound.bassWave||'sawtooth','bass');
  if(step.lead){
   if(profile.style==='house')for(let i=0;i<3;i++)note(step.chordMidi[i],at,sixteenth*2.4,.019,'triangle','lead',0,(i-1)*.25);
   else note(step.leadMidi,at,sixteenth*(sound.leadLength||1.8),(.016+step.energy*.017)*(step.section==='BREAK'?.6:1),sound.leadWave||'sawtooth','lead',(sound.spread||0)+(profile.style==='trance'?rpm/4500:0),((step.step%4)-1.5)*.14);
  }
  if(step.pad&&step.bar%2===0)for(let i=0;i<3;i++)note(step.chordMidi[i],at,60/profile.bpm*7.7,profile.style==='melodic'?.017:.011,profile.style==='house'?'sine':'triangle','pads',4,(i-1)*.45);
  return {time:at,kick:step.kick,hat:step.hat,clap:step.clap,shift,section:step.section};
 };
 const silence=()=>{for(const src of sources){try{src.stop(ctx.currentTime+.025)}catch{}}};
 const dispose=()=>{silence();for(const node of nodes)try{node.disconnect()}catch{};sources.clear()};
 return {profile,root,channels,schedule,riser,silence,dispose};
}

export class MusicEngine{
 constructor(onCue=()=>{}){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Web Audio is unavailable');
  this.context=new Audio({latencyHint:'interactive'});this.onCue=onCue;this.master=gain(this.context,0);this.limiter=this.context.createDynamicsCompressor();this.limiter.threshold.value=-17;this.limiter.knee.value=12;this.limiter.ratio.value=8;this.limiter.attack.value=.003;this.limiter.release.value=.12;
  this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.analyser.smoothingTimeConstant=.68;this.master.connect(this.limiter);this.limiter.connect(this.analyser);this.analyser.connect(this.context.destination);
  this.volume=.25;this.enabled=true;this.intensity=.75;this.layers={drums:true,bass:true,lead:true,pads:true};this.buses=new Set();this.cleanupTimers=new Set();this.profile=resolveMix();this.heard=this.profile;this.playing=false;this.queued=null;this.activation=null;this.telemetry={available:false};this.closed=false;this.beatEpoch=0;this.events=[];this.dropAt=0;this.boostUntil=0;this.lastGear=0;this.lastShift=-Infinity;this.pendingShift=false;this.frozenBeat=0;
 }
 async resume(){if(this.context.state==='suspended')await this.context.resume()}
 updateMaster(){if(!this.closed)this.master.gain.setTargetAtTime(this.playing&&this.enabled?clamp(this.volume,0,1)*.58:0,this.context.currentTime,.025)}
 setVolume(value){this.volume=clamp(value,0,1);this.updateMaster()}
 setEnabled(enabled){this.enabled=enabled;this.updateMaster()}
 setIntensity(value){this.intensity=clamp(value,.15,1)}
 setTelemetry(value){
  const v=value||{available:false};if(this.playing&&v.available&&v.gear>0&&this.lastGear>0&&v.gear!==this.lastGear&&this.context.currentTime-this.lastShift>.35){this.pendingShift=true;this.lastShift=this.context.currentTime}
  this.lastGear=v.available?v.gear:0;this.telemetry=v;
 }
 setLayer(layer,enabled){if(!(layer in this.layers))return;this.layers[layer]=enabled;for(const bus of this.buses)bus.channels[layer].gain.setTargetAtTime(enabled?1:0,this.context.currentTime,.03)}
 activate(profile,t){
  const previous=this.bus,bus=voiceBus(this.context,this.master,profile,this.layers);this.buses.add(bus);bus.root.gain.setValueAtTime(.00001,t);bus.root.gain.linearRampToValueAtTime(.72,t+.18);
  if(previous){previous.root.gain.cancelScheduledValues(t);previous.root.gain.setValueAtTime(Math.max(.001,previous.root.gain.value),t);previous.root.gain.linearRampToValueAtTime(0,t+.20);const timer=setTimeout(()=>{previous.dispose();this.buses.delete(previous);this.cleanupTimers.delete(timer)},Math.max(0,t-this.context.currentTime)*1000+500);this.cleanupTimers.add(timer)}
  this.bus=bus;this.profile=profile;this.activation={profile,time:t};this.dropAt=0;this.boostUntil=0;this.lastGear=0;this.pendingShift=false;
 }
 advanceCue(){if(this.activation&&this.context.currentTime>=this.activation.time){this.heard=this.activation.profile;this.beatEpoch=this.activation.time;this.activation=null;this.events=this.events.filter(e=>e.time>=this.beatEpoch);this.onCue(this.heard)}}
 select(code,genre='signature'){
  const p=resolveMix(code,genre);if(this.playing){this.queued=p.mixId===this.profile.mixId?null:p;return}
  this.queued=null;this.profile=p;this.heard=p;this.frozenBeat=0;this.onCue(p);
 }
 start(code,genre='signature'){
  if(this.closed||this.playing)return;this.playing=true;this.queued=null;this.step=0;this.events=[];this.nextTime=this.context.currentTime+.045;this.beatEpoch=this.nextTime;this.frozenBeat=0;this.activate(resolveMix(code,genre),this.nextTime);this.updateMaster();this.tick();this.timer=setInterval(()=>this.tick(),25);
 }
 requestDrop(){
  if(!this.playing||this.activation||this.queued||this.boostUntil>this.context.currentTime)return false;
  const now=this.context.currentTime,quarter=60/this.heard.bpm,bar=quarter*4;let at=this.beatEpoch+(Math.floor((now-this.beatEpoch)/bar)+1)*bar;if(at-now<quarter*.75)at+=bar;
  this.dropAt=at;this.boostUntil=at+bar*4;this.bus.riser(now+.025,at);return true;
 }
 tick(){
  if(this.closed||!this.playing||this.context.state!=='running')return;this.advanceCue();const now=this.context.currentTime;
  if(this.nextTime<now-.25){const interval=60/this.profile.bpm/4;this.step=Math.max(this.step,Math.floor((now-this.beatEpoch)/interval)+1);this.nextTime=this.beatEpoch+this.step*interval}
  let scheduled=0;while(this.nextTime<now+.12&&scheduled++<32){
   if(this.queued&&this.step%16===0){this.activate(this.queued,this.nextTime);this.queued=null;this.step=0}
   const boost=this.dropAt>0&&this.nextTime>=this.dropAt&&this.nextTime<this.boostUntil,shift=this.pendingShift&&this.step%2===0;if(shift)this.pendingShift=false;
   this.events.push(this.bus.schedule(this.step,this.nextTime,this.telemetry,this.intensity,boost,shift));this.step++;this.nextTime+=60/this.profile.bpm/4;
  }
  this.events=this.events.filter(e=>e.time>now-2);
 }
 state(){
  this.advanceCue();const now=this.context.currentTime,beat=this.playing?Math.max(0,(now-this.beatEpoch)*this.heard.bpm/60):this.frozenBeat||0,bar=Math.floor(beat/4),building=this.playing&&this.dropAt>now,dropping=this.playing&&this.dropAt>0&&now>=this.dropAt&&now<this.boostUntil;
  const recent=kind=>{const e=this.events.filter(e=>e[kind]&&e.time<=now).at(-1);return this.playing&&this.layers.drums&&e?Math.exp(-(now-e.time)*(kind==='kick'?11:18)):0};
  return {profile:this.heard,code:this.heard.code,genreId:this.heard.genreId,bpm:this.heard.bpm,beat,bar,step:Math.floor(beat*4)%16,queued:this.queued||this.activation?.profile||null,playing:this.playing,
   section:dropping?'DROP':building?'BUILD':sectionAt(bar),dropState:dropping?'drop':building?'build':'idle',dropBeats:building?Math.ceil((this.dropAt-now)*this.heard.bpm/60):0,dropRemaining:dropping?(this.boostUntil-now)*this.heard.bpm/60:0,
   kick:recent('kick'),hat:recent('hat'),clap:recent('clap'),shift:recent('shift'),audible:this.playing&&this.enabled&&this.volume>0};
 }
 pause(){if(this.closed)return;this.frozenBeat=this.state().beat;this.playing=false;this.queued=null;this.activation=null;this.dropAt=0;this.boostUntil=0;this.events=[];this.pendingShift=false;clearInterval(this.timer);this.timer=null;this.updateMaster();for(const bus of this.buses)bus.silence()}
 dispose(){if(this.closed)return;this.pause();this.closed=true;for(const t of this.cleanupTimers)clearTimeout(t);for(const bus of this.buses)bus.dispose();this.buses.clear();this.master.disconnect();this.limiter.disconnect();this.analyser.disconnect();this.context.close().catch(()=>{})}
}
