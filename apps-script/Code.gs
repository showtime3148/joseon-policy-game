/**
 * 조선 국정 회의 - 실시간 방 서버 (자동 생성 파일: build.sh)
 * 구글 시트 > 확장 프로그램 > Apps Script 에 이 파일 내용 전체를 붙여 넣고
 * 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) 로 배포하세요.
 */
/* 조선 국정 시뮬레이션 — 시나리오 데이터
 * 능력치: tr 국고, pp 민심, cr 왕권, df 국방, lv 민생(농업·상업), cu 학문·문화 (0~100)
 * 선택지 eff: 즉시 효과 / later: [{in:몇 턴 뒤, eff, note}] 지연 효과 / ach: 업적 / flag: 이후 결말에 영향
 * real: 실제 역사에서 고른 선택지(pick)와 설명(text)
 */
const STATS = {
  tr:{name:'국고', icon:'庫', desc:'나라 재정'},
  pp:{name:'민심', icon:'民', desc:'백성의 지지'},
  cr:{name:'왕권', icon:'王', desc:'국왕의 권위와 정국 안정'},
  df:{name:'국방', icon:'兵', desc:'군사력과 국경 방어'},
  lv:{name:'민생', icon:'農', desc:'농업·상업과 백성의 살림'},
  cu:{name:'문화', icon:'文', desc:'학문·과학·문화'}
};

