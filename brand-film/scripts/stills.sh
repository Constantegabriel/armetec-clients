#!/usr/bin/env bash
# Render representative stills: scripts/stills.sh <Composition> frame1 frame2 ...
set -e
cd "$(dirname "$0")/.."
COMP=$1; shift
mkdir -p out/stills
npx remotion bundle --out-dir=out/bundle >/dev/null 2>&1 || true
for fr in "$@"; do
  npx remotion still out/bundle "$COMP" "out/stills/${COMP}-${fr}.jpg" --frame="$fr" --jpeg-quality=90 2>&1 | grep -E "Error|error:" | head -3 || true
done
