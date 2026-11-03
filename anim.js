/* 결과 화면 연출 — 보드게임처럼 단계별로 펼쳐지는 애니메이션 */
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
let stageTimers = [];

function prevStats(t){ return t.hist.length >= 2 ? t.hist[t.hist.length - 2] : t.st; }
function prevScore(t, turnIdx){
  const l = t.log.find(x => x.t === turnIdx);
  if (!l) return t.score;
  const g = {st: prevStats(t), ach: t.ach.filter(a => a !== l.ach), crises: t.crises.filter(c => c.year !== l.year), ending: null};
  return scoreOf(g);
}

/* 단계 실행: [data-at] 요소가 지정한 시간(ms)에 나타나고 data-fx 효과를 실행 */
function runStages(root){
  stageTimers.forEach(clearTimeout); stageTimers = [];
  const els = Array.from(root.querySelectorAll('[data-at]'));
  const fire = el => { if (el.classList.contains('in')) return; el.classList.add('in'); const fx = el.dataset.fx; if (fx && FX[fx]) FX[fx](el, REDUCE || root.dataset.skip === '1'); };
  if (REDUCE) { els.forEach(fire); const b = root.querySelector('.skip'); if (b) b.remove(); return; }
  els.forEach(el => stageTimers.push(setTimeout(() => fire(el), +el.dataset.at || 0)));
  const end = Math.max(0, ...els.map(el => +el.dataset.at || 0)) + 1500;
  stageTimers.push(setTimeout(() => { const b = root.querySelector('.skip'); if (b) b.remove(); }, end));
}
function skipStages(root){
  stageTimers.forEach(clearTimeout); stageTimers = [];
  root.dataset.skip = '1';
  root.querySelectorAll('[data-at]').forEach(el => { if (!el.classList.contains('in')) { el.classList.add('in'); const fx = el.dataset.fx; if (fx && FX[fx]) FX[fx](el, true); } else if (el._finish) el._finish(); });
  const b = root.querySelector('.skip'); if (b) b.remove();
}

function tween(dur, step, done){
  const t0 = performance.now();
  const f = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); step(e); if (p < 1) requestAnimationFrame(f); else if (done) done(); };
  requestAnimationFrame(f);
}

const FX = {
  type(el, fast){
    const full = el.innerHTML, text = el.textContent;
    const finish = () => { el.innerHTML = full; el._finish = null; };
    if (fast) return finish();
    el._finish = finish; el.textContent = '';
    let i = 0; const iv = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(iv); finish(); } }, 28);
  },
  count(el, fast){
    const to = +el.dataset.to, n = el.querySelector('.n');
    const show = v => { const r = Math.round(v * 10) / 10; n.textContent = sg(r); n.className = 'n ' + (r > 0 ? 'up' : r < 0 ? 'dn' : 'z'); };
    if (fast) return show(to);
    tween(700, e => show(to * e));
  },
  bars(el, fast){
    el.querySelectorAll('[data-to]').forEach(b => {
      const from = +b.dataset.from, to = +b.dataset.to, v = b.closest('.gauge') && b.closest('.gauge').querySelector('.v');
      if (fast) { b.style.width = to + '%'; if (v) v.textContent = Math.round(to); return; }
      tween(900, e => { const x = from + (to - from) * e; b.style.width = x + '%'; if (v) v.textContent = Math.round(x); });
    });
  },
  swap(el){ el.classList.add('swapped'); },
  confetti(el, fast){ if (!fast) confetti(el); },
  flip(el, fast){ el.classList.add('flipped'); const c = el.closest('.card'); if (c) c.querySelectorAll('.dc[data-real="1"]').forEach(d => d.classList.add('realhl')); if (el.dataset.match === '1' && !fast) setTimeout(() => confetti(el), 350); },
  chips(el, fast){
    el.querySelectorAll('.chip').forEach((c, i) => { if (fast) { c.classList.add('drop'); return; } setTimeout(() => c.classList.add('drop'), i * 220); });
    el.querySelectorAll('.cnt[data-to]').forEach(c => { const to = +c.dataset.to; if (fast) { c.textContent = to; return; } tween(800, e => c.textContent = Math.round(to * e)); });
  },
  rank(el, fast){
    const rows = Array.from(el.querySelectorAll('.lbr'));
    const first = new Map(rows.map(r => [r, r.getBoundingClientRect().top]));
    const sorted = rows.slice().sort((a, b) => (+b.dataset.score) - (+a.dataset.score));
    const max = Math.max(1, ...rows.map(r => +r.dataset.score));
    sorted.forEach((r, i) => { r.parentNode.appendChild(r); r.querySelector('.num').textContent = i + 1;
      const was = +r.dataset.prevrank, d = was - (i + 1), ar = r.querySelector('.mv');
      if (ar) { ar.textContent = d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : ''; ar.className = 'mv ' + (d > 0 ? 'up' : d < 0 ? 'dn' : ''); } });
    rows.forEach(r => {
      const bar = r.querySelector('.bb i'), sc = r.querySelector('.s'), from = +r.dataset.prev, to = +r.dataset.score;
      if (fast) { bar.style.width = Math.max(2, to / max * 100) + '%'; sc.textContent = to; return; }
      const dy = first.get(r) - r.getBoundingClientRect().top;
      r.style.transform = `translateY(${dy}px)`; r.style.transition = 'none';
      requestAnimationFrame(() => { r.style.transition = 'transform .9s cubic-bezier(.2,.8,.2,1)'; r.style.transform = ''; });
      tween(1000, e => { const x = from + (to - from) * e; bar.style.width = Math.max(2, x / max * 100) + '%'; sc.textContent = Math.round(x); });
    });
  }
};

