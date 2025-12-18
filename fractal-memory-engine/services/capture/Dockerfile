FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY services/capture/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared module
COPY shared /app/shared

# Copy service
COPY services/capture/app.py .

# Set Python path
ENV PYTHONPATH=/app

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
