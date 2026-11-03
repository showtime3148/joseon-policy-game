/**
 * 조선 국정 회의 → 구글 시트 저장 + 순위판용 Apps Script
 * 시트에서 [확장 프로그램] > [Apps Script]에 붙여 넣고
 * [배포] > [새 배포] > 웹 앱, 실행: 나, 액세스: 모든 사용자 로 배포하세요.
 */
const PROG = '진행', SUBMIT = '제출';
const PROG_HEAD = ['갱신 시각','학급','모둠','모둠원','왕','시나리오','진행 사건','전체 사건','국고','민심','왕권','국방','민생','문화','업적','위기 횟수','점수','완료','최근 선택','최근 근거','세션 ID'];
const SUBMIT_HEAD = ['제출 시각','학급','모둠','모둠원','왕','점수','실제 역사 일치','결말','국고','민심','왕권','국방','민생','문화','업적','위기 횟수','국정 방향',
  '사건1','사건2','사건3','사건4','사건5','사건6','사건7','성찰1: 실제와 다른 선택','성찰2: 실제 왕 평가','성찰3: 우리 치세 실록','보고서 전문','세션 ID'];

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents), ss = SpreadsheetApp.getActiveSpreadsheet();
    if (d.type === 'progress') upsertProgress(ss, d); else { appendSubmit(ss, d); upsertProgress(ss, d); }
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
  finally { lock.releaseLock(); }
}
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'board') {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROG);
    if (!sh || sh.getLastRow() < 2) return out({ ok: true, rows: [] });
    const v = sh.getRange(2, 1, sh.getLastRow() - 1, PROG_HEAD.length).getValues();
    const rows = v.map(r => ({ cls: r[1], team: r[2], members: r[3], king: r[4], turn: r[6], total: r[7], tr: r[8], pp: r[9], cr: r[10], df: r[11], lv: r[12], cu: r[13],
      ach: r[14], crises: r[15], score: r[16], finished: r[17] === true || r[17] === 'TRUE' }));
    return out({ ok: true, rows: rows });
  }
  return out({ ok: true, msg: '조선 국정 회의 저장소가 작동 중입니다.' });
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }
function sheet(ss, name, head) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); sh.getRange(1, 1, 1, head.length).setFontWeight('bold'); }
  return sh;
}
function upsertProgress(ss, d) {
  const sh = sheet(ss, PROG, PROG_HEAD);
  const row = [new Date(), d.cls, d.team, d.members, d.king, d.scenario, d.turn, d.total, d.tr, d.pp, d.cr, d.df, d.lv, d.cu, d.ach, d.crises, d.score, !!d.finished, d.lastChoice || '', d.lastWhy || '', d.sid].map(clean);
  const last = sh.getLastRow();
  if (last > 1) {
    const ids = sh.getRange(2, PROG_HEAD.length, last - 1, 1).getValues().map(r => r[0]);
    const i = ids.indexOf(d.sid);
    if (i >= 0) { sh.getRange(i + 2, 1, 1, row.length).setValues([row]); return; }
  }
  sh.appendRow(row);
}
function appendSubmit(ss, d) {
  const sh = sheet(ss, SUBMIT, SUBMIT_HEAD);
  const q = (d.decisions || []).slice(0, 7); while (q.length < 7) q.push('');
  const row = [new Date(), d.cls, d.team, d.members, d.king, d.score, d.matches, d.ending, d.tr, d.pp, d.cr, d.df, d.lv, d.cu, d.ach, d.crises, d.goal]
    .concat(q).concat([d.ref1, d.ref2, d.ref3, d.report, d.sid]).map(clean);
  sh.appendRow(row);
  sh.getRange(sh.getLastRow(), 1, 1, row.length).setWrap(true).setVerticalAlignment('top');
}
