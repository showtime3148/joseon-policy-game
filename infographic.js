/* 천하 형세 인포그래픽 — 나라(의정부)별 국력 비교, 육각 국력도, 부문별 으뜸, 세력 판도 */
const NATION_COLORS = ['#b23a2b', '#2f5d9e', '#2f7a4c', '#c08a1c', '#6d4ba0', '#1f8a8a', '#c4622d', '#6b4e35'];
function nationIdx(room, id){ const i = room.teams.findIndex(t => t.id === id); return i < 0 ? 0 : i; }
function nationColor(room, id){ return NATION_COLORS[nationIdx(room, id) % NATION_COLORS.length]; }
function nationChar(t){ const n = String(t.name || '?').trim(); return n.charAt(0) || '?'; }
/* 깃발 SVG: 깃대 + 펄럭이는 기 + 나라 이름 첫 글자 */
function flagSVG(room, t, size){
  const c = nationColor(room, t.id), s = size || 34;
  return `<svg class="flag" width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="3" width="2.4" height="35" rx="1" fill="#5a4630"/>
    <path d="M7.4 5 Q20 2 36 6 Q31 13 36 21 Q22 17 7.4 21 Z" fill="${c}" stroke="#2b2118" stroke-width=".8"/>
    <text x="21" y="16.5" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Nanum Myeongjo,serif">${esc(nationChar(t))}</text></svg>`;
}

/* 나라별 국력 비교판: 지표 막대가 이전 값 → 새 값으로 자라남 */
function powerBoardHTML(room, turnIdx, myId){
  const list = ranked(room);
  const prevRank = room.teams.slice().sort((a, b) => prevScore(b, turnIdx) - prevScore(a, turnIdx)).map(t => t.id);
  return `<div class="pboard" data-fx="ibars">
    <div class="pbh"><span></span><span>나라</span>${SKEYS.map(k => `<span class="pbk"><i>${STATS[k].icon}</i>${STATS[k].name}</span>`).join('')}<span>국력</span></div>
    ${list.map((t, i) => {
      const pv = prevStats(t), ps = prevScore(t, turnIdx), was = prevRank.indexOf(t.id) + 1, mv = was - (i + 1), c = nationColor(room, t.id);
      return `<div class="pbr ${t.id === myId ? 'me' : ''}" style="--nc:${c}"><span class="pbrank num">${i + 1}${mv ? `<em class="${mv > 0 ? 'up' : 'dn'}">${mv > 0 ? '▲' : '▼'}${Math.abs(mv)}</em>` : ''}</span>
        <span class="pbn">${flagSVG(room, t, 30)}<b>${esc(t.name)}</b></span>
        ${SKEYS.map(k => { const a = pv[k], b = t.st[k], d = Math.round((b - a) * 10) / 10;
          return `<span class="pbc"><span class="pbbar"><i data-from="${a}" data-to="${b}" class="${b < 20 ? 'lo' : ''}" style="width:${a}%"></i></span><span class="pbv"><b class="num" data-from="${Math.round(a)}" data-to="${Math.round(b)}">${Math.round(a)}</b>${d ? `<em class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${d}</em>` : ''}</span></span>`; }).join('')}
        <span class="pbs"><b class="num" data-from="${ps}" data-to="${t.score}">${ps}</b>${t.score - ps ? `<em class="${t.score - ps > 0 ? 'up' : 'dn'}">${t.score - ps > 0 ? '+' : ''}${t.score - ps}</em>` : ''}</span></div>`; }).join('')}
  </div>`;
}

