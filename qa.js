/* AI 신하(사헌부 대사헌)와의 음성 문답 — 학생 화면
 * 대사헌이 질문하면 소리로 읽어 주고(speechSynthesis), 학생은 마이크로 대답(SpeechRecognition)하거나 글로 쓴다.
 * 질문 → 대답 → 평과 두 번째 질문 → 대답 → 총평(상·중·하). 점수에는 영향이 없다.
 */
const QA = { pid: null, hist: [], busy: false, done: false, rec: null, listening: false, tts: true, voiced: false };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function aiUrl(){ const s = serverUrl(); return s ? s.replace(/game\/?$/, 'ai') : ''; }
const DAESAHEON = { name: '대사헌', look: { robe: '#6b2a3a', hat: 'official', beard: true } };

function qaStop(){ try { if (QA.rec) QA.rec.stop(); } catch (e) {} QA.listening = false; qaMicUI(); }
function qaSpeak(text){
  if (!QA.tts || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[「」『』]/g, ''));
    u.lang = 'ko-KR'; u.rate = 1.02; u.pitch = .85;
    const v = speechSynthesis.getVoices().filter(x => /ko/i.test(x.lang));
    if (v.length) u.voice = v.find(x => /male|남|Minsu|InJoon|Hyun/i.test(x.name)) || v[0];
    const box = document.getElementById('qa'); if (box) box.classList.add('speaking');
    u.onend = u.onerror = () => { const b = document.getElementById('qa'); if (b) b.classList.remove('speaking'); };
    speechSynthesis.speak(u);
  } catch (e) {}
}
function qaTargetName(pid){
  const turn = curTurn(room);
  if (pid === 'pack') return '의정부 합의안';
  const p = policyOf(turn, pid); return p ? p.name : pid;
}
function qaLogHTML(){
  const rows = [];
  QA.hist.forEach((h, i) => {
    rows.push(`<div class="qa-b ai"><span class="who">대사헌</span><p>${esc(h.q)}</p><button class="qa-rep" data-qrep="${i}" aria-label="다시 듣기" title="다시 듣기">🔊</button></div>`);
    if (h.a) rows.push(`<div class="qa-b me"><span class="who">나</span><p>${esc(h.a)}</p></div>`);
  });
  if (QA.final) rows.push(`<div class="qa-b ai fin"><span class="who">대사헌 총평</span><p>${esc(QA.final.say)}</p>${QA.final.grade ? `<span class="qa-grade g-${QA.final.grade}">${QA.final.grade}</span>` : ''}<button class="qa-rep" data-qrep="f" aria-label="다시 듣기" title="다시 듣기">🔊</button></div>`);
  if (rows.length && !QA.busy) rows[rows.length - 1] = rows[rows.length - 1].replace('class="qa-b ', 'class="qa-b new ');
  if (QA.busy) rows.push(`<div class="qa-b ai think"><span class="who">대사헌</span><p><i></i><i></i><i></i></p></div>`);
  return rows.join('');
}
function qaMicUI(){
  const b = document.getElementById('qamic'); if (!b) return;
  b.classList.toggle('on', QA.listening);
  b.innerHTML = QA.listening ? '■ 그만 듣기' : '🎤 말로 대답하기';
  const s = document.getElementById('qastat'); if (s) s.textContent = QA.listening ? '듣고 있소… 말을 마치면 「그만 듣기」를 누르시오.' : (SR ? '' : '이 기기는 음성 인식을 지원하지 않아 글로 대답합니다.');
}
function qaRender(){
  const el = document.getElementById('qa'); if (!el) return;
  el.querySelector('.qa-log').innerHTML = qaLogHTML();
  const lg = el.querySelector('.qa-log'); lg.scrollTop = lg.scrollHeight;
  const f = el.querySelector('.qa-in');
  const can = !QA.busy && !QA.done && QA.hist.length && !QA.hist[QA.hist.length - 1].a;
  f.style.display = QA.done ? 'none' : '';
  f.querySelectorAll('button,textarea').forEach(x => x.disabled = !can);
  const end = el.querySelector('.qa-end'); end.style.display = QA.done ? '' : 'none';
}
function qaOpen(pid){
  if (!aiUrl()) { alert('AI 신하 문답은 실제 서버(배포된 주소)에서만 할 수 있습니다.'); return; }
  QA.pid = pid; QA.hist = []; QA.final = null; QA.done = false; QA.busy = false;
  const old = document.getElementById('qa'); if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'modal-bg qa-bg'; el.id = 'qa'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '대사헌 문답');
  el.innerHTML = `<div class="modal qa-modal">
    <div class="mh"><div><small>司憲府 · AI 신하 문답 · ${esc(qaTargetName(pid))}</small><h2>대사헌의 질문</h2></div><button class="x" data-qclose aria-label="닫기">✕</button></div>
    <div class="qa-top"><div class="qa-face">${advisorSVG(DAESAHEON)}</div>
      <p class="small muted" style="margin:0">대사헌이 우리 정책을 따져 묻습니다. 두 번 대답하면 총평을 해 줍니다. <b>점수에는 영향이 없고</b>, 문답 내용은 선생님 기록에 남습니다.</p>
      <label class="qa-tts small"><input type="checkbox" id="qatts" ${QA.tts ? 'checked' : ''}> 소리로 읽기</label></div>
    <div class="qa-log" aria-live="polite"></div>
    <div class="qa-in">
      <div class="row" style="gap:8px"><button class="btn qa-mic" id="qamic" type="button" ${SR ? '' : 'hidden'}>🎤 말로 대답하기</button><span class="small muted" id="qastat"></span></div>
      <textarea id="qatxt" maxlength="400" placeholder="말로 대답하면 여기에 글자로 적힙니다. 고쳐 쓸 수도 있습니다."></textarea>
      <div class="err" id="qaerr"></div>
      <button class="btn primary" id="qasend" type="button">대답 올리기</button></div>
    <div class="qa-end" style="display:none"><button class="btn" data-qagain type="button">다른 문답 하기</button><button class="btn primary" data-qclose type="button">닫기</button></div>
  </div>`;
  document.body.appendChild(el);
  qaMicUI(); qaRender(); qaCall();
}
function qaClose(){ qaStop(); try { speechSynthesis.cancel(); } catch (e) {} const el = document.getElementById('qa'); if (el) el.remove(); }
function qaCall(){
  QA.busy = true; qaRender();
  const e = document.getElementById('qaerr'); if (e) e.textContent = '';
  fetch(aiUrl(), { method: 'POST', body: JSON.stringify({ code: L.code, teamId: L.teamId, memberId: L.memberId, pid: QA.pid, hist: QA.hist, voice: QA.voiced }) })
    .then(r => r.json()).then(j => {
      QA.busy = false;
      if (!j.ok) { const last = QA.hist[QA.hist.length - 1]; if (last && last.a) { document.getElementById('qatxt').value = last.a; last.a = ''; } if (!QA.hist.length) QA.done = true; qaRender(); const er = document.getElementById('qaerr'); if (er) er.textContent = j.error; else alert(j.error); return; }
      if (j.done) { QA.final = { say: j.say, grade: j.grade }; QA.done = true; }
      else QA.hist.push({ q: j.say });
      qaRender(); qaSpeak(j.say);
      if (j.note) { const s = document.getElementById('qastat'); if (s) s.textContent = j.note; }
    }).catch(() => { QA.busy = false; qaRender(); const er = document.getElementById('qaerr'); if (er) er.textContent = '연결이 끊겼습니다. 다시 눌러 주세요.'; });
}
function qaSend(){
  const ta = document.getElementById('qatxt'), a = ta.value.trim();
  const er = document.getElementById('qaerr');
  if (a.length < 2) { er.textContent = '대답을 말하거나 적어 주세요.'; return; }
  qaStop();
  QA.hist[QA.hist.length - 1].a = a; ta.value = '';
  qaCall();
}
function qaListen(){
  if (!SR) return;
  if (QA.listening) { qaStop(); return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  const ta = document.getElementById('qatxt'), base = ta.value ? ta.value.trim() + ' ' : '';
  const rec = new SR(); QA.rec = rec;
  rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = true;
  rec.onresult = ev => { let fin = '', mid = ''; for (let i = 0; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript; } ta.value = (base + fin + mid).slice(0, 400); QA.voiced = true; };
  rec.onerror = ev => { QA.listening = false; qaMicUI(); const s = document.getElementById('qastat'); if (s) s.textContent = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? '마이크 사용이 막혀 있습니다. 주소창의 자물쇠에서 마이크를 허용하거나 글로 대답하세요.' : ev.error === 'no-speech' ? '소리가 들리지 않았소. 다시 눌러 말해 보시오.' : '음성 인식이 멈췄습니다. 다시 누르거나 글로 대답하세요.'; };
  rec.onend = () => { QA.listening = false; qaMicUI(); };
  try { rec.start(); QA.listening = true; } catch (e) { QA.listening = false; }
  qaMicUI();
}
document.addEventListener('click', e => {
  const t = e.target;
  const q = t.closest('[data-qa]'); if (q) { e.preventDefault(); qaOpen(q.dataset.qa); return; }
  if (!t.closest('#qa')) return;
  if (t.closest('[data-qclose]') || t.id === 'qa') { qaClose(); return; }
  if (t.closest('#qamic')) { qaListen(); return; }
  if (t.closest('#qasend')) { qaSend(); return; }
  if (t.closest('[data-qagain]')) { qaClose(); return; }
  const rp = t.closest('[data-qrep]'); if (rp) { const k = rp.dataset.qrep; qaSpeak(k === 'f' ? QA.final.say : QA.hist[+k].q); return; }
}, true);
document.addEventListener('change', e => { if (e.target.id === 'qatts') { QA.tts = e.target.checked; if (!QA.tts) try { speechSynthesis.cancel(); } catch (er) {} } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('qa')) qaClose(); });
if (window.speechSynthesis) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) {}
