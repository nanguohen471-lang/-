// ===== 星空背景（星星 + 流星 + 滑鼠星塵）=====
(function(){
  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d');
  let stars=[], shootings=[], cursorParticles=[], rafId=null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointerFine = window.matchMedia('(pointer: fine)').matches;

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth*dpr);
    canvas.height = Math.floor(window.innerHeight*dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    initStars();
  }
  function initStars(){
    const count = prefersReduced ? 70 : 140;
    stars = Array.from({length:count},()=>({
      x:Math.random()*window.innerWidth,
      y:Math.random()*window.innerHeight,
      z:Math.random()*0.6+0.4,
      r:Math.random()*1.2+0.2,
      t:Math.random()*Math.PI*2
    }));
  }
  function spawnShooting(){
    if(prefersReduced) return;
    const y = Math.random()*window.innerHeight*0.6;
    shootings.push({x:window.innerWidth+40,y, vx:-(3+Math.random()*2), vy:1+Math.random(), life:0});
    setTimeout(spawnShooting, 5000+Math.random()*4000);
  }
  let lastSpawn=0;
  function spawnCursorParticles(x,y){
    const now=performance.now();
    if(now-lastSpawn<20) return;
    lastSpawn=now;
    for(let i=0;i<6;i++){
      const a=Math.random()*Math.PI*2;
      const s=Math.random()*0.6+0.2;
      cursorParticles.push({x:x+(Math.random()*6-3),y:y+(Math.random()*6-3),vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:Math.random()*1.8+0.6,life:1});
    }
  }
  function draw(){
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    for(const s of stars){
      s.y+=0.05*s.z; s.t+=0.05;
      if(s.y>window.innerHeight){ s.y=-2; s.x=Math.random()*window.innerWidth; }
      ctx.globalAlpha=0.5+0.5*Math.sin(s.t);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=0.9; ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.2;
    shootings.forEach(sh=>{sh.x+=sh.vx; sh.y+=sh.vy; sh.life+=1; ctx.beginPath(); ctx.moveTo(sh.x,sh.y); ctx.lineTo(sh.x+20,sh.y-10); ctx.stroke();});
    shootings=shootings.filter(sh=> sh.x>-60 && sh.life<200);

    if(pointerFine && !prefersReduced){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      cursorParticles.forEach(p=>{p.x+=p.vx; p.y+=p.vy; p.life-=0.02; p.r*=0.985; ctx.globalAlpha=Math.max(p.life,0)*0.9;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(200,220,255,1)'; ctx.fill();});
      ctx.restore();
      cursorParticles=cursorParticles.filter(p=> p.life>0.05 && p.r>0.1);
    }
    rafId=requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&rafId){cancelAnimationFrame(rafId); rafId=null;} else if(!rafId&&!prefersReduced){rafId=requestAnimationFrame(draw);} });
  if(pointerFine && !prefersReduced){ window.addEventListener('mousemove',e=>spawnCursorParticles(e.clientX,e.clientY)); }
  resize(); if(!prefersReduced){ spawnShooting(); rafId=requestAnimationFrame(draw); }
})();

// ===== 背景音樂：原檔名（方案B），音量滑桿＋淡入 =====
const bgm=document.getElementById('bgm');
const toggleBtn=document.getElementById('musicToggle');
const vol=document.getElementById('volume');
const volVal=document.getElementById('volVal');
const savedVol=Number(localStorage.getItem('bgmVol')||'35');
vol.value=String(savedVol); volVal.textContent=savedVol+'%'; bgm.volume=savedVol/100;

let fadeTimer=null;
function fadeVolume(target=0.6,ms=2000){
  if(fadeTimer) cancelAnimationFrame(fadeTimer);
  const start=performance.now(); const from=bgm.volume;
  function step(now){ const t=Math.min(1,(now-start)/ms); bgm.volume=from+(target-from)*t; if(t<1){ fadeTimer=requestAnimationFrame(step);} else {fadeTimer=null;} }
  fadeTimer=requestAnimationFrame(step);
}
function tryPlay(){ return bgm.play().then(()=>{toggleBtn.textContent='🔊';}).catch(()=>{toggleBtn.textContent='🔇';}); }
let userMuted=false;

