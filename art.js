/* 조선 국정 회의 — 그래픽 (모두 인라인 SVG) */
const INK='#2a211a', RED='#b23a2c', JADE='#2f6b5e', GOLD='#c99a2e', NAVY='#24384c', CREAM='#f6edd7';
function cl(x,a,b){ return Math.max(a,Math.min(b,x)); }
function mix(c1,c2,t){ const a=c1.match(/\w\w/g).map(h=>parseInt(h,16)), b=c2.match(/\w\w/g).map(h=>parseInt(h,16));
  return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*cl(t,0,1)).toString(16).padStart(2,'0')).join(''); }

/* 일월오봉도 배너 */
function bannerSVG(h){
  h=h||200;
  const peaks=[[60,150,250],[250,95,420],[600,40,790],[950,95,1120],[1140,150,1300]];
  let s=`<svg viewBox="0 0 1200 ${h}" preserveAspectRatio="xMidYMid slice" style="width:100%;height:${h}px;display:block" aria-hidden="true">
  <defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f3b4d"/><stop offset="1" stop-color="#2e5a5e"/></linearGradient>
  <linearGradient id="bpk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a83"/><stop offset="1" stop-color="#1f5249"/></linearGradient></defs>
  <rect width="1200" height="${h}" fill="url(#bsky)"/>
  <circle cx="1020" cy="${h*0.28}" r="${h*0.13}" fill="${RED}"/><circle cx="180" cy="${h*0.28}" r="${h*0.13}" fill="#f3efe2"/>`;
  peaks.forEach(([x1,top,x2])=>{ const mx=(x1+x2)/2-20, y=h*top/220;
    s+=`<path d="M${x1-60} ${h} Q${mx-40} ${y+40} ${mx+20} ${y} Q${mx+80} ${y+40} ${x2+40} ${h} Z" fill="url(#bpk)" stroke="#d8e8d6" stroke-width="3"/>`;
    for(let k=1;k<4;k++) s+=`<path d="M${mx+20-k*28} ${y+k*26} Q${mx+20} ${y+k*18} ${mx+20+k*28} ${y+k*26}" fill="none" stroke="#d8e8d6" stroke-width="1.6" opacity=".7"/>`; });
  s+=`<path d="M590 ${h*0.42} q10 ${h*0.2} 0 ${h*0.4}" stroke="#e9f2ee" stroke-width="6" fill="none" opacity=".8"/>`;
  for(let i=0;i<14;i++){ const x=i*92-20; s+=`<path d="M${x} ${h-12} q23 -22 46 0 q23 -22 46 0" fill="none" stroke="#e9f2ee" stroke-width="3" opacity=".75"/>`; }
  [[95,0.55],[1105,0.55]].forEach(([x,f])=>{ const y=h*f;
    s+=`<path d="M${x} ${h} L${x+4} ${y}" stroke="#8e2f22" stroke-width="9"/>`;
    [[0,0],[-28,22],[26,18],[-14,42],[18,46]].forEach(([dx,dy])=>{ s+=`<ellipse cx="${x+dx}" cy="${y+dy}" rx="34" ry="12" fill="#2d6a4f" stroke="#d8e8d6" stroke-width="1.5"/>`; }); });
  return s+'</svg>';
}

