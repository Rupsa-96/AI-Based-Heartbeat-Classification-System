#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$( cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd )"

echo "=== SCRIPT_DIR = $SCRIPT_DIR"
echo "=== REPO_ROOT  = $REPO_ROOT"
echo "=== PWD        = $(pwd)"

echo "=== Installing Python dependencies ==="
pip install --no-cache-dir --upgrade pip setuptools wheel
pip install --no-cache-dir -r "$SCRIPT_DIR/requirements.txt"

MODEL_DIR="${MODEL_DIR:-$SCRIPT_DIR/model}"
DATA_DIR="${DATA_DIR:-$REPO_ROOT/data}"

mkdir -p "$MODEL_DIR"
mkdir -p "$DATA_DIR"

MODEL_FILE="$MODEL_DIR/heart_disease_model.keras"

if [ -f "$MODEL_FILE" ]; then
    echo "=== Model already exists at $MODEL_FILE — skipping training ==="
else
    echo "=== Training DNN model (first deploy) ==="
    cd "$REPO_ROOT"

    python - <<'PYEOF'
import os, sys, json, warnings
warnings.filterwarnings("ignore")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

sys.path.insert(0, "training")

script_dir = os.path.dirname(os.path.abspath(os.environ.get("RENDER_BUILD_SCRIPT", "backend/build.sh")))
repo_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == "backend" else script_dir

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

echo "=== Build complete ==="