toggleBtn.addEventListener('click',()=>{ if(bgm.paused){ userMuted=false; tryPlay(); fadeVolume(vol.value/100,600); } else { userMuted=true; bgm.pause(); toggleBtn.textContent='🔇'; }});
vol.addEventListener('input',()=>{ const v=Number(vol.value)/100; volVal.textContent=vol.value+'%'; localStorage.setItem('bgmVol', String(vol.value)); if(!bgm.paused){ bgm.volume=v; }});

// 進入表單＝首次互動觸發播放
document.getElementById('startBtn').addEventListener('click',()=>{
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('formPage').classList.remove('hidden');
  tryPlay().then(()=>{ if(Number(vol.value)===0){ userMuted=true; }});
});

// ===== 數字/星座計算與結果 =====
function calcLifePath(b){ let s=b.replace(/-/g,'').split('').reduce((a,x)=>a+Number(x),0); while(s>9&&s!==11&&s!==22){ s=s.toString().split('').reduce((a,x)=>a+Number(x),0);} return s;}
function calcPersonalYear(b,y){ const [Y,m,d]=b.split('-').map(Number); let s=(m+d+y).toString().split('').reduce((a,x)=>a+Number(x),0); return calcLifePath(s.toString());}
function calcPersonalMonth(py,m){ return calcLifePath((py+m).toString()); }
function calcPersonalDay(pm,d){ return calcLifePath((pm+d).toString()); }
function zodiacOf(m,d){ if((m==3&&d>=21)||(m==4&&d<=19)) return "牡羊"; if((m==4&&d>=20)||(m==5&&d<=20)) return "金牛"; if((m==5&&d>=21)||(m==6&&d<=21)) return "雙子"; if((m==6&&d>=22)||(m==7&&d<=22)) return "巨蟹"; if((m==7&&d>=23)||(m==8&&d<=22)) return "獅子"; if((m==8&&d>=23)||(m==9&&d<=22)) return "處女"; if((m==9&&d>=23)||(m==10&&d<=23)) return "天秤"; if((m==10&&d>=24)||(m==11&&d<=21)) return "天蠍"; if((m==11&&d>=22)||(m==12&&d<=21)) return "射手"; if((m==12&&d>=22)||(m==1&&d<=19)) return "摩羯"; if((m==1&&d>=20)||(m==2&&d<=18)) return "水瓶"; return "雙魚";}
function dailyHoroscope(z){ const pool={火:["今天適合主動出擊","能量滿滿，適合挑戰","表現自己會有好結果"],土:["適合規劃與整理","穩定的一天","放慢腳步，厚植基礎"],風:["適合交流與靈感","多與人互動會有收穫","好奇心帶來新機會"],水:["適合療癒與放鬆","情感交流加深關係","專注自我照顧最重要"]}; const map={牡羊:"火",獅子:"火",射手:"火",金牛:"土",處女:"土",摩羯:"土",雙子:"風",天秤:"風",水瓶:"風",巨蟹:"水",天蠍:"水",雙魚:"水"}; const el=map[z]||"風"; const list=pool[el]; return list[new Date().getDate()%list.length];}
function numberLines(b){ const d=b.replace(/-/g,'').split('').map(Number); const sets=[{line:"1-2-3",has:[1,2,3],desc:"學習快、行動力強"},{line:"4-5-6",has:[4,5,6],desc:"善於組織、重視穩定"},{line:"7-8-9",has:[7,8,9],desc:"靈性直覺、領導能力"},{line:"1-4-7",has:[1,4,7],desc:"意志堅定、執行力強"},{line:"2-5-8",has:[2,5,8],desc:"人際溝通佳、協調力強"},{line:"3-6-9",has:[3,6,9],desc:"創造力佳、表達能力好"},{line:"1-5-9",has:[1,5,9],desc:"有遠見、領導氣場強"},{line:"3-5-7",has:[3,5,7],desc:"思維靈活、善於洞察"}]; const r=[]; sets.forEach(s=>{ if(s.has.every(n=>d.includes(n))) r.push(`${s.line}：${s.desc}`);}); return r.length? r.join("；") : "未形成明顯連線，能量較分散";}

