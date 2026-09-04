#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

LIB1="$SCRIPT_DIR/.render_lib.sh"
LIB2="$SCRIPT_DIR/.render_meta.sh"

if [ -f "$LIB1" ]; then
    echo "[start.sh] loading .render_lib.sh (from build-time bootstrap library)"
    # shellcheck disable=SC1090
    source "$LIB1"
elif [ -f "$LIB2" ]; then
    echo "[start.sh] loading legacy .render_meta.sh"
    # shellcheck disable=SC1090
    source "$LIB2"
else
    echo "[start.sh] NO build-time bootstrap found. Falling back to local pyenv/venv heuristics + PATH search."
    CANDIDATE_PYENV="$SCRIPT_DIR/.pyenv_render"
    CANDIDATE_VENV="$SCRIPT_DIR/.venv_render"
    if [ -d "$CANDIDATE_PYENV" ]; then
        export PYENV_ROOT="$CANDIDATE_PYENV"
        export PATH="$CANDIDATE_PYENV/bin:$CANDIDATE_PYENV/shims:${PATH:-}"
        if [ -x "$CANDIDATE_PYENV/bin/pyenv" ] && [ -f "$SCRIPT_DIR/.python-version" ]; then
            "$CANDIDATE_PYENV/bin/pyenv" rehash 2>/dev/null || true
        fi
    fi
    if [ -d "$CANDIDATE_VENV" ]; then
        export VIRTUAL_ENV="$CANDIDATE_VENV"
        export PATH="$CANDIDATE_VENV/bin:${PATH:-}"
    fi
    hash -r 2>/dev/null || true
fi

echo "[start.sh] CWD = $(pwd)"
echo "[start.sh] PATH = $PATH"

PY=""
for p in \
    "$SCRIPT_DIR/.venv_render/bin/python" \
    "$SCRIPT_DIR/.venv_render/Scripts/python.exe" \
    "$SCRIPT_DIR/.pyenv_render/shims/python3" \
    "$SCRIPT_DIR/.pyenv_render/shims/python" \
    "$(command -v python3 2>/dev/null || true)" \
    "$(command -v python 2>/dev/null || true)" \
    "/opt/render/project/src/.venv/bin/python" \
    "/opt/render/project/src/.venv/bin/python3"; do
    if [ -n "${p:-}" ] && [ -x "$p" ]; then
        PY="$p"
        break
    fi
done

if [ -z "$PY" ]; then
    echo "[start.sh] ERROR: Could not locate any python executable. Dumping env:"
    env | sort
    ls -la "$SCRIPT_DIR" || true
    exit 127
fi

echo "[start.sh] Selected python: $PY"
"$PY" --version 2>&1
echo "[start.sh] Trying to import tensorflow & fastapi & uvicorn via this python..."
if ! "$PY" -c "import tensorflow, fastapi, uvicorn; print('[start.sh] imports OK: tf', tensorflow.__version__, 'fastapi', fastapi.__version__)" 2>&1; then
    echo "[start.sh] WARNING: Missing package(s). Retrying pip install from requirements.txt..."
    if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
        "$PY" -m pip install --no-cache-dir -r "$SCRIPT_DIR/requirements.txt" 2>&1 | tail -20 || \
            "$PY" -m pip install --no-cache-dir uvicorn fastapi pydantic tensorflow scikit-learn numpy pandas ucimlrepo 2>&1 | tail -20
    else
        "$PY" -m pip install --no-cache-dir uvicorn fastapi pydantic tensorflow scikit-learn numpy pandas ucimlrepo 2>&1 | tail -20
    fi
fi

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "[start.sh] Launching uvicorn via: $PY -m uvicorn main:app --host $HOST --port $PORT"
exec "$PY" -m uvicorn main:app --host "$HOST" --port "$PORT"
