#!/bin/bash
# Fractal Memory Engine - Smoke Tests
# Usage: ./smoke_tests.sh [capture_url] [process_url] [surface_url]

set -e

# Default URLs (local development)
CAPTURE_URL="${1:-${CAPTURE_URL:-http://localhost:8001}}"
PROCESS_URL="${2:-${PROCESS_URL:-http://localhost:8002}}"
SURFACE_URL="${3:-${SURFACE_URL:-http://localhost:8003}}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

log() { echo -e "${GREEN}[TEST]${NC} $1"; }
pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }

# Test 1: Health checks
test_health() {
    log "Testing health endpoints..."

    if curl -sf "$CAPTURE_URL/health" > /dev/null; then
        pass "Capture health check"
    else
        fail "Capture health check"
    fi

    if curl -sf "$PROCESS_URL/health" > /dev/null; then
        pass "Process health check"
    else
        fail "Process health check"
    fi

    if curl -sf "$SURFACE_URL/health" > /dev/null; then
        pass "Surface health check"
    else
        fail "Surface health check"
    fi
}

# Test 2: Capture message
test_capture() {
    log "Testing capture endpoint..."

    RESPONSE=$(curl -sf -X POST "$CAPTURE_URL/capture/message" \
        -H "Content-Type: application/json" \
        -d '{
            "user_id": "test_user_smoke",
            "message": "Lets go!!! Monday energy activated!",
            "session_id": "smoke_test_session"
        }')

    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
        pass "Capture message"

        # Check signals extracted
        if echo "$RESPONSE" | grep -q '"energy"'; then
            pass "Energy signal extracted"
        else
            fail "Energy signal extraction"
        fi

        if echo "$RESPONSE" | grep -q '"tone"'; then
            pass "Tone signal extracted"
        else
            fail "Tone signal extraction"
        fi
    else
        fail "Capture message"
        echo "Response: $RESPONSE"
    fi
}

# Test 3: Process signals
test_process() {
    log "Testing process endpoint..."

    RESPONSE=$(curl -sf -X POST "$PROCESS_URL/process/rules_only" \
        -H "Content-Type: application/json" \
        -d '{
            "user_id": "test_user_smoke",
            "raw_signals": [
                {
                    "text": "This is amazing! Lets build something incredible!",
                    "energy": 0.9,
                    "friction": 0.1,
                    "tone": "playful"
                }
            ]
        }')

    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
        pass "Process signals (rules)"

        if echo "$RESPONSE" | grep -q '"rule_count"'; then
            pass "Rules extracted insights"
        else
            fail "Rules insight extraction"
        fi
    else
        fail "Process signals"
        echo "Response: $RESPONSE"
    fi
}

# Test 4: Surface context
test_surface() {
    log "Testing surface endpoint..."

    RESPONSE=$(curl -sf -X POST "$SURFACE_URL/surface/context" \
        -H "Content-Type: application/json" \
        -d '{
            "user_state": {"user_id": "test_user_smoke"},
            "current_avatar": "default",
            "current_message": "How is it going?"
        }')

    if echo "$RESPONSE" | grep -q '"tone_profile"'; then
        pass "Surface context"
    else
        fail "Surface context"
        echo "Response: $RESPONSE"
    fi
}

# Test 5: Quick profile
test_quick_profile() {
    log "Testing quick profile endpoint..."

    RESPONSE=$(curl -sf "$SURFACE_URL/surface/quick_profile/test_user_smoke")

    if echo "$RESPONSE" | grep -q '"profile"'; then
        pass "Quick profile"
    else
        fail "Quick profile"
        echo "Response: $RESPONSE"
    fi
}

# Test 6: End-to-end flow
test_e2e() {
    log "Testing end-to-end flow..."

    USER_ID="e2e_test_$(date +%s)"

    # Step 1: Capture
    CAPTURE_RESP=$(curl -sf -X POST "$CAPTURE_URL/capture/message" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"message\": \"Building the future! This is revolutionary!!\",
            \"session_id\": \"e2e_session\"
        }")

    if ! echo "$CAPTURE_RESP" | grep -q '"status":"ok"'; then
        fail "E2E: Capture step"
        return
    fi

    # Step 2: Process
    PROCESS_RESP=$(curl -sf -X POST "$PROCESS_URL/process/ingest_raw" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"raw_signals\": [
                {
                    \"text\": \"Building the future! This is revolutionary!!\",
                    \"energy\": 0.95,
                    \"friction\": 0.05,
                    \"tone\": \"playful\"
                }
            ]
        }")

    if ! echo "$PROCESS_RESP" | grep -q '"status":"ok"'; then
        fail "E2E: Process step"
        return
    fi

    # Step 3: Surface
    SURFACE_RESP=$(curl -sf -X POST "$SURFACE_URL/surface/context" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_state\": {\"user_id\": \"$USER_ID\"},
            \"current_avatar\": \"default\",
            \"current_message\": \"What should I focus on?\"
        }")

    if echo "$SURFACE_RESP" | grep -q '"tone_profile"'; then
        pass "E2E: Full flow completed"
    else
        fail "E2E: Surface step"
    fi
}

# Run all tests
echo "========================================"
echo "  Fractal Memory Engine - Smoke Tests  "
echo "========================================"
echo "Capture: $CAPTURE_URL"
echo "Process: $PROCESS_URL"
echo "Surface: $SURFACE_URL"
echo "========================================"

test_health
test_capture
test_process
test_surface
test_quick_profile
test_e2e

# Summary
echo ""
echo "========================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
