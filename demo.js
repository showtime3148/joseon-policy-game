/* 체험 모드: 서버 주소가 없으면 이 브라우저 안에서 서버 코드를 그대로 돌립니다.
 * 같은 브라우저의 여러 탭(교사 화면·모둠 화면)이 localStorage로 상태를 공유합니다. */
const DEMO = !serverUrl();
if (DEMO) {
  const noSheet = { appendRow(){}, setFrozenRows(){}, getLastRow(){ return 1; },
    getRange(){ return { getValues(){ return []; }, getValue(){ return ''; }, setValues(){ return this; }, setFontWeight(){ return this; }, setWrap(){ return this; }, setVerticalAlignment(){ return this; } }; } };
  window.CacheService = { getScriptCache: () => ({ get: k => { try { return localStorage.getItem('jd_' + k); } catch (e) { return null; } },
                                                    put: (k, v) => { try { localStorage.setItem('jd_' + k, v); } catch (e) {} } }) };
  window.LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
  window.SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheetByName: () => noSheet, insertSheet: () => noSheet }) };
  window.ContentService = { MimeType: { JSON: 1 }, createTextOutput: t => ({ setMimeType: () => t }) };
  const delay = x => new Promise(r => setTimeout(() => r(x), 120));
  API.state = (code, ver, team) => delay(JSON.parse(doGet({ parameter: { action: 'state', code: code, ver: ver ? String(ver) : '', team: team || '' } })));
  API.post = d => delay(JSON.parse(doPost({ postData: { contents: JSON.stringify(d) } })));
}

/* 체험용 가상 모둠 */
const BOT_NAMES = ['홍문관', '규장각', '비변사'];
const BOT_WHY = ['백성의 살림을 먼저 생각해 이 대책을 골랐다. 국고가 줄어드는 것은 감수한다.',
  '나라의 기틀을 튼튼히 하려면 이 길이 맞다고 모둠이 의견을 모았다. 반발은 설득으로 풀겠다.',
  '당장의 손해보다 몇 해 뒤의 효과를 보고 결정했다. 지표 균형을 유지하는 것이 목표다.'];
function botsKey(code){ return 'jd_bots_' + code; }
function getBots(code){ try { return JSON.parse(localStorage.getItem(botsKey(code))) || []; } catch (e) { return []; } }
function addBots(code){
  const ids = getBots(code);
  const kings = ['sejong', 'jeongjo', 'gwanghae'];
  return BOT_NAMES.reduce((p, n, i) => p.then(() => API.post({ action: 'join', code: code, team: n, members: '가상 모둠 ' + (i + 1), sid: kings[i] })
    .then(j => { if (j.ok && ids.indexOf(j.teamId) < 0) ids.push(j.teamId); })), Promise.resolve())
    .then(() => { try { localStorage.setItem(botsKey(code), JSON.stringify(ids)); } catch (e) {} });
}
const botTimers = {};
function runBots(room){
  if (!DEMO || !room || room.phase !== 'deciding') return;
  getBots(room.code).forEach((id, i) => {
    const t = room.teams.find(x => x.id === id), key = id + ':' + room.turn;
    if (!t || t.submitted || botTimers[key]) return;
    const turn = teamScen(room, t).turns[room.turn];
    botTimers[key] = setTimeout(() => {
      const pick = Math.random() < 0.5 ? turn.real.pick : turn.choices[Math.floor(Math.random() * 3)].id;
      const free = (typeof CARDS !== 'undefined' && room.cardsOn && (t.cards || []).length < CARD_LIMIT) ? CARDS.filter(c => (t.cards || []).indexOf(c.id) < 0) : [];
      const card = free.length && Math.random() < 0.45 ? free[Math.floor(Math.random() * free.length)].id : null;
      const A = t.advisors || {have:[], used:[]}, can = A.have.filter(x => A.used.indexOf(x) < 0);
      if (can.length && Math.random() < 0.35) API.post({ action: 'advise', code: room.code, teamId: id, advisor: can[0] });
      API.post({ action: 'submit', code: room.code, teamId: id, turn: room.turn, choice: pick, card: card,
        gov: { tax: 2 + Math.floor(Math.random() * 3), bud: { df: 20 + Math.random() * 60, lv: 20 + Math.random() * 60, cu: 20 + Math.random() * 60 } }, why: BOT_WHY[i % 3] });
    }, 2500 + i * 1800 + Math.random() * 2500);
  });
}
