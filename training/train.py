import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocess import preprocess

# make runs reproducible
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR    = os.path.join(BASE_DIR, "data")
MODEL_PATH  = os.path.join(BASE_DIR, "backend", "model", "heart_disease_model.keras")
SCALER_PATH = os.path.join(BASE_DIR, "backend", "model", "scaler.pkl")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# hyperparameters
LEARNING_RATE = 1e-3
BATCH_SIZE    = 32
EPOCHS        = 200
PATIENCE      = 20
DROPOUT_1     = 0.30
DROPOUT_2     = 0.30
DROPOUT_3     = 0.20


def build_model(input_dim):
    model = keras.Sequential(
        [
            layers.Input(shape=(input_dim,), name="input_layer"),

            layers.Dense(128, name="dense_1"),
            layers.BatchNormalization(name="bn_1"),
            layers.Activation("relu", name="relu_1"),
            layers.Dropout(DROPOUT_1, name="dropout_1"),

            layers.Dense(64, name="dense_2"),
            layers.BatchNormalization(name="bn_2"),
            layers.Activation("relu", name="relu_2"),
            layers.Dropout(DROPOUT_2, name="dropout_2"),

            layers.Dense(32, name="dense_3"),
            layers.BatchNormalization(name="bn_3"),
            layers.Activation("relu", name="relu_3"),
            layers.Dropout(DROPOUT_3, name="dropout_3"),

            layers.Dense(1, activation="sigmoid", name="output_layer"),
        ],
        name="HeartDiseaseDNN",
    )

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
            keras.metrics.AUC(name="auc"),
        ],
    )
    return model


def get_callbacks():
    early_stop = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=PATIENCE,
        restore_best_weights=True,
        verbose=1,
    )
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=10,
        min_lr=1e-6,
        verbose=1,
    )
    return [early_stop, reduce_lr]


def train():
    print("Heart Disease DNN - Training")
    print("=" * 40)

    (
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        scaler, feature_cols, class_counts,
    ) = preprocess(data_dir=DATA_DIR, scaler_path=SCALER_PATH, fit_scaler=True)

    input_dim = X_train.shape[1]
    print(f"Input features: {input_dim}")
    print(f"Feature order: {feature_cols}")

    # save feature metadata so the backend knows the expected column order
    feature_meta = {
        "feature_columns": feature_cols,
        "class_counts": {str(k): int(v) for k, v in class_counts.items()},
    }
    meta_path = os.path.join(os.path.dirname(MODEL_PATH), "feature_meta.json")
    with open(meta_path, "w") as f:
        json.dump(feature_meta, f, indent=2)
    print(f"Feature metadata saved to {meta_path}")

    model = build_model(input_dim)
    model.summary()

    # weight each class inversely proportional to its frequency
    total = len(y_train)
    n_pos = int(y_train.sum())
    n_neg = total - n_pos
    class_weight = {
        0: total / (2.0 * n_neg),
        1: total / (2.0 * n_pos),
    }
    print(f"Class weights: {class_weight}")

    print("\nStarting training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weight,
        callbacks=get_callbacks(),
        verbose=1,
    )

    print(f"\nTraining finished at epoch {len(history.history['loss'])}")

    print("\nEvaluating on test set...")
    test_results = model.evaluate(X_test, y_test, verbose=0)
    metrics_names = model.metrics_names
    test_metrics = dict(zip(metrics_names, test_results))
    print("\nTest metrics:")
    for name, val in test_metrics.items():
        print(f"  {name}: {val:.4f}")

    model.save(MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

    history_path = os.path.join(RESULTS_DIR, "training_history.json")
    with open(history_path, "w") as f:
        json.dump({k: [float(v) for v in vals]
                   for k, vals in history.history.items()}, f, indent=2)
    print(f"Training history saved to {history_path}")

    np.save(os.path.join(RESULTS_DIR, "X_test.npy"), X_test)
    np.save(os.path.join(RESULTS_DIR, "y_test.npy"), y_test)
    print(f"Test arrays saved to {RESULTS_DIR}")

    return model, history, test_metrics


if __name__ == "__main__":
    model, history, test_metrics = train()
    print("\nDone. Run 'python training/evaluate.py' to generate evaluation plots.")
