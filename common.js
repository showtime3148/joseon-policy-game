/* 학생 화면·교사 화면 공통 */
function serverUrl(){ try{ const q=new URLSearchParams(location.search); if(q.get('demo')) return ''; const o=q.get('server'); if(o) return o; if(location.protocol==='file:') return ''; }catch(e){} return SERVER_URL; }
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
  const sb = room.phase==='deciding' && room.sur && room.sur.id ? `<span class="sbadge ${t.responded?'ok':''}">${t.responded?'돌발 대응 완료':'돌발 대응 중…'}</span>` : '';
  const turn=curTurn(room);
  const adopted = room.phase==='revealed' && last && last.t===room.turn ? `<div class="chips" style="gap:4px">${last.adopt.length?last.adopt.map(a=>{ const p=policyOf(turn,a.id); return `<span class="cchip ${turn.real.ids.includes(a.id)?'real':''}">${esc(p?p.name:a.id)}</span>`; }).join(''):'<span class="small" style="color:var(--bad)">정책 없음</span>'}</div>` : '';
  return `<div class="tc nation ${o.me?'me':''}" style="--nc:${nationColor(room,t.id)}">${room.phase!=='lobby'?`<span class="rk r${r}">${r}</span>`:''}
    <div class="nm">${flagSVG(room,t,28)}<b>${esc(t.name)}</b>${room.phase!=='lobby'?`<span class="sc num">${t.score}</span>`:''}</div>
    ${badge}${sb}${kingdomSVG(t.st,{crisis:last&&last.notes.some(n=>n.type==='crisis')})}
    ${minibars(t.st)}${adopted}
    ${o.members?`<div class="small mlist">${t.members.map(memberLine).join('')||'<span class="muted">모둠원 없음</span>'}</div>`:''}</div>`;
}
function leaderboardHTML(room, myId){
  const list=ranked(room), max=Math.max(1,...list.map(t=>t.score));
  return '<div class="lb">'+list.map((t,i)=>`<div class="lbr ${t.id===myId?'me':''}" style="--nc:${nationColor(room,t.id)}"><span class="num muted">${i+1}</span><b>${esc(t.name)}</b><span class="bb"><i style="width:${Math.max(2,t.score/max*100)}%"></i></span><span class="s num">${t.score}</span></div>`).join('')+'</div>';
}

/* 정책 카드(학생 화면의 6조 정책 목록) */
function policyHTML(turn, p, o){
  o=o||{};
  const d=deptOf(p.id);
  return `<button type="button" class="pol ${o.state||''}" data-pol="${p.id}" aria-haspopup="dialog">
    <span class="ph"><i class="r-${d.id}">${d.icon}</i>${esc(d.dept)}${o.state==='prop'?'<em>제안됨</em>':o.state==='adopt'?'<em>✓ 우리 조 선택</em>':''}</span>
    <b>${esc(p.name)}</b><span class="ds">${esc(p.desc)}</span>
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

/* 돌발 이벤트 카드 */
function surpriseCardHTML(S, o){
  o=o||{};
  return `<div class="surx ${o.big?'big':''}"><div class="sxh"><span class="sxi">${esc(S.icon)}</span><div><div class="sxe">急報 · 돌발 이벤트</div><h3>${esc(S.title)}</h3></div></div>
    <p>${esc(S.text)}</p>
    <div class="sxo">${S.options.map(op=>`<${o.pick?'button type="button" data-sresp="'+op.id+'"':'div'} class="sxopt ${o.chosen===op.id?'on':''}"><b>${esc(op.label)}</b><span>${esc(op.desc)}</span></${o.pick?'button':'div'}>`).join('')}</div>
    ${o.foot||''}</div>`;
}

/* 시너지 도감: 이번 사건의 시너지·충돌과 어느 나라가 이뤘는지 */
function synergyHTML(room, turnIdx, myId){
  const turn = ERA.turns[turnIdx];
  const got = {}; room.teams.forEach(t => { const l = t.log.find(x => x.t === turnIdx); (l && l.syn || []).forEach(i => (got[i] = got[i] || []).push(t)); });
  const card = (c, i) => { const who = got[i] || [], mine = who.some(t => t.id === myId);
    return `<div class="syn ${c.good ? 'good' : 'bad'} ${who.length ? 'hit' : ''} ${mine ? 'mine' : ''}">
      <div class="synh"><b>${c.good ? '🔗 ' : '⚡ '}${esc(c.name)}</b><span class="synb ${c.bonus > 0 ? 'up' : 'dn'}">${c.bonus > 0 ? '+' : ''}${c.bonus}점</span></div>
      <div class="synp">${c.ids.map(id => { const d = deptOf(id); return `<span><i class="dico r-${d.id}">${d.icon}</i>${esc(policyOf(turn, id).name)}</span>`; }).join('<em>+</em>')}</div>
      <p>${esc(c.note)}</p>
      <div class="chips">${who.map(t => `<span class="chip drop ${t.id === myId ? 'me' : ''}" style="border-color:${nationColor(room, t.id)}">${esc(t.name)}</span>`).join('') || '<span class="small muted">이룬 나라 없음</span>'}</div></div>`; };
  const goods = turn.combos.map((c, i) => [c, i]).filter(([c]) => c.good), bads = turn.combos.map((c, i) => [c, i]).filter(([c]) => !c.good);
  return `<div class="synwrap"><div class="syncol"><h4>시너지 (협력 보너스)</h4>${goods.map(([c, i]) => card(c, i)).join('')}</div>
    <div class="syncol"><h4>충돌 (감점)</h4>${bads.map(([c, i]) => card(c, i)).join('')}</div></div>`;
}
/* 우리 나라의 이번 협력 성적표 */
function myBonusHTML(turn, l){
  if (!l) return '';
  const rows = (l.syn || []).map(i => turn.combos[i]).map(c => `<div class="mbr ${c.good ? 'good' : 'bad'}"><b>${c.good ? '🔗' : '⚡'} ${esc(c.name)}</b><span>${c.bonus > 0 ? '+' : ''}${c.bonus}</span></div>`);
  if (l.full) rows.push(`<div class="mbr good"><b>🏛 6조 전원 참여</b><span>+${FULL_BONUS}</span></div>`);
  return `<div class="mybonus"><div class="mbh">협력 보너스 <b class="${l.bonus >= 0 ? 'up' : 'dn'}">${l.bonus > 0 ? '+' : ''}${l.bonus || 0}점</b></div>${rows.join('') || '<p class="small muted" style="margin:0">이번에는 맞물린 정책이 없었습니다. 아래 시너지 도감을 보고 다음 사건에서 다른 조와 손발을 맞춰 보세요.</p>'}</div>`;
}
