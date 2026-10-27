"""
FastAPI Production Prediction Service for MindWave Random Forest Models
Provides:
  - GET  /api/ml/health
  - GET  /api/ml/info
  - POST /api/ml/predict
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MindWave-ML-Service")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
UNIFIED_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_pipeline.joblib")
SCHIZO_MODEL_PATH = os.path.join(MODELS_DIR, "schizophrenia_rf_pipeline.joblib")
BIPOLAR_MODEL_PATH = os.path.join(MODELS_DIR, "bipolar_rf_pipeline.joblib")

# In-memory Model Cache
MODELS_CACHE: Dict[str, Any] = {}

# Supported Age Groups (All age groups enabled for screening analysis)
SUPPORTED_AGE_GROUPS = ["6-12", "13-18", "19-25", "26-31", "32-36", "37-43", "44-50", "50+"]
UNSUPPORTED_AGE_GROUPS = []

# Feature schemas
PQ16_FEATURE_NAMES = [f'q_{i}' for i in range(1, 17)]
MDQ_FEATURE_NAMES = [f'q_{i}' for i in range(1, 16)]


def load_models_at_startup():
    """Load pre-trained Random Forest models into memory once at startup."""
    global MODELS_CACHE
    logger.info("Initializing MindWave Random Forest Models from disk...")

    if os.path.exists(UNIFIED_MODEL_PATH):
        try:
            registry = joblib.load(UNIFIED_MODEL_PATH)
            MODELS_CACHE["registry"] = registry
            logger.info(f"Loaded master model registry version: {registry.get('model_version')}")
        except Exception as e:
            logger.error(f"Error loading master model registry: {e}")

    # Fallback to individual pipeline files if needed
    if "registry" not in MODELS_CACHE or not MODELS_CACHE["registry"]:
        MODELS_CACHE["schizophrenia"] = None
        MODELS_CACHE["bipolar"] = None
        if os.path.exists(SCHIZO_MODEL_PATH):
            try:
                MODELS_CACHE["schizophrenia"] = joblib.load(SCHIZO_MODEL_PATH)
                logger.info("Loaded schizophrenia_rf_pipeline.joblib")
            except Exception as e:
                logger.error(f"Failed to load schizophrenia model: {e}")
        if os.path.exists(BIPOLAR_MODEL_PATH):
            try:
                MODELS_CACHE["bipolar"] = joblib.load(BIPOLAR_MODEL_PATH)
                logger.info("Loaded bipolar_rf_pipeline.joblib")
            except Exception as e:
                logger.error(f"Failed to load bipolar model: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models_at_startup()
    yield


# App Initialization
app = FastAPI(
    title="MindWave Random Forest Prediction Service",
    description="Autonomous ML Service for Psychosis and Bipolar Screening Telemetry",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev / Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Request Models
class AnswerItem(BaseModel):
    id: Optional[int] = None
    answer: Optional[str] = None
    isTrue: Optional[bool] = None
    followUp1: Optional[float] = None
    followUp2: Optional[float] = None


class ScreeningPredictionRequest(BaseModel):
    assessment_type: str = Field(..., description="'schizophrenia' or 'bipolar'")
    age_group: Optional[str] = Field(default="19-25", description="Age category ID, e.g. '19-25'")
    profession: Optional[str] = Field(default=None, description="Profession ID or label")
    answers: List[Any] = Field(..., description="Array of completed question answer objects")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "assessment_type": "schizophrenia",
                "age_group": "19-25",
                "profession": "student",
                "answers": [
                    {"id": 1, "answer": "True", "followUp1": 3, "followUp2": 2},
                    {"id": 2, "answer": "False"}
                ]
            }
        }
    )


# Pydantic Response Models
class ContributingFeature(BaseModel):
    feature_id: str
    item_index: int
    endorsed: bool
    relative_importance: float


class PredictionResponse(BaseModel):
    status: str
    is_supported: bool
    unsupported_reason: Optional[str] = None
    assessment_type: str
    model_version: Optional[str] = None
    algorithm: str
    prediction_label: Optional[str] = None
    predicted_class: Optional[int] = None
    risk_probability: Optional[float] = None
    confidence_percentage: Optional[float] = None
    risk_level: Optional[str] = None
    total_endorsed_features: Optional[int] = None
    top_contributing_features: Optional[List[ContributingFeature]] = None
    clinical_disclaimer: str
    citation: Optional[str] = None


@app.get("/api/ml/health", status_code=status.HTTP_200_OK)
def health_check():
    """Liveness and readiness health probe."""
    has_registry = "registry" in MODELS_CACHE and MODELS_CACHE["registry"] is not None
    return {
        "status": "healthy",
        "service": "mindwave-random-forest-api",
        "models_loaded": {
            "schizophrenia_rf": has_registry or MODELS_CACHE.get("schizophrenia") is not None,
            "bipolar_rf": has_registry or MODELS_CACHE.get("bipolar") is not None,
        },
        "model_version": MODELS_CACHE.get("registry", {}).get("model_version", "1.0.0-rf-mindwave"),
        "supported_age_groups": SUPPORTED_AGE_GROUPS,
        "unsupported_age_groups": UNSUPPORTED_AGE_GROUPS
    }


@app.get("/api/ml/info", status_code=status.HTTP_200_OK)
def service_info():
    """Information regarding the ML methodology, dataset origin, and validation status."""
    registry = MODELS_CACHE.get("registry", {})
    return {
        "model_version": registry.get("model_version", "1.0.0-rf-mindwave"),
        "algorithm": "RandomForestClassifier (scikit-learn)",
        "dataset": registry.get("dataset", {
            "citation": "Akram et al. (2023). Scientific Data, Nature.",
            "doi": "10.6084/m9.figshare.24052236.v2",
            "license": "CC BY 4.0",
            "sample_size": 1408
        }),
        "assessments": {
            "schizophrenia": {
                "instrument": "PQ-16 (Prodromal Questionnaire 16 items)",
                "target": "Ultra-High Risk (UHR) of Psychosis (Ising et al. 2012 cutoff >= 6)",
                "held_out_accuracy": "97.49%",
                "held_out_roc_auc": 0.9959,
                "supported_age_groups": SUPPORTED_AGE_GROUPS
            },
            "bipolar": {
                "instrument": "MDQ (Mood Disorder Questionnaire 15 items)",
                "target": "Bipolar Spectrum Disorder Risk (Hirschfeld et al. 2000 3-tier criteria)",
                "held_out_accuracy": "84.67%",
                "held_out_roc_auc": 0.9327,
                "supported_age_groups": SUPPORTED_AGE_GROUPS
            }
        },
        "disclaimer": "Experimental ML telemetry only. Not a substitute for formal psychiatric evaluation."
    }


@app.post("/api/ml/predict", response_model=PredictionResponse)
def predict_screening(request: ScreeningPredictionRequest):
    """
    Predict psychosis or bipolar screening outcome from submitted questionnaire responses
    using the trained scikit-learn Random Forest model.
    """
    ass_type = (request.assessment_type or "").lower().strip()
    if ass_type not in ["schizophrenia", "bipolar"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported assessment type '{request.assessment_type}'. Must be 'schizophrenia' or 'bipolar'."
        )

    # 1. Age-Group Telemetry (All age groups supported)
    age_group = (request.age_group or "all").strip()
    logger.info(f"Processing prediction request: assessment={ass_type}, age_group={age_group}")

    # 2. Retrieve Model Pipeline from Cache
    pipeline = None
    feature_names = []
    target_desc = ""
    registry = MODELS_CACHE.get("registry", {})
    feature_importances_dict = {}

    if registry and "supported_assessments" in registry:
        ass_meta = registry["supported_assessments"].get(ass_type, {})
        pipeline = ass_meta.get("pipeline")
        feature_names = ass_meta.get("features", [])
        target_desc = ass_meta.get("target_description", "")
        if "metrics" in ass_meta:
            feature_importances_dict = ass_meta["metrics"].get("feature_importances", {})

    if pipeline is None:
        # Fallback to individual cache
        pipeline = MODELS_CACHE.get(ass_type)
        feature_names = PQ16_FEATURE_NAMES if ass_type == "schizophrenia" else MDQ_FEATURE_NAMES

    if pipeline is None:
        return PredictionResponse(
            status="unavailable",
            is_supported=False,
            unsupported_reason="Trained Random Forest pipeline file not currently loaded on server.",
            assessment_type=ass_type,
            algorithm="RandomForestClassifier",
            clinical_disclaimer="Model is temporarily unavailable."
        )

    # 3. Parse and Validate Answers into Feature Vector
    answers = request.answers or []
    expected_len = 16 if ass_type == "schizophrenia" else 15

    feature_dict: Dict[str, float] = {f"q_{i}": 0.0 for i in range(1, expected_len + 1)}

    for idx, item in enumerate(answers):
        q_num = idx + 1
        is_true = False
        if isinstance(item, dict):
            if "id" in item and isinstance(item["id"], int) and 1 <= item["id"] <= expected_len:
                q_num = item["id"]
            if item.get("answer") == "True" or item.get("isTrue") is True:
                is_true = True
        elif hasattr(item, "answer"):
            if getattr(item, "answer") == "True" or getattr(item, "isTrue", False) is True:
                is_true = True

        if 1 <= q_num <= expected_len:
            feature_dict[f"q_{q_num}"] = 1.0 if is_true else 0.0

    # Build input DataFrame matching trained feature names
    X_input = pd.DataFrame([[feature_dict[f] for f in feature_names]], columns=feature_names)
    endorsed_count = int(sum(feature_dict.values()))

    # 4. Generate Random Forest Prediction
    try:
        pred_class = int(pipeline.predict(X_input)[0])
        probabilities = pipeline.predict_proba(X_input)[0]
        # Probability of positive class (index 1)
        risk_proba = float(probabilities[1]) if len(probabilities) > 1 else float(pred_class)
    except Exception as e:
        logger.error(f"Prediction computation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed during Random Forest execution: {str(e)}"
        )

    # 5. Formulate Risk Level & Label
    if ass_type == "schizophrenia":
        if pred_class == 1:
            pred_label = "Elevated Psychosis Risk Indicator"
            risk_level = "High" if risk_proba >= 0.75 else "Moderate"
        else:
            pred_label = "Baseline / Low Psychosis Risk Profile"
            risk_level = "Low"
    else:
        if pred_class == 1:
            pred_label = "Bipolar Spectrum Risk Indicator"
            risk_level = "High" if risk_proba >= 0.70 else "Moderate"
        else:
            pred_label = "Baseline / Low Bipolar Risk Profile"
            risk_level = "Low"

    # 6. Extract Top Contributing Endorsed Features
    top_features = []
    if feature_importances_dict:
        # Sort endorsed features by relative importance
        endorsed_features = [
            (f_name, feature_importances_dict.get(f_name, 0.0))
            for f_name, val in feature_dict.items() if val == 1.0
        ]
        endorsed_features.sort(key=lambda x: x[1], reverse=True)
        for f_name, imp in endorsed_features[:4]:
            q_idx = int(f_name.split("_")[1])
            top_features.append(ContributingFeature(
                feature_id=f_name,
                item_index=q_idx,
                endorsed=True,
                relative_importance=round(imp * 100, 2)
            ))

    return PredictionResponse(
        status="success",
        is_supported=True,
        assessment_type=ass_type,
        model_version=registry.get("model_version", "1.0.0-rf-mindwave"),
        algorithm="RandomForestClassifier",
        prediction_label=pred_label,
        predicted_class=pred_class,
        risk_probability=round(risk_proba, 4),
        confidence_percentage=round(risk_proba * 100, 1) if pred_class == 1 else round((1 - risk_proba) * 100, 1),
        risk_level=risk_level,
        total_endorsed_features=endorsed_count,
        top_contributing_features=top_features,
        clinical_disclaimer=(
            "This prediction is an experimental exploratory analysis generated by an automated Random Forest model. "
            "It is NOT a clinical diagnosis, psychological assessment, or therapeutic recommendation. "
            "Always consult a licensed medical or mental healthcare provider for professional diagnosis."
        ),
        citation="Akram et al. (2023) Scientific Data, Nature (DOI: 10.6084/m9.figshare.24052236.v2)"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=False)
