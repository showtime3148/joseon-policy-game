/* ===== 실시간 방 서버 (Apps Script) — 의정부 회의판 =====
 * 방 상태는 CacheService(빠름)에 두고, 시트 '_rooms'에 백업합니다.
 * 결과 계산은 이 서버가 scenarios.js·core.js 규칙으로 직접 합니다(모든 모둠 공정).
 * 모둠 = 의정부, 모둠원 = 영의정·6조 판서(학생마다 자기 기기)
 */
const ROOM_TTL = 21600; // 6시간
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOTAL = 7;
const LOG_HEAD = ['기록 시각','방','학급','사건 번호','연도','사건','모둠','모둠원(역할)','시행 정책','실제 역사와 같은 정책 수','합의안 근거(영의정)','국고','민심','왕권','국방','민생','문화','점수'];
const PROP_HEAD = ['기록 시각','방','학급','사건 번호','사건','모둠','제안자','역할','제안 정책','채택','제안 근거','학생이 쓴 비슷한 현대 정책','참고: 현대 정책 해설','실제 역사에서 시행'];
const FINAL_HEAD = ['제출 시각','방','학급','모둠','이름','역할','모둠 점수','순위','실제 역사와 같은 정책 수','국고','민심','왕권','국방','민생','문화','위기','성찰1: 내 조의 결정과 실제 역사','성찰2: 조선 정책과 현대 정책 비교','성찰3: 의정부 합의 과정'];

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }
function rid(n, chars) { let s = ''; for (let i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length)); return s; }
function txt(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }
function sheetOf(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (head) { sh.appendRow(head); sh.setFrozenRows(1); } }
  return sh;
}
function appendRows(name, head, rows) {
  if (!rows.length) return;
  const sh = sheetOf(name, head);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows.map(r => r.map(clean)));
}

