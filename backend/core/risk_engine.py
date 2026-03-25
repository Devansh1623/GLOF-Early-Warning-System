"""
GLOF Risk Calculation Engine — v2 with ML inference wrapper.

Primary:  XGBoost classifier (when model file exists)
Fallback: Weighted formula (Costa 1988 approach)
          Risk = 0.35*ΔT_norm + 0.30*R_norm + 0.35*WL_norm

Anomaly Detection: Isolation Forest for sensor health
"""
import os
import json
import logging

logger = logging.getLogger("glof.risk_engine")

# --- Thresholds & Weights ---
TEMP_BASELINE        = 2.0      # °C — below this, minimal melt contribution
TEMP_CRITICAL        = 20.0    # °C — above this, max temp contribution
RAINFALL_CRITICAL    = 100.0   # mm/day
WATER_LEVEL_CRITICAL = 300.0   # cm

W_TEMP  = 0.35
W_RAIN  = 0.30
W_LEVEL = 0.35

# Empirical peak-discharge coefficients (Costa 1988, moraine dams)
COSTA_ALPHA = 0.063
COSTA_BETA  = 0.84

# ML model globals (loaded once at startup)
_xgb_model   = None
_label_enc   = None
_iso_forest  = None
_ml_features = None
_ml_classes  = None
_ml_ready    = False

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def _load_ml_models():
    """Load XGBoost + Isolation Forest from disk (best-effort)."""
    global _xgb_model, _label_enc, _iso_forest, _ml_features, _ml_classes, _ml_ready
    try:
        import joblib

        model_path  = os.path.join(MODELS_DIR, "risk_model.pkl")
        enc_path    = os.path.join(MODELS_DIR, "label_encoder.pkl")
        iso_path    = os.path.join(MODELS_DIR, "anomaly_detector.pkl")
        meta_path   = os.path.join(MODELS_DIR, "model_meta.json")

        if not all(os.path.exists(p) for p in [model_path, enc_path, meta_path]):
            logger.info("ML models not found — using formula engine")
            return

        _xgb_model  = joblib.load(model_path)
        _label_enc  = joblib.load(enc_path)
        _ml_features = json.load(open(meta_path))["features"]
        _ml_classes  = list(_label_enc.classes_)

        if os.path.exists(iso_path):
            _iso_forest = joblib.load(iso_path)

        _ml_ready = True
        logger.info(f"ML models loaded — features: {_ml_features}, classes: {_ml_classes}")

    except Exception as exc:
        logger.warning(f"ML model load failed ({exc}) — falling back to formula")


# Load on import
_load_ml_models()


def _normalize(value, lower, upper):
    """Clamp and normalize value to 0–1 range."""
    clamped = max(lower, min(value, upper))
    return (clamped - lower) / (upper - lower) if upper > lower else 0.0


def _formula_score(temperature, rainfall, water_level_rise):
    """Legacy weighted formula — returns 0-100 float."""
    t_norm  = _normalize(temperature, TEMP_BASELINE, TEMP_CRITICAL)
    r_norm  = _normalize(rainfall, 0, RAINFALL_CRITICAL)
    wl_norm = _normalize(water_level_rise, 0, WATER_LEVEL_CRITICAL)
    raw = W_TEMP * t_norm * 100 + W_RAIN * r_norm * 100 + W_LEVEL * wl_norm * 100
    return round(min(max(raw, 0), 100), 2)


def _level_from_score(score):
    """Map 0-100 score → level + color."""
    if score >= 80:  return "Critical", "#991b1b"
    if score >= 61:  return "High",     "#dc2626"
    if score >= 35:  return "Moderate", "#d97706"
    return "Low", "#16a34a"


def _ml_predict(temperature, rainfall, water_level_rise, velocity=0.0, hour=None):
    """
    Run XGBoost inference.
    Returns (label_str, probability_of_top_class).
    """
    import numpy as np
    if hour is None:
        from datetime import datetime, timezone
        hour = datetime.now(tz=timezone.utc).hour

    feat = [temperature, rainfall, water_level_rise, velocity, hour]
    proba = _xgb_model.predict_proba([feat])[0]
    pred_idx = int(proba.argmax())
    label = _ml_classes[pred_idx]
    confidence = float(proba[pred_idx])
    return label, confidence


def _label_to_score(label: str) -> float:
    """Convert ML class label to a middle-of-band score for metrics."""
    mapping = {"Low": 15.0, "Moderate": 47.0, "High": 70.0, "Critical": 90.0}
    return mapping.get(label, 50.0)