/* 美容美髮資料庫（精簡） */
const BEAUTY_DB={style:{女:{火:{dynamic:["高層次狼剪","蓬鬆法式鎖骨髮","俐落中短鮑伯"],stable:["柔順中長直髮","公主切微內彎","氣質低層次長髮"],show:["空氣瀏海大波浪","混合捲+挑染","法式蓬鬆捲"],spirit:["雲朵燙","自然微彎長髮","柔霧感中長"]},土:{dynamic:["層次鮑伯外翹","韓系長瀏海中長髮"],stable:["典雅直髮","內彎中長","肩上Lob"],show:["法式S彎","法式劉海+低馬尾"],spirit:["絲絨直髮","極簡中分長髮"]},風:{dynamic:["俐落短髮","Undercut柔化版","耳下短髮"],stable:["順直Lob","層次中長"],show:["挑染面框髮","霧感中長+瀏海"],spirit:["輕日系中長","自然空氣感"]},水:{dynamic:["慵懶捲","水波紋燙"],stable:["空氣瀏海直長","內灣長層次"],show:["波浪大捲+亮眼挑染"],spirit:["絲滑長直","雲霧長捲"]}},男:{火:{dynamic:["韓系中分","層次短髮上推","狼尾短髮"],stable:["質感油頭","側分短髮"],show:["濕髮質感All Back","偏分高層次"],spirit:["柔和中長","自然微捲"]},土:{dynamic:["漸層短髮","立體束感短"],stable:["經典側分","乾淨平頭"],show:["法式碎感短","龐畢度變體"],spirit:["柔順中分","清爽微彎"]},風:{dynamic:["輕龐畢度","質感短捲"],stable:["俐落短髮","Lob長瀏海男"],show:["挑染條紋","漂後霧感灰"],spirit:["空氣中長","耳下微捲"]},水:{dynamic:["濕髮蓬鬆感","立體微捲"],stable:["乾淨短髮","自然中分"],show:["波紋燙","混合捲造型"],spirit:["柔和長瀏海","低調微捲"]}},其他:{火:{dynamic:["個性短髮","高層次中長"],stable:["極簡直髮"],show:["挑染設計"],spirit:["柔和波浪"]},土:{dynamic:["層次微捲"],stable:["簡約直髮"],show:["低調挑染"],spirit:["柔順層次"]},風:{dynamic:["Undercut"],stable:["俐落短髮"],show:["霧感挑染"],spirit:["自然瀏海"]},水:{dynamic:["自然微捲"],stable:["絲滑直髮"],show:["藍黑挑染"],spirit:["雲朵燙"]}}},color:{火:{primary:["暖金棕","琥珀棕","烤栗棕"],accent:["橘紅挑染","玫瑰金高光"],conservative:["深可可棕","摩卡棕"],vibrant:["夕陽銅橘","火焰橘"]},土:{primary:["亞麻棕","蜂蜜棕","沙棕"],accent:["焦糖挑染","金棕面框"],conservative:["深咖啡","冷棕"],vibrant:["奶油金","金沙棕"]},風:{primary:["冷棕","霧感灰棕","亞麻黑"],accent:["銀灰挑染","藍灰高光"],conservative:["自然黑","深冷棕"],vibrant:["極光灰藍","星塵銀"]},水:{primary:["奶茶色","霧藍黑","煙紫棕"],accent:["藍黑挑染","葡萄紫面框"],conservative:["深亞麻黑","冷黑"],vibrant:["月光藍","霧紫灰"]}},care:{火:["控制毛躁：使用輕盈護髮油少量多次","造型前噴抗熱","避免過度漂染"],土:["每週一次深層修護","加強髮尾保濕","梳理時先從髮尾開始"],風:["定型品用量減半，避免僵硬","電棒溫度150~170°C","洗後8成乾再造型"],水:["加強頭皮保濕按摩","避免厚重矽靈","隔天洗搭配乾洗噴霧"]},avoid:{火:"避免大面積冷灰調，容易顯蠟黃。",土:"避免過度蓬鬆的爆炸捲，與穩重氣質不符。",風:"避免過度厚重的深咖啡，會顯沉。",水:"避免過多層次導致毛躁，維持線條流暢。"},reason:{dynamic:"你的能量活躍，層次與動感剪裁更能展現自信。",stable:"今天能量穩定，經典乾淨的線條最能凸顯質感。",show:"可以大膽一點，用顏色或線條成為焦點。",spirit:"溫柔沉靜的一天，自然柔和最能襯托氣質。"}};

