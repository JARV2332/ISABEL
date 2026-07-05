#!/bin/sh
set -e
cd "$(dirname "$0")/.."

export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f \
  --env-filter '
    export GIT_AUTHOR_NAME="Lissy Amador"
    export GIT_AUTHOR_EMAIL="lissyamadorsazo@gmail.com"
    export GIT_COMMITTER_NAME="Lissy Amador"
    export GIT_COMMITTER_EMAIL="lissyamadorsazo@gmail.com"
  ' \
  --msg-filter '
    sed -e "/Co-authored-by:.*[Cc]ursor/d" \
        -e "/cursoragent@cursor.com/d" \
        -e "/Made-with: Cursor/d" \
        -e "/Co-authored-by:.*cursoragent/d" \
        -e "/Co-authored-by: Cursor Agent/d"
  ' \
  -- main
