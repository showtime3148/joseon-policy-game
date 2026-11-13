/* 실시간 방 서버 주소
 * '/api/game' : 같은 Vercel 프로젝트의 서버 함수(Upstash Redis 사용) — 기본값
 * Apps Script를 쓰려면 웹 앱 URL(/exec로 끝남)을 넣으세요.
 * 주소 뒤에 ?demo=1 을 붙이면 서버 없이 한 브라우저 안에서만 도는 체험 모드가 됩니다. */
const SERVER_URL = '/api/game';