function getRoom(code) {
  const c = CacheService.getScriptCache().get('room_' + code);
  if (c) return JSON.parse(c);
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

/* 제안은 용량이 커서 모둠마다 따로 저장(방 상태 100KB 한도 대비) */
function getProps(r, t) { const c = CacheService.getScriptCache().get('props_' + r.code + '_' + t.id); return c ? JSON.parse(c) : {}; }
function setProps(r, t, p) { CacheService.getScriptCache().put('props_' + r.code + '_' + t.id, JSON.stringify(p), ROOM_TTL); t.np = Object.keys(p).length; }
function memberList(t) { return t.mo.map(id => t.mem[id]); }
function roleNames(m) { return m.roles.map(x => roleById(x).name).join('·'); }
function membersText(t) { return memberList(t).map(m => m.name + '(' + (roleNames(m) || '역할 없음') + ')').join(', '); }
function hasRole(t, role) { return memberList(t).some(m => m.roles.indexOf(role) >= 0); }
/* 이 모둠원이 제안할 수 있는 조: 자기 역할 + (영의정이면) 판서가 없는 조 */
function canPropose(t, m, pid) {
  const dept = String(pid).charAt(0);
  if (m.roles.indexOf(dept) >= 0) return true;
  return m.roles.indexOf('yeong') >= 0 && !hasRole(t, dept);
}
function canDecide(t, m) { return m.roles.indexOf('yeong') >= 0 || !hasRole(t, 'yeong'); }

function publicRoom(r) {
  return {
    code: r.code, cls: r.cls, phase: r.phase, turn: r.turn, total: TOTAL, ver: r.ver, openedAt: r.openedAt || null,
    teams: r.order.map(id => {
      const t = r.teams[id], g = t.game;
      return { id: t.id, name: t.name, members: memberList(t).map(m => ({ id: m.id, name: m.name, roles: m.roles, final: !!m.final })),
        submitted: !!t.sub, props: t.np || 0,
        st: g.st, hist: g.hist, crises: g.crises, log: g.log, done: g.done, lateNotes: g.lateNotes || [],
        score: scoreOf(g), matches: realMatches(g) };
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
    // 우리 모둠의 제안과 합의안은 같은 모둠원에게만
    if (p.team && r.teams[p.team]) { const mt = r.teams[p.team]; pub.myProps = getProps(r, mt); pub.mySub = mt.sub ? { adopt: mt.sub.ids.map(x => ({ id: x })), why: mt.sub.why, by: mt.sub.by } : null; }
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

function cleanRoles(roles, t, me) {
  const want = (Array.isArray(roles) ? roles : []).filter(x => roleById(x));
  const uniq = want.filter((x, i) => want.indexOf(x) === i);
  if (!uniq.length) return { error: '맡을 역할을 하나 이상 고르세요.' };
  if (t) {
    for (const x of uniq) {
      const other = memberList(t).filter(m => m.id !== me && m.roles.indexOf(x) >= 0)[0];
      if (other) return { error: josa(roleById(x).name, '은는') + ' 이미 ' + other.name + ' 학생이 맡았습니다.' };
    }
  }
  return { roles: ROLES.map(x => x.id).filter(x => uniq.indexOf(x) >= 0) };
}

function handle(d) {
  if (d.action === 'create') {
    let code; do { code = rid(4, CODE_CHARS); } while (CacheService.getScriptCache().get('room_' + code));
    const r = { code: code, hostKey: rid(16, CODE_CHARS), cls: txt(d.cls, 20), phase: 'lobby', turn: 0, teams: {}, order: [], created: Date.now() };
    putRoom(r, true);
    return { ok: true, code: code, hostKey: r.hostKey };
  }
  const code = String(d.code || '').toUpperCase();
  const r = getRoom(code);
  if (!r) return { ok: false, error: '방을 찾을 수 없습니다. 코드를 확인하세요.' };

  if (d.action === 'join') {
    const name = txt(d.team, 20), who = txt(d.name, 20);
    if (!name) return { ok: false, error: '모둠 이름을 입력하세요.' };
    if (!who) return { ok: false, error: '번호와 이름을 입력하세요.' };
    let t = r.order.map(id => r.teams[id]).filter(x => x.name === name)[0];
    if (!t) {
      if (r.order.length >= 8) return { ok: false, error: '한 방에는 8개 의정부까지 들어올 수 있습니다.' };
      if (r.phase === 'ended') return { ok: false, error: '이미 끝난 방입니다.' };
      const g = initGame();
      g.t = r.phase === 'revealed' ? r.turn + 1 : r.turn;   // 늦게 들어온 모둠은 현재 사건부터
      for (let i = 0; i < g.t; i++) g.hist.push(Object.assign({}, g.st));
      t = { id: rid(8, CODE_CHARS), name: name, mem: {}, mo: [], game: g, np: 0, sub: null };
      r.teams[t.id] = t; r.order.push(t.id);
    }
    const again = memberList(t).filter(m => m.name === who)[0];
    if (again) {   // 같은 이름으로 다시 들어오면 이어서
      if (d.roles && d.roles.length) { const c = cleanRoles(d.roles, t, again.id); if (c.error) return { ok: false, error: c.error }; again.roles = c.roles; }
      putRoom(r, true);
      return { ok: true, teamId: t.id, memberId: again.id, rejoin: true };
    }
    if (t.mo.length >= 7) return { ok: false, error: '한 의정부는 7명(영의정과 6조 판서)까지입니다.' };
    const c = cleanRoles(d.roles, t, null);
    if (c.error) { if (!t.mo.length) { delete r.teams[t.id]; r.order = r.order.filter(x => x !== t.id); } return { ok: false, error: c.error }; }
    const m = { id: rid(8, CODE_CHARS), name: who, roles: c.roles };
    t.mem[m.id] = m; t.mo.push(m.id);
    putRoom(r, true);
    return { ok: true, teamId: t.id, memberId: m.id };
  }

  if (d.action === 'host') {
    if (d.hostKey !== r.hostKey) return { ok: false, error: '교사 권한이 없습니다.' };
    if (d.cmd === 'open') {
      if (r.phase === 'lobby') { r.phase = 'deciding'; r.turn = 0; }
      else if (r.phase === 'revealed') {
        if (r.turn + 1 >= TOTAL) r.phase = 'ended';
        else { r.turn++; r.phase = 'deciding'; }
      } else return { ok: false, error: '지금은 다음 단계로 넘어갈 수 없습니다.' };
      r.openedAt = Date.now();
      putRoom(r, true);
      return { ok: true };
    }
    if (d.cmd === 'reveal') {
      if (r.phase !== 'deciding') return { ok: false, error: '공개할 사건이 없습니다.' };
      const turn = ERA.turns[r.turn], logRows = [], propRows = [], now = new Date();
      r.order.forEach(id => {
        const t = r.teams[id], g = t.game;
        if (g.t !== r.turn) return;
        const props = getProps(r, t);
        const pack = t.sub ? { why: t.sub.why, adopt: t.sub.ids.filter(x => props[x]).map(x => ({ id: x, by: props[x].name, role: props[x].role, why: props[x].why, modern: props[x].modern })) } : null;
        const l = playTurn(g, pack && pack.adopt.length ? pack : null);
        const adopted = l.adopt.map(a => a.id);
        logRows.push([now, r.code, r.cls, r.turn + 1, turn.year, turn.title, t.name, membersText(t),
          l.adopt.map(a => policyOf(turn, a.id).name).join(', ') || '(합의안 없음)', l.matches, l.why,
          g.st.tr, g.st.pp, g.st.cr, g.st.df, g.st.lv, g.st.cu, scoreOf(g)]);
        Object.keys(props).forEach(pid => {
          const p = props[pid], pol = policyOf(turn, pid);
          propRows.push([now, r.code, r.cls, r.turn + 1, turn.title, t.name, p.name, p.role, pol.name, adopted.indexOf(pid) >= 0 ? 'O' : 'X', p.why, p.modern, pol.modern.name, turn.real.ids.indexOf(pid) >= 0 ? 'O' : 'X']);
        });
        // 방 상태 용량을 줄이려고 기록에는 핵심만 남김(전문은 시트에 저장)
        l.adopt = l.adopt.map(a => ({ id: a.id, by: a.by, role: a.role, modern: txt(a.modern, 60) }));
        l.why = '';
        setProps(r, t, {}); t.sub = null;
      });
      r.phase = 'revealed';
      putRoom(r, true);
      appendRows('기록', LOG_HEAD, logRows);
      appendRows('제안', PROP_HEAD, propRows);
      return { ok: true };
    }
    if (d.cmd === 'remove') {
      if (r.teams[d.teamId]) { delete r.teams[d.teamId]; r.order = r.order.filter(x => x !== d.teamId); putRoom(r, true); }
      return { ok: true };
    }
    return { ok: false, error: '알 수 없는 명령' };
  }

  // ── 모둠원 요청 ──
  const t = r.teams[d.teamId];
  if (!t) return { ok: false, error: '모둠 정보를 찾을 수 없습니다. 다시 참가하세요.' };
  const m = t.mem[d.memberId];
  if (!m) return { ok: false, error: '모둠원 정보를 찾을 수 없습니다. 다시 참가하세요.' };

  if (d.action === 'roles') {
    if (r.phase !== 'lobby') return { ok: false, error: '역할은 첫 사건이 열리기 전에만 바꿀 수 있습니다.' };
    const c = cleanRoles(d.roles, t, m.id); if (c.error) return { ok: false, error: c.error };
    m.roles = c.roles; putRoom(r, true); return { ok: true };
  }
  if (d.action === 'propose' || d.action === 'unpropose') {
    if (r.phase !== 'deciding' || t.game.t !== r.turn) return { ok: false, error: '사건이 열려 있을 때만 제안할 수 있습니다.' };
    if (Number(d.turn) !== r.turn) return { ok: false, error: '이미 지나간 사건입니다.' };
    const turn = ERA.turns[r.turn], pol = policyOf(turn, d.pid);
    if (!pol) return { ok: false, error: '없는 정책입니다.' };
    const P = getProps(r, t), cur = P[pol.id];
    if (d.action === 'unpropose') {
      if (!cur) return { ok: true };
      if (cur.by !== m.id && !canDecide(t, m)) return { ok: false, error: '다른 사람의 제안은 영의정만 거둘 수 있습니다.' };
      delete P[pol.id]; setProps(r, t, P);
      if (t.sub) t.sub.ids = t.sub.ids.filter(x => x !== pol.id);
      putRoom(r, false); return { ok: true };
    }
    if (!canPropose(t, m, pol.id)) return { ok: false, error: deptOf(pol.id).dept + ' 정책은 ' + josa(deptOf(pol.id).name, '이가') + ' 제안합니다.' };
    if (cur && cur.by !== m.id) return { ok: false, error: '이미 ' + cur.name + ' 학생이 제안한 정책입니다.' };
    const why = txt(d.why, 250), modern = txt(d.modern, 80);
    if (why.length < 15) return { ok: false, error: '제안 근거를 15자 이상 쓰세요.' };
    if (modern.length < 2) return { ok: false, error: '비슷한 현대 정책을 쓰세요.' };
    const role = m.roles.indexOf(pol.id.charAt(0)) >= 0 ? deptOf(pol.id).name : '영의정(대리)';
    P[pol.id] = { by: m.id, name: m.name, role: role, why: why, modern: modern }; setProps(r, t, P);
    putRoom(r, false); return { ok: true };
  }
  if (d.action === 'submit') {
    if (r.phase !== 'deciding' || t.game.t !== r.turn) return { ok: false, error: '지금은 합의안을 올릴 때가 아닙니다.' };
    if (Number(d.turn) !== r.turn) return { ok: false, error: '이미 지나간 사건입니다.' };
    if (!canDecide(t, m)) return { ok: false, error: '합의안은 영의정이 올립니다.' };
    const ids = (Array.isArray(d.adopt) ? d.adopt : []).filter((x, i, a) => a.indexOf(x) === i);
    if (!ids.length) return { ok: false, error: '시행할 정책을 하나 이상 고르세요.' };
    if (ids.length > MAX_ADOPT) return { ok: false, error: '한 번에 ' + MAX_ADOPT + '개까지 시행할 수 있습니다.' };
    const P = getProps(r, t), missing = ids.filter(x => !P[x]);
    if (missing.length) return { ok: false, error: '판서가 제안한 정책만 시행할 수 있습니다.' };
    const why = txt(d.why, 400);
    if (why.length < 30) return { ok: false, error: '합의안 근거를 30자 이상 쓰세요.' };
    t.sub = { ids: ids, why: why, by: m.name, at: Date.now() };
    putRoom(r, false); return { ok: true };
  }
  if (d.action === 'retract') {
    if (r.phase !== 'deciding') return { ok: false, error: '지금은 고칠 수 없습니다.' };
    if (!canDecide(t, m)) return { ok: false, error: '합의안은 영의정이 고칩니다.' };
    t.sub = null; putRoom(r, false); return { ok: true };
  }
  if (d.action === 'final') {
    if (r.phase !== 'ended' && !t.game.done) return { ok: false, error: '모든 사건이 끝난 뒤에 제출합니다.' };
    m.final = { ref1: txt(d.ref1, 1500), ref2: txt(d.ref2, 1500), ref3: txt(d.ref3, 1500) };
    putRoom(r, true);
    const ranked = r.order.map(id => r.teams[id]).sort((a, b) => scoreOf(b.game) - scoreOf(a.game));
    const g = t.game;
    appendRows('제출', FINAL_HEAD, [[new Date(), r.code, r.cls, t.name, m.name, roleNames(m), scoreOf(g), ranked.indexOf(t) + 1, realMatches(g),
      g.st.tr, g.st.pp, g.st.cr, g.st.df, g.st.lv, g.st.cu, g.crises.length, m.final.ref1, m.final.ref2, m.final.ref3]]);
    return { ok: true };
  }
  return { ok: false, error: '알 수 없는 요청' };
}
