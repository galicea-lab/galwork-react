#!/usr/bin/env bash
set -e

TYPE=${1:-patch} # domyślnie podbija patch (np. 0.1.0 -> 0.1.1)

echo "Podbijanie wersji ($TYPE) we wszystkich modułach..."
npm version "$TYPE" --workspaces --no-git-tag-version

echo "Zbudowanie projektu w celu weryfikacji..."
npm run build

echo "Gotowe. Zatwierdź zmiany w Git i dodaj tag release'u:"
echo "git commit -am 'release: bump version'"
echo "git tag v0.1.1"
echo "git push origin main --tags"
