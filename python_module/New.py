import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
import joblib

xgb_model = joblib.load('models/xgb_model.pkl')
lgb_model = joblib.load('models/lgb_model.pkl')
label_encoders = joblib.load('models/label_encoders.pkl')
target_le = joblib.load('models/target_encoder.pkl')
scaler = joblib.load('models/scaler.pkl')

root = tk.Tk()
root.title("Thyroid Recurrence Prediction")


options_with_hints = {
    'Age': {
        'values': [str(i) for i in range(15, 100)],
        'hint': "العمر عند التشخيص (بالسنوات)."
    },
    'Gender': {
        'values': ['F', 'M'],
        'hint': "الجنس: F = أنثى، M = ذكر."
    },
    'Smoking': {
        'values': ['No', 'Yes'],
        'hint': "هل المريض مدخن حاليًا؟"
    },
    'Hx Smoking': {
        'values': ['No', 'Yes'],
        'hint': "تاريخ التدخين السابق (Hx = History)."
    },
    'Hx Radiothreapy': {
        'values': ['No', 'Yes'],
        'hint': "هل تلقى علاجًا إشعاعيًا سابقًا للرقبة؟"
    },
    'Thyroid Function': {
        'values': [
            'Euthyroid',
            'Clinical Hyperthyroidism',
            'Subclinical Hyperthyroidism',
            'Clinical Hypothyroidism',
            'Subclinical Hypothyroidism'
        ],
        'hint': "الحالة الوظيفية للغدة: طبيعي / فرط أو خمول (سريري أو تحت سريري)."
    },
    'Physical Examination': {
        'values': [
            'Single nodular goiter-right',
            'Single nodular goiter-left',
            'Multinodular goiter',
            'Diffuse goiter',
            'Normal',
            'Posterior'
        ],
        'hint': "نتيجة الفحص السريري للغدة الدرقية."
    },
    'Adenopathy': {
        'values': ['No', 'Right', 'Left', 'Bilateral', 'Extensive'],
        'hint': "حالة العقد اللمفاوية: لا/يمين/يسار/ثنائي/واسع."
    },
    'Pathology': {
        'values': ['Micropapillary', 'Papillary', 'Follicular', 'Hurthel cell'],
        'hint': "النوع النسيجي للورم تحت المجهر."
    },
    'Focality': {
        'values': ['Uni-Focal', 'Multi-Focal'],
        'hint': "عدد البؤر الورمية: واحدة أو متعددة."
    },
    'Risk': {
        'values': ['Low', 'Intermediate', 'High'],
        'hint': (
            "تصنيف احتمال عودة الورم (ATA 2015):\n"
            "🔹 Low: الورم محصور داخل الغدة، لا غزو وعائي/خارج الغدة، ≤5 عقد مجهرية ≤0.2 سم.\n"
            "🔸 Intermediate: غزو وعائي أو امتداد خارج الغدة محدود (Minimal ETE) أو N1a/N1b محدود "
            "أو أنماط عدوانية (Tall cell/Columnar/Solid).\n"
            "⚠️ High: امتداد واسع خارج الغدة (Gross ETE) أو نقائل بعيدة (M1) أو انتشار واسع بالعقد "
            "أو أورام عالية العدوانية (Poorly diff./Anaplastic)."
        )
    },
    'T': {
        'values': ['T1a', 'T1b', 'T2', 'T3a', 'T3b', 'T4a', 'T4b'],
        'hint': "الورم الأساسي (Tumor) حسب TNM."
    },
    'N': {
        'values': ['N0', 'N1a', 'N1b'],
        'hint': "العقد اللمفاوية (Node) حسب TNM."
    },
    'M': {
        'values': ['M0', 'M1'],
        'hint': "النقائل البعيدة (Metastasis) حسب TNM."
    },
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

def calculate_stage(T, N, M, Age):
    Age = int(Age)

    # < 55 سنة: I أو II فقط
    if Age < 55:
        return "II" \
            if M == "M1" else "I"

    # >= 55 سنة
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
    """يمسح جميع اختيارات الـ Combobox ويعيد Label الخاص بالـ Stage."""
    for cb in entries.values():
        cb.set('')  # إفراغ القيمة المختارة
    stage_label.config(text="Stage: لم يتم الحساب بعد")

# ---------------- التنبؤ ----------------
def predict():
    try:
        # التحقق من الحقول غير المعبأة
        missing = [k for k, w in entries.items() if not w.get()]
        if missing:
            messagebox.showwarning("Warning", f"الرجاء تعبئة الحقول: {', '.join(missing)}")
            return

        # تجميع القيم في DataFrame
        data = {k: [w.get()] for k, w in entries.items()}
        df_new = pd.DataFrame(data)

        # حساب وإضافة Stage (مختصر) + تحديث العرض للمستخدم
        stage_code = calculate_stage(
            df_new["T"].iloc[0],
            df_new["N"].iloc[0],
            df_new["M"].iloc[0],
            df_new["Age"].iloc[0],
        )
        df_new["Stage"] = stage_code
        stage_label.config(text=f"Stage: {stage_code}")

        # ترميز الأعمدة الفئوية وفق الـ LabelEncoders المخزنة
        for col in df_new.columns:
            if col in label_encoders:
                le = label_encoders[col]
                v = df_new[col].iloc[0]
                if v not in le.classes_:
                    raise ValueError(f"قيمة غير معروفة في '{col}': {v}. القيم المتاحة: {list(le.classes_)}")
                df_new[col] = le.transform(df_new[col])

        # تحويل Age إلى رقم ثم تطبيق StandardScaler
        df_new['Age'] = pd.to_numeric(df_new['Age'])
        df_new['Age'] = scaler.transform(df_new[['Age']])

        #  XGBoost
        pred_xgb = xgb_model.predict(df_new)
        prob_xgb = float(xgb_model.predict_proba(df_new)[0][1])
        result_xgb = target_le.inverse_transform(pred_xgb)[0]

        #  LightGBM
        pred_lgb = lgb_model.predict(df_new)
        prob_lgb = float(lgb_model.predict_proba(df_new)[0][1])
        result_lgb = target_le.inverse_transform(pred_lgb)[0]

        # عرض النتائج
        messagebox.showinfo(
            "Prediction Results",
            f"Stage (AJCC 8th): {stage_code}\n\n"
            f"XGBoost:\nRecurred: {result_xgb}\nProbability: {round(prob_xgb, 2)}\n\n"
            f"LightGBM:\nRecurred: {result_lgb}\nProbability: {round(prob_lgb, 2)}"
        )

    except Exception as e:
        messagebox.showerror("Error", str(e))

# ---------------- الأزرار ----------------
btn_frame = tk.Frame(root)
btn_frame.grid(row=row_idx+1, column=0, columnspan=2, pady=10, sticky='we')

tk.Button(btn_frame, text="Predict", command=predict).grid(row=0, column=0, padx=5, sticky='we')
tk.Button(btn_frame, text="Clear", command=clear_fields).grid(row=0, column=1, padx=5, sticky='we')  # زر المسح
tk.Button(btn_frame, text="Exit", command=root.destroy).grid(row=0, column=2, padx=5, sticky='we')

btn_frame.columnconfigure(0, weight=1)
btn_frame.columnconfigure(1, weight=1)
btn_frame.columnconfigure(2, weight=1)

root.mainloop()