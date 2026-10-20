async page => {
 // Instrument native Web Audio only in the QA browser. No production test hooks.
 await page.addInitScript(()=>{
  if(window.__festivalInstrumented)return;window.__festivalInstrumented=true;
  window.__ahAudio=[];window.__ahErrors=[];
  window.addEventListener('error',e=>window.__ahErrors.push(e.message));
  window.addEventListener('unhandledrejection',e=>window.__ahErrors.push(String(e.reason)));
  const Native=window.AudioContext;
  window.AudioContext=class extends Native{
   constructor(...args){super(...args);this.aa=[];this.osc=[];window.__ahAudio.push(this)}
   createAnalyser(){const a=super.createAnalyser();this.aa.push(a);return a}
   createOscillator(){const o=super.createOscillator();this.osc.push(o);return o}
  };
 });
 return {instrumented:true,note:'Open /#afterhours, then run phases 1–4 in this same arena session. Phase 1 reloads the page.'};
}
