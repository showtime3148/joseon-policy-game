/* 조선 국정 회의(의정부판) — 게임 규칙 */
const SKEYS = ['tr','pp','cr','df','lv','cu'];

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function addTo(d, e, k){ for(const s in e) d[s] = (d[s]||0) + e[s]*(k==null?1:k); return d; }
/* 받침에 따라 조사 고르기: josa('호조판서','은는') → '호조판서는' */
function josa(w, pair){ const c=String(w).charCodeAt(String(w).length-1); const has=c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28>0; return w+(has?pair.charAt(0):pair.charAt(1)); }
function roleById(id){ return ROLES.filter(r => r.id === id)[0]; }
function deptOf(pid){ return roleById(String(pid).charAt(0)); }
function policyOf(turn, pid){ return turn.policies.filter(p => p.id === pid)[0]; }

function initGame(){
  return {t:0, st:Object.assign({}, ERA.start), hist:[Object.assign({}, ERA.start)], pending:[], crises:[], log:[], done:false};
}
function applyStats(st, d){ for(const k of SKEYS) st[k] = clamp(Math.round((st[k] + (d[k]||0))*10)/10, 0, 100); }

/* 정책 묶음의 즉시 효과(조합 효과 제외) — 화면 미리보기용 */
function packEffect(turn, ids){
  const d = {};
  ids.forEach(id => { const p = policyOf(turn, id); if(p) addTo(d, p.eff); });
  return d;
}

/* 한 사건 처리. pack = {adopt:[{id, by, role, why, modern}], why} 또는 null(합의안 미제출) */
function playTurn(g, pack){
  const turn = ERA.turns[g.t];
  const before = Object.assign({}, g.st), notes = [], d = {};
  const adopt = pack ? pack.adopt.filter(a => policyOf(turn, a.id)).slice(0, MAX_ADOPT) : [];
  const ids = adopt.map(a => a.id);
  addTo(d, turn.base);
  addTo(d, {tr: ERA.income});
  if(!adopt.length){ addTo(d, {cr:-4, pp:-3}); notes.push({type:'crisis', text:'의정부가 합의안을 올리지 못해 위기를 방치했습니다.'}); }
  addTo(d, packEffect(turn, ids));
  (turn.combos || []).forEach(c => { if(c.ids.every(x => ids.indexOf(x) >= 0)){ addTo(d, c.eff); notes.push({type: c.good ? 'combo' : 'clash', text: c.note}); } });
  // 지연 효과 도착
  g.pending = g.pending.filter(p => { if(p.due === g.t){ addTo(d, p.eff); notes.push({type:'later', text:p.note}); return false; } return true; });
  // 전쟁: 쌓아 둔 국방력이 피해를 좌우
  if(turn.war){
    const df = g.st.df + (d.df || 0) * 0.5;
    if(df < 40){ addTo(d, {pp:-5, tr:-5, cr:-3, lv:-3}); notes.push({type:'war', text:'국방력이 약해 전쟁 피해가 컸습니다.'}); }
    else if(df >= 60){ addTo(d, {cr:3, pp:2}); notes.push({type:'war', text:'튼튼한 국방 덕분에 피해를 줄였습니다.'}); }
    else notes.push({type:'war', text:'전쟁을 겨우 막아 냈지만 피해가 적지 않았습니다.'});
  }
  applyStats(g.st, d);
  adopt.forEach(a => { const p = policyOf(turn, a.id); (p.later || []).forEach(l => g.pending.push({due:g.t + l.in, eff:l.eff, note:l.note})); });
  // 위기 판정
  const crisisNow = [];
  if(g.st.pp < 20){ applyStats(g.st, {cr:-8, tr:-6}); crisisNow.push('민란 발생'); }
  if(g.st.cr < 20){ applyStats(g.st, {pp:-5, df:-3}); crisisNow.push('정변 위기'); }
  if(g.st.tr < 10){ applyStats(g.st, {lv:-6, pp:-5}); crisisNow.push('재정 파탄'); }
  if(g.st.df < 15){ applyStats(g.st, {cr:-4, pp:-3}); crisisNow.push('국경 붕괴'); }
  crisisNow.forEach(c => { g.crises.push({year:turn.year, name:c}); notes.push({type:'crisis', text:c + '! 나라가 흔들립니다.'}); });

  const delta = {}; for(const k of SKEYS) delta[k] = Math.round((g.st[k] - before[k])*10)/10;
  const log = {t:g.t, year:turn.year, title:turn.title, adopt:adopt, why:pack ? String(pack.why || '') : '', delta:delta, notes:notes,
               matches: ids.filter(x => turn.real.ids.indexOf(x) >= 0).length};
  g.log.push(log);
  g.t++;
  g.hist.push(Object.assign({}, g.st));
  if(g.t >= ERA.turns.length) finishGame(g);
  return log;
}

function finishGame(g){
  const late = {}, notes = [];
  g.pending.forEach(p => { addTo(late, p.eff); notes.push(p.note); });
  g.pending = [];
  applyStats(g.st, late);
  g.lateNotes = notes;
  g.done = true;
  g.hist[g.hist.length-1] = Object.assign({}, g.st);
}

/* 점수: 평균 60% + 가장 낮은 지표 40% − 위기 */
function scoreOf(g){
  const v = SKEYS.map(k => g.st[k]);
  const avg = v.reduce((a,b) => a+b, 0) / v.length, min = Math.min.apply(null, v);
  return Math.round(avg*0.6 + min*0.4 - 5*g.crises.length);
}
function realMatches(g){ return g.log.reduce((a, l) => a + (l.matches || 0), 0); }
