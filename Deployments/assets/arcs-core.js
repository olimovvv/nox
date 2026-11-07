/* Date-only challenge calculations. No network or mutable global state. */
(function(root){
  'use strict';
  const DAY=86400000;
  function ordinal(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;
    const ms=Date.parse(value+'T12:00:00Z');
    return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value?Math.floor(ms/DAY):NaN;
  }
  function add(date,days){return new Date((ordinal(date)+days)*DAY).toISOString().slice(0,10);}
  function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function validate(a){return !!a&&typeof a.title==='string'&&a.title.trim().length>0&&a.title.length<=120&&typeof a.intention==='string'&&a.intention.length<=500&&Number.isFinite(ordinal(a.start_date))&&Number.isInteger(a.duration)&&a.duration>=7&&a.duration<=365&&Array.isArray(a.rituals)&&a.rituals.length>=1&&a.rituals.length<=6&&new Set(a.rituals.map(r=>r.id)).size===a.rituals.length&&a.rituals.every(r=>typeof r.id==='string'&&/^[A-Za-z0-9-]{1,64}$/.test(r.id)&&typeof r.title==='string'&&r.title.trim().length>0&&r.title.length<=120);}
  function stats(a,checks,now=today()){
    if(!validate(a)||!Number.isFinite(ordinal(now)))throw new Error('Invalid Arc or date');
    const days=Array.from({length:a.duration},(_,i)=>add(a.start_date,i));
    const set=new Set(checks.filter(c=>c.arc_id===a.id&&c.date<=now).map(c=>c.date+'|'+c.ritual_id));
    const counts=days.map(d=>a.rituals.filter(r=>set.has(d+'|'+r.id)).length);
    const full=counts.map(n=>n===a.rituals.length);
    const elapsed=Math.max(0,Math.min(a.duration,ordinal(now)-ordinal(a.start_date)+1));
    const done=full.filter(Boolean).length,completed=counts.reduce((sum,n)=>sum+n,0);
    let run=0,longest=0,streak=0;
    full.forEach((v,i)=>{if(days[i]>now)return;run=v?run+1:0;longest=Math.max(longest,run);});
    let i=elapsed-1;if(days[i]===now&&!full[i])i--;
    for(;i>=0&&full[i];i--)streak++;
    return {days,counts,full,elapsed,done,completed,streak,longest,end:days.at(-1),percent:Math.round(done/a.duration*100),consistency:elapsed?Math.round(completed/(elapsed*a.rituals.length)*100):0,status:a.archived?'archived':now<a.start_date?'upcoming':now>days.at(-1)?'finished':'active'};
  }
  const api={ordinal,add,today,validate,stats};root.NoxArcCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
