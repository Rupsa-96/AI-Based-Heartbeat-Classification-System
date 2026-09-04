#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

export PYENV_ROOT="${PYENV_ROOT:-/opt/render/.pyenv}"

if [ -f "$SCRIPT_DIR/.render_meta.sh" ]; then
    echo "[start.sh] Loading render meta from build..."
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.render_meta.sh"
fi

export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:${PATH:-}"

if command -v pyenv >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/.python-version" ]; then
    cd "$SCRIPT_DIR"
    pyenv rehash 2>/dev/null || true
fi

PORT="${PORT:-8000}"

echo "[start.sh] Running from: $SCRIPT_DIR"
echo "[start.sh] python:  $(command -v python)  $(python --version 2>&1)"
echo "[start.sh] uvicorn: $(command -v uvicorn 2>/dev/null || echo via python -m uvicorn)"

cd "$SCRIPT_DIR"
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT"
