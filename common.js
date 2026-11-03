/* 모둠 화면·교사 화면 공통 */
function serverUrl(){ try{ const o=new URLSearchParams(location.search).get('server'); if(o) return o; }catch(e){} return SERVER_URL; }
const API = {
  state(code, ver, team){ return fetch(serverUrl()+'?action=state&code='+encodeURIComponent(code)+(ver?'&ver='+ver:'')+(team?'&team='+team:'')+'&_='+Date.now(), {cache:'no-store'}).then(r=>r.json()); },
  post(d){ return fetch(serverUrl(), {method:'POST', body:JSON.stringify(d)}).then(r=>r.json()); }
};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function sg(x){ x=Math.round(x*10)/10; return x>0?'+'+x:x<0?'−'+Math.abs(x):'±0'; }
function scenById(id){ return SCENARIOS.find(s=>s.id===id); }
function scenOf(room){ return scenById(room.sid); }
function teamScen(room, t){ return scenById(t.sid||room.sid); }
function groups(room){ const m={}; room.teams.forEach(t=>{ (m[t.sid]=m[t.sid]||[]).push(t); }); return SCENARIOS.filter(s=>m[s.id]).map(s=>({s:s, teams:m[s.id]})); }
function mixed(room){ return !room.sid; }
function ranked(room){ return room.teams.slice().sort((a,b)=>b.score-a.score); }
function rankOf(room, id){ return ranked(room).findIndex(t=>t.id===id)+1; }
function setConn(ok){ const c=document.getElementById('conn'); if(c){ c.className='conn'+(ok?'':' off'); c.lastChild.textContent=ok?' 실시간 연결':' 연결 끊김 · 재시도 중'; } }

function gaugesHTML(st, preview){
  return '<div class="gauges">'+SKEYS.map(k=>{ const v=st[k], p=preview?preview[k]:0, nv=Math.max(0,Math.min(100,v+p));
    const em = preview && Math.abs(p)>=0.05 ? `<em style="left:${Math.min(v,nv)}%;width:${Math.abs(nv-v)}%"></em>` : '';
    return `<div class="gauge"><span class="seal" title="${STATS[k].desc}">${STATS[k].icon}</span><div>
      <div class="t2"><b>${STATS[k].name}</b><span><span class="v">${Math.round(v)}</span>${preview?`<span class="pv ${p>0.05?'up':p<-0.05?'dn':'z'}">${sg(p)}</span>`:''}</span></div>
      <div class="bar"><i class="${v<20?'lo':''}" style="width:${v}%"></i>${em}<span class="danger"></span></div></div></div>`; }).join('')+'</div>';
}
function minibars(st){ return '<div class="minibars">'+SKEYS.map(k=>`<div class="mb"><i><s class="${st[k]<20?'lo':''}" style="height:${Math.max(0,Math.min(100,st[k]))}%"></s></i>${STATS[k].name}</div>`).join('')+'</div>'; }

