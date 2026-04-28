"""
GLOF Telemetry Simulator
Generates realistic fake sensor data using:
  - Open-Meteo API (free, no key) for real weather at Himalayan coordinates
  - Synthetic diurnal temperature cycles
  - Gradual water level drift with random spikes

Dynamically fetches the lake list from the backend on startup and refreshes
every LAKE_REFRESH_MINUTES minutes, so any lake added via the Admin Dashboard
is automatically picked up without restarting the simulator.

Posts to /api/telemetry every INTERVAL_SECONDS.
"""
import os, time, math, random, json, threading
from datetime import datetime
import requests

BACKEND_URL           = os.environ.get("BACKEND_URL", "http://localhost:5000")
INTERVAL              = int(os.environ.get("INTERVAL_SECONDS", "5"))
LAKE_REFRESH_MINUTES  = int(os.environ.get("LAKE_REFRESH_MINUTES", "5"))   # re-fetch lake list every N minutes
SIM_JWT_TOKEN         = os.environ.get("SIM_JWT_TOKEN", "")                 # optional: JWT to authenticate /api/lakes/

# ── Fallback static lake list (used only if backend fetch fails) ──────────────
FALLBACK_LAKES = [
    {"id": "GL001", "name": "South Lhonak Lake",     "lat": 27.9167, "lon": 88.2000},
    {"id": "GL002", "name": "Samudra Tapu Lake",      "lat": 32.4500, "lon": 77.3833},
    {"id": "GL003", "name": "Gepang Gath Lake",        "lat": 32.5500, "lon": 77.1000},
    {"id": "GL004", "name": "Rathong Glacier Lake",    "lat": 27.3000, "lon": 88.1667},
    {"id": "GL005", "name": "Kedarnath Glacial Lake",  "lat": 30.7352, "lon": 79.0669},
    {"id": "GL006", "name": "Gangabal Lake",           "lat": 34.4167, "lon": 74.9833},
    {"id": "GL007", "name": "Satopanth Tal",           "lat": 30.7667, "lon": 79.3167},
    {"id": "GL008", "name": "Sheshnag Lake",           "lat": 34.0333, "lon": 75.4667},
    {"id": "GL009", "name": "Tsomgo Lake",             "lat": 27.3722, "lon": 88.7581},
    {"id": "GL010", "name": "Parechu Lake",            "lat": 32.7167, "lon": 78.5000},
    {"id": "GL011", "name": "Gurudongmar Lake",        "lat": 28.0244, "lon": 88.7128},
    {"id": "GL012", "name": "Suraj Tal",               "lat": 32.7667, "lon": 77.2000},
]

# ── Shared mutable lake state ─────────────────────────────────────────────────
_lakes_lock  = threading.Lock()
_active_lakes: list = []          # current lake list (refreshed periodically)
_lake_state:  dict  = {}          # per-lake simulation state

# Cache for Open-Meteo weather data (refresh every 30 minutes)
weather_cache = {}
CACHE_TTL     = 1800


# ── Lake fetching ─────────────────────────────────────────────────────────────

def _build_auth_headers():
    """Return headers dict with JWT bearer token if SIM_JWT_TOKEN is set."""
    headers = {}
    if SIM_JWT_TOKEN:
        headers["Authorization"] = f"Bearer {SIM_JWT_TOKEN}"
    return headers


def fetch_lakes_from_backend() -> list:
    """
    GET /api/lakes/ from the backend and return a list of lake dicts
    with at least {id, name, lat, lon}.  Falls back to FALLBACK_LAKES
    if the endpoint is unreachable or returns an error.
    """
    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/lakes/",
            headers=_build_auth_headers(),
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                # Filter to lakes that have lat/lon
                valid = [
                    {"id": l["id"], "name": l["name"], "lat": float(l["lat"]), "lon": float(l["lon"])}
                    for l in data
                    if l.get("id") and l.get("name") and l.get("lat") is not None and l.get("lon") is not None
                ]
                if valid:
                    print(f"[SIM] Fetched {len(valid)} lakes from backend.")
                    return valid
        print(f"[SIM] Backend returned HTTP {resp.status_code} for /api/lakes/ — using fallback list.")
    except Exception as e:
        print(f"[SIM] Could not reach /api/lakes/: {e} — using fallback list.")
    return FALLBACK_LAKES


def _ensure_lake_state(lake_id: str):
    """Initialise per-lake simulation state if it doesn't exist yet."""
    if lake_id not in _lake_state:
        _lake_state[lake_id] = {
            "water_level": random.uniform(10, 80),
            "drift":       random.uniform(0.1, 0.5),
            "phase":       random.uniform(0, 2 * math.pi),
        }


def refresh_lakes():
    """Fetch fresh lake list from backend and update shared state (thread-safe)."""
    fresh = fetch_lakes_from_backend()
    with _lakes_lock:
        global _active_lakes
        _active_lakes = fresh
        for lake in fresh:
            _ensure_lake_state(lake["id"])


