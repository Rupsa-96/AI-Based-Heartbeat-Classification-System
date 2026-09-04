import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

RANDOM_STATE = 42

FEATURE_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

TARGET_COLUMN = "target"

# continuous features that have a wide numeric range
NUMERICAL_FEATURES = ["age", "trestbps", "chol", "thalach", "oldpeak"]


def load_raw_dataset(data_dir):
    csv_path = os.path.join(data_dir, "heart.csv")

    if os.path.exists(csv_path):
        print(f"Loading dataset from {csv_path}")
        return pd.read_csv(csv_path)

    # try the official UCI repo package first
    try:
        from ucimlrepo import fetch_ucirepo
        print("Fetching dataset from UCI ML Repository...")
        heart_disease = fetch_ucirepo(id=45)
        X = heart_disease.data.features
        y = heart_disease.data.targets
        y = (y["num"] > 0).astype(int).rename("target")
        df = pd.concat([X, y], axis=1)
        cols_needed = FEATURE_COLUMNS + [TARGET_COLUMN]
        df = df[[c for c in cols_needed if c in df.columns]]
        df.to_csv(csv_path, index=False)
        print(f"Dataset saved to {csv_path}")
        return df
    except Exception as e:
        print(f"ucimlrepo failed: {e}")

    # fallback mirror on GitHub
    import urllib.request
    url = (
        "https://raw.githubusercontent.com/dsrscientist/"
        "dataset1/master/heart_disease.csv"
    )
    print(f"Downloading from {url}...")
    urllib.request.urlretrieve(url, csv_path)
    df = pd.read_csv(csv_path)
    print(f"Dataset saved to {csv_path}")
    return df


def preprocess(data_dir, val_size=0.15, test_size=0.15, scaler_path=None, fit_scaler=True):
    df = load_raw_dataset(data_dir)

    print(f"\nRaw dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # normalise column names
    df.columns = [c.lower().strip() for c in df.columns]

    rename_map = {
        "num": TARGET_COLUMN,
        "condition": TARGET_COLUMN,
        "heart_disease": TARGET_COLUMN,
    }
    df.rename(columns=rename_map, inplace=True)

    # keep only the columns we actually need
    expected_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    df = df[[c for c in expected_cols if c in df.columns]].copy()

    # binarise: original scale is 0-4, we only care about 0 vs not-0
    df[TARGET_COLUMN] = (df[TARGET_COLUMN] > 0).astype(int)

    print("Target binarised: 0 = no disease, 1 = disease")
    print("Missing values per column:")
    print(df.isnull().sum())

    # fill missing values — median for continuous, mode for categorical
    for col in df.columns:
        if df[col].isnull().any():
            if col in NUMERICAL_FEATURES:
                med = df[col].median()
                df[col].fillna(med, inplace=True)
                print(f"  {col}: filled with median={med:.2f}")
            else:
                mode_val = df[col].mode()[0]
                df[col].fillna(mode_val, inplace=True)
                print(f"  {col}: filled with mode={mode_val}")

    for col in FEATURE_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df.dropna(inplace=True)

    print(f"\nAfter cleaning: {df.shape[0]} samples")

    class_counts = df[TARGET_COLUMN].value_counts().to_dict()
    total = sum(class_counts.values())
    print("Class distribution:")
    for k, v in class_counts.items():
        label = "No Disease" if k == 0 else "Disease"
        print(f"  {k} ({label}): {v} ({100*v/total:.1f}%)")

    feature_cols = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[feature_cols].values.astype(np.float32)
    y = df[TARGET_COLUMN].values.astype(np.float32)

    # split off test set first, then validation from the remaining portion
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE, stratify=y
    )
    val_fraction = val_size / (1.0 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_fraction, random_state=RANDOM_STATE, stratify=y_temp
    )

    print(f"\nSplit sizes:")
    print(f"  Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}")

    # fit the scaler only on training data to prevent data leakage
    if fit_scaler:
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        print("StandardScaler fitted on training data only.")
    else:
        if scaler_path and os.path.exists(scaler_path):
            with open(scaler_path, "rb") as f:
                scaler = pickle.load(f)
            print(f"Loaded existing scaler from {scaler_path}")
        else:
            raise FileNotFoundError(f"Scaler not found at {scaler_path}")

    X_val = scaler.transform(X_val)
    X_test = scaler.transform(X_test)

    if fit_scaler and scaler_path:
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        with open(scaler_path, "wb") as f:
            pickle.dump(scaler, f)
        print(f"Scaler saved to {scaler_path}")

    return (
        X_train, X_val, X_test,
        y_train, y_val, y_test,
        scaler, feature_cols, class_counts
    )


def preprocess_single(patient_dict, scaler, feature_cols):
    row = [float(patient_dict[col]) for col in feature_cols]
    arr = np.array(row, dtype=np.float32).reshape(1, -1)
    return scaler.transform(arr)


if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base, "data")
    scaler_path = os.path.join(base, "backend", "model", "scaler.pkl")

    results = preprocess(data_dir=data_dir, scaler_path=scaler_path, fit_scaler=True)
    X_train, X_val, X_test, y_train, y_val, y_test, scaler, features, counts = results

    print("\nPreprocessing done.")
    print(f"X_train: {X_train.shape}, X_val: {X_val.shape}, X_test: {X_test.shape}")
    print(f"Features: {features}")
