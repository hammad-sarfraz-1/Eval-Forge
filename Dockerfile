# One Dockerfile, two images. Build context is the project root for both.
#   docker compose up --build   → builds the `backend` and `frontend` targets.

# ---- Backend: Python + FastAPI, served by uvicorn ----
FROM python:3.12-slim AS backend
WORKDIR /code

# Install dependencies first (layer cached unless requirements.txt changes).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code (becomes /code/app).
COPY backend/ .

EXPOSE 8000
# --host 0.0.0.0 makes it reachable from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# ---- Frontend: Node + Next.js dev server ----
FROM node:20-alpine AS frontend
WORKDIR /app

# Install dependencies first (cached unless package.json changes).
COPY frontend/package.json .
RUN npm install

# Copy the app code.
COPY frontend/ .

EXPOSE 3000
# -H 0.0.0.0 makes the dev server reachable from outside the container.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
