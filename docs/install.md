# Installation Guide

## Recommended Local Start

On Windows, run the one-click launcher from the project root:

```bash
start-routeflow.bat
```

It checks frontend and backend dependencies, starts the FastAPI backend on `127.0.0.1:8000`, starts the Vite frontend on `127.0.0.1:5173`, and writes runtime logs to `.runtime/`.

To stop services started by the launcher:

```bash
stop-routeflow.bat
```

## Manual Setup

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
pip install -r requirements.txt
uvicorn api.app:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:5173` after both services are running.