const SCENARIOS = [
{
  id:'sejong', king:'세종', reign:'1418~1450', title:'태평성대를 설계하라',
  lead:'아버지 태종이 왕권을 다져 놓았지만, 남쪽 바다엔 왜구가, 북쪽 국경엔 여진족이 들끓습니다. 백성 대부분은 글을 모르고, 세금 제도는 관리의 부정으로 얼룩져 있습니다.',
  start:{tr:55, pp:55, cr:60, df:45, lv:45, cu:40},
  turns:[
    {year:1419, title:'왜구의 침입', art:'ship', text:'왜구가 충청도 비인현과 황해도 해주 바닷가를 노략질했습니다. 왜구의 근거지는 대마도입니다.',
     choices:[
      {id:'a', label:'대마도 정벌군 파견', desc:'수군을 보내 왜구의 근거지를 직접 친다.', eff:{df:8, tr:-8, cr:4}, later:[{in:3, eff:{df:4, tr:3}, note:'정벌 뒤 대마도가 교역을 청해 오며 왜구가 크게 줄었습니다.'}]},
      {id:'b', label:'해안 방어 강화', desc:'수군과 봉수를 늘려 해안을 지킨다.', eff:{df:7, tr:-4, lv:-1}},
      {id:'c', label:'교역을 허락해 회유', desc:'왜인에게 무역을 허락해 약탈할 이유를 없앤다.', eff:{tr:3, df:-3, lv:2}, later:[{in:2, eff:{df:-6, pp:-4}, note:'회유만으로는 왜구가 근절되지 않아 해안 백성의 피해가 이어졌습니다.'}]}
     ],
     real:{pick:'a', text:'1419년 상왕 태종의 주도로 이종무가 대마도를 정벌했습니다. 이후 1443년 계해약조로 제한된 교역을 허락해 강경책과 회유책을 함께 썼습니다.'}},
    {year:1420, title:'인재와 학문', art:'books', text:'새 왕조의 제도를 다듬으려면 학식 있는 인재가 필요합니다. 그러나 예산은 한정되어 있습니다.',
     choices:[
      {id:'a', label:'집현전 확대', desc:'젊은 학자를 모아 연구와 편찬에 전념하게 한다.', eff:{cu:12, tr:-5}, later:[{in:3, eff:{cu:6, cr:3}, note:'집현전 학자들이 제도 정비와 편찬 사업에서 성과를 내기 시작했습니다.'}], ach:'집현전'},
      {id:'b', label:'과거 시험 확대', desc:'합격자 수를 늘려 관리를 더 뽑는다.', eff:{cu:7, pp:4, tr:-3}},
      {id:'c', label:'공신·종친 중용', desc:'믿을 수 있는 왕실과 공신 가문에 일을 맡긴다.', eff:{cr:6, pp:-3, cu:-2}}
     ],
     real:{pick:'a', text:'세종은 1420년 집현전을 확대해 젊은 학자들을 모았습니다. 이들은 훈민정음 창제와 각종 편찬 사업의 중심이 되었습니다.'}},
    {year:1429, title:'우리 땅에 맞는 농법', art:'rice', text:'지역마다 기후와 토양이 다른데 중국 농서를 그대로 따르다 보니 수확이 들쭉날쭉합니다.',
     choices:[
      {id:'a', label:'우리 농서 편찬·보급', desc:'각 도 경험 많은 농부의 지혜를 모아 책으로 펴낸다.', eff:{lv:8, cu:4, tr:-3}, later:[{in:2, eff:{lv:6, tr:3}, note:'새 농법이 퍼지며 수확이 늘었습니다.'}], ach:'농사직설'},
      {id:'b', label:'세금 감면', desc:'올해 세금을 줄여 농민의 부담을 던다.', eff:{pp:8, lv:4, tr:-9}},
      {id:'c', label:'개간 장려', desc:'새로 일군 땅은 몇 년간 세금을 면제한다.', eff:{lv:5, tr:-2}, later:[{in:3, eff:{tr:4}, note:'개간한 땅에서 세금이 걷히기 시작했습니다.'}]}
     ],
     real:{pick:'a', text:'1429년 농부들의 경험을 모은 『농사직설』을 펴내 각 도에 보급했습니다. 우리 풍토에 맞는 최초의 농서입니다.'}},
    {year:1430, title:'세금 제도 개혁', art:'scale', text:'관리가 해마다 논밭을 보고 세금을 정하는 답험손실법은 부정이 많습니다. 일정한 기준으로 걷는 공법(貢法)을 두고 의견이 갈립니다.',
     choices:[
      {id:'a', label:'백성에게 묻고 오래 논의', desc:'전국 백성에게 찬반을 묻고 충분히 다듬어 시행한다.', eff:{pp:8, cr:-2, tr:-2}, later:[{in:4, eff:{tr:8, lv:4, pp:3}, note:'토지 비옥도와 풍흉에 따라 세금을 정하는 새 제도가 확정되어 세금이 공정해졌습니다.'}], ach:'공법'},
      {id:'b', label:'정액세 즉시 시행', desc:'토지 면적에 따라 같은 세금을 바로 걷는다.', eff:{tr:8, pp:-8, lv:-4}},
      {id:'c', label:'기존 방식 유지', desc:'익숙한 제도를 그대로 둔다.', eff:{cr:2, pp:-3}, later:[{in:2, eff:{tr:-4}, note:'관리의 부정으로 세금이 중간에서 새어 나갑니다.'}]}
     ],
     real:{pick:'a', text:'1430년 약 17만 명에게 찬반을 묻는 여론 조사를 했고, 14년의 논의 끝에 1444년 전분6등법·연분9등법을 확정했습니다.'}},
    {year:1433, title:'북방 국경', art:'fort', text:'압록강과 두만강 일대의 여진족이 국경을 넘어와 약탈합니다. 이 땅을 확실히 우리 영토로 만들지 고민입니다.',
     choices:[
      {id:'a', label:'군대 파견·백성 이주', desc:'여진을 몰아내고 진을 설치한 뒤 남쪽 백성을 옮겨 살게 한다.', eff:{df:10, tr:-10, pp:-7, cr:4}, later:[{in:3, eff:{df:5, lv:3}, note:'압록강에서 두만강에 이르는 국경선이 자리 잡았습니다.'}], ach:'4군 6진'},
      {id:'b', label:'국경 방어만 강화', desc:'성을 쌓고 지키는 데 집중한다.', eff:{df:4, tr:-4}},
      {id:'c', label:'관직·교역으로 회유', desc:'여진 추장에게 벼슬을 주고 교역을 허락한다.', eff:{tr:-2, df:-2, pp:2}, later:[{in:2, eff:{df:-5}, note:'여진의 침입이 다시 잦아졌습니다.'}]}
     ],
     real:{pick:'a', text:'최윤덕이 압록강 쪽에 4군을, 김종서가 두만강 쪽에 6진을 개척했습니다. 남쪽 백성을 옮기는 사민 정책으로 지금의 국경선이 자리 잡았습니다.'}},
    {year:1441, title:'하늘을 읽는 기술', art:'gauge', text:'가뭄과 홍수가 반복되는데 비의 양을 잴 방법이 없고, 중국 달력은 우리 하늘과 맞지 않습니다.',
     choices:[
      {id:'a', label:'천문·측우 기구 개발', desc:'측우기와 해시계를 만들고 우리 역법을 정리한다.', eff:{cu:10, lv:5, tr:-9}, ach:'과학 기구'},
      {id:'b', label:'화포·무기 개량', desc:'기술 투자를 국방에 집중한다.', eff:{df:8, tr:-6}},
      {id:'c', label:'예산 절약', desc:'새 사업을 벌이지 않는다.', eff:{tr:5, cu:-3}}
     ],
     real:{pick:'a', text:'장영실 등이 앙부일구(1434)와 측우기(1441)를 만들었고, 1442년 우리 하늘에 맞춘 역법서 『칠정산』을 펴냈습니다.'}},
    {year:1443, title:'백성을 위한 문자', art:'hangul', text:'백성이 한자를 몰라 억울한 일을 당해도 글로 호소하지 못합니다. 새 문자를 만들자 최만리 등이 "중국을 섬기는 도리에 어긋난다"며 반대 상소를 올렸습니다.',
     choices:[
      {id:'a', label:'반대를 무릅쓰고 반포', desc:'새 문자를 널리 알리고 책을 펴낸다.', eff:{cu:12, pp:8, cr:-5}, later:[{in:2, eff:{pp:4, cu:4}, note:'새 문자로 쓴 책과 노래가 나오기 시작했습니다.'}], ach:'훈민정음'},
      {id:'b', label:'반대 의견 수용·보류', desc:'신하들과의 갈등을 피한다.', eff:{cr:4, cu:-3}},
      {id:'c', label:'이두 정비', desc:'한자를 빌려 우리말을 적는 방식을 다듬는다.', eff:{cu:3, pp:2}}
     ],
     real:{pick:'a', text:'1443년 훈민정음을 창제하고, 1444년 최만리 등의 반대 상소에도 불구하고 1446년 반포했습니다.'}}
  ]
},
{
  id:'gwanghae', king:'광해군', reign:'1608~1623', title:'전쟁의 상처, 새로운 강자',
  lead:'임진왜란이 끝난 지 10년. 농토는 황폐하고 나라 곳간은 비었습니다. 북쪽에서는 여진족이 세력을 키우고 있고, 조정은 왕의 정통성을 두고 갈라져 있습니다.',
  start:{tr:30, pp:45, cr:42, df:35, lv:35, cu:40},
  turns:[
    {year:1608, title:'공납의 폐단', art:'rice', text:'지역 특산물을 바치는 공납은 방납업자의 횡포로 백성의 부담이 몇 배로 불어났습니다. 이원익이 공납을 쌀로 걷자고 건의합니다.',
     choices:[
      {id:'a', label:'경기도부터 시범 시행', desc:'공납을 토지 1결당 쌀로 걷는 제도를 경기도에서 먼저 한다.', eff:{pp:8, lv:5, cr:-3}, later:[{in:3, eff:{tr:5, pp:3}, note:'경기도 백성의 부담이 줄었다는 소문이 퍼졌습니다.'}], ach:'대동법'},
      {id:'b', label:'전국 즉시 시행', desc:'한 번에 전국으로 바꾼다.', eff:{pp:10, cr:-10, tr:-6}},
      {id:'c', label:'공납 유지', desc:'땅 많은 양반 지주의 반발을 피한다.', eff:{cr:3, pp:-6, lv:-4}}
     ],
     real:{pick:'a', text:'1608년 선혜청을 설치하고 경기도에서 대동법을 시행했습니다. 지주들의 반대로 전국 시행까지는 100년이 걸렸습니다(1708).'}},
    {year:1609, title:'전후 복구', art:'people', text:'왜란으로 경작지가 크게 줄고 토지 대장과 호적이 불타 세금을 제대로 걷지 못합니다.',
     choices:[
      {id:'a', label:'토지·호적 정비', desc:'숨은 토지와 인구를 찾아 대장을 새로 만든다.', eff:{tr:8, lv:3, pp:-3}},
      {id:'b', label:'세금 감면', desc:'민생 회복을 먼저 한다.', eff:{pp:8, lv:6, tr:-8}},
      {id:'c', label:'군대 재건 우선', desc:'무너진 성과 무기부터 정비한다.', eff:{df:8, tr:-6, lv:-2}}
     ],
     real:{pick:'a', text:'광해군 정부는 토지 대장과 호적을 정리해 세금 기반을 되살리는 한편, 무너진 성곽과 무기를 정비했습니다.'}},
    {year:1610, title:'백성을 살릴 의학', art:'books', text:'전쟁과 전염병으로 많은 백성이 죽었습니다. 허준이 선조 때부터 써 온 의학서를 완성했습니다.',
     choices:[
      {id:'a', label:'의학서 간행·보급', desc:'책을 찍어 전국에 보급한다.', eff:{cu:8, pp:5, tr:-4}, ach:'동의보감'},
      {id:'b', label:'의원 양성', desc:'지방에 의원을 더 보낸다.', eff:{pp:4, tr:-3}},
      {id:'c', label:'예산 아끼기', desc:'간행을 미룬다.', eff:{tr:3, pp:-3}}
     ],
     real:{pick:'a', text:'허준의 『동의보감』은 1610년 완성되어 1613년 간행되었습니다. 우리 약재와 처방을 정리한 의학서입니다.'}},
    {year:1613, title:'왕위를 둘러싼 갈등', art:'conflict', text:'어린 영창대군을 왕으로 세우려 했다는 역모 고발이 들어왔습니다. 대북 세력은 영창대군을 처벌하고 그 어머니 인목대비를 폐위하라고 주장합니다.',
     choices:[
      {id:'a', label:'대북의 주장 수용', desc:'영창대군을 처벌하고 인목대비를 궁에 가둔다.', eff:{cr:8, pp:-8}, flag:'pyemo', later:[{in:3, eff:{cr:-6}, note:'서인 세력이 "어머니를 폐하고 동생을 죽였다(폐모살제)"며 불만을 키웁니다.'}]},
      {id:'b', label:'처벌하되 대비는 예우', desc:'역모 관련자만 벌한다.', eff:{cr:3, pp:-2}},
      {id:'c', label:'고발을 덮고 탕평', desc:'여러 붕당을 고루 등용해 갈등을 줄인다.', eff:{cr:-4, pp:4, cu:2}}
     ],
     real:{pick:'a', text:'계축옥사(1613)로 영창대군이 죽고 인목대비는 서궁에 갇혔습니다(1618). 이 일은 훗날 인조반정의 명분이 되었습니다.'}},
    {year:1615, title:'궁궐 공사', art:'palace', text:'불탄 창덕궁을 다시 지은 뒤, 왕은 경덕궁과 인경궁 같은 새 궁궐도 짓고 싶어 합니다. 공사비와 부역이 큰 부담입니다.',
     choices:[
      {id:'a', label:'새 궁궐 공사 강행', desc:'왕실의 권위를 세운다.', eff:{cr:6, tr:-12, pp:-8, lv:-4}},
      {id:'b', label:'필요한 곳만 수리', desc:'규모를 줄인다.', eff:{cr:2, tr:-4}},
      {id:'c', label:'공사 중단', desc:'예산을 국방과 민생에 쓴다.', eff:{pp:5, df:3, cr:-3}}
     ],
     real:{pick:'a', text:'광해군은 여러 궁궐 공사를 무리하게 벌여 재정 부담과 백성의 원성을 샀습니다.'}},
    {year:1618, title:'명의 파병 요청', art:'flags', text:'만주에서 누르하치가 후금을 세우고 명을 공격했습니다. 명은 임진왜란 때 도와준 은혜를 갚으라며 군대를 요청합니다.',
     choices:[
      {id:'a', label:'파병하되 형세를 보라', desc:'강홍립에게 군대를 주고 상황에 따라 행동하라고 비밀리에 지시한다.', eff:{df:-3, cr:-4}, flag:'neutral', later:[{in:2, eff:{df:4}, note:'후금이 조선을 적으로 보지 않아 국경이 평온합니다.'}]},
      {id:'b', label:'대군으로 명을 지원', desc:'명에 대한 의리를 지킨다.', eff:{cr:3, df:-10, tr:-8}, flag:'promin', later:[{in:2, eff:{df:-10, pp:-6}, note:'후금이 조선을 적대해 국경 긴장이 높아졌습니다.'}]},
      {id:'c', label:'파병 거절', desc:'남의 전쟁에 끼지 않는다.', eff:{df:2, cr:-8}, flag:'neutral'}
     ],
     real:{pick:'a', text:'1619년 사르후 전투에서 명군이 크게 지자 강홍립은 후금에 항복했습니다. 광해군은 명과 후금 사이에서 중립 외교를 펼쳤습니다.'}},
    {year:1621, title:'커지는 후금, 갈라진 조정', art:'fort', text:'후금의 힘이 점점 커집니다. 서인들은 "오랑캐와 가까이 지내 명의 은혜를 저버린다"고 왕을 비난합니다.',
     choices:[
      {id:'a', label:'국방 정비·중립 유지', desc:'성곽과 화기를 정비하며 외교 노선을 지킨다.', eff:{df:8, tr:-6}},
      {id:'b', label:'친명 노선으로 전환', desc:'서인의 의견을 받아들인다.', eff:{cr:5, df:-4}, flag:'promin'},
      {id:'c', label:'서인 등용·화합', desc:'반대 세력을 조정에 끌어들인다.', eff:{cr:4, pp:3}}
     ],
     real:{pick:'a', text:'광해군은 중립 외교를 유지했지만, 1623년 서인이 폐모살제와 외교 노선을 문제 삼아 인조반정을 일으켰습니다. 이후 친명배금 정책 속에 정묘호란·병자호란을 겪습니다.'}}
  ],
  ending:function(s){
    if((s.flags.pyemo && s.st.cr < 50) || s.st.cr < 35)
      return {bonus:-10, title:'반정으로 폐위', text:'1623년, 서인 세력이 반정을 일으켜 왕이 쫓겨났습니다. 실제 역사와 같은 결말입니다.'};
    if(s.flags.promin)
      return {bonus:-3, title:'반정은 피했으나', text:'왕위는 지켰지만 명을 지원하면서 후금과의 긴장이 커졌습니다.'};
    return {bonus:6, title:'치세를 지켜 내다', text:'정국을 안정시켜 반정 없이 치세를 이어 갔습니다. 실제 역사와 다른 결말입니다.'};
  }
},
{
  id:'yeongjo', king:'영조', reign:'1724~1776', title:'붕당을 넘어 탕평으로',
  lead:'노론과 소론이 서로를 역적이라 부르며 다투고, 왕의 즉위를 두고도 의혹이 돕니다. 백성들은 무거운 군포에 시달립니다.',
  start:{tr:45, pp:45, cr:35, df:45, lv:40, cu:50},
  turns:[
    {year:1724, title:'붕당의 대립', art:'conflict', text:'노론과 소론이 사사건건 대립합니다. 어느 쪽에 힘을 실어 주느냐에 따라 정국이 뒤집힙니다.',
     choices:[
      {id:'a', label:'탕평 선언', desc:'붕당을 가리지 않고 고루 등용하겠다고 밝힌다.', eff:{cr:5, pp:3}, later:[{in:2, eff:{cr:4}, note:'붕당 사이의 다툼이 조금씩 줄었습니다.'}]},
      {id:'b', label:'노론 중용', desc:'왕을 지지해 온 노론에 힘을 싣는다.', eff:{cr:8, pp:-3}, flag:'noron'},
      {id:'c', label:'소론 중용', desc:'노론을 견제한다.', eff:{cr:3, pp:-1}, flag:'soron'}
     ],
     real:{pick:'a', text:'영조는 즉위 초 탕평의 뜻을 밝혔습니다. 그러나 초기에는 노론과 소론을 번갈아 등용하며 균형을 맞춰야 했습니다.'}},
    {year:1728, title:'반란', art:'fort', text:'소론 강경파 이인좌 등이 "왕이 선왕을 독살했다"고 주장하며 청주에서 반란을 일으켰습니다.',
     choices:[
      {id:'a', label:'진압 후 탕평 강화', desc:'반란은 엄하게 다스리되 온건한 소론은 계속 등용한다.', eff:{df:-4, cr:8, pp:2, tr:-5}},
      {id:'b', label:'진압 후 소론 숙청', desc:'소론 전체에 책임을 묻는다.', eff:{df:-4, cr:4, pp:-6, cu:-3}},
      {id:'c', label:'협상·회유', desc:'군사를 쓰지 않고 달랜다.', eff:{cr:-8, pp:-2}}
     ],
     real:{pick:'a', text:'이인좌의 난은 관군에 진압되었습니다. 영조는 이를 계기로 붕당 정치의 폐해를 강조하며 탕평을 더 강하게 추진했습니다.'}},
    {year:1742, title:'탕평의 제도화', art:'scale', text:'탕평을 말로만 외쳐서는 붕당이 사라지지 않습니다. 제도로 뒷받침할 방법이 필요합니다.',
     choices:[
      {id:'a', label:'탕평비와 인사 개혁', desc:'성균관에 탕평비를 세우고 붕당의 인사 통로를 막는다.', eff:{cr:8, cu:3, pp:2}, ach:'탕평비'},
      {id:'b', label:'서원 대폭 정리', desc:'붕당의 근거지인 서원을 줄인다.', eff:{cr:7, cu:-2, tr:3}},
      {id:'c', label:'인사 균형만 유지', desc:'붕당 인물을 섞어 앉힌다.', eff:{cr:3}}
     ],
     real:{pick:'a', text:'1741년 이조전랑의 인사 추천권(통청권)을 없애고, 1742년 성균관 앞에 탕평비를 세웠습니다. 붕당의 근거지가 된 서원도 일부 정리했습니다.'}},
    {year:1746, title:'법과 제도의 정비', art:'books', text:'법전이 오래되어 현실과 맞지 않습니다. 나라의 제도와 역사도 체계적으로 정리할 필요가 있습니다.',
     choices:[
      {id:'a', label:'법전 정비·편찬 사업', desc:'새 법전을 만들고 각종 책을 편찬한다.', eff:{cu:10, cr:3, tr:-4}, ach:'속대전'},
      {id:'b', label:'법전만 손질', desc:'꼭 필요한 조항만 고친다.', eff:{cr:3, cu:3}},
      {id:'c', label:'보류', desc:'예산을 아낀다.', eff:{tr:2}}
     ],
     real:{pick:'a', text:'1746년 『속대전』으로 법전을 정비했고, 1770년 우리나라 문물제도를 정리한 『동국문헌비고』를 펴냈습니다.'}},
    {year:1750, title:'군역의 고통', art:'rice', text:'양인 남자는 해마다 군포 2필을 내야 합니다. 죽은 사람과 어린아이에게까지 군포를 매기는 폐단으로 백성이 고통받고 있습니다.',
     choices:[
      {id:'a', label:'군포를 1필로 감면', desc:'줄어든 세금은 토지세와 어염세 등으로 메운다.', eff:{pp:12, lv:6, tr:-6}, later:[{in:2, eff:{tr:4}, note:'새 세원으로 재정 부족을 메웠습니다.'}], ach:'균역법'},
      {id:'b', label:'양반에게도 군포', desc:'신분과 관계없이 집집마다 군포를 걷는다.', eff:{pp:12, tr:8, cr:-10}},
      {id:'c', label:'현행 유지', desc:'재정을 지킨다.', eff:{tr:3, pp:-10, lv:-5}}
     ],
     real:{pick:'a', text:'1750년 균역법으로 군포를 1필로 줄이고, 부족분은 결작(토지세)·어염선세·선무군관포로 보충했습니다. 양반에게도 걷는 호포제는 양반의 반발로 실현되지 못했습니다.'}},
    {year:1760, title:'도성의 물난리', art:'flood', text:'청계천에 흙과 모래가 쌓여 비만 오면 도성이 물에 잠깁니다.',
     choices:[
      {id:'a', label:'대규모 준천 사업', desc:'바닥을 파내고 물길을 정비한다.', eff:{lv:6, pp:5, tr:-9}, ach:'준천'},
      {id:'b', label:'피해 지역 구휼', desc:'물난리 때마다 곡식을 나눠 준다.', eff:{pp:3, tr:-3}},
      {id:'c', label:'보류', desc:'예산을 아낀다.', eff:{tr:2, lv:-4}}
     ],
     real:{pick:'a', text:'1760년 청계천 준천 사업을 벌여 도성의 홍수 피해를 줄였습니다.'}},
    {year:1771, title:'백성의 목소리', art:'drum', text:'억울한 백성이 왕에게 직접 호소할 길이 막혀 있습니다. 지방 수령의 횡포도 끊이지 않습니다.',
     choices:[
      {id:'a', label:'신문고 부활', desc:'백성이 북을 쳐 억울함을 알리게 한다.', eff:{pp:8, cr:3}, ach:'신문고'},
      {id:'b', label:'암행어사 파견 확대', desc:'지방 수령을 감찰한다.', eff:{pp:6, cr:5, tr:-2}},
      {id:'c', label:'현행 유지', desc:'관리 체계를 믿는다.', eff:{pp:-2}}
     ],
     real:{pick:'a', text:'1771년 신문고를 다시 설치했습니다. 영조는 즉위 초 무릎을 짓누르는 압슬형을 없애는 등 가혹한 형벌도 줄였습니다.'}}
  ]
},
{
  id:'jeongjo', king:'정조', reign:'1776~1800', title:'개혁 군주의 꿈',
  lead:'사도세자의 아들로 왕위에 올랐지만, 즉위를 반대한 세력이 조정에 남아 있습니다. 서울의 상업은 커 가는데 특권 상인이 시장을 막고 있습니다.',
  start:{tr:50, pp:50, cr:35, df:40, lv:50, cu:55},
  turns:[
    {year:1776, title:'측근 정치의 유혹', art:'conflict', text:'즉위를 반대한 세력이 여전합니다. 왕을 지켜 준 홍국영이 점점 권력을 휘두르기 시작합니다.',
     choices:[
      {id:'a', label:'규장각 설치', desc:'왕실 도서관 겸 연구 기관을 세워 젊은 인재를 직접 키운다.', eff:{cr:8, cu:8, tr:-4}, ach:'규장각'},
      {id:'b', label:'측근에게 정치를 맡김', desc:'믿을 만한 사람에게 권한을 몰아준다.', eff:{cr:-6, tr:2}, later:[{in:2, eff:{cr:-6, pp:-4}, note:'측근의 권력 남용에 비판이 커집니다.'}]},
      {id:'c', label:'반대 세력 처벌', desc:'즉위를 방해한 이들을 엄하게 다스린다.', eff:{cr:4, pp:-4}}
     ],
     real:{pick:'a', text:'정조는 즉위하자 규장각을 세워 정치·학문의 중심으로 삼았습니다. 권세를 휘두르던 홍국영은 1779년 내쳤습니다.'}},
    {year:1779, title:'서얼 등용', art:'books', text:'박제가·유득공·이덕무처럼 재능 있는 서얼(첩의 자식)은 법 때문에 높은 관직에 오르지 못합니다.',
     choices:[
      {id:'a', label:'규장각 검서관으로 등용', desc:'실력 있는 서얼에게 관직을 준다.', eff:{cu:8, pp:3, cr:-2}, ach:'검서관'},
      {id:'b', label:'신분 질서 유지', desc:'양반의 반발을 피한다.', eff:{cr:3, cu:-2}},
      {id:'c', label:'서얼 차별 전면 폐지', desc:'한 번에 모든 제한을 없앤다.', eff:{cu:6, pp:4, cr:-8}}
     ],
     real:{pick:'a', text:'1779년 박제가·유득공·이덕무·서이수를 규장각 검서관으로 등용했습니다.'}},
    {year:1785, title:'왕을 지키는 군대', art:'fort', text:'5군영은 붕당 세력과 얽혀 있어 왕을 지키는 데 한계가 있습니다.',
     choices:[
      {id:'a', label:'친위 부대 창설', desc:'왕이 직접 지휘하는 부대를 만든다.', eff:{df:10, cr:8, tr:-10, pp:-2}, ach:'장용영'},
      {id:'b', label:'5군영 개혁', desc:'기존 군영의 기강을 바로잡는다.', eff:{df:5, tr:-4}},
      {id:'c', label:'현행 유지', desc:'새 부담을 만들지 않는다.', eff:{df:-2}}
     ],
     real:{pick:'a', text:'1785년 장용위를 설치하고 1793년 장용영으로 키워 왕권의 군사적 기반으로 삼았습니다.'}},
    {year:1791, title:'시장의 자유', art:'market', text:'시전 상인이 금난전권을 내세워 다른 상인(난전)의 장사를 막는 바람에 물가가 오릅니다.',
     choices:[
      {id:'a', label:'금난전권 폐지', desc:'육의전을 뺀 시전 상인의 특권을 없앤다.', eff:{lv:10, pp:5, tr:3, cr:-2}, ach:'신해통공'},
      {id:'b', label:'특권 유지', desc:'시전 상인의 세금 납부를 지킨다.', eff:{tr:3, lv:-5, pp:-3}},
      {id:'c', label:'모든 특권 폐지', desc:'육의전까지 포함해 특권을 없앤다.', eff:{lv:11, tr:-2, cr:-4}}
     ],
     real:{pick:'a', text:'1791년 신해통공으로 육의전을 제외한 시전 상인의 금난전권을 폐지해 자유로운 상업 활동을 허용했습니다.'}},
    {year:1791, title:'천주교 문제', art:'scroll', text:'전라도 진산의 양반 윤지충이 천주교 교리에 따라 어머니 제사를 지내지 않고 신주를 불태웠습니다. 조정이 들끓습니다.',
     choices:[
      {id:'a', label:'관련자만 처벌', desc:'성리학을 바로 세우면 자연히 사라진다고 보고 확대하지 않는다.', eff:{cr:3, pp:2, cu:-1}},
      {id:'b', label:'대대적 색출', desc:'천주교도를 모두 찾아 처벌한다.', eff:{cr:5, pp:-6, cu:-6}},
      {id:'c', label:'묵인', desc:'개인의 믿음으로 보고 넘어간다.', eff:{cr:-8, cu:3}}
     ],
     real:{pick:'a', text:'진산 사건의 당사자들은 처형되었지만, 정조는 대대적인 박해로 번지지 않도록 했습니다. 대규모 박해는 정조 사후 신유박해(1801)에서 일어났습니다.'}},
    {year:1794, title:'새 도시 화성', art:'palace', text:'아버지 사도세자의 묘를 수원으로 옮긴 뒤, 그곳에 새 도시와 성을 쌓으려 합니다.',
     choices:[
      {id:'a', label:'새 기술·품삯 지급', desc:'거중기 같은 기계를 쓰고 일꾼에게 품삯을 준다.', eff:{cu:8, lv:5, df:6, tr:-14}, ach:'수원 화성'},
      {id:'b', label:'부역 동원', desc:'백성을 의무로 동원해 빨리 짓는다.', eff:{df:6, tr:-4, pp:-10}},
      {id:'c', label:'보류', desc:'재정을 지킨다.', eff:{tr:3}}
     ],
     real:{pick:'a', text:'1794~1796년 정약용이 고안한 거중기 등을 활용하고 일꾼에게 품삯을 주며 수원 화성을 쌓았습니다. 공사 과정은 『화성성역의궤』에 기록되었습니다.'}},
    {year:1795, title:'행차길의 백성들', art:'drum', text:'왕의 행차 길에 백성들이 꽹과리를 치며 억울함을 호소(격쟁)합니다.',
     choices:[
      {id:'a', label:'직접 듣고 처리', desc:'행차 때마다 상언과 격쟁을 받아 해결한다.', eff:{pp:10, cr:4, tr:-2}},
      {id:'b', label:'지방관에게 맡김', desc:'담당 관리가 처리하게 한다.', eff:{cr:2}},
      {id:'c', label:'행차 축소', desc:'행차 비용을 아낀다.', eff:{tr:4, pp:-3}}
     ],
     real:{pick:'a', text:'정조는 능행 때 백성의 상언과 격쟁을 받아 직접 처리했습니다. 재위 중 처리한 민원이 수천 건에 이릅니다.'}}
  ]
},
{
  id:'daewongun', king:'흥선대원군', reign:'1863~1873', title:'안으로 개혁, 밖으로 외세',
  lead:'60여 년의 세도 정치로 나라 곳간은 비고 삼정은 문란해졌습니다. 어린 고종을 대신해 정치를 맡았지만, 바다 건너 서양 함대가 다가오고 있습니다.',
  start:{tr:30, pp:35, cr:35, df:35, lv:35, cu:45},
  turns:[
    {year:1864, title:'세도 정치 청산', art:'conflict', text:'안동 김씨 등 몇몇 가문이 권력을 독차지해 관직을 사고팔고 있습니다.',
     choices:[
      {id:'a', label:'세도 가문 축출·고른 등용', desc:'당파와 지역을 가리지 않고 인재를 쓴다.', eff:{cr:10, pp:6}},
      {id:'b', label:'세도 가문과 타협', desc:'갈등 없이 권력을 나눈다.', eff:{cr:2, tr:3}},
      {id:'c', label:'대대적 숙청', desc:'세도 가문 사람을 모두 몰아낸다.', eff:{cr:8, pp:-2, cu:-3}}
     ],
     real:{pick:'a', text:'흥선대원군은 안동 김씨 세력을 몰아내고 당파와 신분을 가리지 않고 인재를 등용했습니다.'}},
    {year:1865, title:'통치 기구 정비', art:'scale', text:'비변사가 국정을 장악해 의정부와 6조가 제 역할을 못합니다.',
     choices:[
      {id:'a', label:'비변사 폐지·법전 정비', desc:'의정부와 삼군부의 기능을 되살리고 법전을 새로 엮는다.', eff:{cr:8, df:3}, ach:'대전회통'},
      {id:'b', label:'비변사 유지', desc:'익숙한 체제를 둔다.', eff:{cr:-1}},
      {id:'c', label:'직속 기구 신설', desc:'대원군 직속 기구를 만든다.', eff:{cr:5, tr:-3}}
     ],
     real:{pick:'a', text:'1865년 비변사를 폐지하고 의정부와 삼군부의 기능을 회복했으며, 『대전회통』을 편찬했습니다.'}},
    {year:1865, title:'경복궁 중건', art:'palace', text:'임진왜란 때 불탄 경복궁을 다시 지어 왕실의 권위를 세우려 합니다. 그러나 돈이 부족합니다.',
     choices:[
      {id:'a', label:'원납전·당백전으로 강행', desc:'기부금을 걷고 고액 화폐를 찍어 공사비를 마련한다.', eff:{cr:10, tr:6, pp:-12, lv:-10}, later:[{in:2, eff:{lv:-5, pp:-4}, note:'당백전 발행으로 물가가 크게 올랐습니다.'}], ach:'경복궁 중건'},
      {id:'b', label:'규모를 줄여 천천히', desc:'형편에 맞게 짓는다.', eff:{cr:4, tr:-6}},
      {id:'c', label:'중건 보류', desc:'민생을 먼저 챙긴다.', eff:{tr:3, cr:-3, pp:2}}
     ],
     real:{pick:'a', text:'원납전을 강제로 걷고 당백전을 발행해 경복궁을 중건했습니다(1865~1868). 물가가 폭등하고 백성의 원성이 커졌습니다.'}},
    {year:1866, title:'프랑스 함대의 침입', art:'ship', text:'천주교 탄압(병인박해)을 구실로 프랑스 함대가 강화도를 점령했습니다.', war:true,
     choices:[
      {id:'a', label:'끝까지 항전', desc:'정족산성 등에서 맞서 싸운다.', eff:{df:-6, cr:6, pp:4}},
      {id:'b', label:'협상', desc:'통상 문제를 논의해 철수를 끌어낸다.', eff:{cr:-6, df:2, lv:3}},
      {id:'c', label:'강화도 포기·한양 방어', desc:'수도 방어에 집중한다.', eff:{df:-3, pp:-4, cr:-3}}
     ],
     real:{pick:'a', text:'양헌수가 정족산성에서 프랑스군을 물리쳤습니다. 프랑스군은 물러나면서 외규장각 도서를 약탈해 갔습니다(병인양요).'}},
    {year:1871, title:'삼정의 문란', art:'rice', text:'군포는 상민만 내고, 백성을 돕던 환곡은 고리대처럼 변했습니다.',
     choices:[
      {id:'a', label:'호포제·사창제 실시', desc:'양반에게도 군포를 걷고 환곡을 마을 단위로 운영한다.', eff:{pp:12, tr:8, cr:-8}, ach:'호포제'},
      {id:'b', label:'환곡만 개혁', desc:'양반의 반발을 피한다.', eff:{pp:5, tr:2}},
      {id:'c', label:'현행 유지', desc:'갈등을 만들지 않는다.', eff:{pp:-8}}
     ],
     real:{pick:'a', text:'1871년 양반에게도 군포를 걷는 호포제를 실시했고, 환곡은 사창제로 고쳤습니다.'}},
    {year:1871, title:'서원 정리', art:'books', text:'전국 600여 곳의 서원이 세금을 면제받고 붕당의 근거지가 되어 백성을 수탈합니다.',
     choices:[
      {id:'a', label:'47곳만 남기고 정리', desc:'대부분의 서원을 없애고 토지를 거둔다.', eff:{tr:6, pp:5, cr:-6}, later:[{in:2, eff:{cr:-4}, note:'유생들의 반발이 거세집니다.'}]},
      {id:'b', label:'일부만 정리', desc:'문제가 심한 곳만 없앤다.', eff:{tr:2, pp:2}},
      {id:'c', label:'유지', desc:'유생들의 반발을 피한다.', eff:{cr:3, pp:-3}}
     ],
     real:{pick:'a', text:'1871년 전국의 서원 가운데 47곳만 남기고 정리했습니다. 유생들의 반발은 대원군이 물러나는 원인이 되었습니다.'}},
    {year:1871, title:'미국 함대의 침입', art:'ship', text:'제너럴셔먼호 사건(1866)을 구실로 미국 함대가 강화도에 쳐들어와 통상을 요구합니다.', war:true,
     choices:[
      {id:'a', label:'항전 후 척화비 건립', desc:'끝까지 싸우고 서양과의 통상을 거부한다.', eff:{cr:6, df:-6, pp:3}, flag:'closed'},
      {id:'b', label:'통상 조약 협상', desc:'문을 열고 서양 기술을 받아들인다.', eff:{cr:-8, lv:5, cu:3}, flag:'open'},
      {id:'c', label:'제한적 개방', desc:'일부 항구만 열어 교역한다.', eff:{cr:-4, lv:3}, flag:'open'}
     ],
     real:{pick:'a', text:'광성보 전투에서 어재연이 전사하는 등 큰 피해를 입었지만 미군은 물러갔습니다. 대원군은 전국에 척화비를 세워 통상 수교 거부를 분명히 했습니다(신미양요).'}}
  ],
  ending:function(s){
    if(s.st.cr < 50)
      return {bonus:-5, title:'물러난 섭정', text:'1873년 최익현의 탄핵 상소와 유생·양반의 반발 속에 정권에서 물러났습니다. 실제 역사와 같은 결말입니다. 3년 뒤 조선은 일본의 강요로 강화도 조약을 맺고 문을 엽니다.'};
    return {bonus:5, title:'개혁을 이어 가다', text:'반발을 다스리며 개혁을 이어 갔습니다. 실제로는 1873년 물러났고, 1876년 강화도 조약으로 개항했습니다.'};
  }
}
];