/* 지표에 따라 바뀌는 나라 풍경 */
function kingdomSVG(st, opt){
  opt=opt||{};
  const tr=cl(st.tr,0,100), pp=cl(st.pp,0,100), cr=cl(st.cr,0,100), df=cl(st.df,0,100), lv=cl(st.lv,0,100), cu=cl(st.cu,0,100);
  const id='k'+Math.random().toString(36).slice(2,7);
  const skyTop = pp>=50 ? mix('b9d6df','d9ecf0',(pp-50)/50) : mix('4a4f57','b9d6df',pp/50);
  const skyBot = pp>=50 ? '#f6ecd6' : mix('8c8a84','f6ecd6',pp/50);
  let s=`<svg viewBox="0 0 320 190" class="kingdom" role="img" aria-label="나라 풍경: 국고 ${Math.round(tr)}, 민심 ${Math.round(pp)}, 왕권 ${Math.round(cr)}, 국방 ${Math.round(df)}, 민생 ${Math.round(lv)}, 문화 ${Math.round(cu)}">
  <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBot}"/></linearGradient></defs>
  <rect width="320" height="190" fill="url(#${id}s)"/>`;
  // 해 또는 먹구름
  if(pp>=35) s+=`<circle cx="270" cy="34" r="16" fill="${RED}" opacity="${0.5+pp/200}"/>`;
  else s+=`<g fill="#5d5f66" opacity=".85"><ellipse cx="250" cy="30" rx="34" ry="12"/><ellipse cx="275" cy="38" rx="28" ry="10"/><ellipse cx="80" cy="26" rx="30" ry="10"/></g>`;
  // 산
  s+=`<path d="M-10 120 Q40 50 80 70 Q120 30 160 64 Q200 26 240 66 Q280 46 330 112 L330 190 L-10 190Z" fill="#5f9a86" opacity=".55"/>
  <path d="M-10 130 Q60 78 110 96 Q160 70 210 98 Q260 80 330 126 L330 190 L-10 190Z" fill="#3f7a69" opacity=".7"/>`;
  // 궁궐(왕권)
  const sc=0.75+cr/250, px=160, py=112;
  s+=`<g transform="translate(${px} ${py}) scale(${sc})">
    <rect x="-46" y="-6" width="92" height="12" fill="#cfc3a6" stroke="${INK}" stroke-width="1"/>
    ${[-34,-17,0,17,34].map(x=>`<rect x="${x-3}" y="-34" width="6" height="28" fill="${RED}" stroke="${INK}" stroke-width=".8"/>`).join('')}
    <rect x="-40" y="-40" width="80" height="7" fill="${JADE}" stroke="${INK}" stroke-width=".8"/>
    <path d="M-62 -38 Q-50 -42 -40 -52 L40 -52 Q50 -42 62 -38 Q40 -44 0 -44 Q-40 -44 -62 -38Z" fill="#3a3230" stroke="${INK}" stroke-width="1" ${cr<25?'transform="rotate(-4)"':''}/>
    <path d="M-40 -52 Q0 -60 40 -52" fill="none" stroke="#3a3230" stroke-width="3"/>
    ${cr<25?'<path d="M-10 -50 l6 8 -5 6 7 8" stroke="#e9e1cf" stroke-width="1.2" fill="none"/>':''}
    ${Array.from({length:Math.round(cr/25)},(_,i)=>`<g transform="translate(${-30+i*20} -62)"><line x1="0" y1="0" x2="0" y2="-16" stroke="${INK}" stroke-width="1"/><path d="M0 -16 L12 -12 L0 -8Z" fill="${i%2?NAVY:GOLD}"/></g>`).join('')}
  </g>`;
  // 곳간(국고)
  s+=`<g transform="translate(14 96)"><rect x="0" y="16" width="56" height="34" fill="#c9a774" stroke="${INK}" stroke-width="1"/><path d="M-6 18 L28 0 L62 18Z" fill="#6b4a2b" stroke="${INK}" stroke-width="1"/>
    <rect x="22" y="30" width="12" height="20" fill="#5a3e24"/>`;
  const sacks=Math.round(tr/10);
  for(let i=0;i<sacks;i++){ const row=Math.floor(i/4), col=i%4; s+=`<ellipse cx="${66+col*11+row*5}" cy="${46-row*8}" rx="6.5" ry="5" fill="#efe1b8" stroke="${INK}" stroke-width=".8"/>`; }
  if(tr<15) s+=`<text x="28" y="66" text-anchor="middle" font-size="9" fill="${RED}" font-weight="700">텅 빈 곳간</text>`;
  s+=`</g>`;
  // 문화(서고·책)
  const books=Math.round(cu/12);
  s+=`<g transform="translate(250 100)"><path d="M-4 20 L22 4 L48 20Z" fill="${JADE}" stroke="${INK}" stroke-width="1"/><rect x="2" y="20" width="40" height="24" fill="#e8dcc0" stroke="${INK}" stroke-width="1"/>`;
  for(let i=0;i<books;i++) s+=`<rect x="${6+(i%2)*2}" y="${40-i*4}" width="30" height="3.6" fill="${['#2f5d73','#a8402f','#c99a2e','#3f7a69'][i%4]}" stroke="${INK}" stroke-width=".4"/>`;
  s+=`</g>`;
  // 성곽(국방)
  const wh=6+df*0.2, wy=150-wh;
  s+=`<g><rect x="0" y="${wy}" width="320" height="${wh}" fill="#b9ab8c" stroke="${INK}" stroke-width="1"/>`;
  for(let x=4;x<320;x+=14){ if(df<20 && x>130 && x<170) continue; s+=`<rect x="${x}" y="${wy-5}" width="8" height="5" fill="#b9ab8c" stroke="${INK}" stroke-width=".8"/>`; }
  for(let x=10;x<320;x+=24) s+=`<line x1="${x}" y1="${wy+2}" x2="${x}" y2="150" stroke="#8f8065" stroke-width=".6"/>`;
  if(df<20) s+=`<rect x="130" y="${wy-6}" width="40" height="${wh+6}" fill="#a39070" opacity=".9"/><path d="M132 ${wy+2} l8 -6 6 8 10 -9 8 7" stroke="${INK}" fill="none"/>`;
  s+=`<path d="M146 150 v-${Math.min(wh,18)} a14 12 0 0 1 28 0 v${Math.min(wh,18)}Z" fill="#4a3a2a"/>`;
  for(let i=0;i<Math.round(df/20);i++){ const x=30+i*62; s+=`<g transform="translate(${x} ${wy-5})"><line x1="0" y1="0" x2="0" y2="-18" stroke="${INK}"/><path d="M0 -18 L14 -14 L0 -10Z" fill="${RED}"/></g>`; }
  s+=`</g>`;
  // 논밭(민생)
  const field = lv>=40 ? mix('6f9b4c','d6b04a',(lv-40)/60) : mix('9a8466','6f9b4c',lv/40);
  s+=`<rect x="0" y="150" width="320" height="40" fill="${field}"/>`;
  for(let i=0;i<7;i++) s+=`<path d="M0 ${156+i*5} Q160 ${152+i*5} 320 ${156+i*5}" stroke="${INK}" stroke-width=".4" opacity=".35" fill="none"/>`;
  if(lv>=55) for(let x=8;x<320;x+=11) s+=`<path d="M${x} 160 q2 -6 5 -8" stroke="#8a6b1d" stroke-width="1" fill="none"/>`;
  // 초가(민생)
  const huts=1+Math.round(lv/25);
  for(let i=0;i<huts;i++){ const x=206+i*24, y=170; s+=`<g transform="translate(${x} ${y})"><rect x="-8" y="-2" width="16" height="10" fill="#e3d2a8" stroke="${INK}" stroke-width=".7"/><path d="M-11 -1 Q0 -12 11 -1Z" fill="#b8954f" stroke="${INK}" stroke-width=".7"/></g>`; }
  // 백성(민심)
  const mood = pp>=55?'smile':pp>=30?'flat':'frown';
  [[30,176],[54,178],[78,175]].forEach(([x,y],i)=>{
    s+=`<g transform="translate(${x} ${y})"><path d="M-7 12 L-5 0 L5 0 L7 12Z" fill="${['#f1ead8','#d7c9ad','#efe6cf'][i]}" stroke="${INK}" stroke-width=".8"/><circle cx="0" cy="-5" r="5.5" fill="#f2d7b6" stroke="${INK}" stroke-width=".8"/>
      <circle cx="-2" cy="-6" r=".8" fill="${INK}"/><circle cx="2" cy="-6" r=".8" fill="${INK}"/>
      ${mood==='smile'?'<path d="M-2.4 -3.4 Q0 -1.2 2.4 -3.4" stroke="'+INK+'" stroke-width=".8" fill="none"/>':mood==='flat'?'<path d="M-2 -2.8 H2" stroke="'+INK+'" stroke-width=".8"/>':'<path d="M-2.4 -2 Q0 -4 2.4 -2" stroke="'+INK+'" stroke-width=".8" fill="none"/>'}
      ${pp<20?`<line x1="7" y1="2" x2="10" y2="-12" stroke="#6b4a2b" stroke-width="1.4"/><path d="M10 -12 q-3 -5 0 -9 q3 4 0 9" fill="#e8742c"/>`:''}</g>`; });
  if(opt.crisis) s+=`<g opacity=".55"><ellipse cx="160" cy="70" rx="40" ry="16" fill="#555"/><ellipse cx="185" cy="52" rx="28" ry="12" fill="#666"/></g>`;
  return s+'</svg>';
}

