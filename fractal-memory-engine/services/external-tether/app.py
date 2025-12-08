"""
PHASE 21: THE EXTERNAL TETHER - "THE BRIDGES"

Interface layer for external systems:
- OAuth2 connector layer
- Webhook processor
- Outbound action executor
- Secure token vault
- External action memory routing

This is where the engine meets the world.
"""
import asyncio
import hashlib
import hmac
import logging
import secrets
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from urllib.parse import urlencode

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, Field, HttpUrl

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_get, kv_put, kv_delete

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - External Tether",
    description="THE BRIDGES - OAuth, Webhooks, and External API Integration",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS & CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════

class OAuthProvider(str, Enum):
    GOOGLE = "google"
    SLACK = "slack"
    DISCORD = "discord"
    TWITTER = "twitter"
    GITHUB = "github"
    NOTION = "notion"
    LINEAR = "linear"


class WebhookStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class ActionType(str, Enum):
    NOTIFY = "notify"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SYNC = "sync"
    TRIGGER = "trigger"


# ═══════════════════════════════════════════════════════════════════════════
# OAUTH PROVIDER CONFIGS
# ═══════════════════════════════════════════════════════════════════════════

OAUTH_CONFIGS: Dict[str, Dict] = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "scopes": ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"],
        "client_id_env": "GOOGLE_CLIENT_ID",
        "client_secret_env": "GOOGLE_CLIENT_SECRET"
    },
    "slack": {
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "userinfo_url": "https://slack.com/api/users.identity",
        "scopes": ["users:read", "chat:write", "channels:read"],
        "client_id_env": "SLACK_CLIENT_ID",
        "client_secret_env": "SLACK_CLIENT_SECRET"
    },
    "discord": {
        "auth_url": "https://discord.com/api/oauth2/authorize",
        "token_url": "https://discord.com/api/oauth2/token",
        "userinfo_url": "https://discord.com/api/users/@me",
        "scopes": ["identify", "email", "guilds"],
        "client_id_env": "DISCORD_CLIENT_ID",
        "client_secret_env": "DISCORD_CLIENT_SECRET"
    },
    "twitter": {
        "auth_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.twitter.com/2/oauth2/token",
        "userinfo_url": "https://api.twitter.com/2/users/me",
        "scopes": ["tweet.read", "tweet.write", "users.read"],
        "client_id_env": "TWITTER_CLIENT_ID",
        "client_secret_env": "TWITTER_CLIENT_SECRET"
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scopes": ["read:user", "user:email", "repo"],
        "client_id_env": "GITHUB_CLIENT_ID",
        "client_secret_env": "GITHUB_CLIENT_SECRET"
    },
    "notion": {
        "auth_url": "https://api.notion.com/v1/oauth/authorize",
        "token_url": "https://api.notion.com/v1/oauth/token",
        "userinfo_url": "https://api.notion.com/v1/users/me",
        "scopes": [],
        "client_id_env": "NOTION_CLIENT_ID",
        "client_secret_env": "NOTION_CLIENT_SECRET"
    }
}


# ═══════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════

class OAuthState(BaseModel):
    """OAuth state for CSRF protection"""
    state: str
    provider: str
    user_id: str
    redirect_uri: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scopes: List[str] = Field(default_factory=list)


