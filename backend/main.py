import os
import json
import logging

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas.patient import (
    PatientInput,
    PredictionResponse,
    HealthResponse,
    HistoryEntry,
    HistoryListResponse,
    DeleteResponse,
)
from services.predictor import HeartDiseasePredictor
from database import (
    init_db,
    insert_prediction,
    fetch_all_predictions,
    fetch_prediction_by_id,
    delete_prediction,
    delete_all_predictions,
    fetch_history_stats,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")

app = FastAPI(
    title="Heart Disease Classification API",
    description=(
        "AI-powered heart disease risk assessment using a Deep Neural Network. "
        "For educational and research purposes only."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5174",
]


_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
if _frontend_url and _frontend_url not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Heart Disease API...")
    try:
        init_db()
    except Exception as e:
        logger.error("Database init failed: %s", str(e))

    import threading

    def load_model_background():
        try:
            HeartDiseasePredictor.get_instance()
            logger.info("Model loaded in background. Ready for predictions.")
        except FileNotFoundError as e:
            logger.error("Model not found: %s", str(e))
        except Exception as e:
            logger.error("Model load error: %s", str(e))

    t = threading.Thread(target=load_model_background, daemon=True)
    t.start()
    logger.info("Server started. Model loading in background...")


@app.get("/", tags=["Root"])
def root():
    return {
        "message":          "Heart Disease Classification API",
        "version":          "1.0.0",
        "docs":             "/docs",
        "predict_endpoint": "POST /predict",
        "history_endpoint": "GET /history",
        "disclaimer":       "For educational and research use only.",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health():
    try:
        predictor = HeartDiseasePredictor.get_instance()
        loaded = predictor.is_loaded
    except Exception:
        loaded = False

    return HealthResponse(
        status="ok" if loaded else "degraded",
        model_loaded=loaded,
        message="Model is loaded and ready." if loaded
                else "Model not loaded. Run python training/train.py first.",
    )


@app.get("/metrics", tags=["Evaluation"])
def get_metrics():
    base = os.path.dirname(os.path.abspath(__file__))
    metrics_path = os.path.join(base, "..", "results", "metrics.json")

    if not os.path.exists(metrics_path):
        raise HTTPException(
            status_code=404,
            detail="Metrics not found. Run python training/evaluate.py first.",
        )
    with open(metrics_path) as f:
        metrics = json.load(f)
    return {"metrics": metrics, "note": "Computed on held-out test set."}


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(patient: PatientInput):
    predictor = HeartDiseasePredictor.get_instance()

    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        result = predictor.predict(patient.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        logger.exception("Prediction error")
        raise HTTPException(status_code=500, detail="Prediction failed.")

    logger.info(
        "Prediction: %s | Prob: %.4f | Risk: %s",
        result["prediction"], result["probability"], result["risk_level"],
    )

    
    try:
        row_id = insert_prediction(patient.model_dump(), result)
        logger.info("Saved to history as record #%d.", row_id)
    except Exception as e:
        logger.error("History save failed: %s", str(e))

    return PredictionResponse(**result)


@app.get("/history", response_model=HistoryListResponse, tags=["History"])
def get_history():
    try:
        records_raw = fetch_all_predictions()
        stats       = fetch_history_stats()
    except Exception:
        logger.exception("Failed to fetch history")
        raise HTTPException(status_code=500, detail="Could not retrieve history.")

    records = [HistoryEntry(**r) for r in records_raw]
    return HistoryListResponse(records=records, stats=stats)


@app.get("/history/{record_id}", response_model=HistoryEntry, tags=["History"])
def get_history_entry(record_id: int):
    record = fetch_prediction_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found.")
    return HistoryEntry(**record)


@app.delete("/history/{record_id}", response_model=DeleteResponse, tags=["History"])
def delete_history_entry(record_id: int):
    deleted = delete_prediction(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found.")
    return DeleteResponse(success=True, message=f"Record #{record_id} deleted.", deleted_count=1)


@app.delete("/history", response_model=DeleteResponse, tags=["History"])
def clear_history(confirm: bool = Query(False)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Pass ?confirm=true to confirm.")
    count = delete_all_predictions()
    return DeleteResponse(
        success=True,
        message=f"All {count} records cleared.",
        deleted_count=count,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", str(exc))
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
