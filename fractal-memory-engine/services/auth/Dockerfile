FROM python:3.11-slim

WORKDIR /app

COPY services/auth/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/auth/app.py .

ENV PYTHONPATH=/app

EXPOSE 8004

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8004"]
