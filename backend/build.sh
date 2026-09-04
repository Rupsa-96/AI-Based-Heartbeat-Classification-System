#!/usr/bin/env bash
set -euo pipefail

TARGET_PYTHON="3.11.9"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$( cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd )"

LOCAL_PYENV="$SCRIPT_DIR/.pyenv_render"
LOCAL_VENV="$SCRIPT_DIR/.venv_render"
LOCAL_LIB="$SCRIPT_DIR/.render_lib.sh"

echo "=== SCRIPT_DIR = $SCRIPT_DIR"
echo "=== REPO_ROOT  = $REPO_ROOT"
echo "=== PWD        = $(pwd)"
echo "=== LOCAL_PYENV = $LOCAL_PYENV"
echo "=== LOCAL_VENV  = $LOCAL_VENV"

mkdir -p "$LOCAL_PYENV"

ensure_pyenv_in_path() {
    export PYENV_ROOT="$LOCAL_PYENV"
    export PATH="$LOCAL_PYENV/bin:$LOCAL_PYENV/shims:$PATH"
}

CURRENT_PY="$(command -v python3 || command -v python)"
echo "=== Before: python = $CURRENT_PY"
"$CURRENT_PY" -c "import sys; print(f'=== Before: python version = {sys.version}')" || true

NEEDS_PYENV=0
if python3 -c "import sys; sys.exit(0 if (3,9) <= sys.version_info < (3,13) else 1)" 2>/dev/null; then
    echo "=== System Python is in [3.9, 3.13) — tensorflow supported. Will try it first."
else
    echo "=== System Python OUTSIDE [3.9, 3.13) — tensorflow NOT supported. Bootstrapping Python $TARGET_PYTHON via LOCAL pyenv."
    NEEDS_PYENV=1
fi

if [ "$NEEDS_PYENV" -eq 1 ]; then
    if [ ! -x "$LOCAL_PYENV/bin/pyenv" ]; then
        echo "=== Installing pyenv into $LOCAL_PYENV (ships with deployed app, survives build->runtime)..."
        rm -rf "$LOCAL_PYENV.tmp"
        git clone --depth 1 https://github.com/pyenv/pyenv.git "$LOCAL_PYENV.tmp"
        mv "$LOCAL_PYENV.tmp" "$LOCAL_PYENV"
    fi
    ensure_pyenv_in_path
    echo "=== pyenv = $(command -v pyenv), version = $(pyenv --version 2>&1 || true)"
    echo "=== Installing Python $TARGET_PYTHON into LOCAL pyenv (takes 1-3 min)..."
    PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install -s -k "$TARGET_PYTHON"
    echo "=== Activating Python $TARGET_PYTHON via pyenv local for $SCRIPT_DIR..."
    cd "$SCRIPT_DIR"
    pyenv local "$TARGET_PYTHON"
    pyenv rehash
fi

if [ "$NEEDS_PYENV" -eq 0 ]; then
    ensure_pyenv_in_path || true
fi

FINAL_PY="$(command -v python3 || command -v python)"
echo "=== After python detection: $FINAL_PY"
"$FINAL_PY" -c "import sys; print(f'=== After: python version = {sys.version}')"

if [ ! -d "$LOCAL_VENV" ] || [ ! -x "$LOCAL_VENV/bin/python" ]; then
    echo "=== Creating venv at $LOCAL_VENV using $FINAL_PY ..."
    "$FINAL_PY" -m venv "$LOCAL_VENV"
fi

export VIRTUAL_ENV="$LOCAL_VENV"
export PATH="$LOCAL_VENV/bin:${PATH:-}"
hash -r 2>/dev/null || true

echo "=== Venv python: $(command -v python)  $(python --version 2>&1)"
echo "=== Venv pip:    $(command -v pip)     $(pip --version 2>&1)"

echo "=== Installing Python dependencies ==="
pip install --no-cache-dir --upgrade pip setuptools wheel
pip install --no-cache-dir -r "$SCRIPT_DIR/requirements.txt"

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

echo "=== Writing runtime bootstrap library $LOCAL_LIB ==="
cat > "$LOCAL_LIB" <<LIBEOF
#!/usr/bin/env bash
SCRIPT_DIR_LIB="$SCRIPT_DIR"
LOCAL_PYENV_LIB="$LOCAL_PYENV"
LOCAL_VENV_LIB="$LOCAL_VENV"
TARGET_PYTHON_LIB="$TARGET_PYTHON"

export PYENV_ROOT="\${PYENV_ROOT:-\$LOCAL_PYENV_LIB}"
export VIRTUAL_ENV="\${VIRTUAL_ENV:-\$LOCAL_VENV_LIB}"
PATH="\$LOCAL_VENV_LIB/bin:\$LOCAL_PYENV_LIB/bin:\$LOCAL_PYENV_LIB/shims:\${PATH:-}"
export PATH

activate_render_env() {
    if [ -x "\$LOCAL_VENV_LIB/bin/python" ]; then
        return 0
    fi
    if [ -x "\$LOCAL_PYENV_LIB/bin/pyenv" ]; then
        (cd "\$SCRIPT_DIR_LIB" && "\$LOCAL_PYENV_LIB/bin/pyenv" local "\$TARGET_PYTHON_LIB" 2>/dev/null || true)
    fi
    if command -v python3 >/dev/null 2>&1; then
        if python3 -c "import sys; sys.exit(0 if (3,9) <= sys.version_info < (3,13) else 1)" 2>/dev/null; then
            if [ ! -d "\$LOCAL_VENV_LIB" ]; then
                python3 -m venv "\$LOCAL_VENV_LIB"
            fi
        fi
    fi
}

activate_render_env || true
hash -r 2>/dev/null || true
LIBEOF

echo "=== Wrote bootstrap library (start.sh sources this). ==="
echo "=== Build complete ==="