/* 현대 제도 카드 — 통합사회의 경제·정치·법 개념을 조선에 맞게 바꾼 카드
 * unit: 통합사회 관련 단원, modern: 현대 제도 이름, name: 조선판 이름
 * eff: 즉시 효과, later: 지연 효과(in 턴 뒤)
 */
const CARD_LIMIT = 3; // 한 모둠이 한 게임에서 쓸 수 있는 카드 수(한 사건에 1장)
const CARDS = [
  {id:'rate', detail:'한국은행은 기준금리를 올리거나 내려 시중에 도는 돈의 양을 조절합니다. 금리를 올리면 대출과 소비가 줄어 물가가 내려가고, 금리를 내리면 경기가 살아나는 대신 물가가 오를 수 있습니다.', adapt:'조선에는 중앙은행이 없었고 곡식이 화폐처럼 쓰였습니다. 그래서 고려와 조선에 실제로 있었던 상평창이 곡식을 사고팔아 곡식값을 안정시키는 방식으로 바꾸었습니다.', think:'곡식값이 안정되면 농민과 곡식을 사 먹는 백성은 각각 어떤 이익과 손해를 볼까요?', unit:'통합사회2 · 시장경제와 지속가능발전', modern:'중앙은행의 물가 안정 정책', name:'상평창 곡가 조절',
   desc:'풍년에 곡식을 사들이고 흉년에 풀어 곡식값을 안정시킨다.', concept:'중앙은행이 금리·통화량을 조절해 물가를 안정시키듯, 나라가 곡식의 양을 조절해 값을 안정시킵니다.',
   eff:{lv:5, pp:2, tr:-3}},
  {id:'progtax', detail:'우리나라 소득세는 소득이 많아질수록 더 높은 세율이 붙는 누진세 구조입니다. 능력에 따라 더 많이 부담하는 수직적 공평을 실현하고 소득 재분배 효과가 있습니다.', adapt:'조선의 중심 세금은 소득세가 아니라 토지에 매기는 전세(田稅)였습니다. 그래서 땅을 많이 가진 사람일수록 더 높은 비율로 걷는 방식으로 바꾸었습니다.', think:'땅을 많이 가진 양반에게 더 걷는 것은 공정할까요? 수평적 공평과 수직적 공평의 관점에서 토론해 보세요.', unit:'통합사회2 · 사회 정의와 불평등', modern:'누진세', name:'누진 전세(田稅)',
   desc:'땅을 많이 가진 사람일수록 더 높은 비율로 세금을 걷는다.', concept:'소득이 많을수록 높은 세율을 매기는 누진세는 소득 재분배 효과가 있지만, 부유층의 반발을 부릅니다.',
   eff:{tr:7, pp:5, cr:-6}},
  {id:'basic', detail:'사회 보장 제도에는 사회 보험, 공공 부조, 사회 서비스가 있습니다. 기본 소득은 모든 사람에게 조건 없이 일정 금액을 주자는 제안으로, 여러 나라와 지역에서 실험되었습니다.', adapt:'조선에는 흉년에 굶주린 백성에게 곡식을 나누어 주는 진휼 제도가 있었습니다. 이를 넓혀 모든 백성에게 기본 식량을 주는 방식으로 바꾸었습니다.', think:'어려운 사람만 돕는 선별 복지와 모두에게 주는 보편 복지는 각각 어떤 장단점이 있을까요?', unit:'통합사회2 · 사회 정의와 불평등', modern:'사회 보장 제도(기본 소득)', name:'진휼 기본미',
   desc:'모든 백성에게 기본 식량을 나누어 준다.', concept:'공공 부조·기본 소득은 최소한의 생활을 보장하지만 큰 재정이 필요합니다.',
   eff:{pp:8, lv:4, tr:-10}},
  {id:'checks', detail:'대한민국 헌법은 국회(입법), 정부(행정), 법원(사법)에 권력을 나누어 서로 견제하게 합니다. 한 기관에 권력이 몰려 남용되는 것을 막기 위한 장치입니다.', adapt:'조선에도 사헌부·사간원·홍문관, 이른바 삼사가 관리를 감찰하고 왕에게 바른말을 하며 권력을 견제했습니다. 이 삼사를 왕과 대신에게서 더 독립시키는 방식으로 바꾸었습니다.', think:'권력을 나누면 결정이 느려질 수 있습니다. 전쟁 같은 위기 때에는 어떻게 해야 할까요?', unit:'통합사회2 · 인권 보장과 헌법', modern:'권력 분립(견제와 균형)', name:'삼사(三司) 독립',
   desc:'사헌부·사간원·홍문관이 왕과 대신을 마음껏 비판하게 한다.', concept:'입법·행정·사법을 나누어 서로 견제하면 권력 남용을 막지만, 결정이 느려질 수 있습니다.',
   eff:{cr:-5, pp:4, cu:3}, later:[{in:2, eff:{cr:6, pp:2}, note:'삼사의 견제로 부정부패가 줄어 조정이 안정되었습니다.'}]},
  {id:'vote', detail:'우리 헌법은 헌법 개정안과, 외교·국방·통일 등 나라의 중요한 정책을 국민 투표에 부칠 수 있게 합니다. 국민이 직접 결정에 참여하는 직접 민주주의 요소입니다.', adapt:'세종은 새 토지세 제도(공법)를 시행하기 전에 약 17만 명에게 찬반을 물었습니다. 이 사례에 착안해 중요한 정책을 백성에게 직접 묻고 따르는 방식으로 바꾸었습니다.', think:'어떤 문제는 국민 투표로 정하는 것이 좋고, 어떤 문제는 전문가에게 맡기는 것이 좋을까요?', unit:'통합사회2 · 인권 보장과 헌법', modern:'국민 투표(직접 민주주의)', name:'백성 공론 투표',
   desc:'중요한 정책을 백성에게 직접 묻고 결과를 따른다.', concept:'국민 투표는 국민의 뜻을 직접 반영하지만, 비용과 시간이 들고 전문적 판단이 어려울 수 있습니다.',
   eff:{pp:7, cr:-3, tr:-2}},
  {id:'wage', detail:'최저임금법에 따라 최저임금위원회가 해마다 최저 임금을 정하고, 사용자는 그보다 적게 줄 수 없습니다. 노동자의 생활을 보장하지만 고용 부담이 커진다는 의견도 있습니다.', adapt:'조선 백성은 성을 쌓거나 길을 내는 부역에 대가 없이 동원되곤 했습니다. 정조가 수원 화성 공사에 품삯을 준 사례처럼, 나라 공사에 일정 이상의 품삯을 주도록 바꾸었습니다.', think:'최저 임금을 크게 올리면 일하는 사람과 고용하는 사람에게 각각 어떤 일이 생길까요?', unit:'통합사회2 · 시장경제와 지속가능발전', modern:'최저 임금 제도', name:'품삯 하한제',
   desc:'나라 공사에 동원된 백성에게 일정 이상의 품삯을 준다.', concept:'최저 임금은 노동자의 생활을 보장하지만, 고용 부담을 늘릴 수 있습니다.',
   eff:{pp:5, lv:3, tr:-5}},
  {id:'antitrust', detail:'공정거래위원회는 독과점 기업이 가격을 마음대로 올리거나 기업끼리 짜고 가격을 정하는 담합을 규제합니다. 시장의 경쟁을 지켜 소비자를 보호하기 위해서입니다.', adapt:'조선 후기 시전 상인은 금난전권으로 다른 상인의 장사를 막았습니다. 이런 특권을 규제해 누구나 장사할 수 있게 하는 방식으로 바꾸었습니다. 정조의 신해통공과 비슷합니다.', think:'시장에 맡겨 두면 독점이 생기는 이유는 무엇일까요? 정부는 어디까지 개입해야 할까요?', unit:'통합사회2 · 시장경제와 지속가능발전', modern:'공정 거래법(독과점 규제)', name:'독점 상인 규제',
   desc:'특권 상인의 시장 독점을 막고 누구나 장사할 수 있게 한다.', concept:'독과점을 규제하면 경쟁이 늘어 가격이 내려가고 소비자에게 이롭습니다.',
   eff:{lv:6, pp:2, cr:-2}},
  {id:'school', detail:'헌법 제31조는 모든 국민의 교육받을 권리를 보장하고, 초등학교와 중학교는 의무 교육으로 무상입니다. 교육은 개인의 권리이자 나라 발전의 바탕입니다.', adapt:'조선의 서당은 대부분 마을이나 개인이 세운 사설 교육 기관이었습니다. 이를 나라가 세우고 무료로 가르치는 방식으로 바꾸었습니다.', think:'교육에 투자한 효과는 왜 몇 해가 지나서야 나타날까요?', unit:'통합사회2 · 인권 보장과 헌법', modern:'의무 교육(교육권 보장)', name:'서당 무상 교육',
   desc:'마을마다 서당을 세워 아이들을 무료로 가르친다.', concept:'교육받을 권리는 사회권이며, 교육 투자는 오랜 시간이 지나 성과가 나타납니다.',
   eff:{cu:5, tr:-6, pp:2}, later:[{in:3, eff:{cu:5, lv:4}, note:'서당에서 배운 아이들이 자라 학문과 산업이 발전했습니다.'}]},
  {id:'bond', detail:'정부는 세금만으로 부족한 돈을 마련하려고 국채를 발행해 돈을 빌립니다. 당장 재정을 쓸 수 있지만, 나중에 이자와 함께 갚아야 해 국가 채무가 늘어납니다.', adapt:'조선에는 국채가 없었습니다. 부유한 상인에게 나라가 돈을 빌리고 몇 해 뒤 이자를 붙여 갚는 방식으로 바꾸었습니다.', think:'지금 빌려 쓴 돈을 다음 세대가 갚게 되는 것은 공정할까요?', unit:'통합사회2 · 시장경제와 지속가능발전', modern:'국채 발행', name:'국채(國債) 발행',
   desc:'부유한 상인에게 돈을 빌려 당장의 재정을 채운다.', concept:'국채로 당장 재정을 마련할 수 있지만, 나중에 이자와 원금을 갚아야 합니다.',
   eff:{tr:12}, later:[{in:3, eff:{tr:-14}, note:'국채를 갚을 때가 되어 이자와 함께 국고가 빠져나갔습니다.'}]},
  {id:'fta', detail:'자유 무역 협정은 나라끼리 관세 같은 무역 장벽을 낮추거나 없애는 약속입니다. 우리나라는 2004년 칠레와 첫 FTA를 맺은 뒤 여러 나라와 협정을 맺었습니다.', adapt:'조선은 국경의 정해진 시장(개시)에서 청·일본과 제한적으로 교역했습니다. 이 국경 시장을 넓혀 관세 없이 교역하는 방식으로 바꾸었습니다.', think:'자유 무역으로 이익을 보는 사람과 피해를 보는 사람은 누구일까요? 피해 산업은 어떻게 도울 수 있을까요?', unit:'통합사회2 · 시장경제와 지속가능발전', modern:'자유 무역 협정(FTA)', name:'호시(互市) 교역 협정',
   desc:'이웃 나라와 국경 시장을 열어 관세 없이 교역한다.', concept:'자유 무역은 교역을 늘려 이익을 주지만, 경쟁에 약한 산업은 타격을 받을 수 있습니다.',
   eff:{lv:5, tr:4, df:-3, cr:-1}},
  {id:'local', detail:'우리나라는 1991년 지방 의회, 1995년 지방 자치 단체장 선거를 거쳐 지방 자치를 본격 시행했습니다. 주민이 지역의 일을 스스로 결정하는 풀뿌리 민주주의입니다.', adapt:'조선의 지방은 중앙에서 보낸 수령이 다스렸고, 향회는 주로 지방 양반의 모임이었습니다. 이 향회에 고을 사람들이 참여해 고을 일을 정하도록 바꾸었습니다.', think:'중앙에서 한꺼번에 정하는 것과 지역마다 스스로 정하는 것은 각각 어떤 장단점이 있을까요?', unit:'통합사회2 · 인권 보장과 헌법', modern:'지방 자치 제도', name:'향회(鄕會) 자치',
   desc:'고을 일은 고을 사람들의 회의에서 정하게 한다.', concept:'지방 자치는 주민 참여와 지역 맞춤 정책을 가능하게 하지만, 중앙의 통제력은 약해집니다.',
   eff:{pp:5, lv:3, cr:-4}},
  {id:'press', detail:'헌법 제21조는 언론·출판의 자유를 보장합니다. 언론은 정부를 감시하고 국민의 알 권리를 지키지만, 다른 사람의 명예나 권리를 침해해서는 안 됩니다.', adapt:'조선의 조보는 조정의 결정과 소식을 관리들에게 알리던 소식지였습니다. 이를 백성도 볼 수 있게 공개하고 비판을 허용하는 방식으로 바꾸었습니다.', think:'언론의 자유는 어디까지 보장되어야 할까요? 거짓 소식은 어떻게 다루어야 할까요?', unit:'통합사회2 · 인권 보장과 헌법', modern:'언론의 자유', name:'조보(朝報) 공개',
   desc:'조정 소식지를 백성도 볼 수 있게 공개하고 비판을 허용한다.', concept:'언론의 자유는 정부를 감시하고 국민의 알 권리를 보장합니다.',
   eff:{pp:4, cu:4, cr:-3}},
  {id:'eco', detail:'지속 가능한 발전은 미래 세대가 쓸 자원을 해치지 않으면서 현재의 필요를 채우는 발전입니다. 큰 개발 사업은 환경 영향 평가를 거쳐야 합니다.', adapt:'조선도 금산(봉산) 제도로 배와 궁궐을 짓는 데 쓸 소나무 숲의 벌채를 금했습니다. 이를 넓혀 숲 전체를 보호해 홍수와 가뭄을 줄이는 방식으로 바꾸었습니다.', think:'당장의 개발과 미래를 위한 보전이 부딪힐 때 무엇을 기준으로 판단해야 할까요?', unit:'통합사회1 · 자연환경과 인간', modern:'지속 가능한 발전(환경 보호)', name:'금산(禁山) 보호령',
   desc:'산의 나무를 함부로 베지 못하게 해 숲을 지킨다.', concept:'환경 보호는 당장 개발을 제한하지만, 장기적으로 홍수·가뭄을 줄여 지속 가능한 발전을 돕습니다.',
   eff:{lv:-3, tr:-1}, later:[{in:2, eff:{lv:7, pp:2}, note:'숲이 되살아나 홍수와 가뭄 피해가 줄었습니다.'}]},
  {id:'insurance', detail:'우리나라에는 국민연금, 건강 보험, 고용 보험, 산업 재해 보상 보험의 4대 사회 보험이 있습니다. 가입자와 사업주, 국가가 함께 보험료를 내 질병·실업·재해 같은 위험에 대비합니다.', adapt:'조선 마을에는 계와 향약처럼 서로 돕는 전통이 있었습니다. 이를 나라 제도로 만들어 곡식을 모아 두었다가 재해를 당한 집을 돕도록 바꾸었습니다.', think:'의무로 가입하는 사회 보험과 스스로 고르는 민간 보험은 어떻게 다를까요?', unit:'통합사회2 · 사회 정의와 불평등', modern:'사회 보험', name:'계(契) 보험',
   desc:'백성이 조금씩 곡식을 모아 두었다가 재해를 당한 집을 돕게 한다.', concept:'사회 보험은 가입자가 함께 부담해 질병·재해 같은 위험에 대비하는 제도입니다.',
   eff:{lv:2, pp:3}, later:[{in:2, eff:{pp:3, lv:3}, note:'계 보험 덕분에 재해를 당한 백성이 빨리 일어섰습니다.'}]}
];

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

