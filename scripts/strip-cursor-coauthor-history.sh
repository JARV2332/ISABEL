#!/bin/sh
# Quita co-autor de Cursor del historial SIN cambiar autores humanos (Lissy, JARV2332).
set -e
cd "$(dirname "$0")/.."

export FILTER_BRANCH_SQUELCH_WARNING=1
STRIP="$(pwd)/.githooks/strip-coauthor.js"

git filter-branch -f \
  --msg-filter "node \"$STRIP\"" \
  -- main

echo "Historial reescrito. Ejecuta: git push --force origin main"
