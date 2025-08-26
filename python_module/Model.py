import numpy as np
import pandas as pd
import os
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import joblib

df = pd.read_csv('./Thyroid_Diff.csv')
categorical_cols = ['Gender', 'Smoking', 'Hx Smoking', 'Hx Radiothreapy',
                    'Thyroid Function', 'Physical Examination', 'Adenopathy',
                    'Pathology', 'Focality', 'Risk', 'T', 'N', 'M', 'Stage', 'Response']

label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

target_le = LabelEncoder()
df['Recurred_2'] = target_le.fit_transform(df['Recurred'])

X = df.drop(['Recurred', 'Recurred_2', 'Response'], axis=1)
y = df['Recurred_2']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train['Age'] = scaler.fit_transform(X_train[['Age']])
X_test['Age'] = scaler.transform(X_test[['Age']])

xgb_model = XGBClassifier(tree_method='hist', predictor='cpu_predictor', random_state=42)
xgb_model.fit(X_train, y_train)

lgb_model = LGBMClassifier(random_state=42)
lgb_model.fit(X_train, y_train)

for name, model in zip(['XGBoost', 'LightGBM'], [xgb_model, lgb_model]):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"{name} Accuracy: {acc:.4f}")

if not os.path.exists('models'):
    os.makedirs('models')

joblib.dump(xgb_model, 'models/xgb_model.pkl')
joblib.dump(lgb_model, 'models/lgb_model.pkl')
joblib.dump(label_encoders, 'models/label_encoders.pkl')
joblib.dump(target_le, 'models/target_encoder.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
