/* Vercel 서버 함수: Apps Script와 같은 게임 서버(api/_engine.js)를 Upstash Redis 위에서 실행
 * - 요청마다 방 상태와 제안을 Redis에서 읽어 메모리에 올리고, 서버 코드를 그대로 실행한 뒤 바뀐 값만 저장
 * - 여러 학생이 동시에 보내는 요청은 방 단위 잠금으로 차례대로 처리
 * - 구글 시트 대신 기록(기록·제안·제출)을 Redis 목록에 쌓고, 교사 화면에서 엑셀로 내려받음
 */
const makeEngine = require('./_engine.js');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ROOM_TTL = 7 * 24 * 3600;     // 방 상태: 7일
const LOG_TTL = 30 * 24 * 3600;     // 기록: 30일
const SHEETS = ['기록', '제안', '제출'];

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('저장소 오류 ' + r.status);
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Apps Script 흉내: CacheService(메모리) · 시트(기록 모으기) */
function shims(store, dirty, rows) {
  const sheetObj = name => ({
    appendRow(r) { if (SHEETS.includes(name)) rows.push([name, r]); },
    setFrozenRows() {}, getLastRow() { return 1; },
    getRange() { return { getValues() { return []; }, getValue() { return ''; }, setValues(v) { if (SHEETS.includes(name)) v.forEach(r => rows.push([name, r])); return this; } }; }
  });
  return [
    { getScriptCache: () => ({ get: k => (k in store ? store[k] : null), put: (k, v) => { store[k] = v; dirty[k] = v; } }) },
    { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    { getActiveSpreadsheet: () => ({ getSheetByName: n => sheetObj(n), insertSheet: n => sheetObj(n) }) },
    { MimeType: { JSON: 1 }, createTextOutput: t => ({ setMimeType: () => t }) }
  ];
}

/* 방 상태와 그 방 모든 모둠의 제안을 읽어 옴 */
async function load(code) {
  const store = {};
  if (!code) return store;
  const [room] = await redis([['GET', 'room_' + code]]);
  if (!room) return store;
  store['room_' + code] = room;
  const ids = JSON.parse(room).order || [];
  if (ids.length) {
    const keys = ids.map(id => 'props_' + code + '_' + id);
    const vals = await redis([['MGET'].concat(keys)]);
    keys.forEach((k, i) => { if (vals[0][i]) store[k] = vals[0][i]; });
  }
  return store;
}
async function save(code, dirty, rows) {
  const cmds = [];
  Object.keys(dirty).forEach(k => {
    cmds.push(['SET', k, dirty[k], 'EX', String(ROOM_TTL)]);
    if (k.indexOf('room_') === 0) {
      const r = JSON.parse(dirty[k]);
      cmds.push(['SET', 'ver_' + r.code, String(r.ver), 'EX', String(ROOM_TTL)]);
      cmds.push(['SET', 'hk_' + r.code, r.hostKey, 'EX', String(LOG_TTL)]);
    }
  });
  rows.forEach(([name, r]) => {
    const c = code || r[1];
    cmds.push(['RPUSH', 'log_' + c + '_' + name, JSON.stringify(r)]);
    cmds.push(['EXPIRE', 'log_' + c + '_' + name, String(LOG_TTL)]);
  });
  if (cmds.length) await redis(cmds);
}
async function lock(code) {
  const key = 'lock_' + code, tok = Math.random().toString(36).slice(2);
  for (let i = 0; i < 60; i++) {
    const [ok] = await redis([['SET', key, tok, 'NX', 'PX', '5000']]);
    if (ok === 'OK') return async () => { await redis([['EVAL', "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end", '1', key, tok]]); };
    await sleep(60 + Math.random() * 60);
  }
  throw new Error('요청이 몰려 잠시 처리하지 못했습니다. 다시 눌러 주세요.');
}
function run(store, fn, arg) {
  const dirty = {}, rows = [];
  const E = makeEngine.apply(null, shims(store, dirty, rows));
  return { out: JSON.parse(E[fn](arg)), dirty, rows, E };
}

async function exportLogs(code, hostKey) {
  const [hk] = await redis([['GET', 'hk_' + code]]);
  if (!hk) return { ok: false, error: '기록을 찾을 수 없습니다(30일이 지났거나 없는 방).' };
  if (hk !== hostKey) return { ok: false, error: '교사 권한이 없습니다.' };
  const res = await redis(SHEETS.map(n => ['LRANGE', 'log_' + code + '_' + n, '0', '-1']));
  const heads = makeEngine(null, null, null, null).HEADS;
  const sheets = {};
  SHEETS.forEach((n, i) => { sheets[n] = [heads[n]].concat((res[i] || []).map(x => JSON.parse(x))); });
  return { ok: true, code: code, sheets: sheets };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = o => res.status(200).json(o);
  if (!URL_ || !TOKEN) return send({ ok: false, error: '서버 저장소(Upstash Redis)가 아직 연결되지 않았습니다.' });
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      const code = String(q.code || '').toUpperCase();
      if (q.action === 'export') return send(await exportLogs(code, String(q.hostKey || '')));
      if (q.action !== 'state') return send({ ok: true, msg: '조선 국정 회의 서버가 작동 중입니다.' });
      if (q.ver) { const [v] = await redis([['GET', 'ver_' + code]]); if (v && Number(v) === Number(q.ver)) return send({ ok: true, same: true, ver: Number(v) }); }
      const store = await load(code);
      return send(run(store, 'doGet', { parameter: q }).out);
    }
    let body = req.body;
    if (typeof body !== 'string') body = body ? JSON.stringify(body) : '';
    let d; try { d = JSON.parse(body); } catch (e) { return send({ ok: false, error: '요청 형식 오류' }); }
    const code = String(d.code || '').toUpperCase();
    if (d.action === 'create') {
      for (let i = 0; i < 5; i++) {
        const r = run({}, 'doPost', { postData: { contents: body } });
        if (!r.out.ok) return send(r.out);
        const [exists] = await redis([['EXISTS', 'room_' + r.out.code]]);
        if (exists) continue;
        await save(r.out.code, r.dirty, r.rows);
        return send(r.out);
      }
      return send({ ok: false, error: '방을 만들지 못했습니다. 다시 눌러 주세요.' });
    }
    const unlock = await lock(code);
    try {
      const store = await load(code);
      const r = run(store, 'doPost', { postData: { contents: body } });
      await save(code, r.dirty, r.rows);
      return send(r.out);
    } finally { await unlock(); }
  } catch (e) {
    return send({ ok: false, error: String(e && e.message || e) });
  }
};
