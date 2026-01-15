# ============================================================================
# BGE-M3 Embedding Worker Dockerfile
# ============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create directory for model cache
RUN mkdir -p /root/.cache/huggingface

# Expose health check port (optional)
EXPOSE 8000

# Run the worker
CMD ["python", "worker.py"]
