(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const questions = window.QUIZ_QUESTIONS, cleared = new Set();
 let current = null, busy = false, over = false, ctx, drumBuffer;
 const complete = () => cleared.size === questions.length - 1;
 function validate(data) {
  if(!Array.isArray(data)||data.length<2) throw Error('問題を2件以上登録してください。');
  const ids = new Set();
  data.forEach((q,i)=>{
   if(!q || !Number.isInteger(q.id) || q.id < 1 || ids.has(q.id) || ['prompt','explanation'].some(key=>typeof q[key]!=='string'||!q[key].trim()) || typeof q.isTrue!=='boolean') throw Error('問題 '+(i+1)+' の設定を確認してください。IDは重複しない正の整数、isTrue は true または false にしてください。');
   ids.add(q.id);
  });
  if(data.filter(q=>!q.isTrue).length!==1) throw Error('全問題のうち、isTrue: false（嘘・ドボン）を必ず1件だけ設定してください。');
 }
 function enableAudio(){try{ctx ||= new (window.AudioContext || window.webkitAudioContext)(); return ctx.resume().catch(()=>{});}catch{return Promise.resolve();}}
 function tone(freq,start,duration,type='sine',volume=.1){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g);g.connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(start);o.stop(start+duration);}
 function prepareDrum(){
  if(!ctx||drumBuffer)return;
  const rate=ctx.sampleRate;
  drumBuffer=ctx.createBuffer(1,Math.ceil(rate*2),rate);
  const data=drumBuffer.getChannelData(0);
  for(let hit=0;hit<30;hit++){
   const offset=Math.round(hit*.065*rate), length=Math.ceil(.07*rate);
   for(let j=0;j<length && offset+j<data.length;j++){
    const t=j/rate;
    const noise=(Math.random()*2-1)*Math.exp(-t/.015)*(.06+hit*.002);
    const kick=Math.sin(2*Math.PI*110*t)*.04*Math.exp(-t*65);
    data[offset+j]+=noise+kick;
   }
  }
 }
 function drum(){
  if(!ctx||!drumBuffer)return;
  const source=ctx.createBufferSource();source.buffer=drumBuffer;
  source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();
 }
 function verdict(bad){if(!ctx)return;const t=ctx.currentTime;if(bad){tone(115,t,.35,'sawtooth',.065);tone(100,t+.4,.55,'sawtooth',.065);}else{tone(880,t,.25);tone(1174.66,t+.22,.55);}}

 function render(){
  $('grid').replaceChildren();$('count').textContent=cleared.size;$('total').textContent=questions.length-1;
  questions.forEach((q,i)=>{
   const b=document.createElement('button');b.className='panel'+(cleared.has(q.id)?' done':'');b.disabled=!cleared.has(q.id)&&(over||complete());
   const n=document.createElement('span');n.className='num';n.textContent=cleared.has(q.id)?'✓':String(i+1).padStart(2,'0');
   const title=document.createElement('h3');title.textContent=q.prompt;
   const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent=cleared.has(q.id)?'CLEAR':'↗';
   b.append(n,title,arrow);b.addEventListener('click',()=>openQuestion(q,i));$('grid').append(b);
  });
 }
 function openQuestion(q,i){
  if(busy||(!cleared.has(q.id)&&(over||complete()))||$('question').open||$('result').open)return;
  enableAudio();prepareDrum();
  current=q;$('qnumber').textContent=q.prompt;$('prompt').textContent=q.notes || 'クイズ作成者の自由記入欄です';$('cleared-explanation').hidden=!cleared.has(q.id);$('cleared-explanation-text').textContent=cleared.has(q.id)?q.explanation:'';$('yes').disabled=cleared.has(q.id);$('yes').hidden=cleared.has(q.id);$('question').showModal();
 }
 function closeQuestion(){if(busy)return;$('question').close();current=null;}
 async function answer(){
  if(busy||!current||cleared.has(current.id))return;
  busy=true;$('yes').disabled=true;
  const selected=current;
  await enableAudio();
  $('result').className='';$('symbol').textContent='?';$('result-label').textContent='運命の判定';$('result-title').textContent='ドボンか、それとも…';$('result-detail').textContent='';$('bars').hidden=false;$('continue').hidden=true;$('result').showModal();drum();
  setTimeout(()=>{
   const bad=!selected.isTrue;
   if(bad)over=true;else cleared.add(selected.id);
   $('result').className=bad?'bad':'';$('symbol').textContent=bad?'×':'○';$('result-label').textContent=bad?'GAME OVER':complete()?'ALL CLEAR':'SAFE!';$('result-title').textContent=bad?'ドボン！ 失格':'実際に見た夢';$('result-detail').textContent=selected.explanation;$('bars').hidden=true;$('continue').hidden=false;$('continue').textContent=bad||complete()?'もう一度チャレンジ':'次の問題へ →';verdict(bad);render();$('continue').focus();
  },2200);
 }
 function reset(){if(busy)return;cleared.clear();over=false;current=null;render();}
 $('continue').onclick=()=>{const resetNeeded=over||complete();$('result').close();$('question').close();busy=false;current=null;if(resetNeeded)reset();};
 $('yes').onclick=answer;
 $('collapse').onclick=closeQuestion;
 $('question').addEventListener('click',e=>{if(!e.target.closest('button'))closeQuestion()});
 $('close').onclick=closeQuestion;
 $('question').addEventListener('cancel',e=>{e.preventDefault();closeQuestion()});
 $('result').addEventListener('cancel',e=>e.preventDefault());
 $('restart').onclick=reset;
 try{validate(questions);render()}catch(e){$('error').textContent='問題ファイルのエラー：'+e.message;$('restart').disabled=true;}
})();