/* 사건 그림 */
function eventArt(key){
  const W='<svg viewBox="0 0 160 120" class="evart" aria-hidden="true"><rect width="160" height="120" rx="8" fill="#f3e9d2"/>';
  const wave=(y,c)=>Array.from({length:6},(_,i)=>`<path d="M${i*30-10} ${y} q7.5 -8 15 0 q7.5 -8 15 0" fill="none" stroke="${c||NAVY}" stroke-width="2"/>`).join('');
  const A={
    ship:`<circle cx="128" cy="28" r="12" fill="${RED}"/>${wave(96)}${wave(106,JADE)}<path d="M38 82 L122 82 L110 96 L50 96Z" fill="#6b4a2b" stroke="${INK}" stroke-width="1.5"/><line x1="80" y1="82" x2="80" y2="26" stroke="${INK}" stroke-width="2"/><path d="M82 30 L118 74 L82 74Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.5"/><path d="M78 34 L50 72 L78 72Z" fill="#e2d4b0" stroke="${INK}" stroke-width="1.5"/>`,
    books:`<rect x="30" y="78" width="70" height="12" fill="${NAVY}" stroke="${INK}"/><rect x="36" y="66" width="62" height="12" fill="${RED}" stroke="${INK}"/><rect x="32" y="54" width="66" height="12" fill="${JADE}" stroke="${INK}"/><rect x="38" y="42" width="58" height="12" fill="${GOLD}" stroke="${INK}"/>${[44,56,68,80].map(y=>`<line x1="40" y1="${y+6}" x2="90" y2="${y+6}" stroke="#f3e9d2" stroke-width="1" opacity=".6"/>`).join('')}<rect x="108" y="34" width="14" height="60" rx="7" fill="${CREAM}" stroke="${INK}" stroke-width="1.5"/><path d="M115 40 v48" stroke="${INK}" stroke-dasharray="3 4"/>`,
    rice:`${[46,62,78,94,110].map((x,i)=>`<path d="M${x} 100 Q${x-4} 60 ${x+10} 30" stroke="#8a6b1d" stroke-width="2" fill="none"/>${[0,1,2,3,4].map(k=>`<ellipse cx="${x+3+k*1.6}" cy="${36+k*9}" rx="3" ry="5" fill="${GOLD}" transform="rotate(25 ${x+3+k*1.6} ${36+k*9})"/>`).join('')}`).join('')}<path d="M30 100 H130" stroke="${INK}" stroke-width="2"/><ellipse cx="128" cy="96" rx="14" ry="10" fill="#efe1b8" stroke="${INK}" stroke-width="1.5"/><ellipse cx="32" cy="96" rx="14" ry="10" fill="#efe1b8" stroke="${INK}" stroke-width="1.5"/>`,
    scale:`<line x1="80" y1="24" x2="80" y2="96" stroke="${INK}" stroke-width="3"/><path d="M60 100 H100" stroke="${INK}" stroke-width="5"/><line x1="36" y1="34" x2="124" y2="30" stroke="${INK}" stroke-width="3"/><path d="M36 34 l-14 32 h28Z M124 30 l-14 30 h28Z" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M20 66 q16 12 32 0Z" fill="${GOLD}" stroke="${INK}"/><path d="M108 60 q16 12 32 0Z" fill="#efe1b8" stroke="${INK}"/><circle cx="80" cy="24" r="5" fill="${RED}"/>`,
    fort:`<path d="M12 98 V58 H148 V98Z" fill="#c4b594" stroke="${INK}" stroke-width="1.5"/>${Array.from({length:10},(_,i)=>`<rect x="${14+i*14}" y="50" width="9" height="8" fill="#c4b594" stroke="${INK}"/>`).join('')}<path d="M62 98 V76 a18 16 0 0 1 36 0 V98Z" fill="#4a3a2a"/><path d="M56 58 L80 34 L104 58Z" fill="#3a3230" stroke="${INK}"/>${[30,130].map(x=>`<line x1="${x}" y1="50" x2="${x}" y2="20" stroke="${INK}" stroke-width="1.5"/><path d="M${x} 20 l18 5 -18 5Z" fill="${RED}"/>`).join('')}`,
    gauge:`${[30,46,118,134,52,124].map((x,i)=>`<path d="M${x} ${14+i*7} q-3 7 0 10 q3 -3 0 -10" fill="#5b8fb0"/>`).join('')}<rect x="54" y="78" width="52" height="22" fill="#bdb29a" stroke="${INK}" stroke-width="1.5"/><rect x="66" y="34" width="28" height="44" fill="#7a8a96" stroke="${INK}" stroke-width="1.5"/><ellipse cx="80" cy="34" rx="14" ry="4" fill="#5d6c77" stroke="${INK}"/>${[46,58,70].map(y=>`<line x1="66" y1="${y}" x2="94" y2="${y}" stroke="${INK}" stroke-width="1"/>`).join('')}`,
    hangul:`<text x="22" y="72" font-size="44" font-family="serif" font-weight="800" fill="${NAVY}">ㄱ</text><text x="62" y="62" font-size="40" font-family="serif" font-weight="800" fill="${RED}">ㅎ</text><text x="100" y="80" font-size="40" font-family="serif" font-weight="800" fill="${JADE}">ㄴ</text><circle cx="58" cy="94" r="5" fill="${INK}"/><line x1="96" y1="102" x2="140" y2="20" stroke="#6b4a2b" stroke-width="5"/><path d="M96 102 l-6 12 8 -6Z" fill="${INK}"/>`,
    conflict:`<g transform="translate(46 58)"><ellipse cx="0" cy="-16" rx="22" ry="4" fill="${INK}"/><rect x="-9" y="-30" width="18" height="15" rx="3" fill="${INK}"/><circle cx="0" cy="0" r="12" fill="#f2d7b6" stroke="${INK}"/><path d="M-14 14 L-18 46 H18 L14 14Z" fill="${NAVY}"/></g><g transform="translate(114 58)"><ellipse cx="0" cy="-16" rx="22" ry="4" fill="${INK}"/><rect x="-9" y="-30" width="18" height="15" rx="3" fill="${INK}"/><circle cx="0" cy="0" r="12" fill="#f2d7b6" stroke="${INK}"/><path d="M-14 14 L-18 46 H18 L14 14Z" fill="${RED}"/></g><path d="M84 30 l-10 18 h10 l-8 18" stroke="${GOLD}" stroke-width="4" fill="none"/>`,
    palace:`<rect x="30" y="86" width="100" height="14" fill="#cfc3a6" stroke="${INK}"/>${[40,58,76,94,112].map(x=>`<rect x="${x}" y="58" width="7" height="28" fill="${RED}" stroke="${INK}"/>`).join('')}<rect x="34" y="50" width="92" height="8" fill="${JADE}" stroke="${INK}"/><path d="M12 50 Q28 46 40 34 H120 Q132 46 148 50 Q120 42 80 42 Q40 42 12 50Z" fill="#3a3230" stroke="${INK}"/><path d="M40 34 Q80 24 120 34" fill="none" stroke="#3a3230" stroke-width="4"/>`,
    flags:`<line x1="44" y1="106" x2="44" y2="18" stroke="${INK}" stroke-width="3"/><path d="M44 20 L92 30 L44 44Z" fill="${RED}" stroke="${INK}"/><line x1="116" y1="106" x2="116" y2="18" stroke="${INK}" stroke-width="3"/><path d="M116 20 L68 30 L116 44Z" fill="${NAVY}" stroke="${INK}"/><path d="M60 92 h40" stroke="${GOLD}" stroke-width="3" stroke-dasharray="4 4"/>`,
    flood:`${wave(76)}${wave(88,JADE)}${wave(100)}<path d="M20 70 Q80 30 140 70" fill="none" stroke="#7a6a52" stroke-width="7"/>${[44,62,80,98,116].map(x=>`<line x1="${x}" y1="${70-Math.sin((x-20)/120*Math.PI)*36}" x2="${x}" y2="106" stroke="#7a6a52" stroke-width="3"/>`).join('')}`,
    drum:`<line x1="40" y1="104" x2="58" y2="40" stroke="#6b4a2b" stroke-width="4"/><line x1="120" y1="104" x2="102" y2="40" stroke="#6b4a2b" stroke-width="4"/><ellipse cx="80" cy="54" rx="34" ry="28" fill="${RED}" stroke="${INK}" stroke-width="2"/><ellipse cx="80" cy="54" rx="22" ry="20" fill="#f1e2bf" stroke="${INK}"/><circle cx="80" cy="54" r="8" fill="none" stroke="${JADE}" stroke-width="3"/><line x1="122" y1="22" x2="104" y2="44" stroke="#6b4a2b" stroke-width="4"/>`,
    market:`<rect x="24" y="60" width="112" height="40" fill="#e3d2a8" stroke="${INK}"/><path d="M16 60 L32 38 H128 L144 60Z" fill="${JADE}" stroke="${INK}"/>${[40,62,84,106].map((x,i)=>`<ellipse cx="${x+6}" cy="80" rx="9" ry="7" fill="${['#efe1b8',RED,GOLD,NAVY][i]}" stroke="${INK}"/>`).join('')}${[[120,22],[136,30],[104,30]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="${GOLD}" stroke="${INK}"/><rect x="${x-2.5}" y="${y-2.5}" width="5" height="5" fill="#f3e9d2" stroke="${INK}" stroke-width=".6"/>`).join('')}`,
    scroll:`<rect x="34" y="34" width="92" height="56" fill="${CREAM}" stroke="${INK}" stroke-width="1.5"/><rect x="26" y="30" width="10" height="64" rx="5" fill="#6b4a2b"/><rect x="124" y="30" width="10" height="64" rx="5" fill="#6b4a2b"/>${[46,56,66,76].map(y=>`<line x1="46" y1="${y}" x2="114" y2="${y}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="6 3"/>`).join('')}<rect x="72" y="96" width="16" height="16" fill="#efe1b8" stroke="${INK}"/><path d="M80 96 q-6 -10 0 -18 q6 8 0 18" fill="#e8742c"/>`,
    people:`${[[44,RED],[80,NAVY],[116,JADE]].map(([x,c])=>`<g transform="translate(${x} 60)"><circle r="12" fill="#f2d7b6" stroke="${INK}"/><path d="M-16 16 L-20 48 H20 L16 16Z" fill="${c}"/><ellipse cx="0" cy="-12" rx="14" ry="5" fill="#d9c08a" stroke="${INK}"/></g>`).join('')}<path d="M10 108 H150" stroke="${INK}" stroke-width="2"/>`
  };
  return W+(A[key]||A.scroll)+'</svg>';
}
