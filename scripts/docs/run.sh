#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODE="build"
ARGS=()
while (($#)); do
  case "$1" in
    --serve|-s) MODE="serve"; shift ;;
    --build|-b) MODE="build"; shift ;;
    --help|-h)
      printf 'Usage: moon run root:docs-build | moon run root:docs -- --serve [mkdocs args]\n'
      exit 0
      ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

if [[ "$MODE" == "serve" ]]; then
  exec uv run --with-requirements docs/requirements-mkdocs.txt mkdocs serve -f mkdocs.yml "${ARGS[@]}"
fi

uv run --with-requirements docs/requirements-mkdocs.txt mkdocs build -f mkdocs.yml "${ARGS[@]}"
printf '\nStatic documentation site: %s/docs/site/index.html\n' "$ROOT"
