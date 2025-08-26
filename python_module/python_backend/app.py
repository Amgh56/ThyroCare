from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import traceback

# ================== تحميل الموديلات (Pipelines) ==================
xgb_model     = joblib.load('../models/xgb_pipeline_robust.pkl')
lgb_model     = joblib.load('../models/lgb_pipeline_robust.pkl')
voting_model  = joblib.load('../models/voting_pipeline_robust.pkl')
target_le     = joblib.load('../models/target_label_encoder.pkl')

# ==================  تهيئة التطبيق وإعداد صلاحيات التواصل بين المودل والفرونتCORS ==================
app = FastAPI(title="ThyroCare API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== لتأكيد أن البيانات الواردة تطابق الحقول المطلوبة =================
class PatientInput(BaseModel):
    age: int
    gender: str
    smoking: bool
    smokingHistory: bool
    radiotherapyHistory: bool
    thyroidFunction: str
    physicalExam: str
    adenopathy: str
    pathology: str
    focality: str
    riskATA: str
    tumorStage: str
    nodeStage: str
    metastasis: str

# ==================  حساب Stage (AJCC 8th) ==================
def calculate_stage(T, N, M, Age):
    Age = int(Age)
    if Age < 55:
        return "II" if M == "M1" else "I"
    if M == "M1":
        return "IVB"
    if T in ["T1a", "T1b", "T2"]:
        if N in ["N0", "NX"]:
            return "I"
        elif N in ["N1a", "N1b"]:
            return "II"
    if T in ["T3a", "T3b"]:
        return "II"
    if T == "T4a":
        return "III"
    if T == "T4b":
        return "IVB"
    return "I"

@app.get("/")
def root():
    return {"message": "ThyroCare backend is running 🚀"}


# ==================  التنبؤ ==================
@app.post("/predict")
def predict(input: PatientInput):
    try:
        stage_code = calculate_stage(input.tumorStage, input.nodeStage, input.metastasis, input.age)

# ==================  يطابق اليانات باعمده المودل ==================
        row = {
            "Age": input.age,
            "Gender": input.gender,
            "Smoking": "Yes" if input.smoking else "No",
            "Hx Smoking": "Yes" if input.smokingHistory else "No",
            "Hx Radiothreapy": "Yes" if input.radiotherapyHistory else "No",
            "Thyroid Function": input.thyroidFunction,
            "Physical Examination": input.physicalExam,
            "Adenopathy": input.adenopathy,
            "Pathology": input.pathology,
            "Focality": input.focality,
            "Risk": input.riskATA,
            "T": input.tumorStage,
            "N": input.nodeStage,
            "M": input.metastasis,
            "Stage": stage_code,  
        }
        df = pd.DataFrame([row])

        df["Age"] = pd.to_numeric(df["Age"], errors="coerce")

        pred_vote = voting_model.predict(df)
        prob_vote = float(voting_model.predict_proba(df)[0][1])
        raw = target_le.inverse_transform(pred_vote)[0]  

        recurrence = True if str(raw).lower() in ("yes", "1", "true") else False

        return {
            "stage": stage_code,
            "recurrence": recurrence,
            "probability": prob_vote,
            "model": "Voting (XGB+LGBM)",
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Prediction error: {e}")
