#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -x .venv/bin/mkdocs || ! -x .venv/bin/python ]]; then
  echo "Creating .venv with pinned Python and installing docs/requirements-mkdocs.txt..."
  "$(proto bin python 3.14.8)" -m venv .venv
  .venv/bin/python -m pip install --disable-pip-version-check -r docs/requirements-mkdocs.txt
fi

MODE="build"
ARGS=()
while (($#)); do
  case "$1" in
    --serve|-s) MODE="serve"; shift ;;
    --build|-b) MODE="build"; shift ;;
    --help|-h)
      printf 'Usage: moon run docs-build | moon run docs -- --serve [mkdocs args]\n'
      exit 0
      ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

if [[ "$MODE" == "serve" ]]; then
  exec .venv/bin/mkdocs serve -f mkdocs.yml "${ARGS[@]}"
fi

.venv/bin/mkdocs build -f mkdocs.yml "${ARGS[@]}"
printf '\nStatic documentation site: %s/docs/site/index.html\n' "$ROOT"
