"""
Comprehensive Automated Test Suite for MindWave Random Forest ML System
Tests:
1. Dataset loading and schema validation
2. Model loading from disk
3. Prediction on valid PQ-16 Schizophrenia input
4. Prediction on valid MDQ Bipolar input
5. Handling of unsupported age groups (6-12, 13-18)
6. Handling of invalid assessment types
7. Handling of empty or malformed answers
8. Verification of probabilistic scores and clinical disclaimer
"""

import os
import sys
import joblib
import pytest

# Ensure workspace root is in sys.path
BASE_PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_PROJECT_DIR not in sys.path:
    sys.path.insert(0, BASE_PROJECT_DIR)

from fastapi.testclient import TestClient
from ml.src.api import app, MODELS_CACHE, load_models_at_startup

client = TestClient(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "Akram_et_al_2023_Student_MH_Data_UK_SciData.xlsx")

@pytest.fixture(scope="session", autouse=True)
def init_models():
    load_models_at_startup()

def test_raw_dataset_exists():
    """Verify that genuine research dataset file was downloaded and is non-empty."""
    assert os.path.exists(RAW_DATA_PATH), f"Raw dataset missing at {RAW_DATA_PATH}"
    size = os.path.getsize(RAW_DATA_PATH)
    assert size > 100000, f"Raw dataset file unexpectedly small ({size} bytes)"

def test_model_files_exist():
    """Verify all saved joblib model files exist."""
    master_path = os.path.join(MODELS_DIR, "random_forest_pipeline.joblib")
    schizo_path = os.path.join(MODELS_DIR, "schizophrenia_rf_pipeline.joblib")
    bipolar_path = os.path.join(MODELS_DIR, "bipolar_rf_pipeline.joblib")

    assert os.path.exists(master_path), "Master model registry missing"
    assert os.path.exists(schizo_path), "Schizophrenia RF pipeline file missing"
    assert os.path.exists(bipolar_path), "Bipolar RF pipeline file missing"

def test_api_health():
    """Verify GET /api/ml/health returns 200 with loaded models."""
    response = client.get("/api/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"]["schizophrenia_rf"] is True
    assert data["models_loaded"]["bipolar_rf"] is True

def test_api_info():
    """Verify GET /api/ml/info returns metadata and research citation."""
    response = client.get("/api/ml/info")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "RandomForestClassifier (scikit-learn)"
    assert "Akram" in data["dataset"]["citation"]
    assert "schizophrenia" in data["assessments"]
    assert "bipolar" in data["assessments"]

def test_predict_schizophrenia_elevated():
    """Verify positive psychosis risk prediction for high endorsement responses."""
    # 10 endorsed items on PQ-16
    answers = [{"id": i, "answer": "True" if i <= 10 else "False"} for i in range(1, 17)]
    payload = {
        "assessment_type": "schizophrenia",
        "age_group": "19-25",
        "profession": "student",
        "answers": answers
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_supported"] is True
    assert data["predicted_class"] == 1
    assert data["prediction_label"] == "Elevated Psychosis Risk Indicator"
    assert data["risk_probability"] >= 0.5
    assert len(data["clinical_disclaimer"]) > 10

def test_predict_schizophrenia_low_risk():
    """Verify low risk prediction for all-false answers."""
    answers = [{"id": i, "answer": "False"} for i in range(1, 17)]
    payload = {
        "assessment_type": "schizophrenia",
        "age_group": "19-25",
        "answers": answers
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["predicted_class"] == 0
    assert data["prediction_label"] == "Baseline / Low Psychosis Risk Profile"
    assert data["risk_probability"] < 0.5

def test_predict_bipolar_elevated():
    """Verify positive bipolar risk prediction for high endorsement responses."""
    # 10 symptoms + co-occurrence + impairment
    answers = [{"id": i, "answer": "True" if i <= 10 or i in [14, 15] else "False"} for i in range(1, 16)]
    payload = {
        "assessment_type": "bipolar",
        "age_group": "19-25",
        "answers": answers
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_supported"] is True
    assert data["predicted_class"] == 1
    assert "Bipolar Spectrum Risk" in data["prediction_label"]

def test_predict_bipolar_low_risk():
    """Verify low risk prediction for all-false responses in bipolar screening."""
    answers = [{"id": i, "answer": "False"} for i in range(1, 16)]
    payload = {
        "assessment_type": "bipolar",
        "age_group": "19-25",
        "answers": answers
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_class"] == 0
    assert "Baseline / Low Bipolar" in data["prediction_label"]

def test_supported_age_group_child():
    """Verify age group '6-12' is supported and yields a valid prediction."""
    payload = {
        "assessment_type": "schizophrenia",
        "age_group": "6-12",
        "answers": [{"id": 1, "answer": "True"}]
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_supported"] is True

def test_supported_age_group_teen():
    """Verify age group '13-18' is supported and yields a valid prediction."""
    payload = {
        "assessment_type": "bipolar",
        "age_group": "13-18",
        "answers": [{"id": 1, "answer": "True"}]
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_supported"] is True

def test_invalid_assessment_type():
    """Verify 400 bad request for unrecognized test types."""
    payload = {
        "assessment_type": "depression_unknown",
        "age_group": "19-25",
        "answers": []
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 400
    assert "Unsupported assessment type" in response.json()["detail"]

def test_empty_answers_handled_safely():
    """Verify empty answers array handles gracefully without crashing (imputing baseline)."""
    payload = {
        "assessment_type": "schizophrenia",
        "age_group": "19-25",
        "answers": []
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["predicted_class"] == 0


def test_predict_with_longitudinal_history():
    """Verify ML prediction processes optional historical context correctly."""
    answers = [{"id": i, "answer": "True" if i <= 5 else "False"} for i in range(1, 17)]
    history = [
        {"assessment_type": "schizophrenia", "score": 8, "date": "10 Oct 2026"}
    ]
    payload = {
        "assessment_type": "schizophrenia",
        "age_group": "19-25",
        "profession": "student",
        "answers": answers,
        "history": history
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["longitudinal_context"] is not None
    assert data["longitudinal_context"]["has_history"] is True
    assert data["longitudinal_context"]["previous_score"] == 8
    assert data["longitudinal_context"]["score_delta"] == -3
    assert data["longitudinal_context"]["trajectory_direction"] == "decreased"

