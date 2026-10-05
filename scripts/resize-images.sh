#!/usr/bin/env bash
# Static image scale-down for public/images.
#
# Why 1664px: the page shell is capped at max-w-4xl (56rem = 896px) with px-8
# padding, so a hero image renders at 832 CSS px wide (src/lib/shell.ts). At a
# 2x (Retina) device that is 1664 physical pixels — the widest a hero is ever
# displayed. Anything wider than that is invisible in the browser, so scaling
# to 1664 changes nothing on screen; anything narrower would soften the hero.
#
# -auto-orient bakes the EXIF rotation into the pixels (12 of these photos are
# stored rotated), and -strip drops the metadata with it, so the picture looks
# exactly as it does today. `>` means "only shrink, never enlarge".
#
# Usage:  scripts/resize-images.sh          # dry run — prints the plan
#         scripts/resize-images.sh --apply  # writes files, keeps .bak copies
set -euo pipefail

TARGET=1664
QUALITY=82
APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

cd "$(dirname "$0")/.."
# Backups must live OUTSIDE public/: Astro copies everything under public/ into
# dist, so a backup folder there ships the originals with the site.
BACKUP="scripts/.pre-resize-backup"

# PNGs with real transparency (watermark, nav logo, favicon) are left alone:
# they are line art and already at or below their display size.
SKIP=$(printf '%s\n' \
  "public/images/pademelon-outline.png" \
  "public/images/pademelon-logo-small.png" \
  "public/favicon.png")

total_before=0
total_after=0

while IFS= read -r -d '' f; do
  case "$f" in *.png) continue ;; esac
  if echo "$SKIP" | grep -qx "$f"; then continue; fi

  w=$(identify -format "%w" "$f")
  size_before=$(stat -f%z "$f")
  rel=${f#public/images/}

  if [ "$w" -le "$TARGET" ]; then
    # Already at hero width: re-encode only, pixels untouched.
    tmp=$(mktemp -t img).jpg
    magick "$f" -auto-orient -strip -quality "$QUALITY" "$tmp"
    # magick compare exits 1 when images differ; pipefail would kill the loop.
    rmse=$( { magick compare -metric RMSE "$f" "$tmp" null: 2>&1; } | sed 's/.*(\([^)]*\))/\1/' || true)
    after=$(stat -f%z "$tmp")
    rm -f "$tmp"
    printf '%-46s %5spx  %6sKB -> %6sKB  (re-encode, RMSE %.2f/255)\n' \
      "$(basename "$f")" "$w" "$((size_before/1024))" "$((after/1024))" "$(python3 -c "print($rmse*255)")"
    if [ "$APPLY" = 1 ] && [ "$after" -lt "$size_before" ]; then
      mkdir -p "$BACKUP/$(dirname "$rel")"
      cp "$f" "$BACKUP/$rel"
      magick "$f" -auto-orient -strip -quality "$QUALITY" "$f"
    fi
  else
    tmp=$(mktemp -t img).jpg
    # Cap the WIDTH, not the long edge: a portrait photo used as a hero is
    # cropped to 3/2 and displayed 832 CSS px wide, so it needs the same 1664px
    # of width as a landscape one. `1664x1664>` would cap portraits by height
    # and leave them 1248 wide — soft on a Retina hero.
    magick "$f" -auto-orient -resize "${TARGET}x" -strip -quality "$QUALITY" "$tmp"
    after=$(stat -f%z "$tmp")
    neww=$(identify -format "%w" "$tmp")
    rm -f "$tmp"
    printf '%-46s %5spx  %6sKB -> %6sKB  (scale to %s)\n' \
      "$(basename "$f")" "$w" "$((size_before/1024))" "$((after/1024))" "$neww"
    if [ "$APPLY" = 1 ]; then
      mkdir -p "$BACKUP/$(dirname "$rel")"
      cp "$f" "$BACKUP/$rel"
      magick "$f" -auto-orient -resize "${TARGET}x" -strip -quality "$QUALITY" "$f"
    fi
  fi
  total_before=$((total_before + size_before))
  total_after=$((total_after + after))
done < <(find public/images -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 | sort -z)

echo
printf 'Total: %s KB -> %s KB (%s%% smaller)\n' \
  "$((total_before/1024))" "$((total_after/1024))" \
  "$(python3 -c "print(round((1-$total_after/$total_before)*100))")"

if [ "$APPLY" = 1 ]; then
  mkdir -p "$BACKUP"
  echo "Backups in $BACKUP — delete once the site is checked."
else
  echo "Dry run. Re-run with --apply to write files."
fi
