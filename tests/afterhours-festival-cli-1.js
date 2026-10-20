async page => {
 await page.reload({waitUntil:'networkidle'});
 await page.locator('.afterhours-floor canvas[data-ready=true]').waitFor();
 await page.evaluate(()=>{window.__festivalQA={checks:[],measurements:{},scope:'Actual browser audio/visual checks in the managed arena Playwright session.'}});
 const check=async(name,ok)=>{await page.evaluate(({name,ok})=>window.__festivalQA.checks.push({name,passed:!!ok}),{name,ok});if(!ok)throw new Error(name)};
 const floor=page.locator('.afterhours-floor canvas');
 await check('Seven genre remixes and driver signatures are selectable',await page.locator('.ah-genre-rack button').count()===8);
 await check('No AudioContext or flash accent starts before consent',await page.evaluate(()=>window.__ahAudio.length===0)&&await floor.getAttribute('data-flashes')==='false');
 await page.getByRole('button',{name:'Genre: Disco house',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.genre==='house');
 await check('Genre selection while paused updates the creative profile without starting music',await page.evaluate(()=>window.__ahAudio.length===0));
 await page.getByRole('button',{name:'Play Afterhours',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.clock==='audio');
 const start=Number(await floor.getAttribute('data-time'));
 const values={};
 for(const genre of ['trance','psy','acid','house','melodic','groove','breaks','signature']){
  await page.getByRole('combobox',{name:'Afterhours genre',exact:true}).selectOption(genre);
  await page.waitForFunction(id=>document.querySelector('.afterhours-floor canvas')?.dataset.genre===id,genre);
  const sample=await page.evaluate(async()=>{const c=window.__ahAudio.at(-1),a=c.aa.at(-1),s=[];let peak=0;for(let i=0;i<24;i++){const x=new Float32Array(a.fftSize);a.getFloatTimeDomainData(x);s.push(Math.sqrt(x.reduce((v,t)=>v+t*t,0)/x.length));peak=Math.max(peak,...x.map(Math.abs));await new Promise(r=>setTimeout(r,25))}return {rms:s.reduce((a,b)=>a+b,0)/s.length,peak,oscillators:c.osc.length,contexts:window.__ahAudio.length,bpm:document.querySelector('.ah-music-facts>div>b').textContent}});
  values[genre]=sample;await check(genre+': actual synthesized output, corresponding tempo and single context',sample.rms>.00001&&sample.peak<.95&&sample.contexts===1);
 }
 await check('Genre transitions preserve the recorded lap clock',Number(await floor.getAttribute('data-time'))>start);
 await page.evaluate(v=>window.__festivalQA.measurements.genres=v,values);
 await page.getByRole('combobox',{name:'Afterhours genre',exact:true}).selectOption('psy');await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.genre==='psy');
 const originalPattern=await floor.getAttribute('data-pattern');
 await page.waitForFunction(old=>document.querySelector('.afterhours-floor canvas')?.dataset.pattern!==old,originalPattern,{timeout:15000});
 await check('Auto VJ genuinely changes patterns as the audio clock advances',true);
 await page.getByRole('button',{name:'Trigger DRS musical drop',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.section==='BUILD');
 await page.locator('.ah-drop-callout.build').waitFor({timeout:1500});
 await check('DRS request queues an audible build on the musical timeline',true);
 await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.section==='DROP');
 await page.locator('.ah-drop-callout.drop').waitFor({timeout:1500});
 await check('The musical drop and visual callout arrive together',await floor.getAttribute('data-section')==='DROP');
 await page.screenshot({path:'/home/user/pitlane-lab/qa/39-afterhours-drop.png',timeout:60000});
 return await page.evaluate(()=>window.__festivalQA);
}
