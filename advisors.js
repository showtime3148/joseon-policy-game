/* 히든 조언자 — 시공을 넘어 나타나는 역사 인물
 * stats: 이 인물이 꿰뚫어 보는 지표(숨은 효과 크기와 지연 효과까지 알려 줌)
 * unlock: 해금 조건(g = 게임 상태), hint: 잠겨 있을 때 보이는 단서
 * look: 초상화 모양(hat: king|gat|helmet|official|scholar, robe 색, beard)
 */
const ADVISORS = [
  {id:'sejong', name:'세종대왕', title:'훈민정음을 지은 성군', stats:['cu','pp'],
   look:{hat:'king', robe:'#b23a2c', beard:true},
   hello:'백성이 곧 나라의 근본이니라. 내 이 일을 백성의 눈과 학문의 눈으로 함께 살펴보겠노라.',
   hint:'문화를 65 이상으로 키우면 나타납니다.', unlock:g => g.st.cu >= 65},
  {id:'dasan', name:'정약용', title:'목민심서를 쓴 실학자', stats:['lv','tr'],
   look:{hat:'gat', robe:'#e8e0cc', beard:true},
   hello:'목민관은 백성의 살림부터 살펴야 하옵니다. 곳간과 논밭의 셈을 정확히 아뢰겠사옵니다.',
   hint:'민생을 65 이상으로 키우면 나타납니다.', unlock:g => g.st.lv >= 65},
  {id:'yisunsin', name:'이순신', title:'바다를 지킨 장수', stats:['df'],
   look:{hat:'helmet', robe:'#24384c', beard:true},
   hello:'죽고자 하면 살 것이요, 살고자 하면 죽을 것입니다. 나라를 지키는 힘을 냉정히 따져 보겠습니다.',
   hint:'국방을 60 이상으로 키우거나, 튼튼한 국방으로 전쟁 피해를 줄이면 나타납니다.',
   unlock:g => g.st.df >= 60 || g.log.some(l => l.notes.some(n => n.type === 'war' && /줄였/.test(n.text)))},
  {id:'jang', name:'장영실', title:'측우기를 만든 과학자', stats:['cu','lv'],
   look:{hat:'official', robe:'#2f6b5e', beard:false},
   hello:'재주는 신분을 가리지 않사옵니다. 이 일이 학문과 백성 살림에 미칠 바를 재어 보겠사옵니다.',
   hint:'문화와 민생의 합을 120 이상으로 만들면 나타납니다.', unlock:g => g.st.cu + g.st.lv >= 120},
  {id:'hwanghui', name:'황희', title:'18년을 재상으로 지낸 명재상', stats:['cr','pp'],
   look:{hat:'official', robe:'#7a3b5a', beard:true},
   hello:'네 말도 옳고 네 말도 옳다 하였지요. 허나 조정과 백성의 마음은 분명히 갈리니, 그 무게를 달아 드리리다.',
   hint:'왕권 60 이상, 민심 50 이상을 함께 이루면 나타납니다.', unlock:g => g.st.cr >= 60 && g.st.pp >= 50},
  {id:'heojun', name:'허준', title:'동의보감을 쓴 어의', stats:['pp','lv'],
   look:{hat:'gat', robe:'#d9c08a', beard:true},
   hello:'병든 나라도 사람의 몸과 같아, 맥을 짚어야 처방이 나오는 법이옵니다. 백성의 맥을 짚어 드리지요.',
   hint:'민심을 65 이상으로 키우면 나타납니다.', unlock:g => g.st.pp >= 65},
  {id:'jeongdojeon', name:'정도전', title:'조선의 설계자', stats:['cr','tr'],
   look:{hat:'official', robe:'#24384c', beard:true},
   hello:'나라는 제도로 서는 법. 왕권과 곳간이 어찌 움직일지 설계도를 펼쳐 보이겠소.',
   hint:'현대 제도 카드 3장을 모두 쓰거나 왕권을 70 이상으로 키우면 나타납니다.',
   unlock:g => (g.cards || []).length >= 3 || g.st.cr >= 70},
  {id:'ryu', name:'유성룡', title:'징비록을 남긴 재상', stats:['df','cr'],
   look:{hat:'scholar', robe:'#5b4a3a', beard:true},
   hello:'지난 잘못을 징계하여 뒷근심을 삼가야 하옵니다. 지킬 힘과 조정의 기강을 함께 살피겠사옵니다.',
   hint:'실제 역사와 같은 선택을 5번 이상 하면 나타납니다.', unlock:g => g.log.filter(l => l.real).length >= 5}
];
const ADVISOR_STAT_NAME = {tr:'국고', pp:'민심', cr:'왕권', df:'국방', lv:'민생', cu:'문화'};

function josa(w, pair){ // pair: '이가' | '을를' | '은는' | '과와'
  const c = String(w).charCodeAt(String(w).length - 1), has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  return w + (has ? pair.charAt(0) : pair.charAt(1));
}
function advisorById(id){ return ADVISORS.filter(a => a.id === id)[0]; }

/* 조언 만들기: 전문 지표에 대해 각 대책의 즉시 효과와 지연 효과를 정확히 알려 준다 */
function buildAdvice(adv, turn){
  const stats = adv.stats, lines = [];
  let best = null, bestV = -1e9;
  turn.choices.forEach((c, i) => {
    const later = {}; (c.later || []).forEach(l => { for (const k in l.eff) later[k] = (later[k] || 0) + l.eff[k]; });
    const parts = stats.map(k => {
      const now = c.eff[k] || 0, lt = later[k] || 0;
      return ADVISOR_STAT_NAME[k] + ' ' + (now > 0 ? '+' : '') + now + (lt ? ' (몇 해 뒤 ' + (lt > 0 ? '+' : '') + lt + ')' : '');
    });
    const v = stats.reduce((a, k) => a + (c.eff[k] || 0) + (later[k] || 0), 0);
    if (v > bestV) { bestV = v; best = c; }
    lines.push({mark:'甲乙丙'.charAt(i), label:c.label, text:parts.join(', ')});
  });
  // 가장 나은 대책의 다른 분야 대가
  const costs = Object.keys(best.eff).filter(k => stats.indexOf(k) < 0 && best.eff[k] < 0).map(k => ADVISOR_STAT_NAME[k]);
  const rec = '제 눈으로 보면 「' + best.label + '」' + (josa(best.label, '이가').slice(-1)) + ' 가장 낫사옵니다.' + (costs.length ? ' 다만 ' + josa(costs.join('·'), '을를') + ' 잃을 수 있으니 함께 헤아리소서.' : '');
  return {id:adv.id, name:adv.name, hello:adv.hello, lines:lines, rec:rec};
}

/* 해금 판정: 새로 해금된 조언자 id 목록을 돌려준다 */
function checkUnlocks(g){
  g.advisors = g.advisors || {have:[], used:[]};
  const fresh = [];
  ADVISORS.forEach(a => { if (a.id === 'sejong' && g.sid === 'sejong') return; if (g.advisors.have.indexOf(a.id) < 0 && a.unlock(g)) { g.advisors.have.push(a.id); fresh.push(a.id); } });
  return fresh;
}
function starterAdvisor(g, sc){
  const pool = ADVISORS.filter(a => !(sc.id === 'sejong' && a.id === 'sejong')); // 세종 시대에는 세종이 조언자로 나오지 않음
  const a = pool[Math.floor(Math.random() * pool.length)];
  g.advisors = {have:[a.id], used:[]};
}