def lake_refresh_loop():
    """Background thread: periodically refresh the lake list."""
    while True:
        time.sleep(LAKE_REFRESH_MINUTES * 60)
        print(f"[SIM] Refreshing lake list from backend…")
        refresh_lakes()


# ── Weather fetching ──────────────────────────────────────────────────────────

def fetch_open_meteo(lat, lon):
    """Fetch current weather from Open-Meteo. Falls back to synthetic if unavailable."""
    cache_key = f"{lat},{lon}"
    now = time.time()

    if cache_key in weather_cache:
        cached_time, cached_data = weather_cache[cache_key]
        if now - cached_time < CACHE_TTL:
            return cached_data

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,precipitation,wind_speed_10m"
            f"&timezone=auto"
        )
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})
        result = {
            "temperature":   current.get("temperature_2m", None),
            "precipitation": current.get("precipitation",  None),
        }
        weather_cache[cache_key] = (now, result)
        return result
    except Exception as e:
        print(f"[WEATHER] Open-Meteo unavailable for {cache_key}: {e}")
        return {"temperature": None, "precipitation": None}


# ── Simulation ────────────────────────────────────────────────────────────────

def simulate_reading(lake, tick):
    """Generate a single telemetry reading by blending real weather with simulation."""
    lid   = lake["id"]
    state = _lake_state[lid]

    # Fetch real weather (best-effort)
    real = fetch_open_meteo(lake["lat"], lake["lon"])

    # Temperature: blend real + diurnal cycle + noise
    hour    = datetime.utcnow().hour
    diurnal = 6 * math.sin((hour - 6) / 24 * 2 * math.pi)
    if real["temperature"] is not None:
        temp = real["temperature"] + diurnal * 0.3 + random.gauss(0, 1.5)
    else:
        base_temp = 5 + random.gauss(0, 3)
        temp      = base_temp + diurnal + random.gauss(0, 1)

    # Rainfall: blend real + spikes
    if real["precipitation"] is not None:
        rain = max(0, real["precipitation"] + random.gauss(0, 5))
    else:
        rain = max(0, random.expovariate(0.05) if random.random() < 0.3 else random.uniform(0, 5))

    # Occasionally add heavy rainfall event
    if random.random() < 0.05:
        rain += random.uniform(30, 80)

    # Water level: gradual drift up + noise + occasional spike
    state["water_level"] += state["drift"] + random.gauss(0, 2)
    if random.random() < 0.03:
        state["water_level"] += random.uniform(20, 60)   # sudden spike
    if state["water_level"] > 350:
        state["water_level"] = random.uniform(20, 80)    # reset after breach
        state["drift"]       = random.uniform(0.1, 0.5)

    wl = max(0, state["water_level"])

    return {
        "lake_id":           lid,
        "lake_name":         lake["name"],
        "temperature":       round(temp, 2),
        "rainfall":          round(rain, 2),
        "water_level_rise":  round(wl,   2),
        "timestamp":         datetime.utcnow().isoformat() + "Z",
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[SIM] GLOF Telemetry Simulator started")
    print(f"[SIM] Backend : {BACKEND_URL}")
    print(f"[SIM] Interval: {INTERVAL}s | Lake refresh: every {LAKE_REFRESH_MINUTES} min")

    # ── Wait for backend to be ready ─────────────────────────────────────────
    while True:
        try:
            r = requests.get(f"{BACKEND_URL}/health", timeout=5)
            if r.status_code == 200:
                print("[SIM] Backend is ready.")
                break
        except Exception:
            pass
        print("[SIM] Waiting for backend…")
        time.sleep(3)

    # ── Initial lake fetch ────────────────────────────────────────────────────
    refresh_lakes()
    print(f"[SIM] Simulating {len(_active_lakes)} lakes.")

    # ── Start background lake-refresh thread ──────────────────────────────────
    t = threading.Thread(target=lake_refresh_loop, daemon=True)
    t.start()

    # ── Main telemetry loop ───────────────────────────────────────────────────
    tick = 0
    while True:
        with _lakes_lock:
            current_lakes = list(_active_lakes)   # snapshot for this tick

        if not current_lakes:
            time.sleep(INTERVAL)
            continue

        # Round-robin through lakes (cycle 2-3 per tick to spread load)
        lakes_this_tick = random.sample(current_lakes, min(3, len(current_lakes)))

        for lake in lakes_this_tick:
            reading = simulate_reading(lake, tick)
            try:
                resp  = requests.post(
                    f"{BACKEND_URL}/api/telemetry",
                    json=reading,
                    timeout=10,
                )
                risk  = resp.json().get("risk", {}) if resp.status_code == 200 else {}
                level = risk.get("level", "?")
                score = risk.get("score", "?")
                print(f"[SIM] {lake['name'][:20]:20s} | "
                      f"T={reading['temperature']:6.1f}°C  "
                      f"R={reading['rainfall']:6.1f}mm  "
                      f"WL={reading['water_level_rise']:6.1f}cm  "
                      f"→ {level} ({score})")
            except Exception as e:
                print(f"[SIM] Error posting to backend: {e}")

        tick += 1
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
