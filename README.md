# VectoForge — Professional Print Vectorization Tool

A specialized vectorization tool built with **FastAPI + VTracer** (backend) and **React + Vite** (frontend), purpose-built for professional printing workflows: Metal Art, Anime/DTF, and Vinyl cutting.

---

## Architecture

```
foroka/
├── backend/          # FastAPI + VTracer
│   ├── main.py
│   └── requirements.txt
└── frontend/         # React + Vite
    └── src/
        ├── App.jsx
        ├── App.css
        └── components/
            ├── EngineSelector.jsx
            ├── PreviewPanel.jsx
            └── ControlPanel.jsx
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install          # if not already installed
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Engines

| Engine | Mode | Color | Best For |
|--------|------|-------|----------|
| **Metal Engine** | Spline | Binary (B&W) | Laser-cut metal art — maximum sharpness |
| **Anime Engine** | Spline | Color (stacked) | Cel-shading, DTF printing, gradients |
| **Logo Engine** | Polygon | Color (cutout) | Vinyl cutting plotters — minimal nodes |

---

## API

### `POST /vectorize`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PNG, JPEG, or WebP image |
| `engine` | string | `metal` \| `anime` \| `logo` |
| `detail_level` | int (1–10) | Override path precision |
| `color_count` | int (2–32) | Override color quantization |
| `corner_sharpness` | int (1–100) | Override corner threshold |

Returns: `image/svg+xml`

### `GET /engines` — List all engines with descriptions  
### `GET /health` — Health check

---

## VTracer Parameter Mapping

| UI Control | VTracer Param | Notes |
|------------|--------------|-------|
| Detail Level | `path_precision` + `length_threshold` | Higher = more detail |
| Color Count | `color_precision` | 2–32 colors |
| Corner Sharpness | `corner_threshold` (inverted) | Higher UI = lower threshold = sharper corners |