function pyCategory(n){ if([1,5,7].includes(n)) return "dynamic"; if([2,4,6].includes(n)) return "stable"; if([3,8,9].includes(n)) return "show"; if([11,22].includes(n)) return "spirit"; return "stable"; }
function pickByDay(arr,bias=0){ if(!arr||arr.length===0) return ""; const i=(new Date().getDate()+bias)%arr.length; return arr[i]; }
function recommendBeauty(g,e,py,lp){
  const gg=["男","女","其他"].includes(g)?g:"其他";
  const cat=pyCategory(py);
  const styleList=(((BEAUTY_DB.style||{})[gg]||{})[e]||{})[cat]||["自然黑髮"];
  const style=pickByDay(styleList,lp);
  const pal=(BEAUTY_DB.color||{})[e]||{primary:["黑色"],accent:[""],conservative:["黑色"],vibrant:[""]};
  let base,accent;
  if(cat==="stable"){ base=pal.conservative[0]||pal.primary[0]; accent=pal.accent[0]||""; }
  else if(cat==="show"){ base=pal.primary[0]; accent=pal.vibrant[0]||pal.accent[0]; }
  else if(cat==="dynamic"){ base=pal.primary[1]||pal.primary[0]; accent=pal.accent[1]||pal.accent[0]; }
  else { base=pal.primary[0]; accent=pal.accent[0]||""; }
  const care=(BEAUTY_DB.care||{})[e]||[]; const careTips=care.slice(0,2);
  const avoid=(BEAUTY_DB.avoid||{})[e]||""; const reason=(BEAUTY_DB.reason||{})[cat]||"";
  return {style, base, accent, careTips, avoid, reason, cat};
}

// 產生結果
document.getElementById('testForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=e.target.name.value.trim();
  const gender=e.target.gender.value;
  const birthday=e.target.birthday.value;

  const lp=calcLifePath(birthday);
  const t=new Date();
  const py=calcPersonalYear(birthday,t.getFullYear());
  const pm=calcPersonalMonth(py,t.getMonth()+1);
  const pd=calcPersonalDay(pm,t.getDate());

  const b=new Date(birthday);
  const zodiac=zodiacOf(b.getMonth()+1,b.getDate());
  const fortune=dailyHoroscope(zodiac);

  const lines=numberLines(birthday);
  const elementMap={牡羊:"火",獅子:"火",射手:"火",金牛:"土",處女:"土",摩羯:"土",雙子:"風",天秤:"風",水瓶:"風",巨蟹:"水",天蠍:"水",雙魚:"水"};
  const zElement=elementMap[zodiac];

  const beauty=recommendBeauty(gender,zElement,py,lp);
  const luckyC=(beauty.base||"白色");
  const luckyN=(t.getDate()%9)+1;
  const luckyD=["東","南","西","北"][lp%4];

  document.getElementById('formPage').classList.add('hidden');
  document.getElementById('resultPage').classList.remove('hidden');
  document.getElementById('resultTitle').textContent=`${name} 的今日能量報告`;

  const tipsHtml=beauty.careTips.map(t=>`<li>${t}</li>`).join('');
  const reportHtml=`<div class="result-report">
      <h3>🔢 生命數字</h3><p>${lp}</p>
      <h3>📅 流年 / 流月 / 流日</h3><p>${py} ／ ${pm} ／ ${pd}</p>
      <h3>🌟 星座 & 運勢</h3><p>${zodiac} ｜ ${fortune}</p>
      <h3>🔗 數字連線</h3><p>${lines}</p>
      <h3>💇 美容推薦</h3>
      <p>髮型：${beauty.style}</p>
      <p>髮色：${beauty.base}${beauty.accent ? " ＋ 點綴："+beauty.accent : ""}</p>
      <p>${beauty.reason}</p>
      <ul class="tips">${tipsHtml}${beauty.avoid ? `<li>避免：${beauty.avoid}</li>` : ""}</ul>
      <h3>🎨 幸運元素</h3><p>色彩：${luckyC} ｜ 數字：${luckyN} ｜ 方位：${luckyD}</p>
    </div>`;
  document.getElementById('resultCards').innerHTML=reportHtml;
});

// 重新測驗
document.getElementById('restartBtn').addEventListener('click',()=>{
  document.getElementById('resultPage').classList.add('hidden');
  document.getElementById('formPage').classList.remove('hidden');
});

// 分享
document.getElementById('shareBtn').addEventListener('click',()=>{
  const text="快來測驗看看你的能量密碼！✨";
  const url=window.location.href;
  if(navigator.share){ navigator.share({title:"生命探索測驗", text, url}); }
  else{ alert("分享結果：\\n"+text+"\\n"+url); }
});

