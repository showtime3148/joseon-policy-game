/* 사건 삽화 — 640×260 움직이는 장면 (SVG + CSS 애니메이션) */
const SC_INK = '#2a211a';
function scPerson(x, y, s, o){
  o = o || {};
  const robe = o.robe || '#efe6cf', hat = o.hat || 'band', k = s || 1;
  let h = '';
  if (hat === 'gat') h = `<ellipse cx="0" cy="-27" rx="11" ry="2.4" fill="${SC_INK}"/><rect x="-5" y="-35" width="10" height="8" rx="2" fill="${SC_INK}"/>`;
  if (hat === 'king') h = `<path d="M-7 -27 h14 v-7 q-7 -4 -14 0Z" fill="${SC_INK}"/><rect x="-8" y="-28" width="16" height="2.4" fill="#c99a2e"/><ellipse cx="-9" cy="-31" rx="3" ry="2" fill="${SC_INK}"/><ellipse cx="9" cy="-31" rx="3" ry="2" fill="${SC_INK}"/>`;
  if (hat === 'official') h = `<path d="M-7 -27 v-7 q7 -4 14 0 v7Z" fill="${SC_INK}"/><ellipse cx="-10" cy="-31" rx="4" ry="1.6" fill="${SC_INK}"/><ellipse cx="10" cy="-31" rx="4" ry="1.6" fill="${SC_INK}"/>`;
  if (hat === 'helmet') h = `<path d="M-8 -26 q8 -16 16 0Z" fill="#5a4a3a" stroke="${SC_INK}" stroke-width=".6"/><line x1="0" y1="-36" x2="0" y2="-40" stroke="#b23a2c" stroke-width="1.6"/>`;
  if (hat === 'band') h = `<path d="M-6 -30 q6 -5 12 0" stroke="${SC_INK}" stroke-width="2.4" fill="none"/>`;
  if (hat === 'topknot') h = `<circle cx="0" cy="-34" r="2.6" fill="${SC_INK}"/>`;
  const arm = o.arm === 'up' ? `<path d="M5 -14 l9 -12" stroke="${robe}" stroke-width="4" stroke-linecap="round"/>` : o.arm === 'out' ? `<path d="M5 -14 l12 -2" stroke="${robe}" stroke-width="4" stroke-linecap="round"/>` : '';
  const tool = o.tool === 'spear' ? `<line x1="12" y1="6" x2="12" y2="-44" stroke="#6b4a2b" stroke-width="1.4"/><path d="M12 -44 l-2 6 h4Z" fill="#9aa3ab"/>`
    : o.tool === 'hoe' ? `<line x1="10" y1="4" x2="18" y2="-24" stroke="#6b4a2b" stroke-width="1.4"/><path d="M18 -24 l6 3 -2 2Z" fill="#7a7f86"/>`
    : o.tool === 'book' ? `<rect x="-6" y="-14" width="12" height="8" fill="#2f5d73" stroke="${SC_INK}" stroke-width=".5"/>`
    : o.tool === 'brush' ? `<line x1="8" y1="-12" x2="16" y2="-26" stroke="#6b4a2b" stroke-width="1.4"/>`
    : o.tool === 'stick' ? `<line x1="10" y1="-10" x2="20" y2="-30" stroke="#6b4a2b" stroke-width="2"/>` : '';
  const mood = o.mood === 'sad' ? `<path d="M-2 -18.6 q2 -1.4 4 0" stroke="${SC_INK}" stroke-width=".6" fill="none"/>` : `<path d="M-2 -19.4 q2 1.4 4 0" stroke="${SC_INK}" stroke-width=".6" fill="none"/>`;
  return `<g class="${o.cls || ''}"><g transform="translate(${x} ${y}) scale(${k})">${arm}
    <path d="M-8 0 L-6 -16 L6 -16 L8 0Z" fill="${robe}" stroke="${SC_INK}" stroke-width=".7"/>
    <circle cx="0" cy="-22" r="5.6" fill="#f2d7b6" stroke="${SC_INK}" stroke-width=".7"/>
    <circle cx="-2" cy="-23" r=".6" fill="${SC_INK}"/><circle cx="2" cy="-23" r=".6" fill="${SC_INK}"/>${mood}${h}${tool}</g></g>`;
}
function scSky(top, bot, id){ return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect width="640" height="260" fill="url(#${id})"/>`; }
function scHills(c1, c2){ return `<path d="M0 150 Q80 90 160 120 Q240 70 330 112 Q420 72 500 110 Q580 86 640 120 V260 H0Z" fill="${c1 || '#7fae99'}" opacity=".6"/><path d="M0 172 Q110 130 220 156 Q330 128 440 158 Q540 138 640 160 V260 H0Z" fill="${c2 || '#5f9a86'}" opacity=".75"/>`; }
function scWaves(y, c, n, cls){ let s = `<g class="${cls || 'sc-wave'}">`; for (let i = -1; i < (n || 16); i++) s += `<path d="M${i * 46} ${y} q11.5 -10 23 0 q11.5 -10 23 0" fill="none" stroke="${c}" stroke-width="2.4"/>`; return s + '</g>'; }
function scHouse(x, y, s){ return `<g transform="translate(${x} ${y}) scale(${s || 1})"><rect x="-14" y="-14" width="28" height="16" fill="#e3d2a8" stroke="${SC_INK}" stroke-width=".8"/><path d="M-19 -13 Q0 -32 19 -13Z" fill="#b8954f" stroke="${SC_INK}" stroke-width=".8"/><rect x="-4" y="-8" width="8" height="10" fill="#6b4a2b"/></g>`; }
function scHall(x, y, s, roof){ return `<g transform="translate(${x} ${y}) scale(${s || 1})"><rect x="-60" y="-8" width="120" height="10" fill="#cfc3a6" stroke="${SC_INK}"/>${[-48, -24, 0, 24, 48].map(px => `<rect x="${px - 3}" y="-40" width="6" height="32" fill="#b23a2c" stroke="${SC_INK}" stroke-width=".6"/>`).join('')}<rect x="-54" y="-48" width="108" height="8" fill="#2f6b5e" stroke="${SC_INK}" stroke-width=".6"/><path d="M-80 -46 Q-64 -50 -52 -62 H52 Q64 -50 80 -46 Q52 -54 0 -54 Q-52 -54 -80 -46Z" fill="${roof || '#3a3230'}" stroke="${SC_INK}"/></g>`; }
function scFlag(x, y, c, h){ return `<g transform="translate(${x} ${y})"><line x1="0" y1="0" x2="0" y2="${-(h || 40)}" stroke="${SC_INK}" stroke-width="1.6"/><path class="sc-flap" d="M0 ${-(h || 40)} q10 4 20 0 q-2 8 0 14 q-10 4 -20 0Z" fill="${c}"/></g>`; }
function scCloud(x, y, s, dark){ return `<g class="sc-drift"><g transform="translate(${x} ${y}) scale(${s || 1})" opacity="${dark ? .9 : .85}"><ellipse cx="0" cy="0" rx="34" ry="12" fill="${dark ? '#6b6f78' : '#fbf7ee'}"/><ellipse cx="22" cy="-6" rx="22" ry="11" fill="${dark ? '#6b6f78' : '#fbf7ee'}"/><ellipse cx="-20" cy="-4" rx="18" ry="9" fill="${dark ? '#6b6f78' : '#fbf7ee'}"/></g></g>`; }

const SCENE = {
  ship: () => `${scSky('#9cc3d3', '#e9eef0', 'sk1')}<circle cx="560" cy="48" r="20" fill="#b23a2c" opacity=".85"/>
    <path d="M0 168 Q120 150 220 170 L220 260 H0Z" fill="#a89a74"/>${scHouse(60, 168, 1)}${scHouse(118, 172, .9)}
    <g transform="translate(176 166)"><rect x="-10" y="-46" width="20" height="46" fill="#bdb29a" stroke="${SC_INK}"/><g class="sc-smoke"><ellipse cx="0" cy="-58" rx="8" ry="6" fill="#8d8d8d"/><ellipse cx="6" cy="-74" rx="10" ry="7" fill="#9d9d9d"/><ellipse cx="-2" cy="-92" rx="12" ry="8" fill="#b0b0b0"/></g></g>
    <rect x="200" y="176" width="440" height="84" fill="#5f8fa8"/>${scWaves(186, '#e9f2ee', 16)}${scWaves(212, '#2f5d73', 16, 'sc-wave2')}${scWaves(238, '#e9f2ee', 16)}
    ${[[330, 172, 1], [440, 160, .8], [540, 168, .9]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="sc-bob"><path d="M-40 0 H40 L30 16 H-30Z" fill="#4a3424" stroke="${SC_INK}"/><line x1="0" y1="0" x2="0" y2="-58" stroke="${SC_INK}" stroke-width="2"/><path d="M2 -54 L34 -6 H2Z" fill="#3a3230"/><path d="M-2 -50 L-28 -6 H-2Z" fill="#55493f"/></g></g>`).join('')}
    ${scPerson(40, 214, 1.1, {mood: 'sad', arm: 'up'})}${scPerson(78, 222, 1.1, {mood: 'sad', robe: '#d7c9ad'})}${scPerson(110, 216, 1, {hat: 'helmet', robe: '#24384c', tool: 'spear'})}`,

  books: () => `${scSky('#e9dcc0', '#f6edd7', 'sk2')}<rect x="0" y="40" width="640" height="220" fill="#d8c49c"/>
    ${[60, 180, 460, 580].map(x => `<rect x="${x - 8}" y="40" width="16" height="170" fill="#b23a2c" stroke="${SC_INK}"/>`).join('')}<rect x="0" y="30" width="640" height="14" fill="#2f6b5e"/>
    <g>${[[110, 70], [520, 70]].map(([x, y]) => `<g transform="translate(${x} ${y})"><line x1="0" y1="-26" x2="0" y2="0" stroke="${SC_INK}"/><ellipse cx="0" cy="12" rx="12" ry="16" fill="#f3d9a0" stroke="${SC_INK}"/><ellipse cx="0" cy="12" rx="7" ry="11" fill="#fff4cf" class="sc-glow"/></g>`).join('')}</g>
    <rect x="80" y="196" width="480" height="20" fill="#7a5a3a" stroke="${SC_INK}"/>
    ${[160, 260, 380, 480].map((x, i) => `${scPerson(x, 196, 1.5, {hat: 'gat', robe: ['#e8e0cc', '#dfe7ec', '#efe6cf', '#e3ecdf'][i], tool: i % 2 ? 'brush' : 'book'})}`).join('')}
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${290 + i * 2}" y="${178 - i * 7}" width="54" height="7" fill="${['#2f5d73', '#b23a2c', '#c99a2e', '#3f7a69', '#5b4a3a'][i]}" stroke="${SC_INK}" stroke-width=".5"/>`).join('')}
    <g class="sc-float"><rect x="560" y="120" width="54" height="70" fill="#f6edd7" stroke="${SC_INK}"/><path d="M570 136 h34 M570 148 h34 M570 160 h26 M570 172 h30" stroke="${SC_INK}" stroke-dasharray="5 3"/></g>`,

  rice: () => `${scSky('#bcd9e2', '#f6ecd6', 'sk3')}<circle cx="90" cy="56" r="22" fill="#b23a2c" opacity=".8"/>${scHills()}
    <rect x="0" y="170" width="640" height="90" fill="#d6b04a"/>
    <g>${Array.from({length: 40}, (_, i) => `<path d="M${8 + i * 16} 200 q2 -16 8 -24" stroke="#8a6b1d" stroke-width="1.6" fill="none"/><ellipse cx="${17 + i * 16}" cy="176" rx="3" ry="5" fill="#c99a2e"/>`).join('')}</g>
    <g transform="translate(520 168)"><rect x="-30" y="-36" width="60" height="38" fill="#c9a774" stroke="${SC_INK}"/><path d="M-38 -34 L0 -58 L38 -34Z" fill="#6b4a2b" stroke="${SC_INK}"/></g>
    ${[[480, 206], [500, 214], [520, 204], [544, 212]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#efe1b8" stroke="${SC_INK}"/>`).join('')}
    ${scPerson(120, 230, 1.5, {hat: 'band', tool: 'hoe'})}${scPerson(200, 236, 1.5, {hat: 'band', robe: '#d7c9ad', tool: 'hoe'})}${scPerson(380, 232, 1.5, {hat: 'gat', robe: '#2f5d73', tool: 'book', cls: 'sc-sway'})}${scPerson(300, 238, 1.4, {hat: 'topknot', robe: '#efe6cf', mood: 'sad'})}`,

  scale: () => `${scSky('#e9dcc0', '#f6edd7', 'sk4')}${scHall(320, 120, 1.6)}<rect x="0" y="130" width="640" height="130" fill="#cdbb94"/>
    <g transform="translate(320 200)"><line x1="0" y1="0" x2="0" y2="-80" stroke="${SC_INK}" stroke-width="4"/><path d="M-30 4 H30" stroke="${SC_INK}" stroke-width="6"/>
      <g class="sc-tilt"><line x1="-90" y1="-76" x2="90" y2="-76" stroke="${SC_INK}" stroke-width="4"/><path d="M-90 -76 l-20 40 h40Z M90 -76 l-20 40 h40Z" fill="none" stroke="${SC_INK}"/>
      <path d="M-114 -36 q24 16 48 0Z" fill="#c99a2e" stroke="${SC_INK}"/><path d="M66 -36 q24 16 48 0Z" fill="#efe1b8" stroke="${SC_INK}"/>${[0, 1, 2].map(i => `<circle cx="${-100 + i * 10}" cy="-40" r="5" fill="#c99a2e" stroke="${SC_INK}"/>`).join('')}<ellipse cx="90" cy="-42" rx="12" ry="8" fill="#efe1b8" stroke="${SC_INK}"/></g></g>
    ${scPerson(110, 236, 1.6, {hat: 'official', robe: '#b23a2c', arm: 'out'})}${scPerson(170, 240, 1.5, {hat: 'official', robe: '#24384c'})}${scPerson(480, 238, 1.5, {hat: 'band', robe: '#efe6cf', mood: 'sad'})}${scPerson(540, 242, 1.5, {hat: 'band', robe: '#d7c9ad', arm: 'up'})}`,

  fort: () => `${scSky('#a8c3c9', '#efe5cf', 'sk5')}<path d="M380 150 Q460 90 540 130 Q600 100 640 120 V260 H380Z" fill="#8e9a86"/>
    ${[[500, 112], [540, 108], [580, 114]].map(([x, y]) => `<g transform="translate(${x} ${y})"><g class="sc-bob"><ellipse cx="0" cy="0" rx="10" ry="5" fill="#3a3230"/><circle cx="-2" cy="-10" r="4" fill="#3a3230"/><line x1="6" y1="-14" x2="10" y2="-30" stroke="#3a3230" stroke-width="1.4"/></g></g>`).join('')}
    ${scHills('#7fae99', '#5f9a86')}<path d="M0 190 H400 V140 H0Z" fill="#c4b594" stroke="${SC_INK}"/>${Array.from({length: 26}, (_, i) => `<rect x="${i * 16}" y="130" width="10" height="10" fill="#c4b594" stroke="${SC_INK}" stroke-width=".8"/>`).join('')}
    <path d="M170 190 V160 a22 20 0 0 1 44 0 V190Z" fill="#4a3a2a"/><path d="M150 132 L192 104 L234 132Z" fill="#3a3230" stroke="${SC_INK}"/>
    ${scFlag(40, 130, '#b23a2c', 50)}${scFlag(120, 130, '#24384c', 50)}${scFlag(300, 130, '#c99a2e', 50)}${scFlag(370, 130, '#b23a2c', 50)}
    ${[60, 100, 260, 330].map(x => scPerson(x, 130, 1.1, {hat: 'helmet', robe: '#24384c', tool: 'spear'})).join('')}
    <rect x="0" y="190" width="640" height="70" fill="#8b9a6b"/>${scPerson(110, 240, 1.6, {hat: 'helmet', robe: '#b23a2c', tool: 'spear'})}${scPerson(260, 244, 1.6, {hat: 'official', robe: '#2f6b5e', arm: 'out'})}`,

  gauge: () => `${scSky('#8796a3', '#d9dee0', 'sk6')}${scCloud(140, 50, 1.4, true)}${scCloud(420, 40, 1.7, true)}
    <g class="sc-rain">${Array.from({length: 40}, (_, i) => `<line x1="${(i * 53) % 640}" y1="${(i * 37) % 120 + 60}" x2="${(i * 53) % 640 - 4}" y2="${(i * 37) % 120 + 72}" stroke="#5b8fb0" stroke-width="1.6"/>`).join('')}</g>
    <rect x="0" y="190" width="640" height="70" fill="#b9ab8c"/>
    <g transform="translate(250 190)"><rect x="-40" y="-26" width="80" height="26" fill="#bdb29a" stroke="${SC_INK}"/><rect x="-18" y="-90" width="36" height="64" fill="#7a8a96" stroke="${SC_INK}"/><ellipse cx="0" cy="-90" rx="18" ry="5" fill="#5d6c77" stroke="${SC_INK}"/>${[-76, -60, -44].map(y => `<line x1="-18" y1="${y}" x2="18" y2="${y}" stroke="${SC_INK}"/>`).join('')}<rect class="sc-fill" x="-16" y="-50" width="32" height="22" fill="#5b8fb0" opacity=".7"/></g>
    <g transform="translate(420 190)"><rect x="-8" y="-30" width="16" height="30" fill="#bdb29a" stroke="${SC_INK}"/><path d="M-40 -30 q40 34 80 0Z" fill="#c99a2e" stroke="${SC_INK}"/><line x1="0" y1="-30" x2="18" y2="-44" stroke="${SC_INK}" stroke-width="1.4"/></g>
    ${scPerson(130, 238, 1.6, {hat: 'official', robe: '#2f6b5e', tool: 'book'})}${scPerson(540, 240, 1.6, {hat: 'king', robe: '#b23a2c'})}`,

  hangul: () => `${scSky('#efe1c2', '#f6edd7', 'sk7')}<rect x="0" y="40" width="640" height="220" fill="#e3d2a8"/>
    <g class="sc-float"><rect x="200" y="40" width="240" height="150" fill="#fbf6ea" stroke="${SC_INK}" stroke-width="2"/><rect x="190" y="36" width="260" height="10" rx="5" fill="#6b4a2b"/>
      <text x="230" y="110" font-size="54" font-family="serif" font-weight="800" fill="#24384c">ㄱ</text><text x="300" y="104" font-size="54" font-family="serif" font-weight="800" fill="#b23a2c">ㅎ</text><text x="370" y="114" font-size="54" font-family="serif" font-weight="800" fill="#2f6b5e">ㄴ</text>
      <text x="250" y="170" font-size="28" font-family="serif" font-weight="800" fill="${SC_INK}">ㆍ ㅡ ㅣ</text></g>
    <rect x="90" y="196" width="120" height="16" fill="#7a5a3a"/>${scPerson(150, 196, 1.7, {hat: 'king', robe: '#b23a2c', tool: 'brush'})}
    ${[470, 520, 570].map((x, i) => scPerson(x, 236, 1.5, {hat: ['band', 'topknot', 'band'][i], robe: ['#efe6cf', '#d7c9ad', '#f1ead8'][i], arm: i === 1 ? 'up' : ''})).join('')}${scPerson(60, 240, 1.4, {hat: 'gat', robe: '#e8e0cc', mood: 'sad'})}`,

  conflict: () => `${scSky('#3a3a44', '#7a6a5a', 'sk8')}${scHall(320, 116, 1.8, '#2a211a')}<rect x="0" y="120" width="640" height="140" fill="#a8916a"/>
    <rect x="290" y="150" width="60" height="40" fill="#b23a2c" stroke="${SC_INK}"/>${scPerson(320, 172, 1.6, {hat: 'king', robe: '#b23a2c'})}
    ${[60, 110, 160].map(x => scPerson(x, 236, 1.6, {hat: 'official', robe: '#24384c', arm: x === 160 ? 'out' : ''})).join('')}
    ${[480, 530, 580].map(x => scPerson(x, 236, 1.6, {hat: 'official', robe: '#a8402f', arm: x === 480 ? 'out' : ''})).join('')}
    <path class="sc-flash" d="M330 196 l-16 22 h14 l-12 26 l30 -34 h-14 l12 -14Z" fill="#f3d36b" stroke="${SC_INK}"/>`,

  palace: () => `${scSky('#bcd9e2', '#f6ecd6', 'sk9')}${scHills()}<rect x="0" y="180" width="640" height="80" fill="#c9b48a"/>
    <g transform="translate(330 180)"><rect x="-120" y="-10" width="240" height="12" fill="#cfc3a6" stroke="${SC_INK}"/>${[-100, -50, 0, 50, 100].map(x => `<rect x="${x - 4}" y="-70" width="8" height="60" fill="#b23a2c" stroke="${SC_INK}"/>`).join('')}
      <path d="M-140 -70 H140" stroke="#7a5a3a" stroke-width="6"/>${[-130, -70, 70, 130].map(x => `<line x1="${x}" y1="-70" x2="${x + 10}" y2="0" stroke="#a07848" stroke-width="3"/>`).join('')}</g>
    <g transform="translate(520 180)"><line x1="0" y1="0" x2="0" y2="-120" stroke="#6b4a2b" stroke-width="5"/><line x1="0" y1="-120" x2="-70" y2="-90" stroke="#6b4a2b" stroke-width="4"/><g class="sc-lift"><line x1="-70" y1="-90" x2="-70" y2="-40" stroke="${SC_INK}"/><rect x="-90" y="-40" width="40" height="14" fill="#a07848" stroke="${SC_INK}"/></g></g>
    ${scPerson(80, 236, 1.5, {hat: 'band', arm: 'up'})}${scPerson(130, 238, 1.5, {hat: 'band', robe: '#d7c9ad', tool: 'stick'})}${scPerson(420, 240, 1.5, {hat: 'gat', robe: '#2f5d73', tool: 'book'})}
    <g class="sc-carry"><g transform="translate(220 226)"><rect x="-30" y="-6" width="60" height="8" rx="3" fill="#a07848" stroke="${SC_INK}"/>${scPerson(-24, 18, 1.3, {hat: 'band'})}${scPerson(24, 18, 1.3, {hat: 'band', robe: '#d7c9ad'})}</g></g>`,

  flags: () => `${scSky('#c9d6d9', '#efe5cf', 'sk10')}${scHills('#9db39f', '#8aa88f')}<rect x="0" y="180" width="640" height="80" fill="#a9b07c"/>
    ${scFlag(70, 180, '#b23a2c', 90)}${scFlag(130, 186, '#b23a2c', 76)}${scFlag(510, 180, '#c99a2e', 90)}${scFlag(570, 186, '#c99a2e', 76)}
    ${[60, 100, 140].map(x => scPerson(x, 232, 1.4, {hat: 'helmet', robe: '#b23a2c', tool: 'spear'})).join('')}${[500, 540, 580].map(x => scPerson(x, 232, 1.4, {hat: 'helmet', robe: '#6b5a2b', tool: 'spear'})).join('')}
    ${scPerson(320, 238, 1.8, {hat: 'official', robe: '#2f6b5e', arm: 'out'})}<g class="sc-float"><rect x="336" y="186" width="30" height="20" fill="#fbf6ea" stroke="${SC_INK}"/><path d="M340 194 h22 M340 200 h16" stroke="${SC_INK}"/></g>`,

  flood: () => `${scSky('#7e8b95', '#cfd6d8', 'sk11')}${scCloud(180, 46, 1.5, true)}${scCloud(470, 40, 1.3, true)}
    <rect x="0" y="120" width="640" height="40" fill="#b9ab8c"/>${Array.from({length: 40}, (_, i) => `<rect x="${i * 16}" y="112" width="10" height="8" fill="#b9ab8c" stroke="${SC_INK}" stroke-width=".6"/>`).join('')}
    ${scHouse(80, 196, 1.2)}${scHouse(560, 196, 1.2)}<rect x="0" y="180" width="640" height="80" fill="#6b8ea0"/>
    ${scWaves(196, '#e9f2ee', 16)}${scWaves(222, '#3f6f86', 16, 'sc-wave2')}${scWaves(248, '#e9f2ee', 16)}
    <path d="M200 182 Q320 140 440 182" fill="none" stroke="#7a6a52" stroke-width="9"/>
    ${scPerson(150, 176, 1.4, {hat: 'band', tool: 'hoe'})}${scPerson(490, 176, 1.4, {hat: 'band', robe: '#d7c9ad', tool: 'hoe'})}${scPerson(320, 150, 1.5, {hat: 'king', robe: '#b23a2c', arm: 'out'})}`,

  drum: () => `${scSky('#bcd9e2', '#f6ecd6', 'sk12')}<rect x="0" y="60" width="640" height="200" fill="#d3c29a"/>
    <g transform="translate(470 120)"><rect x="-90" y="-40" width="180" height="90" fill="#c4b594" stroke="${SC_INK}"/><path d="M-110 -40 Q0 -76 110 -40Z" fill="#3a3230" stroke="${SC_INK}"/><path d="M-30 50 v-50 a30 26 0 0 1 60 0 v50Z" fill="#4a3a2a"/></g>
    <g transform="translate(200 170)"><line x1="-36" y1="60" x2="-14" y2="-10" stroke="#6b4a2b" stroke-width="5"/><line x1="36" y1="60" x2="14" y2="-10" stroke="#6b4a2b" stroke-width="5"/>
      <g class="sc-beat"><ellipse cx="0" cy="-10" rx="44" ry="36" fill="#b23a2c" stroke="${SC_INK}" stroke-width="2"/><ellipse cx="0" cy="-10" rx="28" ry="24" fill="#f1e2bf" stroke="${SC_INK}"/><circle cx="0" cy="-10" r="10" fill="none" stroke="#2f6b5e" stroke-width="4"/></g></g>
    ${scPerson(270, 236, 1.7, {hat: 'band', robe: '#efe6cf', tool: 'stick', cls: 'sc-hit'})}${scPerson(430, 240, 1.6, {hat: 'king', robe: '#b23a2c'})}${scPerson(480, 242, 1.5, {hat: 'official', robe: '#24384c'})}${scPerson(80, 240, 1.4, {hat: 'topknot', robe: '#d7c9ad', mood: 'sad'})}`,

  market: () => `${scSky('#bcd9e2', '#f6ecd6', 'sk13')}<rect x="0" y="150" width="640" height="110" fill="#d6c49c"/>
    ${[90, 270, 450].map((x, i) => `<g transform="translate(${x} 170)"><rect x="-60" y="-34" width="120" height="40" fill="#e3d2a8" stroke="${SC_INK}"/><path d="M-70 -34 L-54 -60 H54 L70 -34Z" fill="${['#2f6b5e', '#b23a2c', '#24384c'][i]}" stroke="${SC_INK}"/>${[0, 1, 2, 3].map(k => `<ellipse cx="${-40 + k * 26}" cy="-14" rx="9" ry="7" fill="${['#efe1b8', '#c99a2e', '#a8402f', '#7aa357'][(k + i) % 4]}" stroke="${SC_INK}"/>`).join('')}</g>`).join('')}
    <g class="sc-coins">${[[560, 70], [590, 90], [540, 100], [600, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#c99a2e" stroke="${SC_INK}"/><rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#f3e9d2" stroke="${SC_INK}" stroke-width=".6"/>`).join('')}</g>
    ${[[60, 'gat', '#2f5d73'], [140, 'band', '#efe6cf'], [230, 'topknot', '#d7c9ad'], [330, 'band', '#f1ead8'], [410, 'gat', '#e8e0cc'], [520, 'band', '#e3ecdf']].map(([x, h, c], i) => scPerson(x, 240 + (i % 2) * 4, 1.5, {hat: h, robe: c, arm: i % 3 === 0 ? 'out' : '', cls: i % 2 ? 'sc-walk' : ''})).join('')}`,

  scroll: () => `${scSky('#2f2b3a', '#5a4a40', 'sk14')}<circle cx="560" cy="50" r="18" fill="#f3efe2" opacity=".9"/><rect x="0" y="120" width="640" height="140" fill="#7a6248"/>
    <g transform="translate(320 140)"><rect x="-120" y="-80" width="240" height="120" fill="#f6edd7" stroke="${SC_INK}" stroke-width="2"/><rect x="-132" y="-86" width="14" height="132" rx="7" fill="#6b4a2b"/><rect x="118" y="-86" width="14" height="132" rx="7" fill="#6b4a2b"/>
      ${[-56, -36, -16, 4, 24].map(y => `<line x1="-96" y1="${y}" x2="96" y2="${y}" stroke="${SC_INK}" stroke-width="2" stroke-dasharray="10 5"/>`).join('')}<rect x="60" y="10" width="26" height="26" fill="none" stroke="#b23a2c" stroke-width="3"/></g>
    <g transform="translate(140 220)"><rect x="-10" y="-20" width="20" height="20" fill="#efe1b8" stroke="${SC_INK}"/><path class="sc-glow" d="M0 -20 q-8 -14 0 -26 q8 12 0 26" fill="#e8742c"/></g>
    ${scPerson(200, 244, 1.5, {hat: 'gat', robe: '#e8e0cc', tool: 'book'})}${scPerson(460, 244, 1.6, {hat: 'official', robe: '#24384c'})}${scPerson(520, 246, 1.6, {hat: 'official', robe: '#a8402f', arm: 'out'})}`,

  people: () => `${scSky('#bcd9e2', '#f6ecd6', 'sk15')}${scHills()}<rect x="0" y="176" width="640" height="84" fill="#a99a70"/>
    ${scHouse(100, 186, 1.4)}<g transform="translate(240 186)"><path d="M-22 0 V-18 M22 0 V-18 M-26 -18 H26" stroke="#7a5a3a" stroke-width="3"/><path d="M-18 -18 l10 -8 l8 6 l12 -6" stroke="#7a5a3a" stroke-width="2" fill="none"/></g>
    ${scHouse(380, 190, 1.2)}<g transform="translate(460 186)"><g class="sc-smoke"><ellipse cx="0" cy="-20" rx="10" ry="7" fill="#9d9d9d"/><ellipse cx="6" cy="-38" rx="12" ry="8" fill="#b0b0b0"/></g></g>
    ${scPerson(170, 236, 1.5, {hat: 'band', tool: 'hoe'})}${scPerson(300, 240, 1.5, {hat: 'band', robe: '#d7c9ad', arm: 'up'})}${scPerson(520, 238, 1.6, {hat: 'gat', robe: '#2f5d73', tool: 'book'})}${scPerson(570, 242, 1.4, {hat: 'topknot', robe: '#efe6cf', mood: 'sad'})}`
};

function eventScene(key, war){
  const body = (SCENE[key] || SCENE.scroll)();
  const warLayer = war ? `<g class="sc-flash" opacity=".5"><path d="M0 0 H640 V260 H0Z" fill="#b23a2c" opacity=".12"/></g><g class="sc-smoke">${[[80, 120], [600, 110], [300, 90]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="14" fill="#555" opacity=".5"/>`).join('')}</g>` : '';
  return `<svg viewBox="0 0 640 260" class="scene" role="img" aria-label="사건 삽화" preserveAspectRatio="xMidYMid slice">${body}${warLayer}</svg>`;
}