/* 육각 국력도: 여섯 지표를 꼭짓점으로 나라마다 다각형 */
function radarSVG(room, myId, size){
  const W = size || 320, cx = W / 2, cy = W / 2 + 6, R = W * 0.36;
  const pt = (k, v) => { const a = -Math.PI / 2 + k * Math.PI / 3, r = R * v / 100; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const ring = v => SKEYS.map((_, k) => pt(k, v).map(x => x.toFixed(1)).join(',')).join(' ');
  const axes = SKEYS.map((key, k) => { const [x, y] = pt(k, 100), [lx, ly] = pt(k, 122);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#cbbfa6"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#4a3b2a">${STATS[key].name}</text>`; }).join('');
  const polys = ranked(room).slice().reverse().map(t => { const c = nationColor(room, t.id), pts = SKEYS.map((key, k) => pt(k, t.st[key]).map(x => x.toFixed(1)).join(',')).join(' ');
    return `<polygon class="rpoly ${t.id === myId ? 'me' : ''}" points="${pts}" fill="${c}" fill-opacity="${t.id === myId ? .32 : .14}" stroke="${c}" stroke-width="${t.id === myId ? 3 : 1.8}"/>`; }).join('');
  return `<svg class="radar" viewBox="0 0 ${W} ${W + 12}" role="img" aria-label="나라별 육각 국력도">
    ${[25, 50, 75, 100].map(v => `<polygon points="${ring(v)}" fill="${v === 100 ? '#fbf7ee' : 'none'}" stroke="#ddd2bb"/>`).join('')}
    <polygon points="${ring(20)}" fill="#c0392b" fill-opacity=".08" stroke="#c0392b" stroke-dasharray="3 3" stroke-opacity=".5"/>
    ${axes}${polys}</svg>
    <div class="rlegend">${ranked(room).map(t => `<span style="--nc:${nationColor(room, t.id)}" class="${t.id === myId ? 'me' : ''}"><i></i>${esc(t.name)}</span>`).join('')}</div>`;
}

/* 부문별 으뜸: 지표마다 가장 높은 나라와 이번에 가장 많이 오른 나라 */
function leadersHTML(room, turnIdx){
  if (!room.teams.length) return '';
  return `<div class="leaders">${SKEYS.map(k => {
    const top = room.teams.slice().sort((a, b) => b.st[k] - a.st[k])[0];
    const gain = room.teams.map(t => ({t, d: t.st[k] - prevStats(t)[k]})).sort((a, b) => b.d - a.d)[0];
    return `<div class="ld" style="--nc:${nationColor(room, top.id)}"><div class="ldk"><i>${STATS[k].icon}</i>${STATS[k].name} 으뜸</div>
      <div class="ldn">${flagSVG(room, top, 26)}<b>${esc(top.name)}</b><span class="num">${Math.round(top.st[k])}</span></div>
      ${gain.d > 0.05 ? `<div class="ldg">최다 상승 · ${esc(gain.t.name)} <b class="up">+${Math.round(gain.d * 10) / 10}</b></div>` : '<div class="ldg muted">상승한 나라 없음</div>'}</div>`; }).join('')}</div>`;
}

/* 천하 세력 판도: 국력(점수) 비율을 한 줄의 땅으로 */
function shareBarHTML(room, turnIdx, myId){
  const list = ranked(room), tot = list.reduce((a, t) => a + Math.max(1, t.score), 0);
  const ptot = list.reduce((a, t) => a + Math.max(1, prevScore(t, turnIdx)), 0);
  return `<div class="share" data-fx="share">${list.map(t => { const w1 = Math.max(1, t.score) / tot * 100, w0 = Math.max(1, prevScore(t, turnIdx)) / ptot * 100;
    return `<span class="${t.id === myId ? 'me' : ''}" style="--nc:${nationColor(room, t.id)}; width:${w0}%" data-w0="${w0}" data-w1="${w1}" title="${esc(t.name)}"><b>${esc(t.name)}</b><em class="num">${Math.round(w1)}%</em></span>`; }).join('')}</div>`;
}

/* 한 화면 묶음 */
function infographicHTML(room, turnIdx, myId, o){
  o = o || {};
  return `<div class="infog">
    <div class="ighead"><span class="seal" style="width:40px;height:40px;font-size:20px">勢</span><div><div class="eyebrow">${ERA.turns[turnIdx].year}년 · 사건 ${turnIdx + 1} 이후</div><h3>천하 형세</h3></div></div>
    <div data-at="${o.at || 0}" data-fx="share">${shareBarHTML(room, turnIdx, myId)}</div>
    <div class="iggrid"><div data-at="${(o.at || 0) + 300}" data-fx="ibars">${powerBoardHTML(room, turnIdx, myId)}</div>
      ${o.radar === false ? '' : `<div class="igradar" data-at="${(o.at || 0) + 600}">${radarSVG(room, myId, 300)}</div>`}</div>
    ${o.leaders === false ? '' : `<div data-at="${(o.at || 0) + 1600}">${leadersHTML(room, turnIdx)}</div>`}
  </div>`;
}

FX.ibars = function(el, fast){
  el.querySelectorAll('.pbbar i[data-to]').forEach(b => { const from = +b.dataset.from, to = +b.dataset.to;
    if (fast) { b.style.width = to + '%'; return; } tween(1100, e => { b.style.width = (from + (to - from) * e) + '%'; }); });
  el.querySelectorAll('b[data-to]').forEach(n => { const from = +n.dataset.from, to = +n.dataset.to;
    if (fast) { n.textContent = Math.round(to); return; } tween(1100, e => { n.textContent = Math.round(from + (to - from) * e); }); });
  el.querySelectorAll('.pbr em, .pbs em').forEach((m, i) => { if (fast) { m.classList.add('show'); return; } setTimeout(() => m.classList.add('show'), 900 + (i % 7) * 60); });
};
FX.share = function(el, fast){
  el.querySelectorAll('.share span').forEach(s => { const a = +s.dataset.w0, b = +s.dataset.w1;
    if (fast) { s.style.width = b + '%'; return; } tween(1200, e => { s.style.width = (a + (b - a) * e) + '%'; }); });
};
