# -*- coding: utf-8 -*-

import os
import io
import base64
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from datetime import datetime
from sklearn.model_selection import StratifiedKFold, cross_val_score, learning_curve, train_test_split
from sklearn.metrics import (
    roc_auc_score, roc_curve, auc, precision_recall_curve,
    f1_score, precision_score, recall_score, confusion_matrix, accuracy_score,
    classification_report
)
import joblib

# ============ إعدادات عامة ============
plt.rcParams["figure.dpi"] = 120
REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)

DATA_PATH = "./Thyroid_Diff.csv"
TARGET_COL = "Recurred"
FORBIDDEN_COLS = ["Response"]  # لمنع التسريب مثل ما تم في التدريب
MODEL_PATH = "models/voting_pipeline_robust.pkl"  # <-- محدث
TARGET_LE_PATH = "models/target_label_encoder.pkl"

def save_fig_to_b64():
    """يحفظ الرسم الحالي إلى base64 PNG ويعيد النص الجاهز للتضمين في HTML."""
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png", bbox_inches="tight")
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

def cm_figure(cm, labels=("0","1"), title="Confusion Matrix"):
    """يرسم مصفوفة الالتباس ويعيد base64."""
    fig, ax = plt.subplots(figsize=(4, 4))
    im = ax.imshow(cm, interpolation="nearest")
    ax.set_title(title)
    ax.set_xticks([0,1]); ax.set_yticks([0,1])
    ax.set_xticklabels(labels); ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    # النص داخل الخانات
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, f"{cm[i, j]}", ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    plt.colorbar(im, fraction=0.046, pad=0.04)
    return save_fig_to_b64()

# ============ 1) تحميل البيانات والنموذج ============
print("Loading data/model ...")
df = pd.read_csv(DATA_PATH)

# استبعاد الأعمدة الممنوعة (مثل Response) من ميزات التقرير أيضًا
drop_cols = [c for c in FORBIDDEN_COLS if c in df.columns]
y_raw = df[TARGET_COL]
X = df.drop(columns=[TARGET_COL] + drop_cols)

# تحميل نموذج التصويت robust
voting = joblib.load(MODEL_PATH)

# تحضير y رقمية (0/1)
try:
    target_le = joblib.load(TARGET_LE_PATH)
    y = target_le.transform(y_raw)
    class_labels = list(target_le.classes_)
except Exception:
    # fallback: تحويل فئات نصية إلى أرقام
    y = y_raw.values if np.issubdtype(y_raw.dtype, np.number) else pd.Series(y_raw).astype("category").cat.codes.values
    class_labels = ["0", "1"]

# ============ 2) 5-Fold Cross-Validation ============
print("Running 5-fold CV ...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def cv_scores(scoring_name):
    scores = cross_val_score(voting, X, y, cv=cv, scoring=scoring_name)
    return scores.mean(), scores.std()

cv_results = {}
for sc_name in ["roc_auc", "accuracy", "f1", "precision", "recall"]:
    m, s = cv_scores(sc_name)
    cv_results[sc_name] = (m, s)

# ============ 3) Learning Curve (AUC) ============
print("Building learning curve ...")
train_sizes, train_scores, val_scores = learning_curve(
    voting, X, y, cv=cv, scoring="roc_auc",
    train_sizes=np.linspace(0.2, 1.0, 6), shuffle=True, random_state=42
)
train_mean = train_scores.mean(axis=1)
val_mean   = val_scores.mean(axis=1)

plt.figure()
plt.title("Learning Curve (ROC-AUC)")
plt.plot(train_sizes, train_mean, marker="o", label="Train AUC")
plt.plot(train_sizes, val_mean, marker="o", label="CV AUC")
plt.xlabel("Training samples")
plt.ylabel("ROC-AUC")
plt.grid(True, alpha=0.3)
plt.legend()
lc_b64 = save_fig_to_b64()

# ============ 4) Split ثابت: ROC/PR + أفضل عتبة ============
print("Validation split for curves & threshold ...")
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# نُدرّب نسخة النموذج المحمّل على السبلِت هذا فقط لأجل الرسومات
voting.fit(X_tr, y_tr)

proba = voting.predict_proba(X_te)[:, 1]

# ROC
fpr, tpr, thr_roc = roc_curve(y_te, proba)
roc_auc_val = auc(fpr, tpr)
plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc_val:.3f}")
plt.plot([0,1],[0,1],"--")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve (Validation)")
plt.grid(True, alpha=0.3)
plt.legend()
roc_b64 = save_fig_to_b64()

