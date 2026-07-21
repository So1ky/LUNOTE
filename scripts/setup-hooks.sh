#!/bin/sh
# 저장소를 새로 clone한 뒤 1회 실행한다.
#   sh scripts/setup-hooks.sh
# git hook은 clone에 포함되지 않으므로 hooksPath를 명시적으로 지정해야 한다.

set -e
cd "$(dirname "$0")/.."

git config core.hooksPath .githooks
chmod +x .githooks/*

# 로컬 시크릿 파일 권한을 소유자 전용으로 제한
for f in apps/api/.env apps/mobile/.env; do
  [ -f "$f" ] && chmod 600 "$f" && echo "권한 600 적용: $f"
done

echo "✅ pre-commit 훅 설치 완료 (시크릿 커밋 차단)"
