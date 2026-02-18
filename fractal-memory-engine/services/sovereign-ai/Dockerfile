# ═══════════════════════════════════════════════════════════════════════════
# SOVEREIGN AI ENGINE - "THE MIND"
# Full independence from external AI providers
# ═══════════════════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for knowledge storage
RUN mkdir -p /app/knowledge_store/conversations \
    /app/knowledge_store/training_data \
    /app/knowledge_store/patterns \
    /app/knowledge_store/extracted \
    /app/models

# Environment
ENV PYTHONUNBUFFERED=1
ENV OLLAMA_HOST=http://host.docker.internal:11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8050/health || exit 1

# Expose port
EXPOSE 8050

# Run the service
CMD ["uvicorn", "inference:app", "--host", "0.0.0.0", "--port", "8050"]
