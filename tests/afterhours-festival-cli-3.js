async page => {
 const check=async(name,ok)=>{await page.evaluate(({name,ok})=>window.__festivalQA.checks.push({name,passed:!!ok}),{name,ok});if(!ok)throw new Error(name)};
 await page.evaluate(()=>{location.hash='dashboard'});await page.locator('[data-dashboard-page="dashboard"] h1').waitFor();
 await check('Leaving the set closes every music context',await page.evaluate(()=>window.__ahAudio.every(c=>c.state==='closed')));
 for(const id of ['dashboard','timing','calendar','results','driver-standings','constructor-standings','drivers','teams','driver-stats','head-to-head','consistency','race-pace','pit-stops','tyres','weather','race-control','track-dna','data','connections']){
  await page.evaluate(id=>{location.hash=id},id);const root=page.locator(`[data-dashboard-page="${id}"]`);await root.locator('.db-page-heading').waitFor();await root.locator('.db-busy').waitFor({state:'hidden'});
  await check('Retained dashboard route: '+id,await root.locator('.db-load-error').count()===0);
 }
 await page.evaluate(()=>{location.hash='afterhours'});await page.locator('.afterhours-floor canvas[data-ready=true]').waitFor();
 const contexts=await page.evaluate(()=>window.__ahAudio.length);
 await page.getByRole('button',{name:'Auto DJ OFF',exact:true}).click();await page.getByRole('button',{name:'Visuals only',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.driver==='HAM',null,{timeout:18000});await page.waitForTimeout(1200);
 await check('Silent Auto DJ changes one driver per phrase, not every render frame',await page.locator('.afterhours-floor canvas').getAttribute('data-driver')==='HAM');
 await check('Visual rehearsal creates no audio and identifies its preview clock',await page.evaluate(()=>window.__ahAudio.length)===contexts&&await page.locator('.afterhours-floor canvas').getAttribute('data-clock')==='preview');
 await page.getByRole('button',{name:'Pause Afterhours',exact:true}).click();await page.getByRole('button',{name:'Auto DJ ON',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Afterhours genre',exact:true}).selectOption('acid');await page.waitForTimeout(150);
 await check('Genre rack and performance controls fit mobile',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'/home/user/pitlane-lab/qa/41-afterhours-festival-mobile.png',fullPage:true,timeout:60000});
 await page.getByRole('button',{name:'Expand Afterhours',exact:true}).click();await page.getByRole('dialog',{name:'Immersive Afterhours dance floor',exact:true}).waitFor();
 await check('Mobile theatre exposes genre, driver, mute and Calm controls',await page.getByRole('combobox',{name:'Afterhours genre',exact:true}).isVisible()&&await page.getByRole('combobox',{name:'Afterhours driver',exact:true}).isVisible()&&await page.getByRole('button',{name:'Calm lights',exact:true}).isVisible());
 await page.keyboard.press('Escape');await check('Escape exits performance theatre',await page.getByRole('dialog').count()===0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.afterhours-floor canvas')?.dataset.calm==='true');
 await check('Reduced-motion preference overrides flashing and pattern animation',await page.locator('.afterhours-floor canvas').getAttribute('data-flashes')==='false'&&await page.getByRole('button',{name:'Flash accents OFF',exact:true}).isDisabled());
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1050});
 await check('No unexpected browser runtime errors',await page.evaluate(()=>window.__ahErrors.length===0));
 await page.evaluate(()=>{window.__festivalQA.created_at=new Date().toISOString();window.__festivalQA.errors=window.__ahErrors;window.__festivalQA.passed=window.__festivalQA.checks.filter(c=>c.passed).length;window.__festivalQA.total=window.__festivalQA.checks.length});
 return await page.evaluate(()=>window.__festivalQA);
}
