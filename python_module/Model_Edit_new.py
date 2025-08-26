# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
import joblib

# ================== تحميل الموديلات (Pipelines) ==================
xgb_model     = joblib.load('models/xgb_pipeline_robust.pkl')
lgb_model     = joblib.load('models/lgb_pipeline_robust.pkl')
voting_model  = joblib.load('models/voting_pipeline_robust.pkl')
target_le     = joblib.load('models/target_label_encoder.pkl')

# ================== إعداد نافذة Tkinter ==================
root = tk.Tk()
root.title("Thyroid Recurrence Prediction")

options_with_hints = {
    'Age': {'values': [str(i) for i in range(15, 100)],
            'hint': "العمر عند التشخيص (بالسنوات)."},
    'Gender': {'values': ['F', 'M'],
               'hint': "الجنس: F = أنثى، M = ذكر."},
    'Smoking': {'values': ['No', 'Yes'],
                'hint': "هل المريض مدخن حاليًا؟"},
    'Hx Smoking': {'values': ['No', 'Yes'],
                   'hint': "تاريخ التدخين السابق (Hx = History)."},
    'Hx Radiothreapy': {'values': ['No', 'Yes'],
                        'hint': "هل تلقى علاجًا إشعاعيًا سابقًا للرقبة؟"},
    'Thyroid Function': {'values': [
            'Euthyroid','Clinical Hyperthyroidism','Subclinical Hyperthyroidism',
            'Clinical Hypothyroidism','Subclinical Hypothyroidism'],
            'hint': "الحالة الوظيفية للغدة."},
    'Physical Examination': {'values': [
            'Single nodular goiter-right','Single nodular goiter-left',
            'Multinodular goiter','Diffuse goiter','Normal','Posterior'],
            'hint': "نتيجة الفحص السريري."},
    'Adenopathy': {'values': ['No', 'Right', 'Left', 'Bilateral', 'Extensive'],
                   'hint': "العقد اللمفاوية."},
    'Pathology': {'values': ['Micropapillary', 'Papillary', 'Follicular', 'Hurthel cell'],
                  'hint': "النوع النسيجي."},
    'Focality': {'values': ['Uni-Focal', 'Multi-Focal'],
                 'hint': "عدد البؤر الورمية."},
    'Risk': {'values': ['Low', 'Intermediate', 'High'],
             'hint': "تصنيف الخطر حسب ATA 2015."},
    'T': {'values': ['T1a', 'T1b', 'T2', 'T3a', 'T3b', 'T4a', 'T4b'],
          'hint': "Tumor حسب TNM."},
    'N': {'values': ['N0', 'N1a', 'N1b'],
          'hint': "Node حسب TNM."},
    'M': {'values': ['M0', 'M1'],
          'hint': "Metastasis حسب TNM."},
}

entries = {}

row_idx = 0
for field, cfg in options_with_hints.items():
    tk.Label(root, text=field).grid(row=row_idx, column=0, padx=5, pady=3, sticky='w')
    cb = ttk.Combobox(root, values=cfg['values'], state='readonly')
    cb.grid(row=row_idx, column=1, padx=5, pady=3, sticky='we')
    entries[field] = cb
    tk.Label(root, text=cfg['hint'], fg='gray', font=('Arial', 8), justify='left')\
        .grid(row=row_idx+1, column=0, columnspan=2, padx=20, sticky='w')
    row_idx += 2

# ---------------- حساب Stage (AJCC 8th) ----------------
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

stage_label = tk.Label(root, text="Stage: لم يتم الحساب بعد", font=("Arial", 10, "bold"))
stage_label.grid(row=row_idx, column=0, columnspan=2, pady=6, sticky='w')
row_idx += 1

def clear_fields():
    for cb in entries.values():
        cb.set('')
    stage_label.config(text="Stage: لم يتم الحساب بعد")

# ---------------- التنبؤ ----------------
def predict():
    try:
        missing = [k for k, w in entries.items() if not w.get()]
        if missing:
            messagebox.showwarning("Warning", f"الرجاء تعبئة الحقول: {', '.join(missing)}")
            return

        data = {k: [w.get()] for k, w in entries.items()}
        df_new = pd.DataFrame(data)

        stage_code = calculate_stage(
            df_new["T"].iloc[0], df_new["N"].iloc[0],
            df_new["M"].iloc[0], df_new["Age"].iloc[0]
        )
        df_new["Stage"] = stage_code
        stage_label.config(text=f"Stage: {stage_code}")

        # Age كرقم فقط، الباقي يُعالج داخل Pipelines
        df_new['Age'] = pd.to_numeric(df_new['Age'])

        # ===== XGBoost =====
        pred_xgb = xgb_model.predict(df_new)
        prob_xgb = float(xgb_model.predict_proba(df_new)[0][1])
        result_xgb = target_le.inverse_transform(pred_xgb)[0]

        # ===== LightGBM =====
        pred_lgb = lgb_model.predict(df_new)
        prob_lgb = float(lgb_model.predict_proba(df_new)[0][1])
        result_lgb = target_le.inverse_transform(pred_lgb)[0]

        # ===== Voting (XGB+LGBM) =====
        pred_vote = voting_model.predict(df_new)
        prob_vote = float(voting_model.predict_proba(df_new)[0][1])
        result_vote = target_le.inverse_transform(pred_vote)[0]

        messagebox.showinfo(
            "Prediction Results",
            f"Stage (AJCC 8th): {stage_code}\n\n"
            f"XGBoost (robust):\nRecurred: {result_xgb}\nProbability: {round(prob_xgb, 2)}\n\n"
            f"LightGBM (robust):\nRecurred: {result_lgb}\nProbability: {round(prob_lgb, 2)}\n\n"
            f"Voting (XGB+LGBM):\nRecurred: {result_vote}\nProbability: {round(prob_vote, 2)}"
        )

    except Exception as e:
        messagebox.showerror("Error", str(e))

# ---------------- الأزرار ----------------
btn_frame = tk.Frame(root)
btn_frame.grid(row=row_idx+1, column=0, columnspan=2, pady=10, sticky='we')

tk.Button(btn_frame, text="Predict", command=predict).grid(row=0, column=0, padx=5, sticky='we')
tk.Button(btn_frame, text="Clear", command=clear_fields).grid(row=0, column=1, padx=5, sticky='we')
tk.Button(btn_frame, text="Exit", command=root.destroy).grid(row=0, column=2, padx=5, sticky='we')

btn_frame.columnconfigure(0, weight=1)
btn_frame.columnconfigure(1, weight=1)
btn_frame.columnconfigure(2, weight=1)

root.mainloop()
