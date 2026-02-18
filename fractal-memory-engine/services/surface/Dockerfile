FROM python:3.11-slim

WORKDIR /app

COPY services/surface/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/surface/app.py .

ENV PYTHONPATH=/app

EXPOSE 8003

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8003"]
