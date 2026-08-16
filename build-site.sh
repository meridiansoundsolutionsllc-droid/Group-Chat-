#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist
cp ./*.html ./*.css dist/
BASE="https://6a738e97439ec4aa6a975067--meridiansoundsolutions.netlify.app"
for file in \
  meridian-hero-v38.jpg \
  meridian-audio-production-v38.png \
  meridian-dj-performance-v38.png \
  meridian-media-production-v38.png \
  meridian-digital-safety-v38.png \
  meridian-life-skills-v38.png; do
  curl --fail --silent --show-error --location "$BASE/$file" --output "dist/$file"
done
curl --fail --silent --show-error --location "$BASE/index.html" \
  | grep -o 'data:image/png;base64,[A-Za-z0-9+/=]*' \
  | head -1 \
  | sed 's#data:image/png;base64,##' \
  | base64 -d > dist/meridian-emblem.png