class OAuthToken(BaseModel):
    """Stored OAuth token"""
    provider: str
    user_id: str
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_at: Optional[datetime] = None
    scopes: List[str] = Field(default_factory=list)
    provider_user_id: Optional[str] = None
    provider_email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WebhookEvent(BaseModel):
    """Incoming webhook event"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    event_type: str
    payload: Dict[str, Any]
    received_at: datetime = Field(default_factory=datetime.utcnow)
    status: WebhookStatus = WebhookStatus.PENDING
    retry_count: int = 0
    processed_at: Optional[datetime] = None
    error: Optional[str] = None


class WebhookConfig(BaseModel):
    """Webhook endpoint configuration"""
    webhook_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    url: str
    secret: str = Field(default_factory=lambda: secrets.token_hex(32))
    events: List[str] = Field(default_factory=list)  # Event types to receive
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OutboundAction(BaseModel):
    """Action to execute on external system"""
    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    provider: str
    action_type: ActionType
    target: str  # Resource identifier
    payload: Dict[str, Any] = Field(default_factory=dict)
    scheduled_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    status: str = "pending"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class APIKey(BaseModel):
    """Public API key for external access"""
    key_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    user_id: str
    name: str
    key_hash: str  # Only store hash
    prefix: str    # First 8 chars for identification
    scopes: List[str] = Field(default_factory=list)
    rate_limit: int = 60  # Requests per minute
    enabled: bool = True
    last_used: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════
# TOKEN VAULT
# ═══════════════════════════════════════════════════════════════════════════

class TokenVault:
    """Secure storage for OAuth tokens and API keys"""

    def __init__(self):
        self.tokens: Dict[str, OAuthToken] = {}
        self.api_keys: Dict[str, APIKey] = {}

    async def store_token(self, token: OAuthToken) -> None:
        key = f"{token.provider}:{token.user_id}"
        self.tokens[key] = token
        # In production, encrypt and store in Firestore
        logger.info(f"Stored token for {token.provider}:{token.user_id}")

    async def get_token(self, provider: str, user_id: str) -> Optional[OAuthToken]:
        key = f"{provider}:{user_id}"
        return self.tokens.get(key)

    async def delete_token(self, provider: str, user_id: str) -> bool:
        key = f"{provider}:{user_id}"
        if key in self.tokens:
            del self.tokens[key]
            return True
        return False

    async def create_api_key(self, user_id: str, name: str, scopes: List[str]) -> tuple[str, APIKey]:
        """Create a new API key, returns (raw_key, key_record)"""
        raw_key = f"fme_live_{secrets.token_hex(24)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        api_key = APIKey(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            prefix=raw_key[:12],
            scopes=scopes
        )
        self.api_keys[api_key.key_id] = api_key

        return raw_key, api_key

    async def validate_api_key(self, raw_key: str) -> Optional[APIKey]:
        """Validate an API key and return the record if valid"""
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        for api_key in self.api_keys.values():
            if api_key.key_hash == key_hash:
                if api_key.enabled:
                    if api_key.expires_at and api_key.expires_at < datetime.utcnow():
                        return None
                    api_key.last_used = datetime.utcnow()
                    return api_key
        return None


vault = TokenVault()


# ═══════════════════════════════════════════════════════════════════════════
# WEBHOOK PROCESSOR
# ═══════════════════════════════════════════════════════════════════════════

class WebhookProcessor:
    """Process incoming webhooks with retry and deduplication"""

    def __init__(self):
        self.events: Dict[str, WebhookEvent] = {}
        self.processed_ids: set = set()  # For deduplication
        self.handlers: Dict[str, Callable] = {}

    def register_handler(self, source: str, event_type: str, handler: Callable):
        """Register a handler for specific webhook events"""
        key = f"{source}:{event_type}"
        self.handlers[key] = handler
        logger.info(f"Registered webhook handler: {key}")

    async def process(self, event: WebhookEvent) -> Dict[str, Any]:
        """Process a webhook event"""
        # Deduplication check
        if event.event_id in self.processed_ids:
            logger.info(f"Duplicate webhook ignored: {event.event_id}")
            return {"status": "duplicate", "event_id": event.event_id}

        self.events[event.event_id] = event
        event.status = WebhookStatus.PROCESSING

        try:
            # Find handler
            handler_key = f"{event.source}:{event.event_type}"
            handler = self.handlers.get(handler_key)

            if handler:
                result = await handler(event.payload)
                event.status = WebhookStatus.COMPLETED
                event.processed_at = datetime.utcnow()
                self.processed_ids.add(event.event_id)
                return {"status": "processed", "result": result}
            else:
                # No specific handler, store for manual processing
                event.status = WebhookStatus.COMPLETED
                event.processed_at = datetime.utcnow()
                self.processed_ids.add(event.event_id)
                return {"status": "stored", "event_id": event.event_id}

        except Exception as e:
            event.status = WebhookStatus.FAILED
            event.error = str(e)
            event.retry_count += 1

            if event.retry_count < 3:
                event.status = WebhookStatus.RETRYING
                # Schedule retry (in production, use task queue)
                logger.warning(f"Webhook failed, scheduling retry: {event.event_id}")

            return {"status": "failed", "error": str(e)}

    def verify_signature(
        self,
        payload: bytes,
        signature: str,
        secret: str,
        algorithm: str = "sha256"
    ) -> bool:
        """Verify webhook signature"""
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256 if algorithm == "sha256" else hashlib.sha1
        ).hexdigest()

        return hmac.compare_digest(expected, signature)


webhook_processor = WebhookProcessor()


# ═══════════════════════════════════════════════════════════════════════════
# ACTION EXECUTOR
# ═══════════════════════════════════════════════════════════════════════════

class ActionExecutor:
    """Execute outbound actions on external systems"""

    async def execute(self, action: OutboundAction) -> Dict[str, Any]:
        """Execute an outbound action"""
        logger.info(f"Executing action: {action.action_type} on {action.provider}")

        # Get OAuth token for the user/provider
        token = await vault.get_token(action.provider, action.user_id)
        if not token:
            raise HTTPException(status_code=401, detail=f"No {action.provider} connection")

        try:
            # Route to provider-specific executor
            if action.provider == "slack":
                result = await self._execute_slack(action, token)
            elif action.provider == "discord":
                result = await self._execute_discord(action, token)
            elif action.provider == "google":
                result = await self._execute_google(action, token)
            elif action.provider == "notion":
                result = await self._execute_notion(action, token)
            else:
                result = {"status": "unsupported_provider"}

            action.status = "completed"
            action.executed_at = datetime.utcnow()
            action.result = result
            return result

        except Exception as e:
            action.status = "failed"
            action.error = str(e)
            raise

    async def _execute_slack(self, action: OutboundAction, token: OAuthToken) -> Dict:
        """Execute Slack action"""
        # In production, use httpx to call Slack API
        if action.action_type == ActionType.NOTIFY:
            # POST to chat.postMessage
            return {"status": "sent", "channel": action.target}
        return {"status": "ok"}

    async def _execute_discord(self, action: OutboundAction, token: OAuthToken) -> Dict:
        """Execute Discord action"""
        if action.action_type == ActionType.NOTIFY:
            return {"status": "sent", "channel": action.target}
        return {"status": "ok"}

    async def _execute_google(self, action: OutboundAction, token: OAuthToken) -> Dict:
        """Execute Google action (Calendar, etc.)"""
        if action.action_type == ActionType.CREATE:
            # Create calendar event
            return {"status": "created", "event_id": str(uuid.uuid4())}
        return {"status": "ok"}

    async def _execute_notion(self, action: OutboundAction, token: OAuthToken) -> Dict:
        """Execute Notion action"""
        if action.action_type == ActionType.CREATE:
            return {"status": "created", "page_id": str(uuid.uuid4())}
        elif action.action_type == ActionType.UPDATE:
            return {"status": "updated", "page_id": action.target}
        return {"status": "ok"}


action_executor = ActionExecutor()


# ═══════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "external-tether",
        "codename": "THE BRIDGES",
        "providers": list(OAUTH_CONFIGS.keys()),
        "connected_tokens": len(vault.tokens),
        "api_keys": len(vault.api_keys)
    }


# ─────────────────────────────────────────────────────────────────────────
# OAuth Endpoints
# ─────────────────────────────────────────────────────────────────────────

@app.get("/oauth/{provider}/authorize")
async def oauth_authorize(
    provider: str,
    user_id: str,
    redirect_uri: str = "https://0r8.ai/oauth/callback"
):
    """Start OAuth flow"""
    if provider not in OAUTH_CONFIGS:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    config = OAUTH_CONFIGS[provider]
    state = secrets.token_urlsafe(32)

    # Store state for verification
    oauth_state = OAuthState(
        state=state,
        provider=provider,
        user_id=user_id,
        redirect_uri=redirect_uri,
        scopes=config["scopes"]
    )
    # In production, store in Redis/KV with TTL
    await kv_put(f"oauth_state:{state}", oauth_state.model_dump_json(), ttl=600)

    # Build authorization URL
    params = {
        "client_id": f"${{{config['client_id_env']}}}",  # Placeholder
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "state": state,
        "scope": " ".join(config["scopes"])
    }

    auth_url = f"{config['auth_url']}?{urlencode(params)}"
    return {"auth_url": auth_url, "state": state}


@app.get("/oauth/callback")
async def oauth_callback(code: str, state: str):
    """OAuth callback handler"""
    # Retrieve and validate state
    state_json = await kv_get(f"oauth_state:{state}")
    if not state_json:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    oauth_state = OAuthState.model_validate_json(state_json)
    config = OAUTH_CONFIGS[oauth_state.provider]

    # Exchange code for token (in production, use httpx)
    # Simulated token response
    token = OAuthToken(
        provider=oauth_state.provider,
        user_id=oauth_state.user_id,
        access_token=secrets.token_urlsafe(32),
        refresh_token=secrets.token_urlsafe(32),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        scopes=oauth_state.scopes
    )

    await vault.store_token(token)
    await kv_delete(f"oauth_state:{state}")

    return RedirectResponse(
        url=f"{oauth_state.redirect_uri}?provider={oauth_state.provider}&success=true"
    )


@app.delete("/oauth/{provider}/disconnect")
async def oauth_disconnect(provider: str, user_id: str):
    """Disconnect OAuth provider"""
    deleted = await vault.delete_token(provider, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"status": "disconnected", "provider": provider}


@app.get("/oauth/connections")
async def list_connections(user_id: str):
    """List user's OAuth connections"""
    connections = []
    for key, token in vault.tokens.items():
        if token.user_id == user_id:
            connections.append({
                "provider": token.provider,
                "connected_at": token.created_at,
                "scopes": token.scopes,
                "expires_at": token.expires_at
            })
    return {"connections": connections}