/* 모둠 카드: 나라 그림 + 점수 + 지표 */
function teamCard(room, t, o){
  o=o||{};
  const r=rankOf(room,t.id), last=t.log[t.log.length-1];
  let badge='';
  if(room.phase==='deciding') badge = t.submitted ? '<span class="stamp pop">裁可 제출</span>' : '<span class="waiting">논의 중…</span>';
  if(room.phase==='revealed' && last && last.t===room.turn) badge = `<span class="pill ${last.real?'good':''}" style="position:absolute;top:44px;right:10px;max-width:70%;overflow:hidden;text-overflow:ellipsis">${esc(last.label)}</span>`;
  return `<div class="tc ${o.me?'me':''}">${room.phase!=='lobby'?`<span class="rk r${r}">${r}</span>`:''}
    <div class="nm"><b>${esc(t.name)}</b>${!room.sid?`<span class="pill navy" style="margin-right:auto">${esc(teamScen(room,t).king)}</span>`:''}${room.phase!=='lobby'?`<span class="sc num">${t.score}</span>`:''}</div>
    ${badge}${kingdomSVG(t.st,{crisis:last&&last.notes.some(n=>n.type==='crisis')})}
    ${minibars(t.st)}
    ${o.members?`<div class="small muted">${esc(t.members)}</div>`:''}
    ${t.ach.length?`<div class="small" style="color:var(--jade)">업적 ${t.ach.map(esc).join(' · ')}</div>`:''}${room.phase==='revealed'&&last&&last.t===room.turn&&last.card&&cardById(last.card)?`<div><span class="cchip">現代 ${esc(cardById(last.card).name)}</span></div>`:''}</div>`;
}
function leaderboardHTML(room, myId){
  const list=ranked(room), max=Math.max(1,...list.map(t=>t.score));
  return '<div class="lb">'+list.map((t,i)=>`<div class="lbr ${t.id===myId?'me':''}"><span class="num muted">${i+1}</span><b>${esc(t.name)}</b><span class="bb"><i style="width:${Math.max(2,t.score/max*100)}%"></i></span><span class="s num">${t.score}</span></div>`).join('')+'</div>';
}
/* 사건별 선택 분포 */
function distHTML(room, turnIdx, myId, sid){
  const s=scenById(sid||room.sid), turn=s.turns[turnIdx];
  const by={a:[],b:[],c:[],'-':[]};
  room.teams.filter(t=>t.sid===s.id).forEach(t=>{ const l=t.log.find(x=>x.t===turnIdx); if(l) by[l.choice||'-'] ? by[l.choice||'-'].push(t) : by['-'].push(t); });
  const cols=turn.choices.map((c,i)=>{ const isReal=c.id===turn.real.pick;
    return `<div class="dc ${isReal?'real':''}"><div class="row between"><h4>${'甲乙丙'[i]} ${esc(c.label)}</h4><span class="cnt num">${by[c.id].length}</span></div>
      ${isReal?'<div class="small" style="color:var(--jade);font-weight:700;margin-bottom:4px">실제 역사의 선택</div>':''}
      <div class="chips">${by[c.id].map(t=>`<span class="chip ${t.id===myId?'me':''}">${esc(t.name)}</span>`).join('')||'<span class="small muted">없음</span>'}</div></div>`; }).join('');
  const none = by['-'].length ? `<p class="small muted" style="margin:6px 0 0">어명을 내리지 못한 모둠: ${by['-'].map(t=>esc(t.name)).join(', ')}</p>` : '';
  return `<div class="dist">${cols}</div>${none}`;
}
function tagsOf(eff){
  return Object.entries(eff).filter(([k,v])=>v).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3)
    .map(([k,v])=>`<span class="tag ${v>0?'up':'dn'}">${STATS[k].name} ${v>0?'▲':'▼'}</span>`).join('');
}
const TAX_TXT={1:'아주 가볍게',2:'가볍게',3:'예년처럼',4:'무겁게',5:'아주 무겁게'};

function kingPicker(sel, name){
  return '<div class="kp" role="radiogroup">'+SCENARIOS.map(s=>`<label class="kpo"><input type="radio" name="${name||'king'}" value="${s.id}" ${sel===s.id?'checked':''}><span><b>${s.king}</b><em>${esc(s.title)}</em><small>재위 ${s.reign}</small></span></label>`).join('')+'</div>';
}

function cardById(id){ return typeof CARDS!=='undefined' ? CARDS.find(x=>x.id===id) : null; }
function cardHTML(cd, o){
  o=o||{};
  return `<button type="button" class="pcard ${o.used?'used':''} ${o.dim?'dim':''}" data-card="${cd.id}" aria-pressed="${!!o.sel}" aria-haspopup="dialog">
    <span class="mod"><span>現代 <b>${esc(cd.modern)}</b></span></span>
    <span class="bd"><span class="jn">${esc(cd.name)}</span><span class="ds">${esc(cd.desc)}</span>
    <span class="tags">${tagsOf(cd.eff)}${cd.later?'<span class="tag">몇 해 뒤 효과</span>':''}</span><span class="un">통합사회 · ${esc(cd.unit)}</span></span></button>`;
}

