# VectoForge — Deployment Guide

## Table of Contents

1. [Local Development](#1-local-development)
2. [Production Build (Same Server)](#2-production-build-same-server)
3. [Docker Compose (Recommended for Production)](#3-docker-compose)
4. [Cloud Deployment — Railway](#4-cloud-deployment--railway)
5. [Cloud Deployment — VPS (Ubuntu/Nginx)](#5-cloud-deployment--vps-ubuntunginx)
6. [Environment Variables](#6-environment-variables)
7. [Reverse Proxy Reference](#7-reverse-proxy-reference)

---

## 1. Local Development

### Requirements
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API available at: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App available at: `http://localhost:5173`

> The Vite dev server proxies `/vectorize`, `/engines`, and `/health` to `http://localhost:8000` automatically — no CORS issues in development.

---

## 2. Production Build (Same Server)

Build the React app into static files and serve them directly from FastAPI.

### Step 1 — Build the frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Step 2 — Serve static files from FastAPI
Add the following to `backend/main.py`:

```python
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Mount AFTER all API routes
DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    index = os.path.join(DIST, "index.html")
    return FileResponse(index)
```

### Step 3 — Run with a production ASGI server
```bash
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

> `-w 4` = 4 worker processes. Use `(2 × CPU cores) + 1` as a rule of thumb.

---

## 3. Docker Compose

### File structure
```
foroka/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system deps needed by vtracer (Rust-compiled wheel)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `frontend/nginx.conf`
```nginx
server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html;

    # Proxy API calls to backend container
    location ~ ^/(vectorize|engines|health) {
        proxy_pass         http://backend:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### `docker-compose.yml`
```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    container_name: vectoforge-api
    restart: unless-stopped
    environment:
      - MAX_UPLOAD_MB=50
    expose:
      - "8000"

  frontend:
    build: ./frontend
    container_name: vectoforge-ui
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Deploy
```bash
docker compose up -d --build
```
App available at: `http://localhost`

---

## 4. Cloud Deployment — Railway

Railway can deploy both services from the same repo using separate service definitions.

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USER/vectoforge.git
git push -u origin main
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo

### Step 3 — Configure Backend service
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Railway injects `$PORT` automatically

### Step 4 — Configure Frontend service
- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** *(leave blank — Railway serves static via Nixpacks)*

Or use the **Static Site** service type and point output dir to `dist`.

### Step 5 — Set API URL
In the frontend service, add an environment variable:
```
VITE_API_BASE=https://your-backend.railway.app
```

Then update `frontend/src/App.jsx`:
```js
const API_BASE = import.meta.env.VITE_API_BASE ?? ''
```

---

## 5. Cloud Deployment — VPS (Ubuntu/Nginx)

### Requirements
- Ubuntu 22.04+
- Nginx
- Python 3.11+, Node.js 20+, PM2 or systemd

### Install dependencies
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx
```

### Deploy backend
```bash
cd /var/www/vectoforge/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn

# Create systemd service
sudo tee /etc/systemd/system/vectoforge.service > /dev/null <<EOF
[Unit]
Description=VectoForge API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/vectoforge/backend
ExecStart=/var/www/vectoforge/backend/venv/bin/gunicorn main:app \
  -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable vectoforge
sudo systemctl start vectoforge
```

### Build frontend
```bash
cd /var/www/vectoforge/frontend
npm ci
VITE_API_BASE="" npm run build
# Static files output to: /var/www/vectoforge/frontend/dist
```

### Configure Nginx
```bash
sudo tee /etc/nginx/sites-available/vectoforge > /dev/null <<'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 50M;

    # Serve React SPA
    root /var/www/vectoforge/frontend/dist;
    index index.html;

    # Proxy API
    location ~ ^/(vectorize|engines|health|docs|openapi.json) {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/vectoforge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Enable HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 6. Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `PORT` | Backend | `8000` | Port uvicorn/gunicorn binds to (auto-set on Railway) |
| `VITE_API_BASE` | Frontend | `""` | Backend base URL. Empty = use Vite proxy or same origin |
| `MAX_UPLOAD_MB` | Backend | `50` | Max image upload size (enforced at Nginx/proxy level) |

---

## 7. Reverse Proxy Reference

### Nginx — upload size & timeout
For large high-resolution PNGs (300 DPI, A3+), the defaults are too low:

```nginx
client_max_body_size 100M;   # Allow up to 100 MB uploads
proxy_read_timeout   180s;   # VTracer can be slow on complex images
proxy_send_timeout   180s;
```

### Caddy (alternative to Nginx)
```caddyfile
yourdomain.com {
    handle /vectorize* { reverse_proxy localhost:8000 }
    handle /engines*   { reverse_proxy localhost:8000 }
    handle /health*    { reverse_proxy localhost:8000 }
    handle            { root * /var/www/vectoforge/frontend/dist; try_files {path} /index.html; file_server }
}
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `vtracer` install fails on Windows | Install [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| `vtracer` install fails on Linux | `apt install -y build-essential` then retry |
| Upload returns 413 | Increase `client_max_body_size` in Nginx / `--limit-request-body` in gunicorn |
| SVG is blank / all white | Image may be transparent — flatten PNG to white background before uploading |
| CORS errors in browser | Ensure `VITE_API_BASE` is set and the backend `allow_origins` list includes your frontend URL |
