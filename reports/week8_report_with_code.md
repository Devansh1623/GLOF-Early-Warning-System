# GLOF Early Warning System
## Minor Project Report - Week 8

<div align="center">
  <strong>Phase 4: Implementation & CI/CD Integration</strong><br/>
  <em>Focus: Coding, version control, and automated pipelines</em><br/>
  <em>Date: 23 - 28 March 2026</em>
</div>

---

## 1. Executive Summary: Sprint 1
Week 8 marks the official transition from system design into active development, kicking off Sprint 1. The primary focus of this sprint was the implementation of core backend features directly derived from the Class and Sequence diagrams established in previous weeks. Furthermore, strict version control practices were instantiated to manage collaboration effectively.

---

## 2. Core Logic Implementation
Following the SOLID principles established in Week 6, the core business logic has been developed into distinct, modular Python packages within the Flask environment.

### 2.1 Risk Engine (`risk_engine.py`)
The mathematical backbone of the system was implemented. It features a hybrid calculation model that utilizes XGBoost and Isolation Forest models for machine learning-based anomaly detection, while maintaining a robust fallback to empirical formulas (incorporating temperature, rainfall, and water level changes based on the Costa 1988 approach).

**Code Highlight: Unified Risk Calculator**
```python
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
                # ... (metadata omitted for brevity)
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
        # ... (metadata omitted for brevity)
    }
```

### 2.2 Authentication & Security (`auth.py`)
To secure the REST APIs, Role-Based Access Control (RBAC) was implemented using JSON Web Tokens (JWT). Registration and login controllers were built alongside a password reset flow integrated with the Resend Email API. Strict JSON schema validation using Marshmallow ensures data integrity before database interaction.

**Code Highlight: Secure JWT Login Flow**
```python
@auth_bp.route("/login", methods=["POST"])
def login():
    raw = request.get_json() or {}
    data, errors = validate_json(LoginSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    email = data["email"].strip().lower()
    user = _db.users.find_one({"email": email})
    
    if not user:
        auth_log.warning("Failed login attempt", extra={"user": email})
        return jsonify({"error": "Invalid credentials."}), 401

    stored_hash = user["password"]
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    # Secure Password Verification using bcrypt
    if not bcrypt.checkpw(data["password"].encode("utf-8"), stored_hash):
        auth_log.warning("Failed login attempt (bad password)", extra={"user": email})
        return jsonify({"error": "Invalid credentials."}), 401

    # Generate Secure JWT
    token = create_access_token(
        identity=email,
        additional_claims={"role": user.get("role", "user"), "name": user.get("name", "")},
    )

    auth_log.info("User logged in", extra={"user": email})
    return jsonify({
        "token": token,
        "user": {"email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")},
    }), 200
```

### 2.3 Telemetry Simulation (`mock_telemetry.py`)
To test the pipeline without physical sensors, a simulator was developed. This simulator fetches real-time meteorological data via the Open-Meteo API and calculates diurnal temperature drifts and randomized water level spikes to mimic genuine environmental behaviors.

**Code Highlight: Blending Real Weather with Simulation Spikes**
```python
def simulate_reading(lake, tick):
    """Generate a single telemetry reading by blending real weather with simulation."""
    lid = lake["id"]
    state = lake_state[lid]

    # Fetch real weather (best-effort) via Open-Meteo
    real = fetch_open_meteo(lake["lat"], lake["lon"])

    # Temperature: blend real + diurnal cycle + noise
    hour = datetime.utcnow().hour
    diurnal = 6 * math.sin((hour - 6) / 24 * 2 * math.pi)  # warmer midday
    if real["temperature"] is not None:
        temp = real["temperature"] + diurnal * 0.3 + random.gauss(0, 1.5)
    else:
        base_temp = 5 + random.gauss(0, 3)
        temp = base_temp + diurnal + random.gauss(0, 1)

    # Water level: gradual drift up + noise + occasional spike
    state["water_level"] += state["drift"] + random.gauss(0, 2)
    if random.random() < 0.03:
        state["water_level"] += random.uniform(20, 60)  # sudden spike
        
    # Reset mechanic if lake 'breaches'
    if state["water_level"] > 350:
        state["water_level"] = random.uniform(20, 80)   # reset after breach
        state["drift"] = random.uniform(0.1, 0.5)

    wl = max(0, state["water_level"])

    return {
        "lake_id": lid,
        "temperature": round(temp, 2),
        "water_level_rise": round(wl, 2),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
```

---

## 3. Git Branching Strategy
To maintain a clean and reliable codebase as complexity increases, a formalized Git workflow has been strictly enforced across the team.

**Feature Branching Workflow:**
- **Main Branch (`main`)**: Represents the production-ready state. Direct commits to this branch are strictly prohibited.
- **Develop Branch (`develop`)**: Serves as the primary integration branch for the next release.
- **Feature Branches**: Individual tasks (e.g., `feat/risk-engine`, `feat/auth-jwt`) are branched off `develop`. Once the feature is complete and tested, a Pull Request is opened to merge the code back into `develop`.

This hierarchical structure guarantees that the `main` branch remains stable for continuous deployment, encapsulating work cleanly based on Agile Jira tickets.

---

## 4. Plan for Next Week (Week 9)
Entering Week 9, the project will advance into Sprint 2. The primary objectives include:

- **Integration of Data Sources:** Connecting the frontend React UI hooks deeply with the established Flask REST endpoints and Server-Sent Events (SSE) streams.
- **Development of Automated Pipelines:** Setting up GitHub Actions or similar automated triggers for Continuous Integration testing.
