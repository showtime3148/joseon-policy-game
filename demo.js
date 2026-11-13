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

/* 체험용 가상 의정부: 학생 한 명이 영의정과 6조를 모두 겸함 */
const BOT_NAMES = ['청렴 의정부', '개혁 의정부', '안정 의정부'];
const BOT_WHY = ['백성의 살림을 먼저 생각해 이 정책들을 묶었다. 국고가 줄어드는 것은 감수하고 몇 해 뒤 효과를 기대한다.',
  '나라의 기틀을 튼튼히 하려면 이 조합이 맞다고 의견을 모았다. 반발은 설득으로 풀고 재정은 다른 정책으로 보완한다.',
  '당장의 손해보다 지표의 균형을 유지하는 것이 목표다. 부딪히는 정책은 빼고 서로 돕는 정책을 함께 골랐다.'];
const BOT_MODERN = ['누진세', '규제 완화', '국민 청원 제도', '사회 간접 자본 투자', '공정 채용', '방위 산업 육성', '민주 시민 교육', '채무 조정'];
function botsKey(code){ return 'jd_bots_' + code; }
function getBots(code){ try { return JSON.parse(localStorage.getItem(botsKey(code))) || []; } catch (e) { return []; } }
function addBots(code){
  const ids = getBots(code);
  return BOT_NAMES.reduce((p, n, i) => p.then(() => API.post({ action: 'join', code: code, team: n, name: '가상 ' + (i + 1), roles: ROLES.map(r => r.id) })
    .then(j => { if (j.ok && !ids.some(x => x.teamId === j.teamId)) ids.push({ teamId: j.teamId, memberId: j.memberId }); })), Promise.resolve())
    .then(() => { try { localStorage.setItem(botsKey(code), JSON.stringify(ids)); } catch (e) {} });
}
const botTimers = {};
function runBots(room){
  if (!DEMO || !room || room.phase !== 'deciding') return;
  getBots(room.code).forEach((b, i) => {
    const t = room.teams.find(x => x.id === b.teamId), key = b.teamId + ':' + room.turn;
    if (!t || t.submitted || botTimers[key]) return;
    const turn = ERA.turns[room.turn];
    botTimers[key] = setTimeout(() => {
      const pool = turn.policies.map(p => p.id).sort(() => Math.random() - 0.5);
      const pick = Math.random() < 0.4 ? turn.real.ids.slice(0, MAX_ADOPT) : pool.slice(0, 2 + Math.floor(Math.random() * 3));
      const base = { code: room.code, teamId: b.teamId, memberId: b.memberId, turn: room.turn };
      pick.reduce((p, pid, k) => p.then(() => API.post(Object.assign({ action: 'propose', pid: pid, why: '이 사건을 해결하는 데 꼭 필요한 정책이라고 판단했다.', modern: BOT_MODERN[(i + k) % BOT_MODERN.length] }, base))), Promise.resolve())
        .then(() => API.post(Object.assign({ action: 'submit', adopt: pick, why: BOT_WHY[i % 3] }, base)));
    }, 2500 + i * 1800 + Math.random() * 2500);
  });
}
