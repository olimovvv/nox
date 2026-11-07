/* Broadcast carries invalidations only. Every data read remains owner-scoped in loadTasks. */
(()=>{
 const dayVisible=()=>typeof user!=='undefined'&&user&&activeTab==='daily'&&!document.hidden;
 let channel=null,channelOwner=null,joined=false,timer=0,loading=false,again=false,lastDay='';
 function refresh(){
   if(!dayVisible()||!navigator.onLine)return;
   if(loading){again=true;return;}
   loading=true;
   Promise.resolve(loadTasks()).catch(()=>{}).finally(()=>{loading=false;if(again){again=false;schedule();}});
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(refresh,160);}
 function connect(){
   const uid=typeof user==='undefined'?null:user?.id;
   if(uid===channelOwner)return;
   if(channel)void sb.removeChannel(channel);
   joined=false;channel=null;channelOwner=uid;
   if(!uid)return;
   channel=sb.channel('planner-updates:'+uid).on('broadcast',{event:'changed'},schedule);
   const current=channel;
   channel.subscribe(status=>{if(channel!==current)return;joined=status==='SUBSCRIBED';if(joined)schedule();});
 }
 function grains(x,y,success=false){
   if(document.documentElement.hasAttribute('data-nx-light-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches||!window.confetti)return;
   window.confetti({origin:{x,y},particleCount:success?30:42,angle:success?90:28,spread:success?65:36,gravity:.44,drift:success?0:.65,scalar:.33,startVelocity:success?16:13,decay:.94,ticks:66,colors:success?['#77d5b0','#d0e6dc']:['#9b9791','#b1a899','#746f67'],shapes:['square'],disableForReducedMotion:true,zIndex:9000});
 }
 function before(){
   if(!dayVisible())return;
   const day=user.id+'|'+(selCalDate||todayISO()),list=document.querySelector('#daily-list');
   if(!list||lastDay!==day){lastDay=day;return;}
   return new Map([...list.querySelectorAll('[data-task-id]')].map(row=>[row.dataset.taskId,{row,done:row.querySelector('[role="checkbox"]')?.getAttribute('aria-checked')==='true',focused:row.querySelector('[role="checkbox"]')===document.activeElement,subopen:!row.querySelector('.subtask-list')?.classList.contains('hidden'),subdraft:row.querySelector('.subtask-list input')?.value,subfocused:row.querySelector('.subtask-list input')===document.activeElement,subcursor:row.querySelector('.subtask-list input')?.selectionStart,rect:row.getBoundingClientRect()}]));
 }
 function after(previous){
   if(!previous)return;
   const light=document.documentElement.hasAttribute('data-nx-light-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
   const rows=[...document.querySelectorAll('#daily-list [data-task-id]')],ids=new Set(rows.map(row=>row.dataset.taskId));
   for(const row of rows){
     const old=previous.get(row.dataset.taskId),check=row.querySelector('[role="checkbox"]'),done=check?.getAttribute('aria-checked')==='true';
     if(old?.subopen){const panel=row.querySelector('.subtask-list'),input=panel?.querySelector('input');panel?.classList.remove('hidden');if(input&&old.subdraft!==undefined){input.value=old.subdraft;if(old.subfocused&&document.activeElement===document.body){input.focus({preventScroll:true});if(old.subcursor!=null)input.setSelectionRange(old.subcursor,old.subcursor);}}}
     if(old?.focused&&document.activeElement===document.body)check?.focus({preventScroll:true});
     if(light)continue;
     if(!old){
       row.classList.add('nx-arriving','fadeInUp');
       const clear=()=>row.classList.remove('nx-arriving','fadeInUp');
       row.addEventListener('animationend',clear,{once:true});row.addEventListener('animationcancel',clear,{once:true});setTimeout(clear,600);
     }else if(old.done!==done){
       check?.animate(done?[{transform:'scale(.8)'},{transform:'scale(1.08)',offset:.65},{transform:'scale(1)'}]:[{transform:'scale(.94)'},{transform:'scale(1)'}],{duration:done?300:150,easing:'cubic-bezier(.2,.85,.3,1)'});
       const line=row.querySelector('.strike-line');if(done&&line){line.style.transformOrigin='left center';line.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});}
       const label=row.querySelector('.task-txt-wrap');if(label)label.animate([{opacity:done?.75:.5},{opacity:1}],{duration:230,easing:'ease-out'});
     }
   }
   if(light)return;
   let count=0;
   for(const [id,{row,rect}] of previous){if(ids.has(id)||rect.bottom<0||rect.top>innerHeight||!rect.width||count++>=3)continue;
     const ghost=document.createElement('div');ghost.className='day-task-row nx-vanishing fadeOutRight';ghost.setAttribute('aria-hidden','true');ghost.textContent=row.querySelector('.task-txt-wrap')?.textContent||'';
     Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);grains((rect.left+rect.width*.48)/innerWidth,(rect.top+rect.height*.5)/innerHeight);setTimeout(()=>ghost.remove(),420);
   }
 }
 window.NoxTaskLive={before,after,grains,notify(){connect();if(joined)void channel.send({type:'broadcast',event:'changed',payload:{}});}};
 // Poll only a visible Daily as a fallback for dropped sockets and older clients.
 setInterval(()=>{connect();if(dayVisible())schedule();},18000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){connect();schedule();}});
 window.addEventListener('online',()=>{connect();schedule();});
 const original=window.initLiveSync;window.initLiveSync=function(){original();connect();};
 const teardown=window.teardownLiveSync;window.teardownLiveSync=function(){teardown();if(channel)void sb.removeChannel(channel);channel=null;channelOwner=null;joined=false;clearTimeout(timer);};
 let library;
 function loadLibrary(){
   if(window.Tesseract)return Promise.resolve(window.Tesseract);
   if(!library)library=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/planner-vendor/tesseract.min.js';script.onload=()=>resolve(window.Tesseract);script.onerror=()=>{library=null;reject(Error('Could not load image reader'));};document.head.append(script);});
   return library;
 }
 window.NoxLocalCapture={async read(canvas,lang,date,onText){
   const T=await loadLibrary(),base=location.origin+'/assets/planner-vendor/';
   const worker=await T.createWorker('eng+rus',1,{workerPath:base+'worker.min.js',workerBlobURL:false,corePath:base+'tesseract-core-lstm.wasm.js',langPath:base});
   try{const {data}=await worker.recognize(canvas);onText?.(data.text);return data.text.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.length>2).slice(0,30).map(line=>{const a=NoxPlannerCore.parse(line,date);return {...a,text:a.text.slice(0,120),kind:/\b(daily|every day|har kuni)\b/i.test(line)?'habit':'task'};}).filter(x=>x.text);}
   finally{await worker.terminate();}
 }};
})();
