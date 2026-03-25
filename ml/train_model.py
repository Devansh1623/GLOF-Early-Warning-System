"""
ML Risk Model Training Script for GLOF EWS.

Generates synthetic training data → trains XGBoost classifier + Isolation Forest anomaly detector.
Saves models to backend/models/

Run:  python train_model.py
"""
import os
import json
import random
import math
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.ensemble import IsolationForest
import xgboost as xgb
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ─── Synthetic Dataset Generation ─────────────────────────────────────────────
def label_from_thresholds(temp, rainfall, wl_rise, velocity):
    """
    Ground-truth labelling — same logic as formula-based engine so the
    ML model learns to replicate and generalise it.
    """
    score = 0
    if wl_rise > 250: score += 40
    elif wl_rise > 150: score += 30
    elif wl_rise > 80: score += 20
    elif wl_rise > 40: score += 10

    if rainfall > 100: score += 30
    elif rainfall > 50: score += 20
    elif rainfall > 20: score += 10

    if temp > 20: score += 20
    elif temp > 10: score += 10
    elif temp > 4: score += 5

    if velocity > 5: score += 10
    elif velocity > 2: score += 5

    if score >= 75: return "Critical"
    if score >= 55: return "High"
    if score >= 30: return "Moderate"
    return "Low"


def generate_dataset(n_samples: int = 12000) -> pd.DataFrame:
    rows = []
    for _ in range(n_samples):
        # Normal readings (60%)
        if random.random() < 0.60:
            temp = random.gauss(8, 6)
            rainfall = random.expovariate(0.1)
            wl_rise = random.uniform(5, 60)
            velocity = random.gauss(0.2, 0.5)
        # Rising events (25%)
        elif random.random() < 0.70:
            temp = random.gauss(14, 5)
            rainfall = random.uniform(30, 120)
            wl_rise = random.uniform(40, 200)
            velocity = random.uniform(1, 8)
        # Critical events (15%)
        else:
            temp = random.uniform(18, 30)
            rainfall = random.uniform(80, 300)
            wl_rise = random.uniform(150, 400)
            velocity = random.uniform(5, 20)

        # Clamp
        temp = max(-20, min(35, temp))
        rainfall = max(0, min(500, rainfall))
        wl_rise = max(0, min(400, wl_rise))
        velocity = max(-2, min(25, velocity))

        # Hour of day (diurnal effect)
        hour = random.randint(0, 23)

        label = label_from_thresholds(temp, rainfall, wl_rise, velocity)

        rows.append({
            "temperature": round(temp, 2),
            "rainfall": round(rainfall, 2),
            "water_level_rise": round(wl_rise, 2),
            "velocity": round(velocity, 3),
            "hour_of_day": hour,
            "label": label,
        })

    return pd.DataFrame(rows)


# ─── Train XGBoost ────────────────────────────────────────────────────────────
def train_xgboost(df: pd.DataFrame):
    features = ["temperature", "rainfall", "water_level_rise", "velocity", "hour_of_day"]
    X = df[features].values
    y = df["label"].values

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.85,
        colsample_bytree=0.85,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, verbose=False)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[XGB] Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    return model, le, features


# ─── Train Anomaly Detector ───────────────────────────────────────────────────
def train_anomaly_detector(df: pd.DataFrame, features: list):
    """Isolation Forest for sensor anomaly detection."""
    X = df[features].values
    clf = IsolationForest(
        n_estimators=100,
        contamination=0.05,   # expect ~5% anomalies
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X)
    print(f"\n[IForest] Fitted on {len(X)} samples (contamination=0.05)")
    return clf


# ─── Save ─────────────────────────────────────────────────────────────────────
def save_models(model, le, iso_forest, features):
    joblib.dump(model, os.path.join(MODELS_DIR, "risk_model.pkl"))
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    joblib.dump(iso_forest, os.path.join(MODELS_DIR, "anomaly_detector.pkl"))

    meta = {
        "features": features,
        "classes": list(le.classes_),
        "model_type": "XGBClassifier",
        "anomaly_model": "IsolationForest",
        "trained_at": pd.Timestamp.utcnow().isoformat(),
    }
    with open(os.path.join(MODELS_DIR, "model_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[SAVE] Models written to {MODELS_DIR}/")


if __name__ == "__main__":
    print("[GEN] Generating synthetic dataset...")
    df = generate_dataset(12000)
    print(f"[GEN] {len(df)} rows | Label distribution:\n{df['label'].value_counts()}")

    print("\n[TRAIN] XGBoost Risk Classifier...")
    model, le, features = train_xgboost(df)

    print("\n[TRAIN] Isolation Forest Anomaly Detector...")
    iso = train_anomaly_detector(df, features)

    save_models(model, le, iso, features)
    print("\n[DONE] Training complete.")
