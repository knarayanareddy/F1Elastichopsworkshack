async page => {
 const check=async(name,ok)=>{await page.evaluate(({name,ok})=>window.__festivalQA.checks.push({name,passed:!!ok}),{name,ok});if(!ok)throw new Error(name)};
 await page.getByRole('combobox',{name:'Afterhours genre',exact:true}).selectOption('breaks');await page.getByRole('button',{name:'Play Afterhours',exact:true}).click();
 for(const code of ['NOR','VER','LEC','PIA','SAI','PER','RUS','HAM','GAS','ALO','HUL','RIC','STR','ALB','OCO','SAR','TSU','MAG','BOT','ZHO']){
  await page.getByRole('combobox',{name:'Afterhours driver',exact:true}).selectOption(code);
  await page.waitForFunction(code=>{const c=document.querySelector('.afterhours-floor canvas');return c?.dataset.driver===code&&c.dataset.genre==='breaks'},code);
  await check(code+': driver identity survives genre remix and bar-quantized cue',true);
 }
 await check('One active audio context handles all twenty remixed drivers',await page.evaluate(()=>window.__ahAudio.filter(c=>c.state==='running').length===1));
 const lead=page.getByRole('group',{name:'Music layers',exact:true}).getByRole('button',{name:'lead',exact:true});await lead.click();await check('Individual stem control remains available with genre remixes',await lead.getAttribute('aria-pressed')==='false');
 await page.getByRole('slider',{name:'Afterhours volume',exact:true}).evaluate(el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'0');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});await page.waitForTimeout(400);
 const rms=await page.evaluate(()=>{const c=window.__ahAudio.at(-1),a=c.aa.at(-1),x=new Float32Array(a.fftSize);a.getFloatTimeDomainData(x);return Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length)});await check('Zero volume silences the genre engine',rms<.00001);
 await page.getByRole('slider',{name:'Afterhours volume',exact:true}).evaluate(el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'25');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.getByRole('button',{name:'Pause Afterhours',exact:true}).click();await page.waitForTimeout(350);const held=await page.locator('.afterhours-floor canvas').getAttribute('data-beat');await page.waitForTimeout(200);
 await check('Pause freezes the visual beat instead of resetting its pattern phase',await page.locator('.afterhours-floor canvas').getAttribute('data-beat')===held);
 await check('Unmuted pause silences all voices and effect tails',await page.evaluate(()=>{const c=window.__ahAudio.at(-1),a=c.aa.at(-1),x=new Float32Array(a.fftSize);a.getFloatTimeDomainData(x);return Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length)<.00001}));
 await page.getByRole('button',{name:'Play Afterhours',exact:true}).click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(350);
 await check('Hiding the page stops the new genre/drop scheduler',await page.getByRole('button',{name:'Play Afterhours',exact:true}).isVisible());await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await page.evaluate(()=>{location.hash='overview'});await page.locator('.ideas-grid').waitFor();await check('The five-experiment collection is preserved',await page.locator('.idea-card').count()===5);
 await check('All genre-engine contexts close after navigation',await page.evaluate(()=>window.__ahAudio.every(c=>c.state==='closed')));
 await check('No runtime errors across full festival lifecycle',await page.evaluate(()=>window.__ahErrors.length===0));
 await page.evaluate(()=>{window.__festivalQA.created_at=new Date().toISOString();window.__festivalQA.errors=window.__ahErrors;window.__festivalQA.passed=window.__festivalQA.checks.filter(c=>c.passed).length;window.__festivalQA.total=window.__festivalQA.checks.length});return await page.evaluate(()=>window.__festivalQA);
}
