(()=>{
 const key=location.pathname.match(/(terms|privacy|refund|ownership)(?:\.html)?\/?$/)?.[1]||'terms';
 const copy={en:{nav:['Terms of Use','Privacy Policy','Refund Policy','Ownership'],hub:'Nox / Legal & transparency',toc:'On this page',theme:'Change appearance',skip:'Skip to content',back:'Back to Nox',contact:'Questions? Get in touch',language:'Language'},uz:{nav:['Foydalanish shartlari','Maxfiylik siyosati','Qaytarish siyosati','Egalik'],hub:'Nox / Huquqiy ma’lumotlar',toc:'Sahifa mazmuni',theme:'Mavzuni almashtirish',skip:'Matnga o‘tish',back:'Nox’ga qaytish',contact:'Savolingiz bormi? Yozing',language:'Til'},ru:{nav:['Условия использования','Конфиденциальность','Возврат средств','Владелец'],hub:'Nox / Правовая информация',toc:'На этой странице',theme:'Сменить тему',skip:'Перейти к содержимому',back:'Вернуться в Nox',contact:'Есть вопросы? Напишите',language:'Язык'}};
 const keys=['terms','privacy','refund','ownership'];
 const moon='<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11.19 2A9 9 0 1 0 19.8 12.9 7 7 0 1 1 11.19 2Z" fill="currentColor"/></svg>';
 const sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
 const symbols={terms:'<path d="M94 78h44l15 15v70H94Z M138 78v16h15 M106 112h34m-34 13h34m-34 13h21"/>',privacy:'<path d="M124 77l35 14v29c0 23-35 43-35 43s-35-20-35-43V91Z"/><rect x="112" y="111" width="24" height="23" rx="5"/><path d="M117 111v-7a7 7 0 0 1 14 0v7m-7 17v-6"/>',refund:'<path d="M94 103a35 35 0 1 1-4 32 M94 82v23h23 M124 103v22l16 9"/>',ownership:'<path d="M133 87a35 35 0 1 0 25 45 28 28 0 0 1-25-45Z"/><path d="M164 86v16m-8-8h16"/>'};
 let observer, artEntered=false;
 function themeLabel(c){const b=document.getElementById('thm');if(b){b.innerHTML=document.documentElement.classList.contains('light')?moon:sun;b.setAttribute('aria-label',c.theme);b.title=c.theme;}}
 function enhance(){
  const lang=key==='ownership'?'en':document.documentElement.lang; const c=copy[lang]||copy.en;
  const wrap=document.querySelector('.wrap'),doc=document.getElementById('doc'); if(!wrap||!doc)return;
  document.querySelector('.legal-nav')?.remove();document.querySelector('.legal-footer')?.remove();
  const top=wrap.querySelector('nav');top.className='legal-top';top.setAttribute('aria-label','Nox');
  const ctrl=top.querySelector('.ctrl');
  if(ctrl&&key!=='ownership'){
   ctrl.querySelectorAll('[id^="l-"]').forEach(b=>{b.hidden=true;b.setAttribute('aria-hidden','true');});
   let sel=ctrl.querySelector('select');if(!sel){sel=document.createElement('select');sel.innerHTML='<option value="en">English</option><option value="uz">O‘zbekcha</option><option value="ru">Русский</option>';sel.addEventListener('change',()=>window.setL(sel.value));ctrl.prepend(sel);}sel.value=lang;sel.setAttribute('aria-label',c.language);
  }
  const nav=document.createElement('nav');nav.className='legal-nav';nav.setAttribute('aria-label',c.hub);nav.innerHTML=keys.map((k,i)=>'<a href="'+k+'.html"'+(key===k?' aria-current="page"':'')+'>'+c.nav[i]+'</a>').join('');top.after(nav);
  let head=doc.querySelector('header');head.className='legal-hero';
  const kicker=document.createElement('span');kicker.className='legal-kicker';kicker.textContent=c.hub;head.prepend(kicker);
  head.insertAdjacentHTML('beforeend','<svg class="legal-art" viewBox="0 0 248 248" fill="none" aria-hidden="true"><circle class="orbit" cx="124" cy="124" r="114"/><circle class="orbit" cx="124" cy="124" r="89" stroke-dasharray="2 7"/><rect class="plate" x="56" y="56" width="136" height="136" rx="38"/><g class="symbol">'+symbols[key]+'</g><circle class="orbit-dot" cx="238" cy="124" r="4" fill="currentColor"/></svg>');
  if(!artEntered){
    const art=head.querySelector('.legal-art');
    art.dataset.arrival=key;
    if(key==='terms'||key==='privacy')art.querySelector('.symbol path')?.setAttribute('pathLength','1');
    artEntered=true;
  }
  const layout=document.createElement('div');layout.className='legal-layout';const content=document.createElement('div');content.className='legal-copy';
  let section=null;Array.from(doc.children).filter(el=>el!==head).forEach(el=>{if(el.matches('h2')){section=document.createElement('section');section.className='legal-section';content.append(section);} (section||content).append(el);});
  const toc=document.createElement('details');toc.className='legal-toc';toc.open=innerWidth>620;const summary=document.createElement('summary');summary.textContent=c.toc;toc.append(summary);
  const headings=[...content.querySelectorAll('h2')];headings.forEach((h,i)=>{h.id='section-'+(i+1);const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;toc.append(a);});
  layout.append(toc,content);doc.append(layout);
  if(!headings.length){toc.innerHTML='<summary>'+c.toc+'</summary><a href="#ownership-details">Ownership details</a><a href="#rights">Rights & licenses</a>';content.querySelector('.card').id='ownership-details';content.querySelector('.note').id='rights';}
  wrap.querySelector('footer:not(.legal-footer)')?.setAttribute('hidden','');
  const footer=document.createElement('footer');footer.className='legal-footer';footer.innerHTML='<a href="/">← '+c.back+'</a><div class="footer-links"><a href="mailto:noxlab.help@gmail.com">'+c.contact+' ↗</a><span>© 2026 Nox</span></div>';wrap.append(footer);
  let skip=document.querySelector('.skip-link');if(!skip){skip=document.createElement('a');skip.className='skip-link';skip.href='#doc';document.body.prepend(skip);}skip.textContent=c.skip;doc.tabIndex=-1;
  themeLabel(c);observer?.disconnect();observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){toc.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'0px 0px -65% 0px'});headings.forEach(h=>observer.observe(h));
 }
 if(key==='ownership'){
  const main=document.querySelector('main');const brand=main.querySelector('.brand');brand.innerHTML=moon+'<span>nox</span>';const wrap=document.createElement('div');wrap.className='wrap';const nav=document.createElement('nav');nav.append(brand);nav.insertAdjacentHTML('beforeend','<div class="ctrl"><button id="thm" type="button" aria-label="Change appearance"></button></div>');const hero=document.createElement('header');main.querySelector('.eyebrow').remove();hero.append(main.querySelector('h1'),main.querySelector('.lede'));main.prepend(hero);main.querySelector('.links').remove();main.id='doc';main.before(wrap);wrap.append(nav,main);
  let theme;try{theme=localStorage.getItem('nox_theme');}catch{}document.documentElement.classList.toggle('light',theme==='light');document.getElementById('thm').onclick=()=>{const light=document.documentElement.classList.toggle('light');try{localStorage.setItem('nox_theme',light?'light':'dark');}catch{}themeLabel(copy.en);};
 }else{const original=window.render;window.render=function(){original();enhance();};const originalTheme=window.setT;window.setT=function(){originalTheme();themeLabel(copy[document.documentElement.lang]||copy.en);};}
 enhance();
})();
