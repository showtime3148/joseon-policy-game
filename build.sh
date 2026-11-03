#!/bin/sh
# apps-script/Code.gs = 시나리오 + 규칙 + 서버 (Apps Script에 그대로 붙여 넣는 한 파일)
set -e
cd "$(dirname "$0")"
{
  echo "/**"
  echo " * 조선 국정 회의 - 실시간 방 서버 (자동 생성 파일: build.sh)"
  echo " * 구글 시트 > 확장 프로그램 > Apps Script 에 이 파일 내용 전체를 붙여 넣고"
  echo " * 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) 로 배포하세요."
  echo " */"
  cat scenarios.js; echo; cat cards.js; echo; cat advisors.js; echo; cat core.js; echo; cat server/server.gs.js
} > apps-script/Code.gs
echo built apps-script/Code.gs
