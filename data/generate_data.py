import random
import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta

rng = np.random.default_rng(42)
fake = Faker()

ICD10 = ["I10", "E11", "I25", "J44", "N18", "E78", "I50", "K21", "F32", "M54"]
MEDS = ["Aspirin", "Statins", "Metformin", "ACE Inhibitor", "Beta Blocker", "Diuretic"]


def generate_row(pid: int):
    age = int(np.clip(rng.normal(62, 15), 18, 90))
    gender = rng.choice(["Male", "Female"], p=[0.49, 0.51])
    dx = rng.choice(ICD10, p=[0.12, 0.12, 0.1, 0.08, 0.08, 0.15, 0.08, 0.09, 0.09, 0.09])
    lab = float(np.clip(rng.normal(120, 20), 70, 220))
    meds = ",".join(sorted(rng.choice(MEDS, size=rng.integers(1, 4), replace=False).tolist()))
    los = int(max(0, rng.normal(4, 2)))
    comorb = int(np.clip(rng.poisson(2), 0, 10))
    adm_date = datetime(2024, 1, 1) + timedelta(days=int(rng.integers(0, 730)))
    # Logistic style outcome ~18% base rate with effects
    z = -1.5 + 0.02*(age-60) + 0.01*(lab-120) + 0.2*comorb + 0.1*(los>5)
    prob = 1/(1+np.exp(-z))
    y = int(rng.uniform() < prob)
    return {
        "patient_id": pid,
        "age": age,
        "gender": gender,
        "diagnosis_code": dx,
        "lab_result": lab,
        "medication": meds,
        "admission_date": adm_date.date().isoformat(),
        "length_of_stay": los,
        "comorbidity_score": comorb,
        "readmitted": y,
    }


def main(n=50000, out_path="data/train.csv"):
    rows = [generate_row(i) for i in range(1, n+1)]
    df = pd.DataFrame(rows)
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows to {out_path}")


if __name__ == "__main__":
    main()
