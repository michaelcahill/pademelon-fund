#!/usr/bin/env bash
# Rename pass: drop the IMG_ prefix, spaces/underscores -> dashes, all lowercase.
set -euo pipefail
cd "$(dirname "$0")/.."

pairs=$(cat <<'EOF'
public/images/About page photo.jpeg|public/images/about-page-photo.jpeg
public/images/Cradlemountain.jpeg|public/images/cradlemountain.jpeg
public/images/IMG_R&M mountain.jpg|public/images/r-and-m-mountain.jpg
public/images/IMG_alpine.jpg|public/images/alpine.jpg
public/images/IMG_flowers.jpg|public/images/flowers.jpg
public/images/IMG_pademelon.jpg|public/images/pademelon.jpg
public/images/McDonnell Ranges.jpeg|public/images/mcdonnell-ranges.jpeg
public/images/still life in desert.jpeg|public/images/still-life-in-desert.jpeg
public/images/pademelon_photos/IMG_evening treecover.jpg|public/images/pademelon-photos/evening-treecover.jpg
public/images/pademelon_photos/IMG_forest rapids.jpg|public/images/pademelon-photos/forest-rapids.jpg
public/images/pademelon_photos/IMG_misty heath.jpg|public/images/pademelon-photos/misty-heath.jpg
public/images/pademelon_photos/IMG_misty lake.jpg|public/images/pademelon-photos/misty-lake.jpg
public/images/pademelon_photos/IMG_misty sands.jpg|public/images/pademelon-photos/misty-sands.jpg
public/images/pademelon_photos/IMG_misty water.jpg|public/images/pademelon-photos/misty-water.jpg
public/images/pademelon_photos/IMG_moss.jpg|public/images/pademelon-photos/moss.jpg
public/images/pademelon_photos/IMG_rainforest.jpg|public/images/pademelon-photos/rainforest.jpg
public/images/pademelon_photos/IMG_rapids.jpg|public/images/pademelon-photos/rapids.jpg
public/images/pademelon_photos/IMG_rock seaspray.jpg|public/images/pademelon-photos/rock-seaspray.jpg
public/images/pademelon_photos/IMG_sunny hill.jpg|public/images/pademelon-photos/sunny-hill.jpg
public/images/pademelon_photos/IMG_treecover.jpg|public/images/pademelon-photos/treecover.jpg
public/images/pademelon_photos/IMG_white branches.jpg|public/images/pademelon-photos/white-branches.jpg
public/images/pademelon_photos/IMG_wild berries.jpg|public/images/pademelon-photos/wild-berries.jpg
public/images/pademelon_photos/IMG_wild mushroom.jpg|public/images/pademelon-photos/wild-mushroom.jpg
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
if [ -d public/images/pademelon_photos ]; then
  for leftover in public/images/pademelon_photos/*; do
    [ -e "$leftover" ] || continue
    git mv "$leftover" "public/images/pademelon-photos/$(basename "$leftover")"
    echo "public/images/pademelon_photos/$(basename "$leftover") -> public/images/pademelon-photos/$(basename "$leftover")"
  done
  # Hidden placeholders (.gitkeep) are not matched by the glob above.
  for hidden in public/images/pademelon_photos/.*; do
    case "$hidden" in *.|*..) continue ;; esac
    [ -e "$hidden" ] || continue
    git mv "$hidden" "public/images/pademelon-photos/$(basename "$hidden")"
    echo "public/images/pademelon_photos/$(basename "$hidden") -> public/images/pademelon-photos/$(basename "$hidden")"
  done
  rmdir public/images/pademelon_photos
  echo "removed empty public/images/pademelon_photos"
fi
