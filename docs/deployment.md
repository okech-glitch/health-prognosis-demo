# Deployment Guide

- Local: `docker-compose up --build`
- Backend (Heroku-like): container registry deploy
- Frontend (Netlify): build with `npm run build`, publish `dist/`

Set env:
- `MODEL_PATH` for backend model artifact
- `VITE_API_BASE` for frontend API base URL
