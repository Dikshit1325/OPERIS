import pickle
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field


app = FastAPI(title="Burnout Prediction API")

# ================================
# ✅ CORS (FINAL FIX FOR EXTENSION + FRONTEND)
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all (frontend + extension)
    allow_credentials=False,    # IMPORTANT
    allow_methods=["*"],        # IMPORTANT
    allow_headers=["*"],        # IMPORTANT
)

# ================================
# ✅ PRE-FLIGHT HANDLER (STEP 2 FIX)
# ================================
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(status_code=200)


# ================================
# LIVE MEMORY STORE
# ================================
LIVE_HISTORY_MAX = 120
_live_history: deque[dict[str, Any]] = deque(maxlen=LIVE_HISTORY_MAX)
_latest: dict[str, Any] | None = None


# ================================
# REQUEST MODEL
# ================================
class PredictRequest(BaseModel):
    hours_worked: float = Field(..., ge=0, le=80)
    meetings_count: int = Field(..., ge=0, le=50)
    sentiment: float = Field(..., ge=0, le=1)
    tasks_completed: int = Field(..., ge=0, le=200)
    current_site: str | None = Field(default=None, max_length=120)


# ================================
# LOAD MODEL
# ================================
def load_model():
    model_path = Path(__file__).resolve().parent.parent / "ml" / "burnout_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    try:
        return joblib.load(model_path)
    except Exception:
        with open(model_path, "rb") as file:
            return pickle.load(file)


# ================================
# PRODUCTIVITY LOGIC
# ================================
def calculate_productivity_score(data: PredictRequest, burnout_prediction: int) -> float:
    efficiency = data.tasks_completed / max(data.hours_worked, 1)
    score = efficiency * 100
    score += (1 - data.sentiment) * 10
    score -= data.meetings_count * 2

    if burnout_prediction == 1:
        score -= 10

    return round(max(0, min(100, score)), 2)


# ================================
# LIVE DASHBOARD API
# ================================
@app.get("/live")
def get_live_dashboard():
    if not _latest:
        return {
            "has_data": False,
            "message": "No live data yet. Run the Operis extension.",
        }

    trend = [
        {
            "index": i + 1,
            "time": row.get("time_label", ""),
            "productivity": row.get("productivity_score", 0),
        }
        for i, row in enumerate(_live_history)
    ]

    level = "High" if _latest.get("burnout_risk") == "High" else "Low"

    return {
        "has_data": True,
        "kpis": {
            "avgProd": _latest.get("productivity_score"),
            "highBurnout": 1 if level == "High" else 0,
            "avgHours": _latest.get("hours_worked"),
            "totalEmployees": 1,
        },
        "productivity_trend": trend,
    }


# ================================
# PREDICTION API
# ================================
@app.post("/predict")
def predict(payload: PredictRequest):
    try:
        model = load_model()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Model load error: {err}")

    features = [[
        payload.hours_worked,
        payload.meetings_count,
        payload.sentiment,
        payload.tasks_completed,
    ]]

    try:
        burnout_prediction = int(model.predict(features)[0])
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Prediction error: {err}")

    burnout_risk = "High" if burnout_prediction == 1 else "Low"
    productivity_score = calculate_productivity_score(payload, burnout_prediction)

    now = datetime.now(timezone.utc)

    snapshot = {
        "updated_at": now.isoformat(),
        "time_label": now.strftime("%H:%M:%S"),
        "hours_worked": payload.hours_worked,
        "meetings_count": payload.meetings_count,
        "sentiment": payload.sentiment,
        "tasks_completed": payload.tasks_completed,
        "current_site": payload.current_site,
        "burnout_prediction": burnout_prediction,
        "burnout_risk": burnout_risk,
        "productivity_score": productivity_score,
    }

    global _latest
    _latest = snapshot
    _live_history.append(snapshot)

    return {
        "burnout_prediction": burnout_prediction,
        "burnout_risk": burnout_risk,
        "productivity_score": productivity_score,
    }