#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

MODEL_DIR="${MODEL_DIR:-/opt/render/project/src/backend/model}"
DATA_DIR="${DATA_DIR:-/opt/render/project/src/backend/data}"

mkdir -p "$MODEL_DIR"
mkdir -p "$DATA_DIR"

MODEL_FILE="$MODEL_DIR/heart_disease_model.keras"

if [ -f "$MODEL_FILE" ]; then
    echo "=== Model already exists — skipping training ==="
else
    echo "=== Training DNN model (first deploy) ==="
    cd /opt/render/project/src

    python -c "
import os, sys
sys.path.insert(0, 'training')

model_dir = os.environ.get('MODEL_DIR', 'backend/model')
data_dir  = os.environ.get('DATA_DIR',  'backend/data')
os.makedirs(model_dir, exist_ok=True)
os.makedirs(data_dir,  exist_ok=True)

results_dir = os.path.join(os.path.dirname(model_dir), '..', 'results')
results_dir = os.path.abspath(results_dir)
os.makedirs(results_dir, exist_ok=True)

scaler_path = os.path.join(model_dir, 'scaler.pkl')
model_path  = os.path.join(model_dir, 'heart_disease_model.keras')
meta_path   = os.path.join(model_dir, 'feature_meta.json')

print('data_dir :', data_dir)
print('model_dir:', model_dir)

from training.preprocess import preprocess
X_train, X_val, X_test, y_train, y_val, y_test, scaler, feature_cols, class_counts = preprocess(
    data_dir=data_dir, scaler_path=scaler_path, fit_scaler=True
)

import json, numpy as np, tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

model = keras.Sequential([
    layers.Input(shape=(X_train.shape[1],)),
    layers.Dense(128), layers.BatchNormalization(), layers.Activation('relu'), layers.Dropout(0.30),
    layers.Dense(64),  layers.BatchNormalization(), layers.Activation('relu'), layers.Dropout(0.30),
    layers.Dense(32),  layers.BatchNormalization(), layers.Activation('relu'), layers.Dropout(0.20),
    layers.Dense(1, activation='sigmoid'),
], name='HeartDiseaseDNN')

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss='binary_crossentropy',
    metrics=['accuracy', keras.metrics.AUC(name='auc')],
)

total = len(y_train)
n_pos = int(y_train.sum())
n_neg = total - n_pos
class_weight = {0: total / (2.0 * n_neg), 1: total / (2.0 * n_pos)}

model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=200, batch_size=32,
    class_weight=class_weight,
    callbacks=[
        callbacks.EarlyStopping(monitor='val_loss', patience=20, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=10, min_lr=1e-6),
    ],
    verbose=1,
)

model.save(model_path)
print('Model saved:', model_path)

with open(meta_path, 'w') as f:
    json.dump({'feature_columns': feature_cols, 'class_counts': {str(k): int(v) for k, v in class_counts.items()}}, f)
print('Metadata saved:', meta_path)

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_curve, auc as sk_auc
y_prob = model.predict(X_test, verbose=0).flatten()
y_pred = (y_prob >= 0.5).astype(int)
fpr, tpr, _ = roc_curve(y_test, y_prob)
metrics = {
    'accuracy':  round(float(accuracy_score(y_test, y_pred)), 4),
    'precision': round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
    'recall':    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
    'f1':        round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
    'roc_auc':   round(float(sk_auc(fpr, tpr)), 4),
}
with open(os.path.join(results_dir, 'metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)
print('Metrics:', metrics)
print('Training complete.')
"
    cd backend
fi

echo "=== Build complete ==="
