# Health Prognosis Demo App

An interactive portfolio web app demonstrating synthetic EHR data mining, ML prognosis (readmission risk), and a full-stack UI. For demo purposes only; not for medical use.

## Structure
- `data/`: Synthetic data generator and training scripts
- `backend/`: FastAPI service with prediction endpoints
- `frontend/`: React + Tailwind UI (v0.dev assisted)
- `docs/`: API and deployment docs
- `docker-compose.yml`: Local dev stack

## Quickstart
- Backend (dev):
  - python -m venv .venv && .\.venv\Scripts\Activate.ps1
  - pip install -r backend/requirements.txt
  - uvicorn backend.app:app --reload --port 8000
- Frontend (dev):
  - cd frontend
  - npm install
  - npm run dev

