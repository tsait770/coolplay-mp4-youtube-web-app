#!/usr/bin/env bash
set -euo pipefail

URL=${1:-}
HEADERS_JSON=${2:-""}

if [[ -z "$URL" ]]; then
  echo "Usage: $0 <media_url> [headers_json]"
  exit 1
fi

pushd "$(dirname "$0")/.." >/dev/null

flutter run \
  -d ios \
  --target example/lib/main.dart \
  --dart-define=MEDIA_URL="$URL" \
  --dart-define=MEDIA_HEADERS="$HEADERS_JSON"

popd >/dev/null
