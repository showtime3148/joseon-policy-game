/* AI 신하(사헌부 대사헌)와의 문답 — Vercel AI Gateway
 * 흐름: 판서가 고른 정책(또는 영의정의 합의안)에 대해 대사헌이 질문 → 학생이 말(또는 글)로 대답 → 짧은 평과 다음 질문 → 두 번째 대답 뒤 총평
 * 점수에는 영향이 없고, 끝난 문답은 Redis 목록(log_<방>_문답)에 쌓여 교사 화면의 엑셀 기록에 들어간다.
 * 인증: ANTHROPIC_API_KEY가 있으면 Claude API에 바로 연결. 없으면 Vercel AI Gateway(AI_GATEWAY_API_KEY 또는 OIDC 토큰).
 * AI를 부를 수 없을 때는 미리 준비한 질문으로 이어 가서 수업이 멈추지 않게 한다.
 */
const makeEngine = require('./_engine.js');
const G = makeEngine(null, null, null, null);
const ERA = G.ERA, ROLES = G.ROLES;

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const MODEL = process.env.AI_MODEL || 'anthropic/claude-haiku-5.5';
const GATEWAY = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const LOG_TTL = 30 * 24 * 3600;
const PER_MEMBER = 16;   // 한 학생이 한 사건에서 부를 수 있는 횟수
const PER_ROOM = 600;    // 한 방 전체
const QA_HEAD = ['시각', '방', '사건', '연도', '사건 제목', '의정부', '이름', '역할', '대상 정책', '질문1', '대답1', '질문2', '대답2', '총평', '등급', '방식'];

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('저장소 오류 ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
function josa(w, pair) { const c = String(w).charCodeAt(String(w).length - 1); const has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; return w + (has ? pair.charAt(0) : pair.charAt(1)); }
const cut = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const roleById = id => ROLES.filter(r => r.id === id)[0];

function gatewayToken(req) {
  return process.env.AI_GATEWAY_API_KEY || (req.headers && req.headers['x-vercel-oidc-token']) || process.env.VERCEL_OIDC_TOKEN || '';
}

/* ANTHROPIC_API_KEY가 있으면 Claude API에 바로, 없으면 Vercel AI Gateway로 */
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';
async function askClaude(system, user) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': String(process.env.ANTHROPIC_API_KEY).trim().replace(/^["']|["']$/g, ''), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 400, temperature: 0.7, system: system, messages: [{ role: 'user', content: user }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('claude ' + r.status + ' ' + cut(j && j.error && (j.error.message || j.error.type), 200));
    return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  } finally { clearTimeout(tm); }
}
async function askModel(req, system, user) {
  if (process.env.ANTHROPIC_API_KEY) return askClaude(system, user);
  const tok = gatewayToken(req);
  if (!tok) throw new Error('no-token');
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(GATEWAY, {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, temperature: 0.7, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('gateway ' + r.status + ' ' + cut(j && j.error && (j.error.message || j.error), 200));
    return String(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
  } finally { clearTimeout(tm); }
}
function parseJSON(s) {
  const m = String(s).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

const SYSTEM = `너는 조선 후기 사헌부의 대사헌이다. 고등학생들이 역사 수업 게임에서 의정부의 판서·영의정 역할을 맡아 정책을 골랐다.
너는 그 학생에게 정책을 골라 시행하려는 까닭을 따져 묻는 깐깐하지만 다정한 신하다.
말투: "~하오", "~이오?", "판서 대감" 같은 사극 말투를 쓰되 고등학생이 바로 알아듣는 쉬운 낱말을 쓴다. 한자어를 쓰면 쉬운 말로 풀어 준다.
규칙:
- 소리 내어 읽어 줄 글이므로 한 번에 2~3문장, 120자 안팎으로 짧게 말한다. 목록, 기호, 이모지, 괄호 속 영어를 쓰지 않는다.
- 질문은 한 번에 하나만 한다.
- 질문 거리: 그 정책을 고른 근거, 손해 보는 사람과 그 대책, 비용(국고)을 어디서 마련할지, 다른 조의 정책과 어떻게 맞물리는지, 비슷한 오늘날 정책과의 같은 점·다른 점.
- 정답이나 실제 역사에서 무엇을 했는지, 정책의 수치 효과, 다른 정책을 고르라는 말은 절대 하지 않는다. 판단은 학생이 한다.
- 학생 대답이 엉뚱하거나 장난이어도 꾸짖지 말고 웃으며 다시 생각해 보게 한다. 욕설·개인 정보는 다루지 않는다.`;

function contextText(turn, team, targets, props, role) {
  const pol = targets.map(p => `「${p.name}」(${roleById(p.id.charAt(0)).dept}): ${p.desc}`).join('\n');
  const others = Object.keys(props).filter(x => !targets.some(p => p.id === x)).map(x => { const p = turn.policies.filter(q => q.id === x)[0]; return p ? `${roleById(x.charAt(0)).dept} 「${p.name}」` : ''; }).filter(Boolean).join(', ');
  const why = targets.map(p => props[p.id] ? `${p.name} 근거: ${cut(props[p.id].why, 200)} / 비슷한 현대 정책: ${cut(props[p.id].modern, 80)}` : '').filter(Boolean).join('\n');
  return `사건: ${turn.year}년 ${turn.reign} 「${turn.title}」 — ${turn.text}
의정부 이름: ${team.name}, 학생의 역할: ${role}
따져 볼 정책:
${pol}
${why ? '학생이 적어 낸 것:\n' + why : ''}
${others ? '같은 의정부의 다른 조가 고른 정책: ' + others : ''}`;
}

/* AI를 못 부를 때 쓰는 준비된 질문 */
function fallback(step, targets) {
  const n = targets.map(p => p.name).join('·');
  if (step === 0) return { say: `판서 대감, 「${n}」${josa(n, '을를').slice(n.length)} 고르신 까닭이 무엇이오? 이 정책으로 누가 가장 덕을 보는지 말씀해 보시오.` };
  if (step === 1) return { say: `잘 들었소. 그런데 이 정책으로 손해를 보는 사람도 있을 것이오. 그들의 불만은 어떻게 달래시겠소?` };
  return { say: `대감의 뜻을 잘 알겠소. 덕 보는 이와 손해 보는 이를 함께 헤아리는 것이 나랏일이오. 문답을 기록해 두겠소.`, grade: '' };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = o => res.status(200).json(o);
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      if (q.action === 'ping') {  /* 배포 뒤 AI 연결 확인용 */
        const t0 = Date.now();
        try { const s = await askModel(req, '한 단어로만 답하라.', '"준비" 라고만 말하라.'); return send({ ok: true, model: process.env.ANTHROPIC_API_KEY ? CLAUDE_MODEL : MODEL, auth: process.env.ANTHROPIC_API_KEY ? 'claude-api' : process.env.AI_GATEWAY_API_KEY ? 'key' : (req.headers['x-vercel-oidc-token'] ? 'oidc-header' : (process.env.VERCEL_OIDC_TOKEN ? 'oidc-env' : 'none')), reply: s, ms: Date.now() - t0 }); }
        catch (e) { return send({ ok: false, model: process.env.ANTHROPIC_API_KEY ? CLAUDE_MODEL : MODEL, claudeKey: !!process.env.ANTHROPIC_API_KEY, keyOk: /^sk-ant-/.test(String(process.env.ANTHROPIC_API_KEY || '').trim()), error: String(e.message || e), hasHeader: !!(req.headers && req.headers['x-vercel-oidc-token']), hasEnv: !!process.env.VERCEL_OIDC_TOKEN }); }
      }
      return send({ ok: true, msg: 'AI 신하 문답 서버' });
    }
    let d = req.body;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return send({ ok: false, error: '요청 형식 오류' }); } }
    d = d || {};
    if (!URL_ || !TOKEN) return send({ ok: false, error: '서버 저장소가 연결되지 않았습니다.' });
    const code = String(d.code || '').toUpperCase();
    const [raw] = await redis([['GET', 'room_' + code]]);
    if (!raw) return send({ ok: false, error: '방을 찾을 수 없습니다.' });
    const r = JSON.parse(raw);
    if (r.closed) return send({ ok: false, error: '선생님이 종료한 방입니다.' });
    if (r.phase !== 'deciding') return send({ ok: false, error: '문답은 정책을 논의하는 동안에만 할 수 있습니다.' });
    const t = r.teams[d.teamId], m = t && t.mem[d.memberId];
    if (!m) return send({ ok: false, error: '모둠 정보를 찾을 수 없습니다.' });
    const turn = ERA.turns[r.turn];
    const [praw] = await redis([['GET', 'props_' + code + '_' + t.id]]);
    const props = praw ? JSON.parse(praw) : {};

    const pid = String(d.pid || '');
    let targets;
    if (pid === 'pack') targets = Object.keys(props).map(x => turn.policies.filter(p => p.id === x)[0]).filter(Boolean);
    else targets = turn.policies.filter(p => p.id === pid);
    if (!targets.length) return send({ ok: false, error: pid === 'pack' ? '아직 고른 정책이 없습니다.' : '먼저 우리 조의 정책을 고르세요.' });
    const role = pid === 'pack' ? '영의정' : (roleById(pid.charAt(0)).name);

    /* 사용량 제한 */
    const k1 = 'aiq_' + code + '_' + m.id + '_' + r.turn, k2 = 'aiq_' + code;
    const [c1, , c2] = await redis([['INCR', k1], ['EXPIRE', k1, '86400'], ['INCR', k2], ['EXPIRE', k2, String(LOG_TTL)]]);
    if (c1 > PER_MEMBER || c2 > PER_ROOM) return send({ ok: false, error: '대사헌이 지쳤소. 이번 사건의 문답 횟수를 다 썼습니다.' });

    const hist = (Array.isArray(d.hist) ? d.hist : []).slice(0, 2).map(h => ({ q: cut(h.q, 300), a: cut(h.a, 400) }));
    const step = hist.filter(h => h.a).length;   // 0: 첫 질문, 1: 평+두 번째 질문, 2: 총평
    const ctx = contextText(turn, t, targets, props, role);
    const talk = hist.map((h, i) => `대사헌 질문${i + 1}: ${h.q}\n학생 대답${i + 1}: ${h.a || '(아직 없음)'}`).join('\n');
    let user, out, via = 'ai';
    if (step === 0) user = `${ctx}\n\n문답을 시작한다. 학생에게 인사 한마디와 함께 첫 질문 하나를 하라. JSON으로만 답하라: {"say":"할 말"}`;
    else if (step === 1) user = `${ctx}\n\n지금까지의 문답:\n${talk}\n\n학생의 첫 대답에서 좋은 점 하나를 짚고(한 문장), 빠진 부분을 파고드는 두 번째 질문 하나를 하라. JSON으로만 답하라: {"say":"할 말"}`;
    else user = `${ctx}\n\n지금까지의 문답:\n${talk}\n\n문답을 마친다. 학생이 근거를 얼마나 잘 댔는지 칭찬과 보완할 점을 담아 총평을 하라(3문장 이내). grade는 상·중·하 가운데 하나: 근거·손해 보는 사람·대책·다른 조와의 연결을 두루 말했으면 상, 일부면 중, 거의 없으면 하. JSON으로만 답하라: {"say":"총평","grade":"상"}`;
    try {
      const j = parseJSON(await askModel(req, SYSTEM, user));
      if (!j || !j.say) throw new Error('bad-json');
      out = { say: cut(j.say, 400), grade: step === 2 ? (['상', '중', '하'].includes(j.grade) ? j.grade : '') : undefined };
    } catch (e) {
      via = 'fallback'; out = fallback(step, targets); out.note = 'AI 연결이 원활하지 않아 준비된 질문으로 이어 갑니다.'; out.err = cut(e.message, 120);
    }
    if (step === 2) {
      const row = [new Date().toISOString(), code, r.turn + 1, turn.year, turn.title, t.name, m.name, role, targets.map(p => p.name).join(', '),
        hist[0] ? hist[0].q : '', hist[0] ? hist[0].a : '', hist[1] ? hist[1].q : '', hist[1] ? hist[1].a : '', out.say, out.grade || '', d.voice ? '음성' : '글'];
      await redis([['RPUSH', 'log_' + code + '_문답', JSON.stringify(row)], ['EXPIRE', 'log_' + code + '_문답', String(LOG_TTL)]]);
    }
    return send({ ok: true, step: step, done: step === 2, say: out.say, grade: out.grade || '', via: via, note: out.note || '' });
  } catch (e) {
    return send({ ok: false, error: String(e && e.message || e) });
  }
};
module.exports.QA_HEAD = QA_HEAD;
