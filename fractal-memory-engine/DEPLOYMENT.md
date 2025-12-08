# Fractal Memory Engine - Deployment Guide
## THE LAUNCH PAD - Phase 16

Production deployment checklist and runbook.

---

## Deployment Checklist

### 1. Domain & DNS
- [ ] Domain ownership verified
- [ ] DNS configured (A/CNAME records)
- [ ] SSL certificates provisioned (Let's Encrypt / Cloud managed)
- [ ] Edge routing configured (Cloudflare / Vercel)

### 2. Infrastructure
- [ ] Google Cloud project created
- [ ] Firestore database provisioned
- [ ] Cloud Run services deployed
- [ ] Cloud Functions deployed
- [ ] Cloud Scheduler jobs configured
- [ ] VPC / networking configured

### 3. Security
- [ ] Service accounts created
  - [ ] `orchestrator-sa` - Orchestrator identity
  - [ ] `engine-sa` - Engine services identity
  - [ ] `scribe-sa` - Logging/audit identity
- [ ] Firestore rules deployed (`firestore-production.rules`)
- [ ] Secrets loaded in Secret Manager
- [ ] IAM roles assigned

### 4. Services
- [ ] Orchestrator deployed (`:8000`)
- [ ] Capture Engine deployed (`:8001`)
- [ ] Process Engine deployed (`:8002`)
- [ ] Surface Engine deployed (`:8003`)
- [ ] Auth Service deployed (`:8004`)
- [ ] Evolve Cloud Function deployed
- [ ] Calibration Cloud Function deployed

### 5. Observability
- [ ] Cloud Logging enabled
- [ ] Cloud Trace enabled
- [ ] Prometheus metrics endpoint exposed
- [ ] Alert policies configured
- [ ] Dashboard created

### 6. Edge Layer
- [ ] Cloudflare Workers KV namespaces created
- [ ] KV bindings configured
- [ ] Cache invalidation tested

### 7. Frontend
- [ ] Frontend deployed (Vercel / Cloud Run)
- [ ] SDK published to npm
- [ ] WebSocket endpoint tested

### 8. Testing
- [ ] Smoke tests passing
- [ ] Load test completed
- [ ] Security scan completed
- [ ] Full message trace verified

---

## Service Accounts

```bash
# Create service accounts
gcloud iam service-accounts create orchestrator-sa \
  --display-name="Orchestrator Service Account"

gcloud iam service-accounts create engine-sa \
  --display-name="Engine Service Account"

gcloud iam service-accounts create scribe-sa \
  --display-name="Scribe (Logging) Service Account"

# Assign roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:orchestrator-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:engine-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## Secrets Configuration

Required secrets in Secret Manager:

| Secret Name | Description |
|------------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_KV_NAMESPACE` | Cloudflare KV namespace ID |
| `CF_API_TOKEN` | Cloudflare API token |
| `AUTH_SECRET_KEY` | JWT signing key |
| `FIREBASE_CONFIG` | Firebase configuration JSON |

```bash
# Create secrets
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "your-anthropic-key" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
```

---

## Deployment Commands

### Deploy All Services

```bash
# Set project
export PROJECT_ID=your-project-id
export REGION=us-central1
gcloud config set project $PROJECT_ID

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Build and deploy services
cd fractal-memory-engine

# Orchestrator
gcloud run deploy fractal-orchestrator \
  --source services/orchestrator \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "CAPTURE_URL=https://fractal-capture-xxx.run.app"

# Capture
gcloud run deploy fractal-capture \
  --source services/capture \
  --region $REGION \
  --platform managed

# Process
gcloud run deploy fractal-process \
  --source services/process \
  --region $REGION \
  --platform managed

# Surface
gcloud run deploy fractal-surface \
  --source services/surface \
  --region $REGION \
  --platform managed

# Auth
gcloud run deploy fractal-auth \
  --source services/auth \
  --region $REGION \
  --platform managed

# Cloud Functions
gcloud functions deploy fractal-evolve \
  --runtime python311 \
  --trigger-http \
  --source services/evolve \
  --entry-point main \
  --region $REGION

gcloud functions deploy fractal-calibration \
  --runtime python311 \
  --trigger-http \
  --source services/calibration \
  --entry-point main \
  --region $REGION

# Cloud Scheduler
gcloud scheduler jobs create http evolve-hourly \
  --schedule="0 * * * *" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/fractal-evolve" \
  --http-method=POST

gcloud scheduler jobs create http calibration-6h \
  --schedule="30 */6 * * *" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/fractal-calibration" \
  --http-method=POST
```

---

## Verification Steps

### 1. Health Checks

```bash
# Check all services
curl https://fractal-orchestrator-xxx.run.app/health
curl https://fractal-capture-xxx.run.app/health
curl https://fractal-process-xxx.run.app/health
curl https://fractal-surface-xxx.run.app/health
curl https://fractal-auth-xxx.run.app/health
```

### 2. Full Message Trace

```bash
# Send test message through orchestrator
curl -X POST https://fractal-orchestrator-xxx.run.app/orchestrate/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, this is a deployment test!",
    "user_id": "deployment_test_user",
    "avatar": "default"
  }'
```

### 3. Verify Firestore Data

```bash
# Check user data was created
firebase firestore:get users/deployment_test_user
```

### 4. Check Logs

```bash
# View orchestrator logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fractal-orchestrator" --limit=50

# View function logs
gcloud functions logs read fractal-evolve --limit=50
```

---

## Rollback Procedure

```bash
# List revisions
gcloud run revisions list --service fractal-orchestrator --region $REGION

# Rollback to previous revision
gcloud run services update-traffic fractal-orchestrator \
  --to-revisions=fractal-orchestrator-00001-abc=100 \
  --region $REGION
```

---

## Monitoring Alerts

Set up alerts for:

1. **Latency** - P95 > 2s for orchestrator
2. **Error Rate** - 5xx > 1% for any service
3. **LLM Failures** - LLM error rate > 5%
4. **Queue Depth** - Backpressure queue > 80%
5. **Memory Decay** - Unusual decay rate changes
6. **Auth Failures** - Login failure rate > 10%

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                   │
│                    (Next.js / React)                              │
│                    fractal.js SDK                                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      EDGE LAYER                                   │
│                   (Cloudflare / Vercel)                          │
│                   - SSL termination                               │
│                   - Edge KV cache                                 │
│                   - Rate limiting                                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                    │
│                 (Cloud Load Balancer)                            │
│                   - Auth validation                               │
│                   - Request routing                               │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                                   │
│              THE CONDUCTOR (Cloud Run)                           │
│          - Pipeline coordination                                  │
│          - Backpressure management                               │
│          - Request fan-out                                        │
└───────┬─────────────┬─────────────┬─────────────┬────────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  CAPTURE  │  │  PROCESS  │  │  SURFACE  │  │   AUTH    │
│  ENGINE   │  │  ENGINE   │  │  ENGINE   │  │  SERVICE  │
│  :8001    │  │  :8002    │  │  :8003    │  │  :8004    │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FIRESTORE                                    │
│                  (User Memory Graph)                              │
│  /users/{id}/patterns, /knowledge, /avatars, /narrative          │
└──────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│  EVOLVE ENGINE   │           │   CALIBRATION    │
│ (Cloud Function) │           │     ENGINE       │
│   Hourly cron    │           │   6-hour cron    │
└──────────────────┘           └──────────────────┘
```

---

## Post-Deployment Verification

After deployment is complete:

1. ✅ Create test user account
2. ✅ Send 10 messages through full pipeline
3. ✅ Verify memory persistence in Firestore
4. ✅ Verify edge cache hits
5. ✅ Check evolve engine ran successfully
6. ✅ Verify metrics are flowing to dashboards
7. ✅ Test avatar switching
8. ✅ Full trace of one message visible in Cloud Trace

---

## Support

For deployment issues:
- Check Cloud Logging for errors
- Review this runbook
- Contact platform team

**Status Page**: https://status.yourdomain.com
