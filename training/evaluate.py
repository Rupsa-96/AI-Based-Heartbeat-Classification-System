import os
import sys
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, classification_report,
)

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH   = os.path.join(BASE_DIR, "backend", "model", "heart_disease_model.keras")
RESULTS_DIR  = os.path.join(BASE_DIR, "results")
HISTORY_PATH = os.path.join(RESULTS_DIR, "training_history.json")
X_TEST_PATH  = os.path.join(RESULTS_DIR, "X_test.npy")
Y_TEST_PATH  = os.path.join(RESULTS_DIR, "y_test.npy")

sns.set_theme(style="whitegrid", palette="muted")
PLOT_DPI = 150


def save_fig(fig, filename):
    path = os.path.join(RESULTS_DIR, filename)
    fig.savefig(path, dpi=PLOT_DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


def plot_training_curves(history):
    epochs = range(1, len(history["accuracy"]) + 1)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, history["accuracy"], label="Train Accuracy", linewidth=2)
    ax.plot(epochs, history["val_accuracy"], label="Validation Accuracy", linewidth=2, linestyle="--")
    ax.set_title("Training vs Validation Accuracy", fontsize=14, fontweight="bold")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Accuracy")
    ax.legend()
    ax.set_ylim([0, 1.05])
    save_fig(fig, "accuracy_curve.png")

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, history["loss"], label="Train Loss", linewidth=2, color="tomato")
    ax.plot(epochs, history["val_loss"], label="Validation Loss", linewidth=2, linestyle="--", color="darkorange")
    ax.set_title("Training vs Validation Loss", fontsize=14, fontweight="bold")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Binary Cross-Entropy Loss")
    ax.legend()
    save_fig(fig, "loss_curve.png")


def plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    labels = ["No Disease", "Disease"]

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=labels, yticklabels=labels, ax=axes[0],
                linewidths=0.5, linecolor="gray")
    axes[0].set_title("Confusion Matrix (Counts)", fontsize=13, fontweight="bold")
    axes[0].set_xlabel("Predicted Label")
    axes[0].set_ylabel("True Label")

    sns.heatmap(cm_norm, annot=True, fmt=".2%", cmap="Greens",
                xticklabels=labels, yticklabels=labels, ax=axes[1],
                linewidths=0.5, linecolor="gray")
    axes[1].set_title("Confusion Matrix (Normalised)", fontsize=13, fontweight="bold")
    axes[1].set_xlabel("Predicted Label")
    axes[1].set_ylabel("True Label")

    plt.tight_layout()
    save_fig(fig, "confusion_matrix.png")
    return cm


def plot_roc_curve(y_true, y_prob):
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot(fpr, tpr, color="steelblue", lw=2, label=f"ROC Curve (AUC = {roc_auc:.3f})")
    ax.plot([0, 1], [0, 1], color="gray", lw=1, linestyle="--", label="Random Classifier")
    ax.fill_between(fpr, tpr, alpha=0.1, color="steelblue")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curve", fontsize=13, fontweight="bold")
    ax.legend(loc="lower right")
    save_fig(fig, "roc_curve.png")
    return roc_auc


def plot_metrics_bar(metrics):
    keys   = ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"]
    values = [metrics["accuracy"], metrics["precision"],
              metrics["recall"], metrics["f1"], metrics["roc_auc"]]
    colors = ["#4C72B0", "#55A868", "#C44E52", "#8172B2", "#CCB974"]

    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(keys, values, color=colors, width=0.5, edgecolor="white")
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.01,
                f"{val:.3f}", ha="center", va="bottom", fontsize=11)
    ax.set_ylim([0, 1.15])
    ax.set_title("Evaluation Metrics on Test Set", fontsize=13, fontweight="bold")
    ax.set_ylabel("Score")
    save_fig(fig, "metrics_summary.png")


def evaluate():
    print("Heart Disease DNN - Evaluation")
    print("=" * 40)

    print("Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH)

    print("Loading test data...")
    X_test = np.load(X_TEST_PATH)
    y_test = np.load(Y_TEST_PATH)

    print("Loading training history...")
    with open(HISTORY_PATH) as f:
        history = json.load(f)

    y_prob = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_prob >= 0.5).astype(int)

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_auc = auc(fpr, tpr)

    metrics = {
        "accuracy":  acc,
        "precision": prec,
        "recall":    rec,
        "f1":        f1,
        "roc_auc":   roc_auc,
    }

    print("\nResults (test set):")
    print(f"  Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")

    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))

    metrics_json_path = os.path.join(RESULTS_DIR, "metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump({k: round(float(v), 4) for k, v in metrics.items()}, f, indent=2)
    print(f"Metrics saved to {metrics_json_path}")

    print("\nGenerating plots...")
    plot_training_curves(history)
    cm = plot_confusion_matrix(y_test, y_pred)
    plot_roc_curve(y_test, y_prob)
    plot_metrics_bar(metrics)

    tn, fp, fn, tp = cm.ravel()
    print(f"\nConfusion matrix breakdown:")
    print(f"  True Negatives:  {tn}")
    print(f"  False Positives: {fp}")
    print(f"  False Negatives: {fn}")
    print(f"  True Positives:  {tp}")

    print("\nAll plots saved to results/")
    return metrics


if __name__ == "__main__":
    evaluate()
