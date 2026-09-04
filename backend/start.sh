
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

PY_STANDALONE="$SCRIPT_DIR/.python_standalone/bin/python3"
VENV_PY="$SCRIPT_DIR/.venv_render/bin/python"
LIB1="$SCRIPT_DIR/.render_lib.sh"
LIB2="$SCRIPT_DIR/.render_meta.sh"

echo "[start.sh] CWD = $(pwd)"
echo "[start.sh] SCRIPT_DIR = $SCRIPT_DIR"


if [ -f "$LIB1" ]; then
    echo "[start.sh] loading .render_lib.sh (build-time bootstrap)"
    
    source "$LIB1"
elif [ -f "$LIB2" ]; then
    echo "[start.sh] loading legacy .render_meta.sh"
    
    source "$LIB2"
fi


if [ -x "$SCRIPT_DIR/.venv_render/bin/python" ]; then
    export VIRTUAL_ENV="${VIRTUAL_ENV:-$SCRIPT_DIR/.venv_render}"
    export PATH="$SCRIPT_DIR/.venv_render/bin:$PATH"
fi
if [ -d "$SCRIPT_DIR/.python_standalone/lib" ]; then
    export LD_LIBRARY_PATH="$SCRIPT_DIR/.python_standalone/lib:${LD_LIBRARY_PATH:-}"
fi
if [ -d "$SCRIPT_DIR/.python_standalone/bin" ]; then
    export PATH="$SCRIPT_DIR/.python_standalone/bin:$PATH"
fi
unset PYTHONHOME
hash -r 2>/dev/null || true

echo "[start.sh] PATH = $PATH"

PY=""
for p in \
    "$VENV_PY" \
    "$PY_STANDALONE" \
    "$SCRIPT_DIR/.venv_render/Scripts/python.exe" \
    "$SCRIPT_DIR/.python_standalone/bin/python" \
    "$SCRIPT_DIR/.pyenv_render/shims/python3" \
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
    echo "[start.sh] ERROR: No python binary found anywhere. Dumping dirs:"
    ls -la "$SCRIPT_DIR" || true
    ls -la "$SCRIPT_DIR/.venv_render/bin" 2>/dev/null || echo "no .venv_render/bin"
    ls -la "$SCRIPT_DIR/.python_standalone/bin" 2>/dev/null || echo "no .python_standalone/bin"
    env | sort
    exit 127
fi

echo "[start.sh] Selected python = $PY"
"$PY" -c "import sys; print(f'[start.sh] python version = {sys.version}'); print(f'[start.sh] prefix = {sys.prefix}'); print(f'[start.sh] executable = {sys.executable}')"

echo "[start.sh] Checking critical imports (tensorflow, fastapi, uvicorn)..."
if ! "$PY" -c "import tensorflow as tf; import fastapi; import uvicorn; import sklearn, numpy, pandas; print(f'[start.sh] imports OK -> tensorflow', tf.__version__, 'fastapi', fastapi.__version__, 'numpy', numpy.__version__)" 2>&1; then
    echo "[start.sh] WARNING: some imports missing. Attempting pip install fix..."
    if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
        "$PY" -m pip install --no-cache-dir --upgrade pip setuptools wheel
        "$PY" -m pip install --no-cache-dir -r "$SCRIPT_DIR/requirements.txt" 2>&1 | tail -30 || \
            "$PY" -m pip install --no-cache-dir uvicorn fastapi pydantic tensorflow scikit-learn numpy pandas ucimlrepo 2>&1 | tail -30
    else
        "$PY" -m pip install --no-cache-dir --upgrade pip setuptools wheel
        "$PY" -m pip install --no-cache-dir uvicorn fastapi pydantic tensorflow scikit-learn numpy pandas ucimlrepo 2>&1 | tail -30
    fi
fi

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "[start.sh] Running: exec $PY -m uvicorn main:app --host $HOST --port $PORT"
cd "$SCRIPT_DIR"
exec "$PY" -m uvicorn main:app --host "$HOST" --port "$PORT"