/* 조선 국정 시뮬레이션 — 게임 규칙 */
const SKEYS = ['tr','pp','cr','df','lv','cu'];
const BUDGET = 12;            // 한 턴에 쓰는 기본 예산(능력치 환산)
const TAX_LABEL = {1:'매우 가볍게',2:'가볍게',3:'보통',4:'무겁게',5:'매우 무겁게'};

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function addTo(d, e, k){ for(const s in e) d[s] = (d[s]||0) + e[s]*(k==null?1:k); return d; }

function initGame(sc){
  return {sid:sc.id, t:0, st:Object.assign({}, sc.start), hist:[Object.assign({}, sc.start)],
          pending:[], flags:{}, ach:[], cards:[], crises:[], log:[], done:false, ending:null};
}

// 세금·예산 효과: gov = {tax:1~5, bud:{df,lv,cu}}
function govEffect(gov, st){
  const tx = gov.tax - 3;
  const b = gov.bud, tot = (b.df + b.lv + b.cu) || 1;
  const e = {tr: tx*5 + 2, pp: -tx*4 + (st.lv - 50)*0.06, lv: -tx*2 - 2, df: -3, cu: -2, cr:0};
  e.df += BUDGET*0.6*b.df/tot; e.lv += BUDGET*0.6*b.lv/tot; e.cu += BUDGET*0.6*b.cu/tot;
  return e;
}

