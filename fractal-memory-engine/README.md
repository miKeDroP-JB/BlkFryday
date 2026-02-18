# Fractal Memory Engine

Production-ready memory system for AI avatars. Captures, processes, stores, and surfaces user context across sessions.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Capture   │───▶│   Process   │───▶│   Surface   │
│   :8001     │    │   :8002     │    │   :8003     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                    Firestore                        │
│  /users/{id}/patterns, /knowledge, /lexicon, etc   │
└─────────────────────────────────────────────────────┘
       │                                    │
       ▼                                    ▼
┌─────────────┐                    ┌─────────────────┐
│  Edge KV    │                    │  Evolve/Calib   │
│ (Cloudflare)│                    │ (Cloud Funcs)   │
└─────────────┘                    └─────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Capture | 8001 | Receives messages, extracts signals (energy, friction, tone) |
| Process | 8002 | Rules engine + LLM fusion, writes insights |
| Surface | 8003 | Retrieves context snippets for LLM prompts |
| Evolve | cron | Hourly confidence recalculation, pruning, promotion |
| Calibration | cron | Quiet LLM verification of low-confidence items |

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r services/capture/requirements.txt

# Start services
./scripts/deploy.sh local

# Run smoke tests
./scripts/smoke_tests.sh
```

### Docker

```bash
./scripts/deploy.sh docker
docker-compose up -d
```

### Google Cloud

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Deploy
./scripts/deploy.sh gcp
```

### Kubernetes

```bash
# Apply manifests
./scripts/deploy.sh k8s

# Check status
kubectl get pods -n fractal-memory
```

## API Examples

### Capture a Message

```bash
curl -X POST http://localhost:8001/capture/message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "message": "Let'\''s build something amazing!",
    "session_id": "session456"
  }'
```

### Process Signals

```bash
curl -X POST http://localhost:8002/process/ingest_raw \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "raw_signals": [
      {
        "text": "Building the future!",
        "energy": 0.9,
        "friction": 0.1,
        "tone": "playful"
      }
    ]
  }'
```

### Surface Context

```bash
curl -X POST http://localhost:8003/surface/context \
  -H "Content-Type: application/json" \
  -d '{
    "user_state": {"user_id": "user123"},
    "current_avatar": "default",
    "current_message": "What should I focus on?"
  }'
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |
| `OPENAI_API_KEY` | OpenAI API key for LLM fusion |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_KV_NAMESPACE` | Cloudflare KV namespace |
| `CF_API_TOKEN` | Cloudflare API token |

### Decay Configuration

Default decay rates (half-life):
- Knowledge: 30 days (λ = 0.01)
- Lexicon: 7 days (λ = 0.04)
- Behavior: 2 days (λ = 0.1)
- Context: 4 hours (λ = 0.5)

Auto-tuning adjusts λ based on pattern volatility.

## Data Model

### User Document (`/users/{id}`)

```json
{
  "profile.pace": "fast",
  "profile.pace_meta": {
    "timestamp": "2024-01-15T...",
    "source": "llm+rule",
    "confidence": 0.85,
    "version": 3
  },
  "operating_style.tone": "direct",
  "operating_style.tone_meta": {...}
}
```

### Subcollections

- `/users/{id}/raw_signals` - Captured message signals
- `/users/{id}/patterns` - Detected patterns
- `/users/{id}/knowledge` - Verified facts
- `/users/{id}/lexicon` - User vocabulary
- `/users/{id}/avatars/{name}` - Avatar configurations

## Testing

```bash
# Unit tests
pytest tests/ -v

# Smoke tests
./scripts/smoke_tests.sh

# With custom URLs
./scripts/smoke_tests.sh http://prod-capture http://prod-process http://prod-surface
```

## License

MIT
