"""
Unit tests for core/risk_engine.py
"""
import pytest
from core.risk_engine import (
    calculate_risk, should_alert, estimate_peak_discharge,
    _normalize, _formula_score, _level_from_score, anomaly_score,
)


class TestNormalize:
    def test_below_lower(self):
        assert _normalize(-10, 0, 100) == 0.0

    def test_above_upper(self):
        assert _normalize(150, 0, 100) == 1.0

    def test_midpoint(self):
        assert _normalize(50, 0, 100) == 0.5

    def test_equal_bounds(self):
        assert _normalize(5, 5, 5) == 0.0


class TestFormulaScore:
    def test_zero_inputs(self):
        assert _formula_score(0, 0, 0) == 0.0

    def test_max_inputs(self):
        score = _formula_score(20, 100, 300)
        assert score == pytest.approx(100.0, abs=1.0)

    def test_moderate(self):
        score = _formula_score(10, 40, 100)
        assert 20 < score < 60


class TestLevelFromScore:
    @pytest.mark.parametrize("score,expected_level", [
        (10,  "Low"),
        (50,  "Moderate"),
        (70,  "High"),
        (90,  "Critical"),
    ])
    def test_levels(self, score, expected_level):
        level, _ = _level_from_score(score)
        assert level == expected_level


class TestCalculateRisk:
    def test_returns_required_keys(self):
        result = calculate_risk(5, 10, 30)
        assert all(k in result for k in ["score", "level", "color", "breakdown", "engine"])

    def test_score_range(self):
        for temp, rain, wl in [(0, 0, 0), (20, 100, 300), (10, 50, 150)]:
            r = calculate_risk(temp, rain, wl)
            assert 0 <= r["score"] <= 100

    def test_high_values_give_high_score(self):
        r = calculate_risk(22, 120, 280)
        assert r["score"] >= 60

    def test_low_values_give_low_score(self):
        r = calculate_risk(2, 5, 10)
        assert r["score"] < 40

    def test_breakdown_keys(self):
        r = calculate_risk(10, 30, 80)
        bd = r["breakdown"]
        assert "temperature_contribution" in bd
        assert "rainfall_contribution" in bd
        assert "water_level_contribution" in bd

    def test_velocity_included(self):
        r = calculate_risk(10, 30, 80, velocity=5.0)
        assert r["score"] is not None

    def test_anomaly_key_present(self):
        r = calculate_risk(10, 30, 80)
        assert "anomaly" in r
        assert "is_anomaly" in r["anomaly"]


class TestShouldAlert:
    def test_critical(self):
        result = should_alert({"score": 85, "level": "Critical"})
        assert result["alert"] is True
        assert result["type"] == "Emergency"

    def test_high(self):
        result = should_alert({"score": 65, "level": "High"})
        assert result["alert"] is True
        assert result["type"] == "Warning"

    def test_moderate_no_alert(self):
        result = should_alert({"score": 50, "level": "Moderate"})
        assert result["alert"] is False

    def test_low_no_alert(self):
        result = should_alert({"score": 10, "level": "Low"})
        assert result["alert"] is False


class TestPeakDischarge:
    def test_zero_inputs(self):
        assert estimate_peak_discharge(0, 100) == 0.0
        assert estimate_peak_discharge(100, 0) == 0.0

    def test_positive_value(self):
        q = estimate_peak_discharge(1_000_000, 50)
        assert q > 0

    def test_lhonak_approximate(self):
        # South Lhonak ~120ha lake, ~50m dam → rough order of magnitude check
        q = estimate_peak_discharge(120 * 50_000, 50)
        assert q > 100


class TestAnomalyScore:
    def test_returns_tuple(self):
        pred, raw = anomaly_score(10, 30, 80)
        assert pred in (1, -1)
        assert isinstance(raw, float)

    def test_no_model_returns_normal(self):
        # With no model loaded, should return (1, 0.0) — normal
        pred, raw = anomaly_score(10, 30, 80)
        assert pred == 1
        assert raw == 0.0