function applyStats(st, d){ for(const k of SKEYS) st[k] = clamp(Math.round((st[k] + (d[k]||0))*10)/10, 0, 100); }

function playTurn(g, sc, choiceId, gov, why, cardId){
  const turn = sc.turns[g.t];
  const ch = turn.choices.find(c => c.id === choiceId) || {id:'-', label:'어명을 내리지 못함', eff:{cr:-4, pp:-3}};
  const before = Object.assign({}, g.st), notes = [], d = {};
  addTo(d, ch.eff);
  addTo(d, govEffect(gov, g.st));
  // 지연 효과 도착
  g.pending = g.pending.filter(p => { if(p.due === g.t){ addTo(d, p.eff); notes.push({type:'later', text:p.note}); return false; } return true; });
  // 현대 제도 카드
  let usedCard = null;
  const card = cardId && typeof CARDS !== 'undefined' ? CARDS.find(c => c.id === cardId) : null;
  g.cards = g.cards || [];
  if(card && g.cards.indexOf(card.id) < 0 && g.cards.length < CARD_LIMIT){
    addTo(d, card.eff);
    if(card.later) card.later.forEach(l => g.pending.push({due:g.t + l.in, eff:l.eff, note:l.note, from:card.name}));
    g.cards.push(card.id); usedCard = card.id;
  }
  // 전쟁: 국방력에 따라 피해가 달라짐
  if(turn.war){
    if(g.st.df < 40){ addTo(d, {pp:-5, tr:-5, cr:-3}); notes.push({type:'war', text:'국방력이 약해 전쟁 피해가 컸습니다.'}); }
    else if(g.st.df >= 60){ addTo(d, {cr:3, pp:2}); notes.push({type:'war', text:'튼튼한 국방 덕분에 피해를 줄였습니다.'}); }
  }
  applyStats(g.st, d);
  if(ch.later) ch.later.forEach(l => g.pending.push({due:g.t + l.in, eff:l.eff, note:l.note, from:turn.title}));
  if(ch.flag) g.flags[ch.flag] = true;
  const newAch = ch.ach && !g.ach.includes(ch.ach) ? ch.ach : null;
  if(newAch) g.ach.push(newAch);
  // 위기 판정
  const crisisNow = [];
  if(g.st.pp < 20){ applyStats(g.st, {cr:-8, tr:-6}); crisisNow.push('민란 발생'); }
  if(g.st.cr < 20){ applyStats(g.st, {pp:-5, df:-3}); crisisNow.push('정변 위기'); }
  if(g.st.tr < 10){ applyStats(g.st, {lv:-6, pp:-5}); crisisNow.push('재정 파탄'); }
  crisisNow.forEach(c => { g.crises.push({year:turn.year, name:c}); notes.push({type:'crisis', text:c+'! 나라가 흔들립니다.'}); });

  const delta = {}; for(const k of SKEYS) delta[k] = Math.round((g.st[k] - before[k])*10)/10;
  g.log.push({t:g.t, year:turn.year, title:turn.title, choice:choiceId, label:ch.label, tax:gov.tax, bud:Object.assign({}, gov.bud),
              why:why||'', card:usedCard, delta:delta, notes:notes, ach:newAch, real:turn.real.pick === ch.id});
  g.t++;
  g.hist.push(Object.assign({}, g.st));
  if(g.t >= sc.turns.length) finishGame(g, sc);
  return g.log[g.log.length-1];
}

function finishGame(g, sc){
  // 아직 나타나지 않은 지연 효과는 후대에 나타남
  const late = {}, notes = [];
  g.pending.forEach(p => { addTo(late, p.eff); notes.push(p.note); });
  g.pending = [];
  applyStats(g.st, late);
  g.lateNotes = notes;
  g.ending = sc.ending ? sc.ending(g) : null;
  g.done = true;
  g.hist[g.hist.length-1] = Object.assign({}, g.st);
}

function scoreOf(g){
  // 평균(60%) + 가장 약한 능력치(40%): 한쪽만 키우면 점수가 낮다
  const v = SKEYS.map(k => g.st[k]);
  const avg = v.reduce((a,b) => a+b, 0) / v.length, min = Math.min(...v);
  return Math.max(0, Math.round(0.6*avg + 0.4*min + 2*g.ach.length - 5*g.crises.length + (g.ending ? g.ending.bonus : 0)));
}
function realMatches(g){ return g.log.filter(l => l.real).length; }

if(typeof module !== 'undefined' && module.exports) module.exports = {SKEYS, initGame, playTurn, scoreOf, govEffect, realMatches, TAX_LABEL};

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
