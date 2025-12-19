FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY ../../shared /app/shared

# Copy service code
COPY . .

# Create rituals directory
RUN mkdir -p /app/rituals

EXPOSE 8020

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8020"]
