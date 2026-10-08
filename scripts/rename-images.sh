#!/usr/bin/env bash
# Rename pass: drop the IMG_ prefix, spaces/underscores -> dashes, all lowercase.
set -euo pipefail
cd "$(dirname "$0")/.."

pairs=$(cat <<'EOF'
src/assets/images/About page photo.jpeg|src/assets/images/about-page-photo.jpeg
src/assets/images/Cradlemountain.jpeg|src/assets/images/cradlemountain.jpeg
src/assets/images/IMG_R&M mountain.jpg|src/assets/images/r-and-m-mountain.jpg
src/assets/images/IMG_alpine.jpg|src/assets/images/alpine.jpg
src/assets/images/IMG_flowers.jpg|src/assets/images/flowers.jpg
src/assets/images/IMG_pademelon.jpg|src/assets/images/pademelon.jpg
src/assets/images/McDonnell Ranges.jpeg|src/assets/images/mcdonnell-ranges.jpeg
src/assets/images/still life in desert.jpeg|src/assets/images/still-life-in-desert.jpeg
src/assets/images/pademelon_photos/IMG_evening treecover.jpg|src/assets/images/pademelon-photos/evening-treecover.jpg
src/assets/images/pademelon_photos/IMG_forest rapids.jpg|src/assets/images/pademelon-photos/forest-rapids.jpg
src/assets/images/pademelon_photos/IMG_misty heath.jpg|src/assets/images/pademelon-photos/misty-heath.jpg
src/assets/images/pademelon_photos/IMG_misty lake.jpg|src/assets/images/pademelon-photos/misty-lake.jpg
src/assets/images/pademelon_photos/IMG_misty sands.jpg|src/assets/images/pademelon-photos/misty-sands.jpg
src/assets/images/pademelon_photos/IMG_misty water.jpg|src/assets/images/pademelon-photos/misty-water.jpg
src/assets/images/pademelon_photos/IMG_moss.jpg|src/assets/images/pademelon-photos/moss.jpg
src/assets/images/pademelon_photos/IMG_rainforest.jpg|src/assets/images/pademelon-photos/rainforest.jpg
src/assets/images/pademelon_photos/IMG_rapids.jpg|src/assets/images/pademelon-photos/rapids.jpg
src/assets/images/pademelon_photos/IMG_rock seaspray.jpg|src/assets/images/pademelon-photos/rock-seaspray.jpg
src/assets/images/pademelon_photos/IMG_sunny hill.jpg|src/assets/images/pademelon-photos/sunny-hill.jpg
src/assets/images/pademelon_photos/IMG_treecover.jpg|src/assets/images/pademelon-photos/treecover.jpg
src/assets/images/pademelon_photos/IMG_white branches.jpg|src/assets/images/pademelon-photos/white-branches.jpg
src/assets/images/pademelon_photos/IMG_wild berries.jpg|src/assets/images/pademelon-photos/wild-berries.jpg
src/assets/images/pademelon_photos/IMG_wild mushroom.jpg|src/assets/images/pademelon-photos/wild-mushroom.jpg
EOF
)

while IFS='|' read -r old new; do
  [ -z "$old" ] && continue
  # Idempotent: a re-run finds the old name gone and the new name in place.
  if [ ! -f "$old" ] && [ -f "$new" ]; then echo "already renamed: $new"; continue; fi
  if [ ! -f "$old" ]; then echo "MISSING: $old"; exit 1; fi
  mkdir -p "$(dirname "$new")"
  # A case-only rename is invisible on the case-insensitive macOS filesystem:
  # `Cradlemountain.jpeg` and `cradlemountain.jpeg` are the same file, so a plain
  # git mv looks like a collision. Go through a temporary name.
  if [ "$(printf '%s' "$old" | tr 'A-Z' 'a-z')" = "$(printf '%s' "$new" | tr 'A-Z' 'a-z')" ]; then
    tmp="${new}.case-tmp"
    git mv "$old" "$tmp"
    git mv "$tmp" "$new"
  elif [ -e "$new" ]; then
    echo "COLLISION: $new"; exit 1
  else
    git mv "$old" "$new"
  fi
  printf '%-46s -> %s\n' "$old" "$new"
done <<< "$pairs"

# The gallery folder itself: underscore -> dash. Nothing references it today.
# The target already exists by now (mkdir created it), so `git mv` would move the
# old folder *inside* the new one — move what is left in it, then remove it.
if [ -d src/assets/images/pademelon_photos ]; then
  for leftover in src/assets/images/pademelon_photos/*; do
    [ -e "$leftover" ] || continue
    git mv "$leftover" "src/assets/images/pademelon-photos/$(basename "$leftover")"
    echo "src/assets/images/pademelon_photos/$(basename "$leftover") -> src/assets/images/pademelon-photos/$(basename "$leftover")"
  done
  # Hidden placeholders (.gitkeep) are not matched by the glob above.
  for hidden in src/assets/images/pademelon_photos/.*; do
    case "$hidden" in *.|*..) continue ;; esac
    [ -e "$hidden" ] || continue
    git mv "$hidden" "src/assets/images/pademelon-photos/$(basename "$hidden")"
    echo "src/assets/images/pademelon_photos/$(basename "$hidden") -> src/assets/images/pademelon-photos/$(basename "$hidden")"
  done
  rmdir src/assets/images/pademelon_photos
  echo "removed empty src/assets/images/pademelon_photos"
fi
