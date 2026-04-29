# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# AI Service — FastAPI + PyTorch + Transformers + EasyOCR + FAISS
# ─────────────────────────────────────────────────────────────
# Heavy ML deps; we use python:3.11-slim and install only the
# minimum native libraries needed by opencv, easyocr, and torch.
# ─────────────────────────────────────────────────────────────

FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/app/.cache/huggingface \
    TORCH_HOME=/app/.cache/torch \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    PORT=5001

# Native libs required at runtime by opencv-python, easyocr, pdfminer, PIL, etc.
# `build-essential` + `libglib2.0` + `libgl1` cover the common OpenCV import errors.
RUN apt-get update -y && apt-get install -y --no-install-recommends \
        build-essential \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
        ca-certificates \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for cache reuse.
# Note: the requirements.txt pulls torch + transformers — this layer is large
# (≈3–5 GB) and slow on first build; subsequent builds cache it.
COPY requirements.txt ./
RUN pip install --upgrade pip wheel setuptools \
    && pip install -r requirements.txt

# App source
COPY . .

# Non-root user + writable cache/data dirs for HF/torch model downloads
RUN groupadd --system --gid 1001 ai \
    && useradd --system --uid 1001 --gid ai ai \
    && mkdir -p /app/data /app/.cache/huggingface /app/.cache/torch \
    && chown -R ai:ai /app

USER ai

EXPOSE 5001

ENTRYPOINT ["/usr/bin/tini", "--"]

# uvicorn binds the port from the env var so compose can override it.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5001}"]