# ─────────────────────────────────────────────────────────────────────────
# Webhook Endpoints
# ─────────────────────────────────────────────────────────────────────────

@app.post("/external/hook")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None),
    x_webhook_source: Optional[str] = Header(None)
):
    """Receive incoming webhook"""
    body = await request.body()
    payload = await request.json()

    source = x_webhook_source or payload.get("source", "unknown")
    event_type = payload.get("type", payload.get("event", "unknown"))

    event = WebhookEvent(
        source=source,
        event_type=event_type,
        payload=payload
    )

    # Process in background
    background_tasks.add_task(webhook_processor.process, event)

    return {
        "status": "accepted",
        "event_id": event.event_id
    }


@app.get("/webhooks")
async def list_webhooks(user_id: str):
    """List user's webhook configurations"""
    # In production, fetch from Firestore
    return {"webhooks": []}


@app.post("/webhooks")
async def create_webhook(config: WebhookConfig):
    """Create a new webhook endpoint"""
    return {
        "status": "created",
        "webhook_id": config.webhook_id,
        "secret": config.secret
    }


# ─────────────────────────────────────────────────────────────────────────
# Action Endpoints
# ─────────────────────────────────────────────────────────────────────────

@app.post("/external/trigger")
async def trigger_action(action: OutboundAction):
    """Trigger an outbound action"""
    result = await action_executor.execute(action)
    return {
        "status": "executed",
        "action_id": action.action_id,
        "result": result
    }


