#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

MODEL_DIR="${MODEL_DIR:-/var/data/model}"
DATA_DIR="${DATA_DIR:-/var/data}"

mkdir -p "$MODEL_DIR"
mkdir -p "$DATA_DIR"

MODEL_FILE="$MODEL_DIR/heart_disease_model.keras"

if [ -f "$MODEL_FILE" ]; then
    echo "=== Trained model found at $MODEL_FILE — skipping training ==="
else
    echo "=== No trained model found — running full training pipeline ==="
    cd ..
    python -c "
import os, sys
sys.path.insert(0, 'training')
sys.path.insert(0, 'backend')

model_dir = os.environ.get('MODEL_DIR', '/var/data/model')
data_dir  = os.environ.get('DATA_DIR',  '/var/data')
os.makedirs(model_dir, exist_ok=True)
os.makedirs(data_dir,  exist_ok=True)

scaler_path = os.path.join(model_dir, 'scaler.pkl')
model_path  = os.path.join(model_dir, 'heart_disease_model.keras')
results_dir = os.path.join(data_dir, 'results')
os.makedirs(results_dir, exist_ok=True)

from training.preprocess import preprocess
result = preprocess(data_dir=data_dir, scaler_path=scaler_path, fit_scaler=True)
X_train, X_val, X_test, y_train, y_val, y_test, scaler, feature_cols, class_counts = result

import json, numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

def build_model(input_dim):
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
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
    return model

input_dim = X_train.shape[1]
model = build_model(input_dim)

total = len(y_train)
n_pos = int(y_train.sum())
n_neg = total - n_pos
class_weight = {0: total / (2.0 * n_neg), 1: total / (2.0 * n_pos)}

early_stop = callbacks.EarlyStopping(monitor='val_loss', patience=20, restore_best_weights=True)
reduce_lr  = callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=10, min_lr=1e-6)

model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=200, batch_size=32,
    class_weight=class_weight,
    callbacks=[early_stop, reduce_lr],
    verbose=1,
)

model.save(model_path)
print(f'Model saved to {model_path}')

feature_meta = {
    'feature_columns': feature_cols,
    'class_counts': {str(k): int(v) for k, v in class_counts.items()},
}
meta_path = os.path.join(model_dir, 'feature_meta.json')
with open(meta_path, 'w') as f:
    json.dump(feature_meta, f, indent=2)
print(f'Feature metadata saved to {meta_path}')

y_pred = (model.predict(X_test, verbose=0).flatten() >= 0.5).astype(int)
y_prob = model.predict(X_test, verbose=0).flatten()
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import roc_curve, auc as sklearn_auc
acc  = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0)
rec  = recall_score(y_test, y_pred, zero_division=0)
f1   = f1_score(y_test, y_pred, zero_division=0)
fpr, tpr, _ = roc_curve(y_test, y_prob)
roc_auc = sklearn_auc(fpr, tpr)
metrics = {'accuracy': round(acc,4), 'precision': round(prec,4), 'recall': round(rec,4), 'f1': round(f1,4), 'roc_auc': round(roc_auc,4)}
with open(os.path.join(results_dir, 'metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=2)
print('Metrics:', metrics)
print('Training pipeline complete.')
"
    cd backend
fi

echo "=== Build complete ==="
