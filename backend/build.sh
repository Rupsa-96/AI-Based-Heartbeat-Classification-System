
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$( cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd )"

PY_STANDALONE_DIR="$SCRIPT_DIR/.python_standalone"
VENV_DIR="$SCRIPT_DIR/.venv_render"
RENDER_LIB="$SCRIPT_DIR/.render_lib.sh"


PY_ARCHIVE="cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz"
PY_URL="https://github.com/indygreg/python-build-standalone/releases/download/20240726/$PY_ARCHIVE"
PY_SHA256="496adbb00c198a44d9e667f71be9e51b9f7310c84b76a286a2b6c5f57b25b2e6"

echo "=== SCRIPT_DIR   = $SCRIPT_DIR"
echo "=== REPO_ROOT    = $REPO_ROOT"
echo "=== PWD          = $(pwd)"
echo "=== PY_STANDALONE= $PY_STANDALONE_DIR"
echo "=== VENV_DIR     = $VENV_DIR"

UNAME_M="$(uname -m 2>/dev/null || echo x86_64)"
UNAME_S="$(uname -s 2>/dev/null || echo Linux)"
echo "=== System:      = $UNAME_S $UNAME_M"

CURRENT_PY="$(command -v python3 2>/dev/null || command -v python 2>/dev/null || true)"
echo "=== System python: ${CURRENT_PY:-none}"
[ -n "${CURRENT_PY:-}" ] && "$CURRENT_PY" -c "import sys; print(f'=== System python version = {sys.version}')" 2>/dev/null || true

if [ ! -x "$PY_STANDALONE_DIR/bin/python3" ]; then
    echo "=== Downloading standalone Python 3.11.9 (indygreg build, <30s)..."
    mkdir -p "$PY_STANDALONE_DIR"
    TMP_TAR="$SCRIPT_DIR/.python_standalone.tmp.tar.gz"
    rm -f "$TMP_TAR"

    DL_OK=0
    for dl_cmd in \
        "curl -fsSL -o $TMP_TAR $PY_URL" \
        "wget -q -O $TMP_TAR $PY_URL" \
        "python3 -c \"import urllib.request; urllib.request.urlretrieve('$PY_URL', '$TMP_TAR')\"" \
        "python  -c \"import urllib.request; urllib.request.urlretrieve('$PY_URL', '$TMP_TAR')\""; do
        echo "--- Trying: $dl_cmd"
        if eval "$dl_cmd" && [ -s "$TMP_TAR" ]; then
            DL_OK=1
            break
        fi
        echo "--- command failed, trying next..."
    done

    if [ "$DL_OK" -ne 1 ] || [ ! -s "$TMP_TAR" ]; then
        echo "=== FAIL: could not download standalone python. Trying last-resort: curl with verbose:"
        curl -v -o "$TMP_TAR" "$PY_URL" || true
        ls -la "$SCRIPT_DIR" || true
        exit 1
    fi

    echo "=== Extracting standalone python..."
    EX_TMP="$SCRIPT_DIR/.python_standalone.extract.tmp"
    rm -rf "$EX_TMP"
    mkdir -p "$EX_TMP"
    tar -xzf "$TMP_TAR" -C "$EX_TMP"

    # Archive root contains a 'python' subdir; move contents up
    if [ -d "$EX_TMP/python" ]; then
        mv "$EX_TMP/python/"* "$PY_STANDALONE_DIR/"
    else
        mv "$EX_TMP/"* "$PY_STANDALONE_DIR/"
    fi
    rm -rf "$EX_TMP" "$TMP_TAR"
    chmod +x "$PY_STANDALONE_DIR/bin/python3" "$PY_STANDALONE_DIR/bin/python" "$PY_STANDALONE_DIR/bin/pip"* 2>/dev/null || true
fi

export PATH="$PY_STANDALONE_DIR/bin:$PATH"
hash -r 2>/dev/null || true

PY="$PY_STANDALONE_DIR/bin/python3"
echo "=== Standalone python binary: $PY"
"$PY" -c "import sys; print(f'=== Standalone python version = {sys.version}'); print(f'=== prefix = {sys.prefix}')"

if [ ! -d "$VENV_DIR" ] || [ ! -x "$VENV_DIR/bin/python" ]; then
    echo "=== Creating dedicated venv at $VENV_DIR ..."
    "$PY" -m venv "$VENV_DIR" --without-pip --system-site-packages || "$PY" -m venv "$VENV_DIR"
fi

export VIRTUAL_ENV="$VENV_DIR"
export PATH="$VENV_DIR/bin:$PY_STANDALONE_DIR/bin:$PATH"
hash -r 2>/dev/null || true

echo "=== Venv python: $(command -v python)  $(python --version 2>&1)"
echo "=== Venv pip:    $(command -v pip 2>/dev/null || echo via python -m pip)"

if ! python -m pip --version >/dev/null 2>&1; then
    echo "=== Bootstrapping pip inside venv via ensurepip..."
    python -m ensurepip --upgrade || "$PY" -m ensurepip --upgrade --default-pip
    python -m pip install --no-cache-dir --upgrade pip setuptools wheel
fi