/* 오방색 꽃가루 */
function confetti(el){
  if (REDUCE) return;
  const r = el.getBoundingClientRect(), cols = ['#b23a2c', '#24384c', '#c99a2e', '#2f6b5e', '#f6edd7'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i'); p.className = 'confetti';
    p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top + r.height / 2) + 'px';
    p.style.background = cols[i % cols.length];
    const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 160;
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); p.style.setProperty('--dy', (Math.sin(ang) * dist - 80) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(p); setTimeout(() => p.remove(), 1600);
  }
}

/* 연출용 조각 */
function gaugesFromTo(prev, now){
  return '<div class="gauges">' + SKEYS.map(k => `<div class="gauge"><span class="seal" title="${STATS[k].desc}">${STATS[k].icon}</span><div>
    <div class="t2"><b>${STATS[k].name}</b><span><span class="v">${Math.round(prev[k])}</span></span></div>
    <div class="bar"><i class="${now[k] < 20 ? 'lo' : ''}" data-from="${prev[k]}" data-to="${now[k]}" style="width:${prev[k]}%; transition:none"></i><span class="danger"></span></div></div></div>`).join('') + '</div>';
}
function lbAnimHTML(room, myId, turnIdx){
  const rows = room.teams.map(t => ({t, prev: prevScore(t, turnIdx)}));
  const byPrev = rows.slice().sort((a, b) => b.prev - a.prev);
  const max = Math.max(1, ...rows.map(r => Math.max(r.prev, r.t.score)));
  return '<div class="lb">' + byPrev.map((r, i) => `<div class="lbr ${r.t.id === myId ? 'me' : ''}" data-score="${r.t.score}" data-prev="${r.prev}" data-prevrank="${i + 1}">
    <span class="num muted">${i + 1}</span><b>${esc(r.t.name)} <span class="mv"></span></b><span class="bb"><i style="width:${Math.max(2, r.prev / max * 100)}%"></i></span><span class="s num">${r.prev}</span></div>`).join('') + '</div>';
}
function distAnimHTML(room, turnIdx, myId, sid){
  const s = scenById(sid || room.sid), turn = s.turns[turnIdx], by = {a: [], b: [], c: [], '-': []};
  room.teams.filter(t => t.sid === s.id).forEach(t => { const l = t.log.find(x => x.t === turnIdx); if (l) (by[l.choice || '-'] || by['-']).push(t); });
  return `<div class="dist">${turn.choices.map((c, i) => `<div class="dc" data-real="${c.id === turn.real.pick ? 1 : 0}"><div class="row between"><h4>${'甲乙丙'.charAt(i)} ${esc(c.label)}</h4><span class="cnt num" data-to="${by[c.id].length}">0</span></div>
    <div class="chips">${by[c.id].map(t => `<span class="chip ${t.id === myId ? 'me' : ''}">${esc(t.name)}</span>`).join('') || '<span class="small muted">없음</span>'}</div></div>`).join('')}</div>
    ${by['-'].length ? `<p class="small muted" style="margin:6px 0 0">어명을 내리지 못한 모둠: ${by['-'].map(t => esc(t.name)).join(', ')}</p>` : ''}`;
}
function realFlipHTML(turn, match, at, manual){
  return `<div class="flipcard ${manual ? 'manual' : ''}" ${at != null ? `data-at="${at}" data-fx="flip"` : ''} data-match="${match ? 1 : 0}">
    <div class="fc-in"><div class="fc-front"><span class="seal" style="width:44px;height:44px;font-size:22px">史</span><b>실제 역사에서 왕은 무엇을 택했을까?</b>${manual ? '<button class="btn primary" data-act="flipreal">실제 역사 공개</button>' : '<span class="small">곧 공개됩니다…</span>'}</div>
    <div class="fc-back"><b class="tit">실제 역사에서는</b>${match ? '<span class="matchst">史實 일치</span>' : ''}<p>${esc(turn.real.text)}</p></div></div></div>`;
}