def anomaly_score(temperature, rainfall, water_level_rise, velocity=0.0, hour=None):
    """
    Return (score -1=anomaly, +1=normal, raw_score float).
    Returns (1, 0.0) if anomaly detection not available.
    """
    if _iso_forest is None:
        return 1, 0.0
    if hour is None:
        from datetime import datetime, timezone
        hour = datetime.now(tz=timezone.utc).hour
    feat = [[temperature, rainfall, water_level_rise, velocity, hour]]
    pred = int(_iso_forest.predict(feat)[0])
    raw  = float(_iso_forest.score_samples(feat)[0])
    return pred, raw


def calculate_risk(temperature, rainfall, water_level_rise, velocity=0.0):
    """
    Unified risk calculator.
    - Uses XGBoost when model is available.
    - Falls back to formula engine otherwise.
    Returns dict with score (0-100), level, color, breakdown, and ml metadata.
    """
    # Build formula breakdown (always computed — provides interpretability)
    t_norm  = _normalize(temperature, TEMP_BASELINE, TEMP_CRITICAL)
    r_norm  = _normalize(rainfall, 0, RAINFALL_CRITICAL)
    wl_norm = _normalize(water_level_rise, 0, WATER_LEVEL_CRITICAL)

    temp_contrib  = round(W_TEMP  * t_norm  * 100, 2)
    rain_contrib  = round(W_RAIN  * r_norm  * 100, 2)
    level_contrib = round(W_LEVEL * wl_norm * 100, 2)
    formula_score = round(min(max(temp_contrib + rain_contrib + level_contrib, 0), 100), 2)

    # Anomaly detection
    anom_pred, anom_raw = anomaly_score(temperature, rainfall, water_level_rise, velocity)

    if _ml_ready:
        try:
            ml_label, ml_conf = _ml_predict(temperature, rainfall, water_level_rise, velocity)
            ml_score = _label_to_score(ml_label)
            # Blend: 60% formula (interpretable), 40% ML
            blended_score = round(formula_score * 0.60 + ml_score * 0.40, 2)
            level, color  = _level_from_score(blended_score)
            return {
                "score":    blended_score,
                "level":    level,
                "color":    color,
                "engine":   "ml_blended",
                "ml_score": ml_score,
                "ml_label": ml_label,
                "ml_confidence": round(ml_conf, 3),
                "formula_score": formula_score,
                "anomaly":  {"is_anomaly": anom_pred == -1, "raw_score": round(anom_raw, 4)},
                "breakdown": {
                    "temperature_contribution": temp_contrib,
                    "rainfall_contribution":    rain_contrib,
                    "water_level_contribution": level_contrib,
                },
            }
        except Exception as exc:
            logger.warning(f"ML inference failed ({exc}), using formula")

    # Formula fallback
    level, color = _level_from_score(formula_score)
    return {
        "score":    formula_score,
        "level":    level,
        "color":    color,
        "engine":   "formula",
        "ml_score": None,
        "anomaly":  {"is_anomaly": anom_pred == -1, "raw_score": round(anom_raw, 4)},
        "breakdown": {
            "temperature_contribution": temp_contrib,
            "rainfall_contribution":    rain_contrib,
            "water_level_contribution": level_contrib,
        },
    }


def estimate_peak_discharge(lake_volume_m3, dam_height_m):
    """
    Empirical peak discharge (m³/s) using Costa (1988) regression.
    Qp = α * (V * Hd)^β
    """
    if lake_volume_m3 <= 0 or dam_height_m <= 0:
        return 0.0
    return round(COSTA_ALPHA * (lake_volume_m3 * dam_height_m) ** COSTA_BETA, 1)


def should_alert(risk_result):
    """Determine if an alert should fire and its type."""
    score = risk_result["score"]
    level = risk_result["level"]

    if score >= 80:
        return {
            "alert": True,
            "type": "Emergency",
            "message": f"CRITICAL RISK ({score:.1f}) — Immediate evacuation protocols recommended.",
            "severity": "critical",
        }
    elif score >= 61:
        return {
            "alert": True,
            "type": "Warning",
            "message": f"HIGH RISK ({score:.1f}) — Alert authorities and increase monitoring frequency.",
            "severity": "high",
        }
    else:
        return {
            "alert": False,
            "type": None,
            "message": None,
            "severity": level.lower(),
        }
