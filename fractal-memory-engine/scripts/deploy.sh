#!/bin/bash
# Fractal Memory Engine - Deploy Script
# Usage: ./deploy.sh [local|gcp|k8s]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

deploy_local() {
    log "Starting local deployment..."

    # Check dependencies
    command -v python3 >/dev/null 2>&1 || error "Python 3 required"
    command -v pip >/dev/null 2>&1 || error "pip required"

    # Install dependencies
    log "Installing dependencies..."
    pip install -r "$ROOT_DIR/services/capture/requirements.txt"
    pip install -r "$ROOT_DIR/services/process/requirements.txt"
    pip install -r "$ROOT_DIR/services/surface/requirements.txt"

    # Start services in background
    log "Starting Capture service on :8001..."
    cd "$ROOT_DIR/services/capture" && uvicorn app:app --host 0.0.0.0 --port 8001 &
    CAPTURE_PID=$!

    log "Starting Process service on :8002..."
    cd "$ROOT_DIR/services/process" && uvicorn app:app --host 0.0.0.0 --port 8002 &
    PROCESS_PID=$!

    log "Starting Surface service on :8003..."
    cd "$ROOT_DIR/services/surface" && uvicorn app:app --host 0.0.0.0 --port 8003 &
    SURFACE_PID=$!

    log "Services started:"
    log "  Capture: http://localhost:8001 (PID: $CAPTURE_PID)"
    log "  Process: http://localhost:8002 (PID: $PROCESS_PID)"
    log "  Surface: http://localhost:8003 (PID: $SURFACE_PID)"

    # Save PIDs
    echo "$CAPTURE_PID $PROCESS_PID $SURFACE_PID" > "$ROOT_DIR/.pids"

    log "To stop: kill \$(cat $ROOT_DIR/.pids)"
}

deploy_docker() {
    log "Building Docker images..."

    cd "$ROOT_DIR"

    docker build -t fractal-memory/capture:latest -f services/capture/Dockerfile .
    docker build -t fractal-memory/process:latest -f services/process/Dockerfile .
    docker build -t fractal-memory/surface:latest -f services/surface/Dockerfile .

    log "Docker images built successfully"
}

deploy_gcp() {
    log "Deploying to Google Cloud..."

    # Check gcloud
    command -v gcloud >/dev/null 2>&1 || error "gcloud CLI required"

    PROJECT_ID=$(gcloud config get-value project)
    REGION=${GCP_REGION:-us-central1}

    log "Project: $PROJECT_ID, Region: $REGION"

    # Build and push images
    log "Building and pushing images to GCR..."

    cd "$ROOT_DIR"

    gcloud builds submit --tag "gcr.io/$PROJECT_ID/fractal-memory/capture" -f services/capture/Dockerfile .
    gcloud builds submit --tag "gcr.io/$PROJECT_ID/fractal-memory/process" -f services/process/Dockerfile .
    gcloud builds submit --tag "gcr.io/$PROJECT_ID/fractal-memory/surface" -f services/surface/Dockerfile .

    # Deploy to Cloud Run
    log "Deploying to Cloud Run..."

    gcloud run deploy fractal-capture \
        --image "gcr.io/$PROJECT_ID/fractal-memory/capture" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated

    gcloud run deploy fractal-process \
        --image "gcr.io/$PROJECT_ID/fractal-memory/process" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated

    gcloud run deploy fractal-surface \
        --image "gcr.io/$PROJECT_ID/fractal-memory/surface" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated

    # Deploy Cloud Functions
    log "Deploying Cloud Functions..."

    gcloud functions deploy fractal-evolve \
        --runtime python311 \
        --trigger-http \
        --source services/evolve \
        --entry-point main \
        --region "$REGION"

    gcloud functions deploy fractal-calibration \
        --runtime python311 \
        --trigger-http \
        --source services/calibration \
        --entry-point main \
        --region "$REGION"

    log "GCP deployment complete!"
}

deploy_k8s() {
    log "Deploying to Kubernetes..."

    # Check kubectl
    command -v kubectl >/dev/null 2>&1 || error "kubectl required"

    cd "$ROOT_DIR"

    # Apply manifests
    log "Applying Kubernetes manifests..."

    kubectl apply -f infra/k8s/namespace.yaml
    kubectl apply -f infra/k8s/configmap.yaml
    kubectl apply -f infra/k8s/secrets.yaml
    kubectl apply -f infra/k8s/capture-deployment.yaml
    kubectl apply -f infra/k8s/process-deployment.yaml
    kubectl apply -f infra/k8s/surface-deployment.yaml
    kubectl apply -f infra/k8s/evolve-cronjob.yaml

    log "Kubernetes deployment complete!"

    # Show status
    kubectl get pods -n fractal-memory
}

# Main
case "${1:-local}" in
    local)
        deploy_local
        ;;
    docker)
        deploy_docker
        ;;
    gcp)
        deploy_gcp
        ;;
    k8s)
        deploy_k8s
        ;;
    *)
        echo "Usage: $0 [local|docker|gcp|k8s]"
        exit 1
        ;;
esac
