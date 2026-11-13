#!/bin/sh
# apps-script/Code.gs = 시나리오 + 규칙 + 서버 (Apps Script에 그대로 붙여 넣는 한 파일)
set -e
cd "$(dirname "$0")"
{
  echo "/**"
  echo " * 조선 국정 회의(의정부판) - 실시간 방 서버 (자동 생성 파일: build.sh)"
  echo " * 구글 시트 > 확장 프로그램 > Apps Script 에 이 파일 내용 전체를 붙여 넣고"
  echo " * 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) 로 배포하세요."
  echo " */"
  cat scenarios.js; echo; cat core.js; echo; cat server/server.gs.js
} > apps-script/Code.gs
echo built apps-script/Code.gs

# api/_engine.js = 같은 서버 코드를 Vercel 함수에서 쓰도록 감싼 파일
mkdir -p api
{
  echo "/* 자동 생성 파일(build.sh) — scenarios.js + core.js + server/server.gs.js */"
  echo "module.exports = function (CacheService, LockService, SpreadsheetApp, ContentService) {"
  cat scenarios.js; echo; cat core.js; echo; cat server/server.gs.js
  echo "return { doGet: doGet, doPost: doPost, HEADS: { '기록': LOG_HEAD, '제안': PROP_HEAD, '제출': FINAL_HEAD } };"
  echo "};"
} > api/_engine.js
echo built api/_engine.js
