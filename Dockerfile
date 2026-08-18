# ==============================================================================
# Stage 1: Build the React / Vite Frontend
# ==============================================================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python Backend with FFmpeg
# ==============================================================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install FFmpeg and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend Application Code
COPY backend/ ./backend/

# Copy Frontend Built Static Assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create storage directory structure
RUN mkdir -p storage/uploads storage/exports storage/temp

# Set working directory to backend
WORKDIR /app/backend

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

EXPOSE 8000

# Start Production Server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
