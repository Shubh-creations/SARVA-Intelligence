# FinanceOS MVP

Local-first cash forecasting workspace for finance teams. Import a CSV of bank transactions, review a rolling 13-week cash forecast, drill into source transactions, export the forecast, and generate an executive summary.

## Run locally

1. Start the API:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. Start the web app in a second terminal:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open the address printed by Vite. The app ships with demo data and accepts CSV columns `date`, `description`, `amount`, and optional `category`.

Or use Docker:

```powershell
docker compose up --build
```

Open `http://localhost:8080`.

## Optional AI summary

Set `OPENAI_API_KEY` in `backend/.env` to enable a live OpenAI executive summary. Without it, the API returns a deterministic finance-focused summary so the MVP stays usable offline.
