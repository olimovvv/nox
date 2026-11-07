(function(root){
 'use strict';
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const shift=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return iso(d);};
 function day(now=new Date(),hour=0){const d=new Date(now);if(d.getHours()<hour)d.setDate(d.getDate()-1);return iso(d);}
 // Normalize a time only when there is a clock separator or an explicit time phrase.
 const hours=[
  ['zero','nol','ноль'],['one','bir','час','один'],['two','ikki','два'],['three','uch','три'],
  ['four','to\'rt','четыре'],['five','besh','пять'],['six','olti','шесть'],['seven','yetti','семь'],
  ['eight','sakkiz','восемь'],['nine','to\'qqiz','девять'],['ten','o\'n','десять'],
  ['eleven','o\'n bir','одиннадцать'],['twelve','o\'n ikki','двенадцать']
 ];
 const words=new Map(hours.flatMap((group,h)=>group.map(word=>[word,h])));
 const number='(?:'+[...words.keys()].sort((a,b)=>b.length-a.length).join('|').replace(/'/g,"['‘’ʻ]")+'|[0-9]{1,2})';
 const period='(?:pm|am|p\\.m\\.|a\\.m\\.|in the afternoon|in the evening|in the morning|of the afternoon|вечера|утра|дня|kechqurun|ertalab|kunduzi|kechki|tushdan keyin)';
 function normalizeClock(text){
   let out=text.replace(/(часа|часов)\s+(дня|утра|вечера)/giu,'$2').replace(/(?<![\d.])([01]?\d|2[0-3])[.]([0-5]\d)(?![\d.])/g,'$1:$2');
   const pattern=new RegExp('(^|[\\s,])(?:(soat|at|в|kechki|ertalab|kechqurun|kunduzi|tushdan keyin)\\s+)?(?:(half past|quarter past|quarter to)\\s+)?('+number+')(?:[:.]([0-5]\\d)|\\s+(thirty|fifteen|yarim|пятнадцать|тридцать))?(da)?(?:\\s*('+period+'))?(?=$|[\\s,;.!?])','giu');
   return out.replace(pattern,(full,space,lead,part,n,m,fraction,suffix,after)=>{
     if(!(lead||part||suffix||after))return full;
     const norm=n.toLowerCase().replace(/[‘’ʻ]/g,"'");let hour=words.get(norm)??Number(n);
     const phase=(after||lead||'').toLowerCase();
     if(!Number.isInteger(hour)||hour>23)return full;
     if(/pm|p\.m|afternoon|evening|вечера|дня|kech|kunduzi|tushdan/.test(phase)&&hour<12)hour+=12;
     if(/am|morning|утра|ertalab/.test(phase)&&hour===12)hour=0;
     let min=m?Number(m):/half|thirty|yarim|тридцать/i.test(part||fraction||'')?30:part||fraction?15:0;
     if(part?.toLowerCase()==='quarter to'){hour=(hour+23)%24;min=45;}
     return space+String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0');
   });
 }
 function parse(input,base){
  let text=normalizeClock(input.trim()),date=base,start=null,end=null,section=null,owl=false;const chips=[];
  text=text.replace(/(^|\s)(tomorrow|ertaga|завтра)(?=\s|$)/iu,(_,s)=>{date=shift(base,1);chips.push(date);return s;});
  text=text.replace(/(^|\s)(today|bugun|сегодня)(?=\s|$)/iu,(_,s)=>{chips.push(date);return s;});
  text=text.replace(/(^|\s)(\d{4}-\d{2}-\d{2})(?=\s|$)/,(_,s,v)=>{if(iso(new Date(v+'T12:00:00'))!==v)return _;date=v;chips.push(v);return s;});
  text=text.replace(/(?:\b(?:at|soat|в)\s+)?\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*[-–]\s*([01]?\d|2[0-3]):([0-5]\d))?(?:\s+da\b)?/i,(_,h,m,eh,em)=>{start=h.padStart(2,'0')+':'+m;end=eh?eh.padStart(2,'0')+':'+em:null;chips.push(start+(end?'–'+end:''));return '';});
  text=text.replace(/(?:^|\s)#([\p{L}\p{N}_-]+)/u,(_,v)=>{section=v;chips.push('#'+v);return ' ';});
  text=text.replace(/(?:^|\s)!3owls\b/i,()=>{owl=true;chips.push('Owl');return ' ';});
  const normalPriority=/(?:not (?:important|urgent)|muhim emas|не срочно|не важно)/iu.test(text);
  text=text.replace(/(?:^|\s)(?:urgent|important|shoshilinch|juda muhim|срочно|важно|самое важное|mark (?:this |it )?(?:as )?(?:an? )?owl|(?:make|mark) (?:this |it )?(?:an? )?(?:owl|priority)|(?:this is |my )?(?:most important|main task)|(?:top|high) priority|(?:bu (?:eng )?)?muhim(?: vazifa)?|eng muhim|eng asosiy|ustuvor(?: vazifa)?|owl qilib belgil[ae]|высокий приоритет)(?=\s|$|[,.])/iu,()=>{owl=true;if(!chips.includes('Owl'))chips.push('Owl');return ' ';});
  text=text.replace(/(?:^|\s)(?:in (?:the )?section|section|bo‘lim|bo'lim|раздел)\s+([\p{L}\p{N}_-]+)/iu,(_,v)=>{section=v;chips.push(v);return ' ';});
  if(normalPriority){owl=false;const i=chips.indexOf('Owl');if(i>=0)chips.splice(i,1);}
  if(start&&!end){const n=minutes(start)+30;if(n<1440)end=time(n);}
  return {text:text.replace(/\s+/g,' ').trim(),date,start_time:start,end_time:end,section,is_owl:owl,chips};
 }
 const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
 const time=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const overlaps=(a,b)=>a.date===b.date&&a.start_time&&a.end_time&&b.start_time&&b.end_time&&a.start_time<b.end_time&&b.start_time<a.end_time;
 const api={normalizeClock,iso,shift,day,parse,minutes,time,overlaps};root.NoxPlannerCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
