import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier
# SHAP disabled for Windows portability; see README for enabling
import joblib
import os

DATA_PATH = os.getenv("DATA_PATH", "data/train.csv")
MODEL_DIR = os.getenv("MODEL_DIR", "backend/models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
# EXPLAINER_PATH = os.path.join(MODEL_DIR, "explainer.pkl")


df = pd.read_csv(DATA_PATH)
X = df[["age", "gender", "diagnosis_code", "lab_result", "medication", "length_of_stay", "comorbidity_score"]].copy()
y = df["readmitted"].astype(int)

# ---- Feature engineering ----
# Medication count (number of active meds)
X["meds_count"] = X["medication"].fillna("").apply(lambda s: 0 if s=="" else len(str(s).split(',')))

# Age groups (bins) to capture non-linearities
age_bins = [0, 30, 45, 60, 75, 120]
age_labels = ["age_0_29", "age_30_44", "age_45_59", "age_60_74", "age_75+"]
X["age_group"] = pd.cut(X["age"].astype(float), bins=age_bins, labels=age_labels, include_lowest=True)

# Lab flags and interactions
X["lab_high"] = (X["lab_result"].astype(float) >= 140).astype(int)
X["age_x_lab"] = X["age"].astype(float) * X["lab_result"].astype(float)

# Clean/clip some ranges
X["length_of_stay"] = X["length_of_stay"].fillna(0).clip(lower=0, upper=60)
X["comorbidity_score"] = X["comorbidity_score"].fillna(0).clip(lower=0, upper=10)

cat_cols = ["gender", "diagnosis_code", "age_group"]
num_cols = ["age", "lab_result", "length_of_stay", "comorbidity_score", "meds_count", "lab_high", "age_x_lab"]

pre = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
    ("num", "passthrough", num_cols),
])

model = XGBClassifier(
    n_estimators=1000,
    max_depth=5,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=2,
    gamma=0.5,
    reg_lambda=2.0,
    objective="binary:logistic",
    eval_metric="auc",
    tree_method="hist",
    n_jobs=0,
)

pipe = Pipeline([
    ("pre", pre),
    ("clf", model),
])

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# scale_pos_weight for imbalance
pos = int(y_tr.sum())
neg = int((y_tr == 0).sum())
spw = max(1.0, neg / max(1, pos))
pipe.named_steps["clf"].set_params(scale_pos_weight=spw)

# Fit with early stopping using validation set
pipe.named_steps["clf"].fit(
    pre.fit_transform(X_tr), y_tr,
    eval_set=[(pre.transform(X_te), y_te)],
    verbose=False,
    early_stopping_rounds=50,
)

probs = pipe.named_steps["clf"].predict_proba(pre.transform(X_te))[:,1]
auc = roc_auc_score(y_te, probs)
print(f"Holdout AUC: {auc:.3f}")

os.makedirs(MODEL_DIR, exist_ok=True)
# Re-wrap the trained model with preprocessor for serving
serving_pipe = Pipeline([
    ("pre", pre),
    ("clf", pipe.named_steps["clf"]),
])
joblib.dump(serving_pipe, MODEL_PATH)

# SHAP explainer skipped to avoid llvmlite/numba dependency issues on Windows.
print(f"Saved model to {MODEL_PATH}")