# PR + أفضل عتبة لفحص F1
prec, rec, thr_pr = precision_recall_curve(y_te, proba)
plt.figure()
plt.plot(rec, prec)
plt.xlabel("Recall")
plt.ylabel("Precision")
plt.title("Precision–Recall (Validation)")
plt.grid(True, alpha=0.3)
pr_b64 = save_fig_to_b64()

ths = np.linspace(0.1, 0.9, 81)
f1_vals = []
for t in ths:
    yhat = (proba >= t).astype(int)
    f1_vals.append(f1_score(y_te, yhat, zero_division=0))
best_idx = int(np.argmax(f1_vals))
best_t = float(ths[best_idx])
best_f1 = float(f1_vals[best_idx])

# مقاييس عند 0.5 وعند العتبة المثلى
def metrics_at_threshold(t):
    yhat = (proba >= t).astype(int)
    acc = accuracy_score(y_te, yhat)
    prc = precision_score(y_te, yhat, zero_division=0)
    rcl = recall_score(y_te, yhat, zero_division=0)
    f1v = f1_score(y_te, yhat, zero_division=0)
    cm  = confusion_matrix(y_te, yhat)
    return acc, prc, rcl, f1v, cm

acc50, p50, r50, f150, cm50 = metrics_at_threshold(0.50)
accBT, pBT, rBT, f1BT, cmBT  = metrics_at_threshold(best_t)
cm50_b64 = cm_figure(cm50, labels=class_labels, title=f"Confusion Matrix @0.50")
cmBT_b64 = cm_figure(cmBT, labels=class_labels, title=f"Confusion Matrix @{best_t:.2f}")

# ============ 5) Top Features من XGB ============
print("Extracting top features from XGB ...")
xgb_pipe = None

# إذا كان voting من النوع المُدرّب (estimators_) أو المُهيّأ (estimators)
if hasattr(voting, "estimators_") and voting.estimators_:
    # بعد fit: قائمة من النماذج فقط (بدون أسماء)، نبحث عن البايبلاين الذي فيه 'clf' وله feature_importances_
    for est in voting.estimators_:
        if hasattr(est, "named_steps") and "clf" in est.named_steps and hasattr(est.named_steps["clf"], "feature_importances_"):
            xgb_pipe = est
            break
if xgb_pipe is None and hasattr(voting, "estimators"):
    # قبل/بعد fit: قائمة (اسم, نموذج)
    for name, est in voting.estimators:
        if "xgb" in name.lower():
            xgb_pipe = est
            break

top_features_html = "<p>لم يتمكّن السكربت من استخراج الأهميات (تحقق من أسماء الخطوات داخل الـPipeline).</p>"
if xgb_pipe is not None and hasattr(xgb_pipe, "named_steps") and "clf" in xgb_pipe.named_steps:
    clf = xgb_pipe.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        preprocess_in_pipe = xgb_pipe.named_steps.get("preprocess", None)

        # أسماء الأعمدة الأصلية لكل transformer
        try:
            num_cols = list(preprocess_in_pipe.transformers_[0][2]) if preprocess_in_pipe else []
        except Exception:
            num_cols = []
        try:
            cat_cols = list(preprocess_in_pipe.transformers_[1][2]) if preprocess_in_pipe else []
        except Exception:
            # تقدير تقريبي
            cat_cols = [c for c in X.columns if c not in num_cols]

        cat_feature_names = []
        if preprocess_in_pipe is not None:
            cat_transformer = preprocess_in_pipe.named_transformers_.get("cat", None)
            if cat_transformer is not None:
                if hasattr(cat_transformer, "get_feature_names_out"):
                    cat_feature_names = list(cat_transformer.get_feature_names_out(cat_cols))
                else:
                    try:
                        cat_feature_names = list(cat_transformer.get_feature_names(cat_cols))
                    except Exception:
                        cat_feature_names = [f"{c}_cat" for c in cat_cols]

        feature_names = list(num_cols) + list(cat_feature_names)
        fi = clf.feature_importances_

        L = min(len(feature_names), len(fi))
        feature_names = feature_names[:L]
        fi = fi[:L]

        top = sorted(zip(feature_names, fi), key=lambda x: x[1], reverse=True)[:20]
        top_df = pd.DataFrame(top, columns=["feature", "importance"])
        out_csv = os.path.join(REPORT_DIR, "val_feature_importance_top20.csv")
        top_df.to_csv(out_csv, index=False, encoding="utf-8-sig")

        rows = "\n".join([f"<tr><td>{i+1}</td><td>{f}</td><td>{imp:.6f}</td></tr>" for i, (f, imp) in enumerate(top)])
        top_features_html = f"""
        <p>حُفظت نسخة CSV: <code>{out_csv}</code></p>
        <table class="tbl">
          <thead><tr><th>#</th><th>Feature</th><th>Importance</th></tr></thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        """

