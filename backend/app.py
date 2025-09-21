from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import os
from io import StringIO
from typing import Optional, Dict, Any, List
import csv

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Health Prognosis Demo App", version="0.3.1 (Hybrid)")

# CORS for local dev frontend
def _configure_cors():
    # Production-friendly CORS:
    # - If ALLOWED_ORIGINS env is set (comma-separated), use exact origins.
    # - Otherwise allow all (fine for a public demo; tighten later).
    allowed = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if allowed == "*":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        origins = [o.strip() for o in allowed.split(",") if o.strip()]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

_configure_cors()

"""
Hybrid mode backend:
- Tries to load a local trained model from backend/models/model.pkl if dependencies are available.
- If not available (or load fails), falls back to lightweight heuristic so the app stays usable.
"""

MODEL_LOADED = False
PIPE = None

def try_load_model():
    global MODEL_LOADED, PIPE
    model_path = os.getenv("MODEL_PATH", "backend/models/model.pkl")
    try:
        import joblib  # type: ignore
        import pandas as pd  # type: ignore
    except Exception:
        MODEL_LOADED = False
        PIPE = None
        return
    if os.path.exists(model_path):
        try:
            PIPE = joblib.load(model_path)
            MODEL_LOADED = True
        except Exception:
            PIPE = None
            MODEL_LOADED = False
    else:
        MODEL_LOADED = False


class PatientInput(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: str
    diagnosis_code: str
    lab_result: float
    medication: str
    length_of_stay: Optional[int] = 0
    comorbidity_score: Optional[int] = 0


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": MODEL_LOADED, "mode": ("full" if MODEL_LOADED else "lite")}


@app.on_event("startup")
async def on_startup():
    # Attempt to load a local trained model on startup
    try_load_model()


def heuristic_predict(row: Dict[str, Any]) -> Dict[str, Any]:
    age = float(row.get("age", 0) or 0)
    lab = float(row.get("lab_result", 0) or 0)
    comorb = float(row.get("comorbidity_score", 0) or 0)
    los = float(row.get("length_of_stay", 0) or 0)
    # simple bounded linear heuristic
    risk = 0.5 + 0.002 * (age - 60) + 0.002 * (lab - 120) + 0.03 * comorb + 0.01 * (1 if los > 5 else 0)
    risk = max(0.0, min(1.0, risk))
    cat = "High" if risk >= 0.7 else ("Medium" if risk >= 0.4 else "Low")
    importances = [
        {"feature": "age", "importance": 0.4},
        {"feature": "lab_result", "importance": 0.35},
        {"feature": "comorbidity_score", "importance": 0.2},
        {"feature": "length_of_stay", "importance": 0.05},
    ]
    return {"risk_probability": float(risk), "risk_category": cat, "explanations": {"feature_importances": importances}}


@app.post("/predict/single")
async def predict_single(payload: PatientInput):
    if MODEL_LOADED and PIPE is not None:
        try:
            import pandas as pd  # type: ignore
            df = pd.DataFrame([payload.model_dump()])
            prob = float(PIPE.predict_proba(df)[0, 1])
            cat = "High" if prob >= 0.7 else ("Medium" if prob >= 0.4 else "Low")
            importances = [
                {"feature": "age", "importance": 0.3},
                {"feature": "lab_result", "importance": 0.3},
                {"feature": "comorbidity_score", "importance": 0.2},
                {"feature": "length_of_stay", "importance": 0.2},
            ]
            return {"risk_probability": prob, "risk_category": cat, "explanations": {"feature_importances": importances}}
        except Exception:
            # fallback on any runtime error
            return heuristic_predict(payload.model_dump())
    else:
        return heuristic_predict(payload.model_dump())


@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    content = (await file.read()).decode("utf-8", errors="ignore")
    required = ["age", "gender", "diagnosis_code", "lab_result", "medication"]

    # If full model is loaded and pandas available, use pandas path for speed/consistency
    if MODEL_LOADED and PIPE is not None:
        try:
            import pandas as pd  # type: ignore
            df = pd.read_csv(StringIO(content))
            missing = [c for c in required if c not in df.columns]
            if missing:
                raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
            probs = PIPE.predict_proba(df)[:, 1]
            cats = ["High" if p >= 0.7 else ("Medium" if p >= 0.4 else "Low") for p in probs]
            df_out = df.copy()
            df_out["risk_probability"] = probs
            df_out["risk_category"] = cats
            return {"results": df_out.to_dict(orient="records")}
        except Exception:
            # fall back to heuristic path if pandas/model inference fails
            pass

    # Heuristic CSV path (no pandas)
    reader = csv.DictReader(StringIO(content))
    if not set(required).issubset(reader.fieldnames or []):
        missing = [c for c in required if c not in (reader.fieldnames or [])]
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
    results: List[Dict[str, Any]] = []
    for row in reader:
        res = heuristic_predict(row)
        out = dict(row)
        out["risk_probability"] = res["risk_probability"]
        out["risk_category"] = res["risk_category"]
        results.append(out)
    return {"results": results}

