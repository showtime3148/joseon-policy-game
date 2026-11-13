/* ===== 실시간 방 서버 (Apps Script) =====
 * 방 상태는 CacheService(빠름)에 두고, 시트 '_rooms'에 백업합니다.
 * 결과 계산은 이 서버가 scenarios.js·core.js 규칙으로 직접 합니다(모든 모둠 공정).
 */
const ROOM_TTL = 21600; // 6시간
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOG_HEAD = ['기록 시각','방','학급','왕','사건 번호','연도','사건','모둠','모둠원','선택','실제와 일치','현대 제도 카드','세금','예산(국방/민생/문화)','결정 근거','국고','민심','왕권','국방','민생','문화','점수'];
const FINAL_HEAD = ['제출 시각','방','학급','왕','모둠','모둠원','점수','순위','실제 역사 일치','결말','국고','민심','왕권','국방','민생','문화','업적','위기','사용한 카드','국정 방향','성찰1: 실제와 다른 선택','성찰2: 실제 왕 평가','성찰3: 우리 치세 실록'];

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }
function rid(n, chars) { let s = ''; for (let i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length)); return s; }
function scen(id) { return SCENARIOS.filter(s => s.id === id)[0]; }
function tscen(r, t) { return scen(t.sid || r.sid); }
const TOTAL = 7;
function sheetOf(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (head) { sh.appendRow(head); sh.setFrozenRows(1); } }
  return sh;
}

function feed(r, e) { e.at = Date.now(); r.feed = (r.feed || []).concat([e]).slice(-30); }
function getRoom(code) {
  const c = CacheService.getScriptCache().get('room_' + code);
  if (c) return JSON.parse(c);
  // 캐시가 비었으면 시트 백업에서 복구
  const sh = sheetOf('_rooms', ['방', '갱신', '상태']);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const codes = sh.getRange(2, 1, last - 1, 1).getValues().map(r => r[0]);
  const i = codes.lastIndexOf(code);
  if (i < 0) return null;
  const json = sh.getRange(i + 2, 3).getValue();
  if (!json) return null;
  CacheService.getScriptCache().put('room_' + code, json, ROOM_TTL);
  return JSON.parse(json);
}
function putRoom(r, backup) {
  r.ver = (r.ver || 0) + 1;
  const json = JSON.stringify(r);
  CacheService.getScriptCache().put('room_' + r.code, json, ROOM_TTL);
  if (backup && json.length < 49000) {
    const sh = sheetOf('_rooms', ['방', '갱신', '상태']);
    const last = sh.getLastRow();
    const codes = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(x => x[0]) : [];
    const i = codes.lastIndexOf(r.code);
    if (i >= 0) sh.getRange(i + 2, 2, 1, 2).setValues([[new Date(), json]]);
    else sh.appendRow([r.code, new Date(), json]);
  }
}

function publicRoom(r) {
  return {
    feed: (r.feed || []).slice(-8), code: r.code, sid: r.sid, cls: r.cls, cardsOn: r.cards !== false, phase: r.phase, turn: r.turn, total: TOTAL, ver: r.ver, openedAt: r.openedAt || null,
    teams: r.order.map(id => {
      const t = r.teams[id], g = t.game;
      return { id: t.id, sid: t.sid || r.sid, name: t.name, members: t.members, goal: t.goal || '', submitted: !!t.sub,
        st: g.st, hist: g.hist, ach: g.ach, cards: g.cards || [], advisors: g.advisors || { have: [], used: [] }, crises: g.crises, log: g.log, done: g.done, ending: g.ending, lateNotes: g.lateNotes || [],
        score: scoreOf(g), matches: realMatches(g), final: !!t.final };
    })
  };
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'state') {
    const r = getRoom(String(p.code || '').toUpperCase());
    if (!r) return out({ ok: false, error: '방을 찾을 수 없습니다. 코드를 확인하세요.' });
    if (p.ver && Number(p.ver) === r.ver) return out({ ok: true, same: true, ver: r.ver });
    const pub = publicRoom(r);
    if (p.team && r.teams[p.team]) { const mt = r.teams[p.team]; pub.mySub = mt.sub || null; pub.myAdvice = mt.advice && mt.advice.turn === r.turn && r.phase === 'deciding' ? mt.advice.data : null; }
    return out({ ok: true, room: pub });
  }
  return out({ ok: true, msg: '조선 국정 회의 서버가 작동 중입니다.' });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: '요청 형식 오류' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return out(handle(d)); }
  catch (err) { return out({ ok: false, error: String(err && err.message || err) }); }
  finally { lock.releaseLock(); }
}

