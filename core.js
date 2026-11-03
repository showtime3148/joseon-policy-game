/* 조선 국정 시뮬레이션 — 게임 규칙 */
const SKEYS = ['tr','pp','cr','df','lv','cu'];
const BUDGET = 12;            // 한 턴에 쓰는 기본 예산(능력치 환산)
const TAX_LABEL = {1:'매우 가볍게',2:'가볍게',3:'보통',4:'무겁게',5:'매우 무겁게'};

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function addTo(d, e, k){ for(const s in e) d[s] = (d[s]||0) + e[s]*(k==null?1:k); return d; }

function initGame(sc){
  return {sid:sc.id, t:0, st:Object.assign({}, sc.start), hist:[Object.assign({}, sc.start)],
          pending:[], flags:{}, ach:[], crises:[], log:[], done:false, ending:null};
}

// 세금·예산 효과: gov = {tax:1~5, bud:{df,lv,cu}}
function govEffect(gov, st){
  const tx = gov.tax - 3;
  const b = gov.bud, tot = (b.df + b.lv + b.cu) || 1;
  const e = {tr: tx*5 + 2, pp: -tx*4 + (st.lv - 50)*0.06, lv: -tx*2 - 2, df: -3, cu: -2, cr:0};
  e.df += BUDGET*0.6*b.df/tot; e.lv += BUDGET*0.6*b.lv/tot; e.cu += BUDGET*0.6*b.cu/tot;
  return e;
}

function applyStats(st, d){ for(const k of SKEYS) st[k] = clamp(Math.round((st[k] + (d[k]||0))*10)/10, 0, 100); }

function playTurn(g, sc, choiceId, gov, why){
  const turn = sc.turns[g.t];
  const ch = turn.choices.find(c => c.id === choiceId) || {id:'-', label:'어명을 내리지 못함', eff:{cr:-4, pp:-3}};
  const before = Object.assign({}, g.st), notes = [], d = {};
  addTo(d, ch.eff);
  addTo(d, govEffect(gov, g.st));
  // 지연 효과 도착
  g.pending = g.pending.filter(p => { if(p.due === g.t){ addTo(d, p.eff); notes.push({type:'later', text:p.note}); return false; } return true; });
  // 전쟁: 국방력에 따라 피해가 달라짐
  if(turn.war){
    if(g.st.df < 40){ addTo(d, {pp:-5, tr:-5, cr:-3}); notes.push({type:'war', text:'국방력이 약해 전쟁 피해가 컸습니다.'}); }
    else if(g.st.df >= 60){ addTo(d, {cr:3, pp:2}); notes.push({type:'war', text:'튼튼한 국방 덕분에 피해를 줄였습니다.'}); }
  }
  applyStats(g.st, d);
  if(ch.later) ch.later.forEach(l => g.pending.push({due:g.t + l.in, eff:l.eff, note:l.note, from:turn.title}));
  if(ch.flag) g.flags[ch.flag] = true;
  const newAch = ch.ach && !g.ach.includes(ch.ach) ? ch.ach : null;
  if(newAch) g.ach.push(newAch);
  // 위기 판정
  const crisisNow = [];
  if(g.st.pp < 20){ applyStats(g.st, {cr:-8, tr:-6}); crisisNow.push('민란 발생'); }
  if(g.st.cr < 20){ applyStats(g.st, {pp:-5, df:-3}); crisisNow.push('정변 위기'); }
  if(g.st.tr < 10){ applyStats(g.st, {lv:-6, pp:-5}); crisisNow.push('재정 파탄'); }
  crisisNow.forEach(c => { g.crises.push({year:turn.year, name:c}); notes.push({type:'crisis', text:c+'! 나라가 흔들립니다.'}); });

  const delta = {}; for(const k of SKEYS) delta[k] = Math.round((g.st[k] - before[k])*10)/10;
  g.log.push({t:g.t, year:turn.year, title:turn.title, choice:choiceId, label:ch.label, tax:gov.tax, bud:Object.assign({}, gov.bud),
              why:why||'', delta:delta, notes:notes, ach:newAch, real:turn.real.pick === ch.id});
  g.t++;
  g.hist.push(Object.assign({}, g.st));
  if(g.t >= sc.turns.length) finishGame(g, sc);
  return g.log[g.log.length-1];
}

function finishGame(g, sc){
  // 아직 나타나지 않은 지연 효과는 후대에 나타남
  const late = {}, notes = [];
  g.pending.forEach(p => { addTo(late, p.eff); notes.push(p.note); });
  g.pending = [];
  applyStats(g.st, late);
  g.lateNotes = notes;
  g.ending = sc.ending ? sc.ending(g) : null;
  g.done = true;
  g.hist[g.hist.length-1] = Object.assign({}, g.st);
}

function scoreOf(g){
  // 평균(60%) + 가장 약한 능력치(40%): 한쪽만 키우면 점수가 낮다
  const v = SKEYS.map(k => g.st[k]);
  const avg = v.reduce((a,b) => a+b, 0) / v.length, min = Math.min(...v);
  return Math.max(0, Math.round(0.6*avg + 0.4*min + 2*g.ach.length - 5*g.crises.length + (g.ending ? g.ending.bonus : 0)));
}
function realMatches(g){ return g.log.filter(l => l.real).length; }

if(typeof module !== 'undefined' && module.exports) module.exports = {SKEYS, initGame, playTurn, scoreOf, govEffect, realMatches, TAX_LABEL};