@app.get("/external/state")
async def get_external_state(user_id: str, provider: str):
    """Get current state of external connection"""
    token = await vault.get_token(provider, user_id)
    if not token:
        return {"connected": False, "provider": provider}

    return {
        "connected": True,
        "provider": provider,
        "scopes": token.scopes,
        "expires_at": token.expires_at
    }


# ─────────────────────────────────────────────────────────────────────────
# API Key Endpoints
# ─────────────────────────────────────────────────────────────────────────

@app.post("/api-keys")
async def create_api_key(user_id: str, name: str, scopes: List[str] = None):
    """Create a new API key"""
    raw_key, api_key = await vault.create_api_key(
        user_id=user_id,
        name=name,
        scopes=scopes or ["read", "write"]
    )

    return {
        "key": raw_key,  # Only shown once!
        "key_id": api_key.key_id,
        "prefix": api_key.prefix,
        "name": api_key.name,
        "scopes": api_key.scopes
    }


@app.get("/api-keys")
async def list_api_keys(user_id: str):
    """List user's API keys (without exposing the actual keys)"""
    keys = [
        {
            "key_id": k.key_id,
            "name": k.name,
            "prefix": k.prefix,
            "scopes": k.scopes,
            "enabled": k.enabled,
            "last_used": k.last_used,
            "created_at": k.created_at
        }
        for k in vault.api_keys.values()
        if k.user_id == user_id
    ]
    return {"api_keys": keys}


@app.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user_id: str):
    """Revoke an API key"""
    if key_id in vault.api_keys:
        api_key = vault.api_keys[key_id]
        if api_key.user_id == user_id:
            api_key.enabled = False
            return {"status": "revoked", "key_id": key_id}
    raise HTTPException(status_code=404, detail="API key not found")


# ═══════════════════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("EXTERNAL TETHER - THE BRIDGES")
    logger.info("Connecting the engine to the world.")
    logger.info(f"OAuth providers: {list(OAUTH_CONFIGS.keys())}")
    logger.info("=" * 60)

    # Register default webhook handlers
    webhook_processor.register_handler(
        "slack", "message",
        lambda p: logger.info(f"Slack message: {p}")
    )
    webhook_processor.register_handler(
        "discord", "message",
        lambda p: logger.info(f"Discord message: {p}")
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8021)