function handle(d) {
  if (d.action === 'create') {
    if (!scen(d.sid)) return { ok: false, error: '다스릴 왕(시대)을 고르세요.' };
    let code; do { code = rid(4, CODE_CHARS); } while (CacheService.getScriptCache().get('room_' + code));
    const r = { code: code, hostKey: rid(16, CODE_CHARS), sid: d.sid || '', cls: String(d.cls || ''), cards: d.cards !== false, phase: 'lobby', turn: 0, teams: {}, order: [], created: Date.now() };
    putRoom(r, true);
    return { ok: true, code: code, hostKey: r.hostKey };
  }
  const code = String(d.code || '').toUpperCase();
  const r = getRoom(code);
  if (!r) return { ok: false, error: '방을 찾을 수 없습니다. 코드를 확인하세요.' };

  if (d.action === 'join') {
    const name = String(d.team || '').trim().slice(0, 20);
    if (!name) return { ok: false, error: '모둠 이름을 입력하세요.' };
    const exist = r.order.map(id => r.teams[id]).filter(t => t.name === name)[0];
    const sid = r.sid || d.sid;
    if (!exist && !scen(sid)) return { ok: false, error: '우리 모둠이 다스릴 왕을 고르세요.' };
    const s = scen(sid);
    if (exist) { if (d.members) exist.members = String(d.members).slice(0, 100); putRoom(r, true); return { ok: true, teamId: exist.id, rejoin: true }; }
    if (r.order.length >= 12) return { ok: false, error: '한 방에는 12모둠까지 들어올 수 있습니다.' };
    if (r.phase === 'ended') return { ok: false, error: '이미 끝난 방입니다.' };
    const id = rid(8, CODE_CHARS);
    const g = initGame(s);
    starterAdvisor(g, s);
    // 늦게 들어온 모둠은 현재 사건부터 시작
    g.t = r.phase === 'revealed' ? r.turn + 1 : r.turn;
    for (let i = 0; i < g.t; i++) g.hist.push(Object.assign({}, g.st));
    r.teams[id] = { id: id, sid: sid, name: name, members: String(d.members || '').slice(0, 100), game: g, sub: null, goal: '' };
    r.order.push(id);
    putRoom(r, true);
    return { ok: true, teamId: id };
  }

  if (d.action === 'goal' || d.action === 'submit' || d.action === 'final' || d.action === 'scenario' || d.action === 'advise') {
    const t = r.teams[d.teamId];
    if (!t) return { ok: false, error: '모둠 정보를 찾을 수 없습니다. 다시 참가하세요.' };
    if (d.action === 'scenario') {
      if (r.sid) return { ok: false, error: '이 방은 선생님이 시대를 정했습니다.' };
      if (r.phase !== 'lobby') return { ok: false, error: '사건이 시작된 뒤에는 바꿀 수 없습니다.' };
      if (!scen(d.sid)) return { ok: false, error: '시나리오가 없습니다.' };
      t.sid = d.sid; t.game = initGame(scen(d.sid)); starterAdvisor(t.game, scen(d.sid)); putRoom(r, true); return { ok: true };
    }
    const s = tscen(r, t);
    if (d.action === 'advise') {
      if (r.phase !== 'deciding' || t.game.t !== r.turn) return { ok: false, error: '사건이 열려 있을 때만 조언을 청할 수 있습니다.' };
      const adv = advisorById(d.advisor), A = t.game.advisors || { have: [], used: [] };
      if (!adv || A.have.indexOf(adv.id) < 0) return { ok: false, error: '아직 만나지 못한 조언자입니다.' };
      if (A.used.indexOf(adv.id) >= 0) return { ok: false, error: '이 조언자는 이미 조언을 마쳤습니다.' };
      if (t.advice && t.advice.turn === r.turn) return { ok: false, error: '한 사건에는 한 명의 조언만 들을 수 있습니다.' };
      A.used.push(adv.id); t.game.advisors = A;
      t.advice = { turn: r.turn, data: buildAdvice(adv, s.turns[r.turn]) };
      feed(r, { kind: 'advise', adv: adv.id, team: t.name, text: josa(adv.name, '이가') + ' ' + t.name + ' 모둠 앞에 나타나 조언하였습니다' });
      putRoom(r, false);
      return { ok: true, advice: t.advice.data };
    }
    if (d.action === 'goal') { t.goal = String(d.goal || '').slice(0, 1000); putRoom(r, false); return { ok: true }; }
    if (d.action === 'submit') {
      if (r.phase !== 'deciding') return { ok: false, error: '지금은 어명을 받을 때가 아닙니다.' };
      if (Number(d.turn) !== r.turn) return { ok: false, error: '이미 지나간 사건입니다.' };
      const ch = s.turns[r.turn].choices.filter(c => c.id === d.choice)[0];
      if (!ch) return { ok: false, error: '대책을 고르세요.' };
      let card = null;
      if (d.card) {
        const cd = CARDS.filter(x => x.id === d.card)[0], used = t.game.cards || [];
        if (r.cards === false || !cd) return { ok: false, error: '쓸 수 없는 카드입니다.' };
        if (used.indexOf(cd.id) >= 0) return { ok: false, error: '이미 쓴 카드입니다.' };
        if (used.length >= CARD_LIMIT) return { ok: false, error: '카드는 ' + CARD_LIMIT + '장까지만 쓸 수 있습니다.' };
        card = cd.id;
      }
      const gov = d.gov || {}, b = gov.bud || {};
      t.sub = { choice: ch.id, gov: { tax: Math.max(1, Math.min(5, Number(gov.tax) || 3)), bud: { df: Math.max(0, +b.df || 0), lv: Math.max(0, +b.lv || 0), cu: Math.max(0, +b.cu || 0) } }, why: String(d.why || '').slice(0, 1000), card: card, at: Date.now() };
      putRoom(r, false);
      return { ok: true };
    }
    if (d.action === 'final') {
      t.final = { ref1: String(d.ref1 || ''), ref2: String(d.ref2 || ''), ref3: String(d.ref3 || '') };
      putRoom(r, true);
      const ranked = r.order.map(id => r.teams[id]).sort((a, b) => scoreOf(b.game) - scoreOf(a.game));
      const g = t.game;
      sheetOf('제출', FINAL_HEAD).appendRow([new Date(), r.code, r.cls, s.king, t.name, t.members, scoreOf(g), ranked.indexOf(t) + 1, realMatches(g) + '/' + g.log.length,
        g.ending ? g.ending.title : '', g.st.tr, g.st.pp, g.st.cr, g.st.df, g.st.lv, g.st.cu, g.ach.join(', '), g.crises.length, (g.cards || []).map(id => CARDS.filter(x => x.id === id)[0].name).join(', '), t.goal, t.final.ref1, t.final.ref2, t.final.ref3].map(clean));
      return { ok: true };
    }
  }

  if (d.action === 'host') {
    if (d.hostKey !== r.hostKey) return { ok: false, error: '교사 권한이 없습니다.' };
    if (d.cmd === 'open') {
      const s = { turns: { length: TOTAL } };
      if (r.phase === 'lobby') { r.phase = 'deciding'; r.turn = 0; }
      else if (r.phase === 'revealed') {
        if (r.turn + 1 >= s.turns.length) r.phase = 'ended';
        else { r.turn++; r.phase = 'deciding'; }
      } else return { ok: false, error: '지금은 다음 단계로 넘어갈 수 없습니다.' };
      r.openedAt = Date.now();
      putRoom(r, true);
      return { ok: true };
    }
    if (d.cmd === 'reveal') {
      if (r.phase !== 'deciding') return { ok: false, error: '공개할 사건이 없습니다.' };
      const rows = [];
      r.order.forEach(id => {
        const t = r.teams[id], g = t.game, s = tscen(r, t), turn = s.turns[r.turn];
        if (g.t !== r.turn) return;
        const sub = t.sub || { choice: null, gov: { tax: 3, bud: { df: 1, lv: 1, cu: 1 } }, why: '(제출하지 않음)' };
        const l = playTurn(g, s, sub.choice, sub.gov, sub.why, sub.card);
        l.unlocks = checkUnlocks(g);
        l.unlocks.forEach(id => feed(r, { kind: 'unlock', adv: id, team: t.name, text: t.name + ' 모둠이 히든 조언자 ' + josa(advisorById(id).name, '을를') + ' 만났습니다' }));
        t.sub = null;
        rows.push([new Date(), r.code, r.cls, s.king, r.turn + 1, turn.year, turn.title, t.name, t.members, l.label, l.real ? 'O' : 'X', l.card ? CARDS.filter(x => x.id === l.card)[0].name : '', sub.gov.tax,
          sub.gov.bud.df + '/' + sub.gov.bud.lv + '/' + sub.gov.bud.cu, sub.why, g.st.tr, g.st.pp, g.st.cr, g.st.df, g.st.lv, g.st.cu, scoreOf(g)].map(clean));
      });
      r.phase = 'revealed';
      putRoom(r, true);
      if (rows.length) { const sh = sheetOf('기록', LOG_HEAD); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows); }
      return { ok: true };
    }
    if (d.cmd === 'remove') {
      if (r.teams[d.teamId]) { delete r.teams[d.teamId]; r.order = r.order.filter(x => x !== d.teamId); putRoom(r, true); }
      return { ok: true };
    }
    return { ok: false, error: '알 수 없는 명령' };
  }
  return { ok: false, error: '알 수 없는 요청' };
}
