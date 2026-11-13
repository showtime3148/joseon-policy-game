/* 학생 화면·교사 화면 공통 */
function serverUrl(){ try{ const o=new URLSearchParams(location.search).get('server'); if(o) return o; }catch(e){} return SERVER_URL; }
const API = {
  state(code, ver, team){ return fetch(serverUrl()+'?action=state&code='+encodeURIComponent(code)+(ver?'&ver='+ver:'')+(team?'&team='+team:'')+'&_='+Date.now(), {cache:'no-store'}).then(r=>r.json()); },
  post(d){ return fetch(serverUrl(), {method:'POST', body:JSON.stringify(d)}).then(r=>r.json()); }
};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function sg(x){ x=Math.round(x*10)/10; return x>0?'+'+x:x<0?'−'+Math.abs(x):'±0'; }
function ranked(room){ return room.teams.slice().sort((a,b)=>b.score-a.score); }
function rankOf(room, id){ return ranked(room).findIndex(t=>t.id===id)+1; }
function setConn(ok){ const c=document.getElementById('conn'); if(c){ c.className='conn'+(ok?'':' off'); c.lastChild.textContent=ok?' 실시간 연결':' 연결 끊김 · 재시도 중'; } }
function curTurn(room){ return ERA.turns[Math.min(room.turn, ERA.turns.length-1)]; }

function gaugesHTML(st, preview){
  return '<div class="gauges">'+SKEYS.map(k=>{ const v=st[k], p=preview?preview[k]||0:0, nv=Math.max(0,Math.min(100,v+p));
    const em = preview && Math.abs(p)>=0.05 ? `<em style="left:${Math.min(v,nv)}%;width:${Math.abs(nv-v)}%"></em>` : '';
    return `<div class="gauge"><span class="seal" title="${STATS[k].desc}">${STATS[k].icon}</span><div>
      <div class="t2"><b>${STATS[k].name}</b><span><span class="v">${Math.round(v)}</span>${preview?`<span class="pv ${p>0.05?'up':p<-0.05?'dn':'z'}">${p>0.05?'▲':p<-0.05?'▼':''}</span>`:''}</span></div>
      <div class="bar"><i class="${v<20?'lo':''}" style="width:${v}%"></i>${em}<span class="danger"></span></div></div></div>`; }).join('')+'</div>';
}
function minibars(st){ return '<div class="minibars">'+SKEYS.map(k=>`<div class="mb"><i><s class="${st[k]<20?'lo':''}" style="height:${Math.max(0,Math.min(100,st[k]))}%"></s></i>${STATS[k].name}</div>`).join('')+'</div>'; }
function tagsOf(eff){
  return Object.entries(eff).filter(([k,v])=>v).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3)
    .map(([k,v])=>`<span class="tag ${v>0?'up':'dn'}">${STATS[k].name} ${v>0?'▲':'▼'}</span>`).join('');
}
function effList(eff){ return Object.entries(eff).filter(([k,v])=>v).map(([k,v])=>`<span class="tag ${v>0?'up':'dn'}">${STATS[k].name} ${v>0?'▲':'▼'}</span>`).join(''); }
function roleTag(rid){ const r=roleById(rid); return `<span class="rtag r-${rid}" title="${esc(r.duty)}"><i>${r.icon}</i>${esc(r.name)}</span>`; }
function memberLine(m){ return `<span class="mline">${esc(m.name)} ${m.roles.map(roleTag).join('')}</span>`; }

/* 모둠(의정부) 카드: 나라 그림 + 점수 + 지표 */
function teamCard(room, t, o){
  o=o||{};
  const r=rankOf(room,t.id), last=t.log[t.log.length-1];
  let badge='';
  if(room.phase==='deciding') badge = t.submitted ? '<span class="stamp pop">裁可 상신</span>' : `<span class="waiting">논의 중… 제안 ${t.props}</span>`;
  const turn=curTurn(room);
  const adopted = room.phase==='revealed' && last && last.t===room.turn ? `<div class="chips" style="gap:4px">${last.adopt.length?last.adopt.map(a=>{ const p=policyOf(turn,a.id); return `<span class="cchip ${turn.real.ids.includes(a.id)?'real':''}">${esc(p?p.name:a.id)}</span>`; }).join(''):'<span class="small" style="color:var(--bad)">합의안 없음</span>'}</div>` : '';
  return `<div class="tc ${o.me?'me':''}">${room.phase!=='lobby'?`<span class="rk r${r}">${r}</span>`:''}
    <div class="nm"><b>${esc(t.name)}</b>${room.phase!=='lobby'?`<span class="sc num">${t.score}</span>`:''}</div>
    ${badge}${kingdomSVG(t.st,{crisis:last&&last.notes.some(n=>n.type==='crisis')})}
    ${minibars(t.st)}${adopted}
    ${o.members?`<div class="small mlist">${t.members.map(memberLine).join('')||'<span class="muted">모둠원 없음</span>'}</div>`:''}</div>`;
}
function leaderboardHTML(room, myId){
  const list=ranked(room), max=Math.max(1,...list.map(t=>t.score));
  return '<div class="lb">'+list.map((t,i)=>`<div class="lbr ${t.id===myId?'me':''}"><span class="num muted">${i+1}</span><b>${esc(t.name)}</b><span class="bb"><i style="width:${Math.max(2,t.score/max*100)}%"></i></span><span class="s num">${t.score}</span></div>`).join('')+'</div>';
}

/* 정책 카드(학생 화면의 6조 정책 목록) */
function policyHTML(turn, p, o){
  o=o||{};
  const d=deptOf(p.id);
  return `<button type="button" class="pol ${o.state||''}" data-pol="${p.id}" aria-haspopup="dialog">
    <span class="ph"><i class="r-${d.id}">${d.icon}</i>${esc(d.dept)}${o.state==='prop'?'<em>제안됨</em>':o.state==='adopt'?'<em>합의안</em>':''}</span>
    <b>${esc(p.name)}</b><span class="ds">${esc(p.desc)}</span>
    <span class="tags">${tagsOf(p.eff)}${p.later?'<span class="tag">몇 해 뒤 효과</span>':''}</span>
    ${o.by?`<span class="by">제안: ${esc(o.by)}</span>`:''}</button>`;
}
/* 결과 공개 때 현대 정책 해설 */
function modernHTML(turn, a, o){
  o=o||{};
  const p=policyOf(turn,a.id); if(!p) return '';
  return `<div class="modern ${o.cls||''}" ${o.at!=null?`data-at="${o.at}"`:''}>
    <div class="mh2"><b>${esc(p.name)}</b>${turn.real.ids.includes(p.id)&&o.real?'<span class="pill good">실제 역사</span>':''}<span class="small muted">${esc(a.by||'')} · ${esc(a.role||'')}</span></div>
    <div class="mrow"><div class="mine"><span>우리가 쓴 비슷한 현대 정책</span><p>${esc(a.modern||'-')}</p></div>
    <div class="ref"><span>해설 · ${esc(UNITS[p.modern.u]||'')}</span><b>${esc(p.modern.name)}</b><p>${esc(p.modern.text)}</p></div></div></div>`;
}

/* 팝업 */
let modalReturn=null;
function openModal(html){
  closeModal(); modalReturn=document.activeElement;
  const bg=document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('click', e=>{ if(e.target===bg || e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(bg);
  const f=bg.querySelector('textarea, .mf button, .x'); if(f) f.focus();
}
function closeModal(){ const m=document.getElementById('modal'); if(m){ m.remove(); if(modalReturn&&modalReturn.focus) try{ modalReturn.focus(); }catch(e){} } }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
