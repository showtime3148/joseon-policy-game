/* Vercel 서버 함수: 판서의 '제안 근거'에 AI 조언을 준다 (Gemini API)
 * - 환경 변수 GEMINI_API_KEY 필요 (선택: GEMINI_MODEL, 기본 gemini-3.5-flash-lite)
 * - 답을 대신 써 주지 않고, 근거를 더 깊게 만들 질문과 힌트만 준다
 * - 숨겨진 수치·조합 효과·실제 역사는 AI에게도 알려 주지 않는다
 * - 학생 한 명당 사건마다 AI_LIMIT회까지
 */
const makeEngine = require('./_engine.js');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const AI_LIMIT = 8;

const noop = { getScriptCache: () => ({ get: () => null, put() {} }) };
const G = makeEngine(noop, { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, { getActiveSpreadsheet: () => ({}) }, { MimeType: {}, createTextOutput: t => t });

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('저장소 오류 ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const cut = (s, n) => String(s == null ? '' : s).slice(0, n);
const dir = eff => Object.keys(eff).map(k => G.STATS[k].name + (eff[k] > 0 ? ' 오름' : ' 내림')).join(', ');

const SYSTEM = `너는 고등학교 한국사·통합사회 융합 수업 '조선 국정 회의' 게임의 조언자다. 학생은 조선 후기 의정부의 판서가 되어 정책을 제안하고 '제안 근거'와 '비슷한 현대 정책'을 쓴다.
규칙:
- 학생의 글을 대신 써 주지 말고, 완성된 문장이나 모범 답안을 주지 마라. 학생이 스스로 생각을 넓히게 돕는다.
- 형식(꼭 지킬 것, 전체 250자 안팎, 쉬운 말, 존댓말):
  👍 잘한 점: 한 문장 (근거가 비었으면 "아직 근거가 없어요"라고 쓰기)
  🤔 더 생각해 볼 질문: 2개 (예: 이 사건의 어떤 문제를 해결하나? 누가 부담을 지나? 부작용은? 다른 조 정책과 함께 하면?)
  💡 현대 정책 힌트: 떠올릴 만한 통합사회 개념 키워드 1~2개만 (설명 없이)
- 학생이 쓴 현대 정책이 크게 빗나갔으면 질문으로 다시 생각하게 하라.
- 실제 역사에서 조정이 어떤 정책을 택했는지, 정책의 정확한 효과 수치는 말하지 마라.
- 수업과 관계없는 요청이나 부적절한 말에는 "정책 제안에 대해 물어봐 주세요."라고만 답하라.`;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = o => res.status(200).send(JSON.stringify(o));
  try {
    if (req.method !== 'POST') return send({ ok: false, error: 'POST만 받습니다.' });
    if (!KEY) return send({ ok: false, error: 'AI 조언이 아직 설정되지 않았습니다. 선생님께 말씀해 주세요.' });
    let d = req.body; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
    if (!d) return send({ ok: false, error: '요청 형식 오류' });
    const code = cut(d.code, 8).toUpperCase(), teamId = cut(d.teamId, 40), memberId = cut(d.memberId, 40);
    const [raw] = await redis([['GET', 'room_' + code]]);
    if (!raw) return send({ ok: false, error: '방을 찾을 수 없습니다.' });
    const room = JSON.parse(raw), team = room.teams && room.teams[teamId];
    if (!team || !team.mem || !team.mem[memberId]) return send({ ok: false, error: '의정부 구성원만 AI 조언을 받을 수 있습니다.' });
    if (room.phase !== 'deciding') return send({ ok: false, error: '정책을 논의하는 동안에만 AI 조언을 받을 수 있습니다.' });
    const turn = G.ERA.turns[room.turn], pol = turn && turn.policies.find(p => p.id === d.pid);
    if (!pol) return send({ ok: false, error: '정책을 찾을 수 없습니다.' });

    const ck = 'ai_' + code + '_' + memberId + '_' + room.turn;
    const [n] = await redis([['INCR', ck], ['EXPIRE', ck, String(2 * 24 * 3600)]]);
    if (n > AI_LIMIT) return send({ ok: false, error: '이번 사건에서는 AI 조언을 ' + AI_LIMIT + '번까지 받을 수 있습니다. 모둠 친구들과 이야기해 보세요.' });

    const dept = G.ROLES.find(r => r.id === pol.id.charAt(0));
    const why = cut(d.why, 300).trim(), modern = cut(d.modern, 100).trim();
    const prompt = `[사건] ${turn.year}년 ${turn.reign} · ${turn.title}\n${turn.text}\n\n[정책] ${dept.dept} · ${pol.name}\n${pol.desc}\n즉시 효과 방향: ${dir(pol.eff)}${pol.later ? ' (몇 해 뒤 추가 효과 있음)' : ''}\n\n[학생이 쓴 제안 근거]\n${why || '(아직 쓰지 않음)'}\n\n[학생이 쓴 비슷한 현대 정책]\n${modern || '(아직 쓰지 않음)'}`;

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2048 } })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('gemini', r.status, JSON.stringify(j).slice(0, 500)); return send({ ok: false, error: 'AI가 잠시 답하지 못했습니다. 조금 뒤 다시 눌러 주세요.' }); }
    const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!text) return send({ ok: false, error: 'AI가 답을 만들지 못했습니다. 다시 눌러 주세요.' });
    return send({ ok: true, text, left: Math.max(0, AI_LIMIT - n) });
  } catch (e) {
    console.error(e);
    return send({ ok: false, error: '서버 오류: ' + e.message });
  }
};
