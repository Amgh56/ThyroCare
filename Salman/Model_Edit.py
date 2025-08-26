# -*- coding: utf-8 -*-
import os
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.ensemble import VotingClassifier

from xgboost import XGBClassifier
import xgboost as xgb
from lightgbm import LGBMClassifier
import joblib

DATA_PATH = "./Thyroid_Diff.csv"
TARGET_COL = "Recurred"
FORBIDDEN_COLS = ['Response']   # ميزات “متأخرة زمنيًا” (Leakage) تُستبعد

df = pd.read_csv(DATA_PATH)
y_raw = df[TARGET_COL]
X = df.drop(columns=[TARGET_COL] + [c for c in FORBIDDEN_COLS if c in df.columns])

categorical_cols = [
    'Gender','Smoking','Hx Smoking','Hx Radiothreapy','Thyroid Function',
    'Physical Examination','Adenopathy','Pathology','Focality','Risk',
    'T','N','M','Stage'
]
numeric_cols = ['Age']
categorical_cols = [c for c in categorical_cols if c in X.columns]
numeric_cols     = [c for c in numeric_cols     if c in X.columns]

target_le = LabelEncoder()
y = target_le.fit_transform(y_raw)

X_train_full, X_test, y_train_full, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
X_tr, X_val, y_tr, y_val = train_test_split(
    X_train_full, y_train_full, test_size=0.15, random_state=42, stratify=y_train_full
)


try:
    preprocess = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols),
        ],
        remainder='drop'
    )
except TypeError:
    preprocess = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse=False), categorical_cols),
        ],
        remainder='drop'
    )


pre_es = Pipeline([('prep', preprocess)])
pre_es.fit(X_tr, y_tr)
Xtr_t  = pre_es.transform(X_tr)
Xval_t = pre_es.transform(X_val)

dtr  = xgb.DMatrix(Xtr_t,  label=y_tr)
dval = xgb.DMatrix(Xval_t, label=y_val)

xgb_params = {
    'objective': 'binary:logistic',
    'eval_metric': 'logloss',
    'tree_method': 'hist',
    'learning_rate': 0.03,
    'max_depth': 4,
    'min_child_weight': 5,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'gamma': 1.0,
    'reg_alpha': 1.0,
    'reg_lambda': 3.0,
    'seed': 42
}

xgb_bst = xgb.train(
    params=xgb_params,
    dtrain=dtr,
    num_boost_round=1200,
    evals=[(dval, 'valid')],
    early_stopping_rounds=80,
    verbose_eval=False
)
best_iter = getattr(xgb_bst, 'best_iteration', None)
best_n = int(best_iter + 1) if best_iter is not None else 300
print(f"[XGB] best_iteration = {best_iter}, using n_estimators = {best_n}")


xgb_final = XGBClassifier(
    tree_method='hist',
    random_state=42,
    n_estimators=best_n,
    learning_rate=0.03,
    max_depth=4,
    min_child_weight=5,
    subsample=0.8,
    colsample_bytree=0.8,
    gamma=1.0,
    reg_alpha=1.0,
    reg_lambda=3.0,
    eval_metric='logloss'
)
lgb_final = LGBMClassifier(
    random_state=42,
    n_estimators=600,
    learning_rate=0.03,
    num_leaves=31,
    min_data_in_leaf=20,
    feature_fraction=0.8,
    bagging_fraction=0.8,
    bagging_freq=1,
    lambda_l1=1.0,
    lambda_l2=3.0,
    min_gain_to_split=1.0,
    class_weight='balanced',
    max_bin=255,
    verbose=-1
)

xgb_pipe = Pipeline([('preprocess', preprocess), ('clf', xgb_final)])
lgb_pipe = Pipeline([('preprocess', preprocess), ('clf', lgb_final)])
voting = VotingClassifier(estimators=[('xgb', xgb_pipe), ('lgb', lgb_pipe)], voting='soft')

xgb_pipe.fit(X_train_full, y_train_full)
lgb_pipe.fit(X_train_full, y_train_full)
voting.fit(X_train_full, y_train_full)

def evaluate(model, X_te, y_te, name='Model'):
    y_pred = model.predict(X_te)
    y_proba = model.predict_proba(X_te)[:, 1] if hasattr(model, "predict_proba") else None
    acc = accuracy_score(y_te, y_pred)
    prec = precision_score(y_te, y_pred, zero_division=0)
    rec = recall_score(y_te, y_pred, zero_division=0)
    f1 = f1_score(y_te, y_pred, zero_division=0)
    auc = roc_auc_score(y_te, y_proba) if y_proba is not None else np.nan
    cm = confusion_matrix(y_te, y_pred)

    print(f"\n{name} results")
    print("="*len(f"{name} results"))
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1-score : {f1:.4f}")
    print(f"ROC-AUC  : {auc:.4f}")
    print("Confusion Matrix:\n", cm)
    print("\nClassification Report:\n", classification_report(y_te, y_pred, zero_division=0))

evaluate(xgb_pipe, X_test, y_test, name='XGBoost (robust)')
evaluate(lgb_pipe, X_test, y_test, name='LightGBM (robust)')
evaluate(voting,   X_test, y_test, name='Soft Voting (robust)')


os.makedirs('models', exist_ok=True)
joblib.dump(xgb_pipe, 'models/xgb_pipeline_robust.pkl')
joblib.dump(lgb_pipe, 'models/lgb_pipeline_robust.pkl')
joblib.dump(voting,   'models/voting_pipeline_robust.pkl')
joblib.dump(target_le, 'models/target_label_encoder.pkl')

print("\nSaved models to 'models/' folder:")
print("- models/xgb_pipeline_robust.pkl")
print("- models/lgb_pipeline_robust.pkl")
print("- models/voting_pipeline_robust.pkl")
print("- models/target_label_encoder.pkl")
