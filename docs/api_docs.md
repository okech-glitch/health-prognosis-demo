# API Docs

Base URL: http://localhost:8000

- GET `/health`: Service status
- POST `/predict/single`: Single patient JSON -> risk prediction + SHAP
- POST `/predict/batch` (multipart/form-data with `file` CSV): Batch predictions

Example single request body:
```
{
  "age": 70,
  "gender": "Female",
  "diagnosis_code": "I10",
  "lab_result": 145.0,
  "medication": "Aspirin,Statins",
  "length_of_stay": 3,
  "comorbidity_score": 2
}
```
