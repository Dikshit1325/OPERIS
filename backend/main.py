import pickle
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Burnout Prediction API")

# In-memory live session (updated by extension POST /predict; read by dashboard GET /live).
LIVE_HISTORY_MAX = 120
_live_history: deque[dict[str, Any]] = deque(maxlen=LIVE_HISTORY_MAX)
_latest: dict[str, Any] | None = None

# Allow the frontend dev server to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all
    allow_credentials=False,   # ⚠️ IMPORTANT CHANGE
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    # Keep ranges aligned with Simulation form limits.
    hours_worked: float = Field(..., ge=0, le=80)
    meetings_count: int = Field(..., ge=0, le=50)
    sentiment: float = Field(..., ge=0, le=1)  # Frontend sends 0/0.5/1
    tasks_completed: int = Field(..., ge=0, le=200)
    current_site: str | None = Field(default=None, max_length=120)


def load_model():
    model_path = Path(__file__).resolve().parent.parent / "ml" / "burnout_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    # Current training script stores model with joblib.dump(...).
    # Keep pickle fallback for compatibility with older model files.
    try:
        return joblib.load(model_path)
    except Exception:
        with open(model_path, "rb") as file:
            return pickle.load(file)


def calculate_productivity_score(data: PredictRequest, burnout_prediction: int) -> float:
    # Efficiency (main factor)
    efficiency = data.tasks_completed / max(data.hours_worked, 1)

    # Base score from efficiency
    score = efficiency * 100  # converts to %

    # Sentiment impact
    score += (1 - data.sentiment) * 10  # positive boosts

    # Meeting penalty (light)
    score -= data.meetings_count * 2

    # Burnout penalty
    if burnout_prediction == 1:
        score -= 10

    # Clamp between 0–100
    return round(max(0, min(100, score)), 2)


def _risk_to_level(risk: str) -> str:
    if risk == "High":
        return "High"
    return "Low"


@app.get("/live")
def get_live_dashboard():
    """Latest telemetry + history for real-time dashboard (poll from React)."""
    if not _latest:
        return {
            "has_data": False,
            "message": "No live data yet. Run the Operis extension with the backend running.",
            "last_update": None,
            "kpis": None,
            "productivity_trend": [],
            "burnout_distribution": [
                {"level": "Low", "count": 0},
                {"level": "Medium", "count": 0},
                {"level": "High", "count": 0},
            ],
            "alerts": [],
            "live_row": None,
            "meeting_productivity_series": [],
        }

    trend = []
    for i, row in enumerate(_live_history):
        trend.append({
            "index": i + 1,
            "time": row.get("time_label", ""),
            "productivity": row.get("productivity_score", 0),
        })

    level = _risk_to_level(_latest.get("burnout_risk", "Low"))
    dist = [
        {"level": "Low", "count": 1 if level == "Low" else 0},
        {"level": "Medium", "count": 1 if level == "Medium" else 0},
        {"level": "High", "count": 1 if level == "High" else 0},
    ]
    alerts = []
    if level == "High":
        alerts.append({
            "employeeId": "live",
            "name": "Current session",
            "level": "High",
            "recommendation": "Take a break; reduce meetings if possible.",
        })

    kpis = {
        "avgProd": round(float(_latest.get("productivity_score", 0)), 2),
        "highBurnout": 1 if level == "High" else 0,
        "avgHours": round(float(_latest.get("hours_worked", 0)), 2),
        "totalEmployees": 1,
        "current_site": _latest.get("current_site"),
    }

    live_row = {
        "id": "live",
        "name": "You (extension)",
        "productivityScore": round(float(_latest.get("productivity_score", 0)), 2),
        "burnoutLevel": level,
        "hoursWorked": round(float(_latest.get("hours_worked", 0)), 2),
        "current_site": _latest.get("current_site"),
    }

    meeting_productivity_series = [
        {
            "meetings": int(row.get("meetings_count", 0)),
            "productivity": float(row.get("productivity_score", 0)),
            "time": row.get("time_label", ""),
        }
        for row in _live_history
    ]

    return {
        "has_data": True,
        "message": None,
        "last_update": _latest.get("updated_at"),
        "kpis": kpis,
        "productivity_trend": trend,
        "burnout_distribution": dist,
        "alerts": alerts,
        "live_row": live_row,
        "meeting_productivity_series": meeting_productivity_series,
    }


@app.post("/predict")
def predict(payload: PredictRequest):
    print("Incoming:", payload)
    try:
        model = load_model()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {err}") from err

    # Model was trained with columns:
    # [hours_worked, meetings_count, sentiment, tasks_completed]
    features = [[
        payload.hours_worked,
        payload.meetings_count,
        payload.sentiment,
        payload.tasks_completed,
    ]]

    try:
        burnout_prediction = int(model.predict(features)[0])
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {err}") from err

    burnout_risk = "High" if burnout_prediction == 1 else "Low"
    productivity_score = calculate_productivity_score(payload, burnout_prediction)

    now = datetime.now(timezone.utc)
    time_label = now.strftime("%H:%M:%S")
    snapshot = {
        "updated_at": now.isoformat(),
        "time_label": time_label,
        "hours_worked": payload.hours_worked,
        "meetings_count": payload.meetings_count,
        "sentiment": payload.sentiment,
        "tasks_completed": payload.tasks_completed,
        "current_site": payload.current_site,
        "burnout_prediction": burnout_prediction,
        "burnout_label": "burnout" if burnout_prediction == 1 else "no_burnout",
        "burnout_risk": burnout_risk,
        "productivity_score": productivity_score,
    }
    global _latest
    _latest = snapshot
    _live_history.append(snapshot)

    return {
        "burnout_prediction": burnout_prediction,
        "burnout_label": "burnout" if burnout_prediction == 1 else "no_burnout",
        "burnout_risk": burnout_risk,
        "productivity_score": productivity_score,
    }