# ============ 6) بناء الـHTML ============
print("Writing HTML report ...")
def fmt(ms):
    m, s = cv_results[ms]
    return f"{m:.4f} ± {s:.4f}"

html = f"""
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>تقرير نموذج التصويت (XGB+LGBM)</title>
<style>
  body {{ font-family: Arial, Tahoma; margin: 20px; color:#222; }}
  h1,h2,h3 {{ margin: 0.4em 0; }}
  .kpi {{ display:flex; gap:12px; flex-wrap:wrap; margin:12px 0; }}
  .card {{ border:1px solid #ddd; border-radius:10px; padding:12px 16px; }}
  img {{ max-width: 100%; height: auto; border:1px solid #eee; border-radius:8px; }}
  .tbl {{ border-collapse: collapse; width: 100%; }}
  .tbl th, .tbl td {{ border:1px solid #ddd; padding:8px; text-align:center; }}
  .small {{ color:#666; font-size: 12px; }}
  code {{ background:#f6f6f6; padding:2px 4px; border-radius:4px; }}
</style>
</head>
<body>
  <h1>تقرير أداء النموذج (Voting: XGB + LGBM)</h1>
  <p class="small">تاريخ التوليد: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>

  <h2>ملخص 5-Fold Cross-Validation</h2>
  <div class="kpi">
    <div class="card"><b>ROC-AUC</b><br>{fmt("roc_auc")}</div>
    <div class="card"><b>Accuracy</b><br>{fmt("accuracy")}</div>
    <div class="card"><b>F1</b><br>{fmt("f1")}</div>
    <div class="card"><b>Precision</b><br>{fmt("precision")}</div>
    <div class="card"><b>Recall</b><br>{fmt("recall")}</div>
  </div>

  <h2>Learning Curve</h2>
  <img src="data:image/png;base64,{lc_b64}" alt="Learning Curve" />

  <h2>منحنيات التحقق (Validation)</h2>
  <div class="kpi">
    <div class="card"><b>ROC-AUC (val)</b><br>{roc_auc_val:.4f}</div>
    <div class="card"><b>أفضل عتبة (F1)</b><br>{best_t:.2f}</div>
    <div class="card"><b>F1 @ أفضل عتبة</b><br>{best_f1:.4f}</div>
  </div>
  <h3>ROC Curve</h3>
  <img src="data:image/png;base64,{roc_b64}" alt="ROC Curve" />
  <h3>Precision–Recall Curve</h3>
  <img src="data:image/png;base64,{pr_b64}" alt="PR Curve" />

  <h2>مقارنة المقاييس حسب العتبة</h2>
  <table class="tbl">
    <thead>
      <tr><th>Threshold</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr>
    </thead>
    <tbody>
      <tr><td>0.50</td><td>{acc50:.4f}</td><td>{p50:.4f}</td><td>{r50:.4f}</td><td>{f150:.4f}</td></tr>
      <tr><td>{best_t:.2f}</td><td>{accBT:.4f}</td><td>{pBT:.4f}</td><td>{rBT:.4f}</td><td>{f1BT:.4f}</td></tr>
    </tbody>
  </table>

  <h3>مصفوفات الالتباس</h3>
  <div style="display:flex; gap:12px; flex-wrap:wrap;">
    <div>
      <b>@ 0.50</b><br>
      <img src="data:image/png;base64,{cm50_b64}" alt="CM 0.50" />
    </div>
    <div>
      <b>@ {best_t:.2f}</b><br>
      <img src="data:image/png;base64,{cmBT_b64}" alt="CM best T" />
    </div>
  </div>

  <h2>Top 20 Features (XGBoost)</h2>
  {top_features_html}

  <hr>
  <p class="small">
    ملاحظات:
    <br>• إذا رأيت فجوة كبيرة بين Train AUC و CV AUC على منحنى التعلم → احتمال أوفرفيتنق.
    <br>• استخدم أفضل عتبة (بدل 0.50) إذا كان هدفك رفع الـRecall بدون هبوط كبير في الـPrecision.
    <br>• تأكد من عدم وجود Feature Leakage (مثلاً أعمدة ما تكون معروفة وقت اتخاذ القرار).
  </p>
</body>
</html>
"""

out_html = os.path.join(REPORT_DIR, "model_report.html")
with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\n✅ Report written to: {out_html}\n"
      f"افتحه بالمتصفح، ثم اطبع (Ctrl+P) واختر Save as PDF لو تبغى نسخة PDF.")

# لفتح التقرير تلقائيًا في المتصفح، فعّل السطور التالية:
# import webbrowser
# webbrowser.open('file://' + os.path.realpath(out_html))
