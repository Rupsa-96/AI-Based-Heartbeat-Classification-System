from pydantic import BaseModel, Field
from typing import Optional, List


class PatientInput(BaseModel):
    age:      float = Field(..., ge=1,   le=120,  description="Age in years")
    sex:      int   = Field(..., ge=0,   le=1,    description="0=Female, 1=Male")
    cp:       int   = Field(..., ge=0,   le=3,    description="Chest pain type 0-3")
    trestbps: float = Field(..., ge=50,  le=250,  description="Resting blood pressure mm Hg")
    chol:     float = Field(..., ge=50,  le=700,  description="Serum cholesterol mg/dl")
    fbs:      int   = Field(..., ge=0,   le=1,    description="Fasting blood sugar >120 mg/dl")
    restecg:  int   = Field(..., ge=0,   le=2,    description="Resting ECG result 0-2")
    thalach:  float = Field(..., ge=60,  le=250,  description="Max heart rate bpm")
    exang:    int   = Field(..., ge=0,   le=1,    description="Exercise-induced angina")
    oldpeak:  float = Field(..., ge=0.0, le=10.0, description="ST depression")
    slope:    int   = Field(..., ge=0,   le=2,    description="Peak exercise ST slope")
    ca:       int   = Field(..., ge=0,   le=4,    description="Major vessels 0-4")
    thal:     int   = Field(..., ge=0,   le=3,    description="Thalassemia type 0-3")

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 55, "sex": 1, "cp": 2, "trestbps": 140,
                "chol": 250, "fbs": 0, "restecg": 1, "thalach": 150,
                "exang": 0, "oldpeak": 1.2, "slope": 1, "ca": 0, "thal": 2,
            }
        }
    }


class PredictionResponse(BaseModel):
    prediction:  str   = Field(..., description="Human readable label")
    probability: float = Field(..., ge=0.0, le=1.0)
    risk_level:  str   = Field(..., description="Low / Moderate / High")
    disclaimer:  str


class HealthResponse(BaseModel):
    status:       str
    model_loaded: bool
    message:      str


class HistoryEntry(BaseModel):
    id:        int
    timestamp: str

    age:      float
    sex:      int
    cp:       int
    trestbps: float
    chol:     float
    fbs:      int
    restecg:  int
    thalach:  float
    exang:    int
    oldpeak:  float
    slope:    int
    ca:       int
    thal:     int

    prediction:  str
    probability: float = Field(..., ge=0.0, le=1.0)
    risk_level:  str
    disclaimer:  str


class HistoryListResponse(BaseModel):
    records: List[HistoryEntry]
    stats:   dict


class DeleteResponse(BaseModel):
    success:       bool
    message:       str
    deleted_count: int = Field(default=1)
