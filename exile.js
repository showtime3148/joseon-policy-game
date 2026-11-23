/* 귀양 이벤트: 결과 공개 때 점수가 EXILE_LINE 아래로 떨어진 의정부의 영의정이 귀양을 떠난다 (연출만, 점수 영향 없음) */
const EXILE_LINE = 40;
const EXILE_PLACES = [
  {name:'제주도', sea:true, note:'바다 건너 가장 먼 귀양지. 광해군도 이곳에서 생을 마쳤습니다.'},
  {name:'흑산도', sea:true, note:'정약전이 귀양 가서 물고기 책 『자산어보』를 쓴 섬입니다.'},
  {name:'강진', sea:false, note:'정약용이 18년 동안 귀양 살며 책 500여 권을 쓴 곳입니다.'},
  {name:'거제도', sea:true, note:'남쪽 바닷가 섬. 송시열도 이곳으로 귀양을 갔습니다.'},
  {name:'삼수갑산', sea:false, note:'함경도 깊은 산골. "삼수갑산을 가더라도"라는 말이 여기서 나왔습니다.'},
  {name:'추자도', sea:true, note:'제주 가는 바닷길 한가운데의 작은 섬입니다.'},
  {name:'진도', sea:true, note:'물살 거센 울돌목 건너의 섬입니다.'},
  {name:'울릉도', sea:true, note:'이번에는 수토관 대신 귀양객이 갑니다.'}
];
function exRo(n){ const c=n.charCodeAt(n.length-1), b=(c-0xAC00)%28; return n+(c>=0xAC00&&c<=0xD7A3&&b>0&&b!==8?'으로':'로'); }
function exHash(s){ let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function exilePlace(team, turnIdx){ return EXILE_PLACES[exHash(team.id + ':' + turnIdx) % EXILE_PLACES.length]; }
function exileWho(team){
  const y = team.members.find(m => m.roles.includes('yeong'));
  return y ? '영의정 ' + y.name + ' 대감' : team.name + ' 의정부 대신들';
}
function exiledTeams(room, turnIdx){
  return room.teams.filter(t => t.score < EXILE_LINE && t.log.some(l => l.t === turnIdx));
}

/* 귀양길 그림: 죄인(흰 옷) 한 명과 나졸 두 명이 길을 따라 떠나고, 섬이면 배를 탄다 */
function exileSVG(place){
  const sea = place.sea;
  const person = (x, robe, hat, cls) => `<g class="${cls||''}" transform="translate(${x} 0)">
    <ellipse cx="0" cy="186" rx="14" ry="3" fill="#000" opacity=".15"/>
    <path d="M-11 150 L-14 184 H14 L11 150Z" fill="${robe}" stroke="#2b2118" stroke-width="1.2"/>
    <g class="ex-leg"><line x1="-5" y1="182" x2="-8" y2="190" stroke="#2b2118" stroke-width="3"/><line x1="5" y1="182" x2="8" y2="190" stroke="#2b2118" stroke-width="3"/></g>
    <circle cx="0" cy="140" r="9" fill="#f2d7b6" stroke="#2b2118" stroke-width="1.2"/>
    ${hat}</g>`;
  const gat = `<ellipse cx="0" cy="133" rx="15" ry="3" fill="#2b2118" opacity=".85"/><rect x="-6" y="122" width="12" height="11" rx="2" fill="#2b2118" opacity=".85"/>`;
  const guardHat = `<ellipse cx="0" cy="133" rx="13" ry="3" fill="#2b2118"/><path d="M-6 133 q6 -16 12 0Z" fill="#2b2118"/><path d="M6 128 l8 -6" stroke="#b23a2c" stroke-width="3"/>`;
  const prisoner = person(0, '#f4efe4', gat + `<path d="M-14 152 h28" stroke="#6b4a2b" stroke-width="4"/><rect x="-16" y="146" width="32" height="7" rx="2" fill="#8a6b3d" stroke="#2b2118"/>`, 'ex-p');
  const g1 = person(-44, '#2f4a6b', guardHat + `<line x1="12" y1="146" x2="20" y2="118" stroke="#6b4a2b" stroke-width="2.5"/><path d="M20 118 l3 -8 3 8Z" fill="#999"/>`, 'ex-g');
  const g2 = person(44, '#2f4a6b', guardHat, 'ex-g');
  const ground = sea
    ? `<rect x="0" y="176" width="640" height="84" fill="#5a8fb0"/><g class="sc-wave">${Array.from({length:16},(_,i)=>`<path d="M${i*46-20} 200 q11.5 -8 23 0 q11.5 -8 23 0" fill="none" stroke="#dbe9f2" stroke-width="2"/>`).join('')}</g>
       <path d="M0 176 H250 Q270 176 280 190 L290 260 H0Z" fill="#cdb98a"/>
       <g class="ex-island"><path d="M500 180 Q540 140 590 178Z" fill="#4f7a5b"/><path d="M520 172 q10 -30 20 -2" fill="#3f6a4b"/></g>`
    : `<path d="M0 190 Q320 170 640 196 V260 H0Z" fill="#cdb98a"/><path d="M0 220 Q300 200 640 226" fill="none" stroke="#b39c6b" stroke-width="10" stroke-linecap="round"/>`;
  const boat = sea ? `<g class="ex-boat"><path d="M-40 190 H40 L30 206 H-30Z" fill="#6b4a2b" stroke="#2b2118"/><line x1="0" y1="190" x2="0" y2="140" stroke="#2b2118" stroke-width="2"/><path d="M2 144 L32 184 H2Z" fill="#efe1b8" stroke="#2b2118"/></g>` : '';
  return `<svg viewBox="0 0 640 260" class="ex-svg ${sea?'sea':'land'}" role="img" aria-label="${esc(exRo(place.name))} 귀양 가는 모습">
    <defs><linearGradient id="exsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3048"/><stop offset="1" stop-color="#c98a5a"/></linearGradient></defs>
    <rect width="640" height="260" fill="url(#exsky)"/>
    <circle cx="520" cy="70" r="26" fill="#f1c27a" opacity=".85"/>
    <path d="M0 170 Q90 110 180 150 Q270 90 380 140 Q480 100 640 150 V200 H0Z" fill="#5c4a5e" opacity=".7"/>
    <g class="sc-drift"><ellipse cx="140" cy="60" rx="40" ry="10" fill="#e9d6c2" opacity=".5"/><ellipse cx="380" cy="44" rx="30" ry="8" fill="#e9d6c2" opacity=".4"/></g>
    ${ground}
    <g class="ex-crows">${[0,1,2].map(i=>`<path d="M${200+i*40} ${50+i*10} q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#2b2118" stroke-width="2"/>`).join('')}</g>
    <g class="ex-walk ${sea?'to-boat':''}"><g transform="translate(0 0)">${sea?boat:''}${g1}${prisoner}${g2}</g></g>
  </svg>`;
}

function exileCardHTML(team, turnIdx, room){
  const p = exilePlace(team, turnIdx);
  return `<div class="ex-card" style="--nc:${nationColor(room, team.id)}">
    <div class="ex-nm">${flagSVG(room, team, 30)}<b>${esc(team.name)}</b><span class="num">${team.score}점</span></div>
    <p class="ex-msg"><b>${esc(exileWho(team))}</b>, 나라를 어지럽힌 죄로 <b class="ex-place">${esc(p.name)}</b>${exRo(p.name).slice(p.name.length)} 귀양을 떠나오!</p>
    <p class="small ex-note">${esc(p.note)}</p></div>`;
}

/* 학생 화면: 우리 나라가 귀양이면 크게, 아니면 아무것도 */
function exileOverlay(room, teams, turnIdx, opts){
  opts = opts || {};
  if (!teams.length) return;
  const old = document.getElementById('exile'); if (old) old.remove();
  const first = exilePlace(teams[0], turnIdx);
  const el = document.createElement('div');
  el.id = 'exile'; el.className = 'ex-bg';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '귀양 이벤트');
  el.innerHTML = `<div class="ex-box">
    <div class="ex-head"><span class="ex-stamp">流配</span><div><small>${opts.host ? '점수 ' + EXILE_LINE + '점 아래로 떨어진 의정부' : '우리 의정부 점수가 ' + EXILE_LINE + '점 아래로!'}</small><h2>귀양 가오!</h2></div></div>
    ${exileSVG(first)}
    <div class="ex-list">${teams.map(t => exileCardHTML(t, turnIdx, room)).join('')}</div>
    <p class="small ex-foot">${opts.host ? '다음 사건에서 점수를 40점 위로 올리면 귀양에서 풀려나 다시 조정으로 돌아옵니다.' : '걱정 마시오. 다음 사건에서 점수를 ' + EXILE_LINE + '점 위로 올리면 귀양에서 풀려나 조정으로 돌아옵니다. 6조가 힘을 모아 시너지를 노려 보시오!'}</p>
    <button class="btn primary" data-exclose>${opts.host ? '계속' : '귀양길 배웅하기'}</button></div>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
  el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-exclose]')) close(); });
  const b = el.querySelector('[data-exclose]'); if (b) setTimeout(() => { try { b.focus(); } catch (e) {} }, 50);
  try { if (navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch (e) {}
}
function exileSeen(code, turnIdx, who){
  const k = 'exile_' + code + '_' + turnIdx + '_' + who;
  try { if (sessionStorage.getItem(k)) return true; sessionStorage.setItem(k, '1'); } catch (e) {}
  return false;
}
/* 이전 사건에서 귀양이었다가 이번에 40점 위로 올라온 의정부(해배) */
function releasedTeams(room, turnIdx){
  return room.teams.filter(t => t.score >= EXILE_LINE && t.log.some(l => l.t === turnIdx) && prevScore(t, turnIdx) < EXILE_LINE && t.log.some(l => l.t === turnIdx - 1));
}