echo "=== Installing Python dependencies ==="
python -m pip install --no-cache-dir --upgrade pip setuptools wheel
python -m pip install --no-cache-dir -r "$SCRIPT_DIR/requirements.txt"

MODEL_DIR="${MODEL_DIR:-$SCRIPT_DIR/model}"
DATA_DIR="${DATA_DIR:-$REPO_ROOT/data}"
mkdir -p "$MODEL_DIR" "$DATA_DIR"

MODEL_FILE="$MODEL_DIR/heart_disease_model.keras"

if [ -f "$MODEL_FILE" ]; then
    echo "=== Model already exists at $MODEL_FILE — skipping training ==="
else
    echo "=== Training DNN model (first deploy) ==="
    cd "$REPO_ROOT"
    MODEL_DIR="$MODEL_DIR" DATA_DIR="$DATA_DIR" python - <<'PYEOF'
import os, sys, json, warnings
warnings.filterwarnings("ignore")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

sys.path.insert(0, "training")

cwd = os.getcwd()
repo_root = cwd
for _ in range(2):
    if os.path.isdir(os.path.join(repo_root, "training")) and os.path.isdir(os.path.join(repo_root, "backend")):
        break
    repo_root = os.path.dirname(repo_root)

model_dir = os.environ.get("MODEL_DIR", os.path.join(repo_root, "backend", "model"))
data_dir  = os.environ.get("DATA_DIR",  os.path.join(repo_root, "data"))
os.makedirs(model_dir, exist_ok=True)
os.makedirs(data_dir,  exist_ok=True)

results_dir = os.path.join(repo_root, "results")
os.makedirs(results_dir, exist_ok=True)

scaler_path = os.path.join(model_dir, "scaler.pkl")
model_path  = os.path.join(model_dir, "heart_disease_model.keras")
meta_path   = os.path.join(model_dir, "feature_meta.json")

print("[1/4] Preprocessing data from", data_dir, flush=True)
from training.preprocess import preprocess
X_train, X_val, X_test, y_train, y_val, y_test, scaler, feature_cols, class_counts = preprocess(
    data_dir=data_dir, scaler_path=scaler_path, fit_scaler=True
)

print("[2/4] Building DNN model", flush=True)
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

tf.get_logger().setLevel("ERROR")

model = keras.Sequential([
    layers.Input(shape=(X_train.shape[1],)),
    layers.Dense(128), layers.BatchNormalization(), layers.Activation("relu"), layers.Dropout(0.30),
    layers.Dense(64),  layers.BatchNormalization(), layers.Activation("relu"), layers.Dropout(0.30),
    layers.Dense(32),  layers.BatchNormalization(), layers.Activation("relu"), layers.Dropout(0.20),
    layers.Dense(1, activation="sigmoid"),
], name="HeartDiseaseDNN")

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy", keras.metrics.AUC(name="auc")],
)

total = int(len(y_train))
n_pos = int(y_train.sum())
n_neg = total - n_pos
class_weight = {0: total / (2.0 * n_neg), 1: total / (2.0 * n_pos)}

print("[3/4] Training (max 80 epochs, Render-safe)...", flush=True)
model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=80,
    batch_size=32,
    class_weight=class_weight,
    callbacks=[
        callbacks.EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, min_lr=1e-6, verbose=1),
    ],
    verbose=2,
)

model.save(model_path)
print("Model saved:", model_path, flush=True)

with open(meta_path, "w") as f:
    json.dump({
        "feature_columns": feature_cols,
        "class_counts": {str(k): int(v) for k, v in class_counts.items()}
    }, f)
print("Metadata saved:", meta_path, flush=True)

print("[4/4] Evaluating on test set...", flush=True)
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_curve, auc as sk_auc
y_prob = model.predict(X_test, verbose=0).flatten()
y_pred = (y_prob >= 0.5).astype(int)
fpr, tpr, _ = roc_curve(y_test, y_prob)
metrics = {
    "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
    "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
    "recall":    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
    "f1":        round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
    "roc_auc":   round(float(sk_auc(fpr, tpr)), 4),
}
with open(os.path.join(results_dir, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=2)
print("Test metrics:", metrics, flush=True)
print("Training complete.", flush=True)
PYEOF
fi

echo "=== Writing runtime bootstrap library $RENDER_LIB ==="
cat > "$RENDER_LIB" <<LIBEOF
#!/usr/bin/env bash
# Generated by build.sh. Source this in start.sh to get the exact same runtime.
SCRIPT_DIR_LIB="$SCRIPT_DIR"
PY_STANDALONE_DIR_LIB="$PY_STANDALONE_DIR"
VENV_DIR_LIB="$VENV_DIR"

export PYTHONHOME=""
export VIRTUAL_ENV="\${VIRTUAL_ENV:-\$VENV_DIR_LIB}"
export PATH="\$VENV_DIR_LIB/bin:\$PY_STANDALONE_DIR_LIB/bin:\${PATH:-}"
export LD_LIBRARY_PATH="\$PY_STANDALONE_DIR_LIB/lib:\${LD_LIBRARY_PATH:-}"
hash -r 2>/dev/null || true
LIBEOF

echo "=== Wrote bootstrap library (start.sh sources this). ==="
echo "=== Build complete ==="
