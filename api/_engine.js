/* 자동 생성 파일(build.sh) — scenarios.js + core.js + server/server.gs.js */
module.exports = function (CacheService, LockService, SpreadsheetApp, ContentService) {
/* 조선 국정 회의 — 의정부 회의판 (조선 후기 고정)
 * 지표: tr 국고, pp 민심, cr 왕권(정국 안정), df 국방, lv 민생, cu 문화 (0~100)
 * 사건마다 6조가 정책을 제안하고 영의정이 최대 MAX_ADOPT개를 묶어 시행한다.
 * 정책: id 첫 글자가 담당 조(i 이조, h 호조, y 예조, b 병조, k 형조, g 공조)
 *   eff 즉시 효과 / later [{in, eff, note}] 몇 해 뒤 효과 / modern {name, text, u} 비슷한 현대 정책(결과 공개 때 해설)
 * combos: 함께 시행하면 생기는 효과(시너지·충돌) / real: 실제 역사에서 시행한 정책
 */
const STATS = {
  tr:{name:'국고', icon:'庫', desc:'나라 재정'},
  pp:{name:'민심', icon:'民', desc:'백성의 지지'},
  cr:{name:'왕권', icon:'王', desc:'왕실의 권위와 정국 안정'},
  df:{name:'국방', icon:'兵', desc:'군사력과 국경 방어'},
  lv:{name:'민생', icon:'農', desc:'농업·상업과 백성의 살림'},
  cu:{name:'문화', icon:'文', desc:'학문·교육·과학'}
};
const MAX_ADOPT = 4;
const UNITS = {1:'통합사회2 · 인권 보장과 헌법', 2:'통합사회2 · 사회 정의와 불평등', 3:'통합사회2 · 시장경제와 지속가능발전', 4:'통합사회2 · 세계화와 평화', 5:'통합사회1 · 자연환경과 인간'};
const ROLES = [
  {id:'yeong', name:'영의정', icon:'領', duty:'의정부의 으뜸 벼슬. 6조의 제안을 모아 최종 정책 묶음(합의안)을 정하고 올린다. 판서가 없는 조의 정책은 영의정이 대신 제안한다.'},
  {id:'i', dept:'이조', name:'이조판서', icon:'吏', duty:'관리의 임명·평가와 행정 조직'},
  {id:'h', dept:'호조', name:'호조판서', icon:'戶', duty:'세금·재정·토지와 호구'},
  {id:'y', dept:'예조', name:'예조판서', icon:'禮', duty:'교육·과거·외교·의례'},
  {id:'b', dept:'병조', name:'병조판서', icon:'兵', duty:'군사·국방·군역'},
  {id:'k', dept:'형조', name:'형조판서', icon:'刑', duty:'법률·재판·형벌'},
  {id:'g', dept:'공조', name:'공조판서', icon:'工', duty:'토목·건설·수공업·광산'}
];

const ERA = {
  title:'조선 후기, 의정부 회의', period:'1608 ~ 1866',
  lead:'임진왜란이 끝난 지 10년, 국토는 황폐하고 백성의 세금 부담은 무겁습니다. 앞으로 250여 년 동안 조선은 전쟁, 붕당의 대립, 세금 제도의 문란, 상업의 성장, 서양 세력의 접근을 차례로 맞게 됩니다. 여러분은 국정을 이끄는 의정부입니다. 영의정과 6조 판서가 머리를 맞대어 위기마다 여러 정책을 묶어 시행하십시오.',
  start:{tr:50, pp:45, cr:50, df:40, lv:45, cu:45},
  income:3,
  turns:[
  /* 1 ─────────────────────────────── */
  {year:1608, reign:'광해군 즉위년', title:'공납의 폐단', art:'rice',
   text:'고을마다 특산물을 바치는 공납이 백성을 괴롭히고 있습니다. 관리와 상인이 공물을 대신 내 주고 몇 배의 값을 받아 내는 방납이 판을 치고, 전쟁으로 논밭이 황폐해져 살림은 바닥입니다.',
   base:{pp:-4, lv:-4, tr:-2},
   policies:[
    {id:'h1', name:'대동법 시행', desc:'집집마다 걷던 공물을 토지 면적(결)에 따라 쌀로 걷는다. 땅이 많은 사람이 더 낸다.', eff:{pp:7, lv:4, tr:2, cr:-3},
     later:[{in:2, eff:{lv:4, tr:3}, note:'대동법으로 공인(貢人)이 생겨나 물건을 사고파는 상업이 활기를 띱니다.'}],
     modern:{name:'조세 형평성(응능 원칙)과 세제 단순화', text:'오늘날 소득과 재산이 많을수록 세금을 더 내는 원칙(응능 원칙)과, 복잡한 세금을 하나로 정리하는 세제 개편과 닮았습니다. 대동법은 부담 기준을 사람 수에서 토지로 바꿔 부유한 지주의 부담을 늘렸습니다.', u:2}},
    {id:'h2', name:'공물 액수 감면', desc:'올해 공물의 양을 크게 줄여 준다.', eff:{pp:4, lv:2, tr:-6},
     modern:{name:'한시적 감세·세금 감면', text:'경기가 어려울 때 일정 기간 세금을 깎아 주는 한시적 감세와 비슷합니다. 당장 부담은 줄지만 방납이라는 구조적 문제는 그대로 남습니다.', u:3}},
    {id:'i1', name:'선혜청 설치', desc:'대동미를 전담해 걷고 쓰는 관청을 새로 만들고 전담 관리를 둔다.', eff:{cr:3, tr:-2},
     modern:{name:'전담 행정 기관 신설(예: 국세청)', text:'세금을 걷고 관리하는 일을 전문 기관에 맡기는 오늘날의 국세청과 닮았습니다. 새 제도가 뿌리내리려면 그것을 맡을 조직이 필요합니다.', u:3}},
    {id:'k1', name:'방납 모리배 엄벌', desc:'공물을 대신 내고 폭리를 취하는 관리와 상인을 잡아 벌한다.', eff:{pp:3, cr:2, lv:1},
     later:[{in:2, eff:{pp:-3}, note:'단속이 느슨해지자 방납이 다시 살아났습니다. 처벌만으로는 구조가 바뀌지 않았습니다.'}],
     modern:{name:'불공정 거래 처벌(공정거래 규제)', text:'독점적 지위를 이용해 부당한 이익을 얻는 행위를 처벌하는 공정거래 규제와 비슷합니다. 다만 제도를 고치지 않고 처벌만 하면 효과가 오래가지 않습니다.', u:3}},
    {id:'g1', name:'농지 개간·수리 시설 복구', desc:'전쟁으로 버려진 땅을 다시 일구고 저수지와 보를 고친다.', eff:{lv:6, tr:-5},
     later:[{in:2, eff:{lv:3, tr:2}, note:'복구한 논밭에서 수확이 늘어 세금도 다시 걷히기 시작했습니다.'}],
     modern:{name:'사회 간접 자본(SOC) 투자', text:'정부가 도로·댐·농업 기반 시설에 돈을 써서 생산 기반을 되살리는 SOC 투자와 비슷합니다. 비용은 먼저 들고 효과는 나중에 나타납니다.', u:3}},
    {id:'y1', name:'공론 수렴', desc:'각 도의 수령과 유생에게 공납 개혁에 대한 의견을 묻는다.', eff:{pp:3, cu:1, cr:-1},
     modern:{name:'공청회·국민 참여 정책 제안', text:'정책을 정하기 전에 공청회를 열거나 국민 의견을 듣는 숙의 민주주의 절차와 비슷합니다. 시간이 걸리지만 정책의 정당성이 높아집니다.', u:1}},
    {id:'b1', name:'군량 확보 우선', desc:'훈련도감 군량을 위해 공물을 지금처럼 걷는다.', eff:{df:5, pp:-3, lv:-2},
     modern:{name:'국방 예산 우선 편성', text:'다른 지출보다 국방 예산을 먼저 확보하는 결정과 비슷합니다. 안보는 지키지만 그 부담이 누구에게 돌아가는지 따져 봐야 합니다.', u:4}},
    {id:'g2', name:'관영 수공업 정비', desc:'공물로 받던 물건을 관청 작업장에서 직접 만들어 쓴다.', eff:{lv:-1, tr:-3, cu:2, cr:1},
     modern:{name:'공기업 직접 생산', text:'민간에서 사던 물건을 공기업이 직접 생산하는 방식과 비슷합니다. 품질과 공급은 안정되지만 비용과 효율 문제가 따릅니다.', u:3}}
   ],
   combos:[
    {ids:['h1','i1'], eff:{tr:3, cr:2}, good:true, note:'선혜청이 대동미를 체계적으로 관리해 제도가 빠르게 자리 잡았습니다.'},
    {ids:['h2','b1'], eff:{tr:-3}, good:false, note:'공물을 줄이면서 군량까지 지키려니 국고가 바닥났습니다.'}
   ],
   real:{ids:['h1','i1'], text:'1608년 광해군은 영의정 이원익의 건의로 경기도에 대동법을 시행하고, 이를 맡을 선혜청을 두었습니다. 그러나 땅이 많은 양반 지주들이 거세게 반대하여 대동법이 전국(평안·함경 제외)으로 확대되기까지 100년(1708년 황해도)이 걸렸습니다.'}},

  /* 2 ─────────────────────────────── */
  {year:1636, reign:'인조 14년', title:'청의 침입', art:'fort', war:true,
   text:'후금이 나라 이름을 청으로 바꾸고 조선에 신하의 예를 갖추라고 요구합니다. 조정은 화친을 맺어 나라를 지키자는 주화론과, 오랑캐에게 굴복할 수 없다는 척화론으로 갈라졌습니다. 압록강 너머에서 청군이 움직이고 있습니다.',
   base:{df:-3, pp:-2},
   policies:[
    {id:'b1', name:'남한산성 방어 거점 강화', desc:'도성 남쪽 산성을 고쳐 쌓고 식량과 무기를 쌓아 둔다.', eff:{df:7, tr:-5},
     modern:{name:'전략적 방어 체계 구축', text:'핵심 거점을 요새화하고 비축 물자를 확보하는 오늘날의 방어 체계 구축과 비슷합니다. 다만 산성 하나에 의존하면 다른 지역이 무방비가 됩니다.', u:4}},
    {id:'b2', name:'속오군 정비·지방군 훈련', desc:'양인과 노비를 묶어 편성한 지방군을 다시 훈련시킨다.', eff:{df:5, lv:-3, pp:-2},
     modern:{name:'예비군·병역 제도', text:'평소에는 생업에 종사하다 유사시 군인이 되는 예비군 제도와 비슷합니다. 국방력은 오르지만 백성의 생업 부담이 커집니다.', u:4}},
    {id:'y1', name:'청과 외교 협상(주화)', desc:'사신을 보내 형제 관계 수준에서 타협하고 전쟁을 피하려 한다.', eff:{df:3, cr:-4, pp:-2},
     modern:{name:'실리 외교·외교적 협상', text:'명분보다 국가의 안전과 이익을 앞세워 협상하는 실리 외교와 비슷합니다. 국민 감정과 부딪힐 수 있다는 점이 오늘날에도 같습니다.', u:4}},
    {id:'y2', name:'척화 선언', desc:'명에 대한 의리를 지키고 청의 요구를 거절한다고 천명한다.', eff:{cr:4, pp:3, df:-3},
     later:[{in:1, eff:{tr:-4, pp:-3, lv:-3}, note:'척화 이후 청군이 쳐들어와 백성의 피해가 컸습니다.'}],
     modern:{name:'가치 외교·동맹 우선 외교', text:'국가가 지켜 온 가치와 기존 동맹을 우선하는 외교와 비슷합니다. 명분은 뚜렷하지만 힘의 차이를 따져 보지 않으면 큰 대가를 치를 수 있습니다.', u:4}},
    {id:'h1', name:'전쟁 대비 특별 세금', desc:'군량과 무기 비용을 위해 임시로 세금을 더 걷는다.', eff:{tr:5, df:2, pp:-4},
     modern:{name:'방위세·전시 특별세', text:'국방 비용을 마련하려고 한시적으로 걷는 방위세(우리나라 1975~1990)와 비슷합니다. 재원은 생기지만 국민 부담이 늘어납니다.', u:3}},
    {id:'i1', name:'실전 경험 있는 무관 발탁', desc:'가문보다 전투 경험과 능력을 보고 장수를 뽑는다.', eff:{df:4, cr:1},
     modern:{name:'능력 중심 인사·전문가 등용', text:'출신보다 전문성과 경력을 기준으로 사람을 쓰는 능력 중심 인사와 비슷합니다.', u:2}},
    {id:'g1', name:'화포·조총 제작', desc:'관청 작업장에서 화포와 조총을 만들어 군에 보급한다.', eff:{df:6, tr:-4, cu:1},
     modern:{name:'방위 산업 육성', text:'무기를 스스로 개발·생산하는 방위 산업 육성과 비슷합니다. 국방력과 기술이 함께 자라지만 큰 비용이 듭니다.', u:4}},
    {id:'k1', name:'피란민 보호·약탈 엄단', desc:'전란 중 약탈을 엄히 다스리고 피란민을 보호한다.', eff:{pp:3, cr:1, tr:-1},
     modern:{name:'재난 시 치안 유지·긴급 구호', text:'전쟁이나 재난 때 질서를 지키고 피해자를 보호하는 긴급 구호 체계와 비슷합니다.', u:1}}
   ],
   combos:[
    {ids:['y1','y2'], eff:{cr:-4, pp:-3}, good:false, note:'화친과 척화를 동시에 외치자 조정이 갈팡질팡하며 신뢰를 잃었습니다.'},
    {ids:['b1','g1'], eff:{df:3}, good:true, note:'산성에 새로 만든 화포를 배치해 방어력이 크게 높아졌습니다.'}
   ],
   real:{ids:['y2','b1'], text:'인조의 조정은 척화론을 택했습니다. 1636년 12월 청 태종이 직접 대군을 이끌고 쳐들어오자(병자호란) 인조는 남한산성으로 피신해 47일간 버텼으나, 결국 삼전도에서 항복하고 청과 군신 관계를 맺었습니다. 소현세자 등 많은 사람이 청에 끌려갔습니다.'}},

  /* 3 ─────────────────────────────── */
  {year:1728, reign:'영조 4년', title:'붕당의 대립과 반란', art:'conflict',
   text:'노론과 소론의 대립이 극에 달한 가운데, 정권에서 밀려난 소론 강경파와 남인 일부가 왕의 정통성을 문제 삼아 청주에서 군사를 일으켰습니다(이인좌의 난). 반란은 경상도와 전라도로 번지고 있습니다.',
   base:{cr:-5, pp:-2},
   policies:[
    {id:'i1', name:'탕평 인사', desc:'노론과 소론의 온건파를 고르게 등용하여 어느 한쪽이 권력을 독차지하지 못하게 한다.', eff:{cr:5, pp:2, cu:-1},
     later:[{in:2, eff:{cr:3}, note:'탕평 인사가 자리 잡으며 정국이 안정되었습니다.'}],
     modern:{name:'협치·통합 인사(연립 정부)', text:'여러 정당이 함께 정부를 구성하거나 반대편 인사도 등용하는 협치와 비슷합니다. 갈등을 줄이지만 결정이 느려질 수 있습니다.', u:1}},
    {id:'i2', name:'한 붕당에 힘 실어 주기', desc:'충성스러운 노론에게 요직을 몰아준다.', eff:{cr:4, pp:-3},
     later:[{in:2, eff:{cr:-6, pp:-2}, note:'밀려난 세력이 반발하며 정국이 다시 흔들렸습니다.'}],
     modern:{name:'승자 독식 정치', text:'선거에서 이긴 쪽이 모든 자리를 차지하는 승자 독식 정치와 비슷합니다. 당장은 결속이 강해지지만 갈등의 골이 깊어집니다.', u:1}},
    {id:'b1', name:'반란군 신속 진압', desc:'관군을 보내 반란을 빨리 진압한다.', eff:{cr:4, df:2, tr:-3},
     modern:{name:'국가 위기 대응 체계', text:'내란이나 테러에 대비한 국가의 위기 대응 체계와 비슷합니다. 다만 공권력은 법의 테두리 안에서 써야 합니다.', u:1}},
    {id:'k1', name:'주동자만 처벌, 연좌 최소화', desc:'가담 정도를 따져 처벌하고 가족에게 죄를 묻지 않는다.', eff:{pp:4, cr:1},
     modern:{name:'연좌제 금지와 책임주의', text:'우리 헌법 제13조 3항은 "자기의 행위가 아닌 친족의 행위로 불이익한 처우를 받지 아니한다"고 하여 연좌제를 금지합니다. 자기 행위에만 책임을 지는 책임주의 원칙입니다.', u:1}},
    {id:'k2', name:'관련 붕당 전체 숙청', desc:'반란에 관련된 붕당 사람들을 모두 조정에서 내쫓고 처벌한다.', eff:{cr:3, pp:-4, cu:-3},
     modern:{name:'정치 보복·과잉 처벌', text:'정치적 반대 세력 전체를 처벌하는 것은 오늘날 법치주의와 비례의 원칙에 어긋나는 정치 보복으로 비판받습니다.', u:1}},
    {id:'y1', name:'탕평비 건립·탕평 교육', desc:'성균관에 탕평의 뜻을 새긴 비석을 세우고 유생에게 가르친다.', eff:{cu:4, cr:2, tr:-2},
     modern:{name:'민주 시민 교육', text:'다양한 의견을 존중하고 대화로 갈등을 푸는 태도를 가르치는 민주 시민 교육과 비슷합니다.', u:1}},
    {id:'h1', name:'반란 지역 세금 감면', desc:'전란 피해 지역의 세금을 깎아 민심을 달랜다.', eff:{pp:4, lv:2, tr:-4},
     modern:{name:'특별 재난 지역 지원', text:'큰 피해를 입은 지역을 특별 재난 지역으로 정해 세금 감면과 복구비를 지원하는 제도와 비슷합니다.', u:2}},
    {id:'g1', name:'궁궐 보수로 위엄 과시', desc:'궁궐을 화려하게 고쳐 왕실의 권위를 보여 준다.', eff:{cr:2, tr:-5, pp:-2},
     modern:{name:'전시성 사업', text:'실질적 효과보다 보여 주기에 치우친 대형 사업과 비슷합니다. 예산 낭비라는 비판을 받기 쉽습니다.', u:3}}
   ],
   combos:[
    {ids:['i1','y1'], eff:{cr:2, cu:2}, good:true, note:'탕평 인사와 탕평 교육이 맞물려 화합의 분위기가 퍼졌습니다.'},
    {ids:['i1','k2'], eff:{cr:-4, pp:-2}, good:false, note:'탕평을 외치면서 한쪽을 숙청하자 아무도 탕평을 믿지 않았습니다.'}
   ],
   real:{ids:['b1','i1','y1'], text:'이인좌의 난은 관군에 의해 한 달 만에 진압되었습니다. 영조는 이 반란을 붕당 정치의 폐해로 보고 탕평책을 더욱 강화하여 노론과 소론의 온건파를 고르게 등용했고, 1742년 성균관 앞에 탕평비를 세웠습니다.'}},

  /* 4 ─────────────────────────────── */
  {year:1750, reign:'영조 26년', title:'군역의 고통', art:'scale',
   text:'양인 남자는 군대에 가는 대신 해마다 군포 2필을 냅니다. 그런데 양반은 군포를 내지 않고, 관리들은 죽은 사람(백골징포)이나 어린아이(황구첨정)에게까지 군포를 매기고 있습니다. 군포를 피해 도망치는 백성이 늘고 있습니다.',
   base:{pp:-5, lv:-3},
   policies:[
    {id:'h1', name:'균역법: 군포 2필 → 1필', desc:'양인이 내는 군포를 절반으로 줄인다.', eff:{pp:7, lv:3, tr:-7},
     modern:{name:'서민 부담 완화(역진성 개선)', text:'소득이 적은 사람일수록 부담이 큰 세금을 줄여 주는 서민 감세와 비슷합니다. 줄어든 세수를 어디서 메울지가 늘 함께 따라오는 문제입니다.', u:2}},
    {id:'h2', name:'결작 부과', desc:'토지 1결당 쌀 2두를 걷어 줄어든 군포를 메운다(지주 부담).', eff:{tr:4, pp:-1, lv:-1},
     modern:{name:'토지 보유세(부동산 보유세)', text:'땅이나 집을 가진 사람에게 매기는 보유세와 비슷합니다. 재산이 많은 사람이 더 부담하게 해 재원을 마련합니다.', u:2}},
    {id:'b1', name:'선무군관포', desc:'군역을 지지 않던 일부 부유한 양인에게 선무군관이라는 칭호를 주고 군포 1필을 걷는다.', eff:{tr:3, pp:1, cr:-1},
     modern:{name:'과세 기반 확대(비과세 감면 축소)', text:'세금을 안 내던 사람이나 분야에 세금을 매겨 세금 내는 사람의 범위를 넓히는 정책과 비슷합니다.', u:3}},
    {id:'b2', name:'양반에게도 군포(호포론)', desc:'신분과 관계없이 집집마다 군포를 걷는다.', eff:{tr:6, pp:3, cr:-6},
     modern:{name:'보편 과세(납세의 의무)', text:'헌법 제38조는 "모든 국민은 법률이 정하는 바에 의하여 납세의 의무를 진다"고 정합니다. 특권층 예외 없이 모두 부담하는 보편 과세입니다. 조선에서는 양반의 반발이 매우 컸습니다.', u:1}},
    {id:'i1', name:'암행어사 파견', desc:'군역 행정의 부정을 몰래 살피고 관리를 처벌한다.', eff:{pp:3, cr:2, tr:-1},
     modern:{name:'공직자 감찰(감사원)', text:'공무원의 부정과 비리를 살피는 감사원의 직무 감찰과 비슷합니다.', u:1}},
    {id:'k1', name:'부당 징수 처벌', desc:'백골징포·황구첨정을 한 수령을 엄히 처벌하는 법을 만든다.', eff:{pp:4, cr:1},
     modern:{name:'부당 징수 금지·행정 구제', text:'법에 없는 세금을 걷지 못하게 하는 조세 법률주의와, 부당한 처분을 바로잡는 행정 심판·소송 제도와 비슷합니다.', u:1}},
    {id:'g1', name:'어염선세 국가 귀속', desc:'왕실 등이 가져가던 어장·염전·선박세를 나라 재정으로 돌린다.', eff:{tr:4, cr:1, lv:-1},
     modern:{name:'공공 자원 사용료·세원 발굴', text:'공공 자원을 쓰는 데 사용료를 받거나 새 세원을 찾아 재정을 마련하는 정책과 비슷합니다.', u:3}},
    {id:'y1', name:'상소·여론 수렴', desc:'군역의 고통을 호소하는 상소를 널리 받는다.', eff:{pp:2, cu:1},
     modern:{name:'국민 청원·국민 신문고', text:'국민이 정부에 직접 의견을 내는 청원 제도(헌법 제26조 청원권)와 비슷합니다.', u:1}}
   ],
   combos:[
    {ids:['h1','h2'], eff:{tr:3}, good:true, note:'결작이 줄어든 군포 수입을 메워 재정이 버텼습니다.'},
    {ids:['h1','g1'], eff:{tr:2}, good:true, note:'어염선세가 균역법의 부족한 재원을 보탰습니다.'},
    {ids:['b2','h2'], eff:{cr:-3}, good:false, note:'양반에게 군포와 결작을 한꺼번에 매기자 양반층의 반발이 폭발했습니다.'}
   ],
   real:{ids:['h1','h2','b1','g1'], text:'1750년 영조는 균역법을 시행하여 군포를 1필로 줄였습니다. 줄어든 수입은 결작(토지 1결당 쌀 2두), 선무군관포, 왕실이 가져가던 어염선세를 나라 재정으로 돌려 메웠습니다. 하나의 정책이 아니라 여러 정책을 묶어 시행한 대표적인 사례입니다. 그러나 결작이 소작농에게 떠넘겨지는 등 한계도 있었습니다.'}},

  /* 5 ─────────────────────────────── */
  {year:1791, reign:'정조 15년', title:'시장과 상업의 성장', art:'market',
   text:'한양에서는 허가받은 시전 상인만 장사할 수 있는 금난전권 때문에 난전 상인이 단속당하고 물건값이 치솟고 있습니다. 한편 왕은 개혁을 이끌 인재와 새 도시를 원합니다.',
   base:{lv:-3, pp:-2},
   policies:[
    {id:'h1', name:'신해통공', desc:'육의전을 뺀 시전 상인의 금난전권을 없애 누구나 장사할 수 있게 한다.', eff:{lv:7, pp:3, tr:-2, cr:-1},
     later:[{in:2, eff:{lv:4, tr:3}, note:'자유로운 상업으로 한양과 지방의 장시가 크게 늘었습니다.'}],
     modern:{name:'규제 완화·독과점 폐지', text:'특정 사업자만 영업하게 하던 규제를 풀어 경쟁을 늘리는 정책, 독과점을 막는 공정거래법과 비슷합니다. 소비자는 이득이지만 기존 사업자는 반발합니다.', u:3}},
    {id:'h2', name:'시전 특권 유지', desc:'시전 상인의 독점을 지키는 대신 세금을 더 받는다.', eff:{tr:4, lv:-3, pp:-2},
     modern:{name:'독점 사업권 허가', text:'정부가 특정 기업에 독점 사업권을 주고 대가를 받는 방식과 비슷합니다. 재정에는 도움이 되지만 가격이 오르고 경쟁이 사라집니다.', u:3}},
    {id:'g1', name:'수원 화성 건설', desc:'수원에 새 성곽 도시를 세우고 상인을 모아 상업 중심지로 키운다.', eff:{cr:4, lv:3, tr:-7, cu:2},
     later:[{in:2, eff:{lv:3, cr:2}, note:'화성이 상업 도시로 자리 잡아 남부 지역 경제의 중심이 되었습니다.'}],
     modern:{name:'신도시·국가 균형 발전 정책', text:'수도에 몰린 기능을 나누고 새 성장 거점을 만드는 신도시 건설, 행정 중심 복합 도시(세종시) 같은 균형 발전 정책과 비슷합니다.', u:5}},
    {id:'g2', name:'광산 민간 개발 허용', desc:'민간이 광산을 개발하게 하고 세금을 받는다(설점수세).', eff:{tr:4, lv:3, pp:-1},
     modern:{name:'민간 투자 유치·민영화', text:'정부가 하던 사업을 민간에 맡기고 세금이나 사용료를 받는 민간 투자 유치와 비슷합니다.', u:3}},
    {id:'i1', name:'서얼 등용', desc:'첩의 자식이라 벼슬길이 막혔던 서얼 출신 학자를 규장각 검서관으로 뽑는다.', eff:{cu:5, cr:2, pp:1},
     modern:{name:'차별 금지·기회 균등', text:'출신이나 신분 때문에 기회를 막지 않는 차별 금지와, 불리한 처지의 사람에게 기회를 넓혀 주는 적극적 우대 조치와 비슷합니다.', u:2}},
    {id:'y1', name:'규장각 편찬 사업', desc:'규장각에서 학문을 연구하고 실용적인 책을 펴낸다.', eff:{cu:6, tr:-3},
     modern:{name:'국가 연구 개발(R&D) 지원', text:'정부가 연구 기관과 학자를 지원해 지식과 기술을 쌓는 국가 R&D 투자와 비슷합니다.', u:3}},
    {id:'b1', name:'장용영 설치', desc:'왕이 직접 거느리는 친위 부대를 만든다.', eff:{df:4, cr:4, tr:-5},
     modern:{name:'군 통수권 강화', text:'최고 지도자가 군을 직접 지휘하는 체계를 강화하는 것과 비슷합니다. 개혁 추진력은 높아지지만 권력 집중을 견제할 장치가 필요합니다.', u:1}},
    {id:'k1', name:'격쟁·상언 허용', desc:'백성이 왕의 행차 길에서 징을 치거나 글을 올려 억울함을 직접 호소하게 한다.', eff:{pp:4, cr:1},
     modern:{name:'국민 청원·옴부즈만', text:'국민이 권리 침해를 직접 호소하는 청원 제도와 국민 권익 위원회(옴부즈만)와 비슷합니다.', u:1}}
   ],
   combos:[
    {ids:['h1','g1'], eff:{lv:3}, good:true, note:'자유로운 상업과 새 도시가 맞물려 화성에 상인이 몰려들었습니다.'},
    {ids:['h1','h2'], eff:{lv:-3, pp:-2}, good:false, note:'특권을 없애면서 동시에 지켜 주겠다니 상인들이 혼란에 빠졌습니다.'},
    {ids:['i1','y1'], eff:{cu:3}, good:true, note:'서얼 출신 검서관들이 규장각 편찬 사업을 이끌었습니다.'}
   ],
   real:{ids:['h1','g1','i1','b1','k1'], text:'1791년 정조는 신해통공으로 육의전을 제외한 시전의 금난전권을 없앴습니다. 또 박제가·유득공 등 서얼 출신을 규장각 검서관으로 등용하고(1779), 친위 부대 장용영을 두었으며(1793), 수원 화성을 세웠습니다(1794~1796). 격쟁과 상언을 널리 허용해 백성의 목소리를 직접 들었습니다.'}},

  /* 6 ─────────────────────────────── */
  {year:1862, reign:'철종 13년', title:'삼정의 문란과 농민 봉기', art:'people',
   text:'세도 가문이 권력을 독차지하면서 토지세(전정)·군포(군정)·환곡(환정)의 삼정이 크게 어지러워졌습니다. 진주에서는 탐관오리의 수탈을 견디지 못한 농민들이 들고일어났고, 봉기는 삼남 지방 70여 곳으로 번지고 있습니다.',
   base:{pp:-6, lv:-4, cr:-2},
   policies:[
    {id:'h1', name:'삼정이정청 설치', desc:'삼정의 폐단을 바로잡는 임시 기구를 만들고 환곡을 토지세로 바꾸는 개혁안을 낸다.', eff:{pp:5, lv:3, tr:-3, cr:-1},
     modern:{name:'제도 개혁 특별 위원회', text:'오래된 문제를 고치려고 만드는 특별 위원회와 비슷합니다. 개혁안이 실제로 실행되고 유지되는지가 핵심입니다.', u:1}},
    {id:'h2', name:'환곡 빚 탕감', desc:'백성이 진 환곡 빚과 이자를 없애 준다.', eff:{pp:5, lv:3, tr:-6},
     modern:{name:'채무 조정·부채 탕감', text:'갚기 어려운 빚을 줄여 주거나 없애 주는 채무 조정 제도(신용 회복 지원)와 비슷합니다. 당장 숨통이 트이지만 재정 부담과 형평성 논란이 따릅니다.', u:2}},
    {id:'i1', name:'탐관오리 파면', desc:'수탈한 수령과 아전을 파면하고 암행어사를 보낸다.', eff:{pp:5, cr:2},
     modern:{name:'공직 부패 방지', text:'공직자의 부패를 막는 청탁금지법, 공직자 재산 공개 같은 부패 방지 제도와 비슷합니다.', u:1}},
    {id:'i2', name:'세도 가문 인사 독점 타파', desc:'특정 가문이 독차지한 요직을 능력 있는 인재에게 고루 나눈다.', eff:{cr:4, pp:2, cu:1, tr:-1},
     modern:{name:'공정 채용·정실 인사 금지', text:'연줄이 아닌 능력과 공정한 절차로 사람을 뽑는 공정 채용(블라인드 채용)과 비슷합니다.', u:2}},
    {id:'b1', name:'봉기 무력 진압', desc:'군대를 보내 봉기를 강제로 진압한다.', eff:{cr:3, pp:-6, df:1},
     modern:{name:'공권력의 강경 대응', text:'시위에 공권력으로 강경 대응하는 것과 비슷합니다. 질서는 회복되지만 원인을 해결하지 않으면 갈등이 되풀이됩니다. 오늘날에는 집회의 자유(헌법 제21조)와의 균형이 중요합니다.', u:1}},
    {id:'k1', name:'안핵사 파견·진상 조사', desc:'관리를 보내 봉기의 원인을 조사하고 주동자만 처벌한다.', eff:{pp:4, cr:1},
     modern:{name:'진상 조사 위원회', text:'사건의 원인과 책임을 밝히는 진상 조사 위원회와 비슷합니다.', u:1}},
    {id:'g1', name:'저수지·제방 정비', desc:'흉년에 대비해 저수지와 제방을 고친다.', eff:{lv:5, tr:-4},
     later:[{in:1, eff:{lv:3}, note:'정비한 저수지 덕분에 가뭄 피해가 줄었습니다.'}],
     modern:{name:'재해 예방 인프라·기후 적응 정책', text:'홍수와 가뭄에 대비해 댐·제방을 정비하는 재해 예방 투자, 기후 변화 적응 정책과 비슷합니다.', u:5}},
    {id:'y1', name:'향약으로 마을 질서 회복', desc:'마을 자치 규약인 향약을 되살려 서로 돕게 한다.', eff:{pp:2, cu:2, cr:1},
     modern:{name:'지역 공동체·주민 자치', text:'주민이 스스로 마을 일을 정하고 서로 돕는 주민 자치회, 지역 공동체 활동과 비슷합니다.', u:1}}
   ],
   combos:[
    {ids:['h1','i1'], eff:{pp:3, cr:1}, good:true, note:'탐관오리를 몰아내고 제도까지 고치자 백성이 개혁을 믿기 시작했습니다.'},
    {ids:['b1','k1'], eff:{pp:-2}, good:false, note:'조사를 한다면서 동시에 무력으로 짓밟자 조사 결과를 아무도 믿지 않았습니다.'}
   ],
   real:{ids:['k1','h1','b1'], text:'1862년 진주 농민 봉기를 시작으로 삼남 각지에서 봉기가 일어났습니다(임술 농민 봉기). 조정은 박규수를 안핵사로 보내 원인을 조사하고 삼정이정청을 설치해 개혁안을 내놓았지만, 석 달 만에 철회하고 봉기는 무력으로 진압했습니다. 근본 문제는 해결되지 않았습니다.'}},

  /* 7 ─────────────────────────────── */
  {year:1866, reign:'고종 3년', title:'서양 함대의 침입', art:'ship', war:true,
   text:'프랑스 함대가 프랑스 선교사 처형을 구실로 강화도를 침략했습니다. 서양 여러 나라가 통상을 요구하는 가운데, 경복궁을 다시 짓느라 재정은 바닥나 있습니다. 흥선 대원군이 국정을 이끌고 있습니다.',
   base:{df:-3, cr:-2, tr:-2},
   policies:[
    {id:'b1', name:'강화도 방어 강화', desc:'강화도 해안에 포대를 쌓고 군사를 보내 맞서 싸운다.', eff:{df:7, tr:-5, cr:2},
     modern:{name:'해안 방어·영토 수호', text:'해안 경비와 방어 시설을 강화해 영토와 주권을 지키는 국방 정책과 비슷합니다.', u:4}},
    {id:'y1', name:'통상 거부·척화비 건립', desc:'서양과의 통상을 거부하고 그 뜻을 전국에 비석으로 새긴다.', eff:{cr:5, pp:2, cu:-2},
     later:[{in:1, eff:{cu:-3, lv:-2}, note:'문을 닫은 사이 이웃 나라와의 기술 격차가 커졌습니다.'}],
     modern:{name:'보호 무역·쇄국 정책', text:'외국 상품과 자본을 막는 보호 무역 정책과 비슷합니다. 국내 질서는 지키지만 새로운 기술과 교역의 기회를 놓칠 수 있습니다.', u:4}},
    {id:'y2', name:'제한적 통상·서양 기술 연구', desc:'일부 항구에서 교역을 허락하고 서양의 기술을 배운다.', eff:{lv:4, cu:5, cr:-4, pp:-3},
     modern:{name:'자유 무역 협정(FTA)·개방 경제', text:'교역의 문을 열어 기술과 상품을 주고받는 자유 무역 협정과 비슷합니다. 경제는 성장하지만 피해를 보는 산업과 계층이 생겨 반발이 따릅니다.', u:4}},
    {id:'h1', name:'당백전 발행', desc:'액면가가 상평통보의 100배인 동전을 찍어 재원을 마련한다.', eff:{tr:8, lv:-5, pp:-4},
     modern:{name:'통화량 확대와 인플레이션', text:'정부가 돈을 많이 찍어 재정을 메우면 물가가 치솟는 인플레이션이 일어납니다. 당백전 발행 뒤 쌀값이 몇 배로 뛰었습니다. 오늘날 중앙은행이 독립적으로 통화량을 관리하는 이유입니다.', u:3}},
    {id:'h2', name:'호포제', desc:'양반도 상민처럼 집집마다 군포를 내게 한다.', eff:{tr:5, pp:3, cr:-2},
     modern:{name:'보편 과세(납세의 의무)', text:'신분이나 지위와 관계없이 모두가 세금을 내는 보편 과세와 비슷합니다(헌법 제38조 납세의 의무).', u:2}},
    {id:'g1', name:'신식 무기 연구', desc:'서양 함선을 막을 수뢰포와 대포를 연구해 만든다.', eff:{df:4, cu:2, tr:-3},
     modern:{name:'국방 과학 기술 연구', text:'국방 과학 연구소처럼 새로운 무기 기술을 연구·개발하는 정책과 비슷합니다.', u:4}},
    {id:'i1', name:'서원 정리', desc:'면세 혜택을 누리며 붕당의 근거지가 된 서원을 47개만 남기고 정리한다.', eff:{cr:4, tr:3, cu:-2, pp:1},
     modern:{name:'기득권 특혜 정리', text:'특정 집단이 누리던 세금 면제와 특혜를 없애는 개혁과 비슷합니다. 재정은 좋아지지만 기득권층의 반발이 큽니다.', u:2}},
    {id:'k1', name:'천주교 탄압', desc:'서양 세력과 연결된다며 천주교 신자를 처벌한다.', eff:{cr:3, pp:-2, cu:-3},
     modern:{name:'종교의 자유 침해', text:'오늘날 헌법 제20조는 종교의 자유를 보장합니다. 국가가 특정 종교를 이유로 처벌하는 것은 기본권 침해에 해당합니다. 당시와 오늘날의 인권 기준을 비교해 볼 수 있습니다.', u:1}}
   ],
   combos:[
    {ids:['y1','y2'], eff:{cr:-4, lv:-2}, good:false, note:'통상을 거부하면서 동시에 허락하자 외교 방침이 무너졌습니다.'},
    {ids:['b1','g1'], eff:{df:3}, good:true, note:'새로 만든 대포를 강화도 포대에 배치해 방어력이 크게 높아졌습니다.'},
    {ids:['h1','h2'], eff:{pp:-2}, good:false, note:'돈을 찍어 내면서 세금까지 늘리자 백성의 원성이 높아졌습니다.'}
   ],
   real:{ids:['k1','b1','h1','y1'], text:'1866년 흥선 대원군은 천주교 신자와 프랑스 선교사를 처형했고(병인박해), 이를 구실로 쳐들어온 프랑스 함대를 강화도에서 물리쳤습니다(병인양요). 경복궁 중건 비용을 위해 당백전을 발행해 물가가 크게 올랐습니다. 1871년 신미양요 뒤에는 전국에 척화비를 세웠고, 같은 해 호포제 시행과 서원 정리도 단행했습니다.'}}
  ]
};

/* 조선 국정 회의(의정부판) — 게임 규칙 */
const SKEYS = ['tr','pp','cr','df','lv','cu'];

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function addTo(d, e, k){ for(const s in e) d[s] = (d[s]||0) + e[s]*(k==null?1:k); return d; }
/* 받침에 따라 조사 고르기: josa('호조판서','은는') → '호조판서는' */
function josa(w, pair){ const c=String(w).charCodeAt(String(w).length-1); const has=c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28>0; return w+(has?pair.charAt(0):pair.charAt(1)); }
function roleById(id){ return ROLES.filter(r => r.id === id)[0]; }
function deptOf(pid){ return roleById(String(pid).charAt(0)); }
function policyOf(turn, pid){ return turn.policies.filter(p => p.id === pid)[0]; }

function initGame(){
  return {t:0, st:Object.assign({}, ERA.start), hist:[Object.assign({}, ERA.start)], pending:[], crises:[], log:[], done:false};
}
function applyStats(st, d){ for(const k of SKEYS) st[k] = clamp(Math.round((st[k] + (d[k]||0))*10)/10, 0, 100); }

/* 정책 묶음의 즉시 효과(조합 효과 제외) — 화면 미리보기용 */
function packEffect(turn, ids){
  const d = {};
  ids.forEach(id => { const p = policyOf(turn, id); if(p) addTo(d, p.eff); });
  return d;
}

/* 한 사건 처리. pack = {adopt:[{id, by, role, why, modern}], why} 또는 null(합의안 미제출) */
function playTurn(g, pack){
  const turn = ERA.turns[g.t];
  const before = Object.assign({}, g.st), notes = [], d = {};
  const adopt = pack ? pack.adopt.filter(a => policyOf(turn, a.id)).slice(0, MAX_ADOPT) : [];
  const ids = adopt.map(a => a.id);
  addTo(d, turn.base);
  addTo(d, {tr: ERA.income});
  if(!adopt.length){ addTo(d, {cr:-4, pp:-3}); notes.push({type:'crisis', text:'의정부가 합의안을 올리지 못해 위기를 방치했습니다.'}); }
  addTo(d, packEffect(turn, ids));
  (turn.combos || []).forEach(c => { if(c.ids.every(x => ids.indexOf(x) >= 0)){ addTo(d, c.eff); notes.push({type: c.good ? 'combo' : 'clash', text: c.note}); } });
  // 지연 효과 도착
  g.pending = g.pending.filter(p => { if(p.due === g.t){ addTo(d, p.eff); notes.push({type:'later', text:p.note}); return false; } return true; });
  // 전쟁: 쌓아 둔 국방력이 피해를 좌우
  if(turn.war){
    const df = g.st.df + (d.df || 0) * 0.5;
    if(df < 40){ addTo(d, {pp:-5, tr:-5, cr:-3, lv:-3}); notes.push({type:'war', text:'국방력이 약해 전쟁 피해가 컸습니다.'}); }
    else if(df >= 60){ addTo(d, {cr:3, pp:2}); notes.push({type:'war', text:'튼튼한 국방 덕분에 피해를 줄였습니다.'}); }
    else notes.push({type:'war', text:'전쟁을 겨우 막아 냈지만 피해가 적지 않았습니다.'});
  }
  applyStats(g.st, d);
  adopt.forEach(a => { const p = policyOf(turn, a.id); (p.later || []).forEach(l => g.pending.push({due:g.t + l.in, eff:l.eff, note:l.note})); });
  // 위기 판정
  const crisisNow = [];
  if(g.st.pp < 20){ applyStats(g.st, {cr:-8, tr:-6}); crisisNow.push('민란 발생'); }
  if(g.st.cr < 20){ applyStats(g.st, {pp:-5, df:-3}); crisisNow.push('정변 위기'); }
  if(g.st.tr < 10){ applyStats(g.st, {lv:-6, pp:-5}); crisisNow.push('재정 파탄'); }
  if(g.st.df < 15){ applyStats(g.st, {cr:-4, pp:-3}); crisisNow.push('국경 붕괴'); }
  crisisNow.forEach(c => { g.crises.push({year:turn.year, name:c}); notes.push({type:'crisis', text:c + '! 나라가 흔들립니다.'}); });

  const delta = {}; for(const k of SKEYS) delta[k] = Math.round((g.st[k] - before[k])*10)/10;
  const log = {t:g.t, year:turn.year, title:turn.title, adopt:adopt, why:pack ? String(pack.why || '') : '', delta:delta, notes:notes,
               matches: ids.filter(x => turn.real.ids.indexOf(x) >= 0).length};
  g.log.push(log);
  g.t++;
  g.hist.push(Object.assign({}, g.st));
  if(g.t >= ERA.turns.length) finishGame(g);
  return log;
}

function finishGame(g){
  const late = {}, notes = [];
  g.pending.forEach(p => { addTo(late, p.eff); notes.push(p.note); });
  g.pending = [];
  applyStats(g.st, late);
  g.lateNotes = notes;
  g.done = true;
  g.hist[g.hist.length-1] = Object.assign({}, g.st);
}

/* 점수: 평균 60% + 가장 낮은 지표 40% − 위기 */
function scoreOf(g){
  const v = SKEYS.map(k => g.st[k]);
  const avg = v.reduce((a,b) => a+b, 0) / v.length, min = Math.min.apply(null, v);
  return Math.round(avg*0.6 + min*0.4 - 5*g.crises.length);
}
function realMatches(g){ return g.log.reduce((a, l) => a + (l.matches || 0), 0); }

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
return { doGet: doGet, doPost: doPost, HEADS: { '기록': LOG_HEAD, '제안': PROP_HEAD, '제출': FINAL_HEAD } };
};