/* 팝업 */
let modalReturn=null;
function openModal(html){
  closeModal(); modalReturn=document.activeElement;
  const bg=document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('click', e=>{ if(e.target===bg || e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(bg);
  const f=bg.querySelector('.mf button, .x'); if(f) f.focus();
}
function closeModal(){ const m=document.getElementById('modal'); if(m){ m.remove(); if(modalReturn&&modalReturn.focus) try{ modalReturn.focus(); }catch(e){} } }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

function effList(eff){ return Object.entries(eff).filter(([k,v])=>v).map(([k,v])=>`<span class="tag ${v>0?'up':'dn'}">${STATS[k].name} ${v>0?'▲':'▼'}</span>`).join(''); }
function cardModalHTML(cd, foot){
  return `<div class="mh"><div><small>현대 제도 카드 · 통합사회 ${esc(cd.unit)}</small><h2>${esc(cd.name)}</h2></div><button class="x" data-close aria-label="닫기">✕</button></div>
  <div class="mbody">
    <div class="bridge"><div><span>現代 오늘날</span><b>${esc(cd.modern)}</b></div><div style="border:none;background:none;font-size:22px">→</div><div style="border-color:var(--jade)"><span>朝鮮 조선판</span><b style="color:var(--jade)">${esc(cd.name)}</b></div></div>
    <div class="sec2"><h4>어떤 정책인가요</h4><p>${esc(cd.desc)}</p></div>
    <div class="sec2"><h4>오늘날의 ${esc(cd.modern)}</h4><p>${esc(cd.detail||cd.concept)}</p></div>
    <div class="sec2"><h4>조선에 맞게 바꾼 점</h4><p>${esc(cd.adapt||'')}</p></div>
    <div class="sec2"><h4>예상되는 효과</h4><div class="tags">${effList(cd.eff)}${cd.later?'<span class="tag">몇 해 뒤 추가 효과 있음</span>':''}</div><p class="hint" style="margin-top:4px">효과의 방향만 공개됩니다. 크기는 히든 조언자도 알려 주지 않습니다.</p></div>
    <div class="sec2"><h4>핵심 개념</h4><p>${esc(cd.concept)}</p></div>
    <div class="think"><b>생각해 볼 질문</b> ${esc(cd.think||'')}</div>
  </div>
  <div class="mf">${foot||'<button class="btn" data-close>닫기</button>'}</div>`;
}
function advisorModalHTML(a, have, used, foot){
  const st=a.stats.map(k=>STATS[k].name).join(' · ');
  return `<div class="mh"><div><small>히든 조언자</small><h2>${have?esc(a.name):'??? (잠김)'}</h2></div><button class="x" data-close aria-label="닫기">✕</button></div>
  <div class="mbody"><div class="advtop">${advisorSVG(a,!have)}<div>
      ${have?`<p style="margin:0 0 6px; font-weight:700">${esc(a.title)}</p><p style="margin:0; font-family:var(--display); font-size:16.5px; line-height:1.7">“${esc(a.hello)}”</p>`:'<p style="margin:0">아직 만나지 못한 조언자입니다.</p>'}</div></div>
    <div class="sec2"><h4>꿰뚫어 보는 분야</h4><p>${have?st+' — 이 분야에 대해 세 대책의 정확한 효과 크기와 몇 해 뒤 효과까지 알려 줍니다.':'?'}</p></div>
    <div class="sec2"><h4>해금 조건</h4><p>${esc(a.hint)}</p></div>
    <div class="sec2"><h4>쓸 수 있는 횟수</h4><p>${!have?'잠겨 있습니다.':used?'이번 게임에서 이미 조언을 들었습니다.':'이번 게임에서 한 번 조언을 청할 수 있습니다. 한 사건에는 한 명만 부를 수 있습니다.'}</p></div></div>
  <div class="mf">${foot||'<button class="btn" data-close>닫기</button>'}</div>`;
}
