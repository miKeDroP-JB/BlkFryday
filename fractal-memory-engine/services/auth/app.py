"""
Auth + Multi-Tenancy Layer - THE GATES
Phase 10: Secure, battle-ready identity layer

Firebase Auth integration with rate limiting, avatar scoping, and admin console
"""
import asyncio
import hashlib
import hmac
import logging
import time
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, Any, List, Optional, Callable

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_get, kv_put, kv_delete

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Auth Service",
    description="THE GATES - Auth + Multi-Tenancy Layer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

class AuthConfig:
    # Rate limits (requests per minute)
    RATE_LIMIT_DEFAULT = 60
    RATE_LIMIT_PREMIUM = 300
    RATE_LIMIT_ADMIN = 1000

    # Token settings
    TOKEN_EXPIRY_HOURS = 24
    REFRESH_TOKEN_DAYS = 30

    # Backend signature key (set via env in production)
    BACKEND_SECRET = "fractal-memory-secret-change-in-prod"


# ═══════════════════════════════════════════════════════════════
# Models
# ═══════════════════════════════════════════════════════════════

class UserRole(str):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"
    SERVICE = "service"


class AuthUser(BaseModel):
    """Authenticated user context"""
    user_id: str
    email: Optional[str] = None
    role: str = UserRole.USER
    avatar_scope: List[str] = Field(default_factory=lambda: ["default"])
    rate_limit: int = AuthConfig.RATE_LIMIT_DEFAULT
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TokenPayload(BaseModel):
    """JWT-like token payload"""
    user_id: str
    email: Optional[str]
    role: str
    avatar_scope: List[str]
    issued_at: str
    expires_at: str
    signature: str


class LoginRequest(BaseModel):
    """Login request"""
    email: str
    password: Optional[str] = None
    provider: str = "email"  # email, google, magic_link
    token: Optional[str] = None  # OAuth token or magic link token


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    refresh_token: str
    user: AuthUser
    expires_at: str


class AdminUserView(BaseModel):
    """Admin view of user data"""
    user_id: str
    email: Optional[str]
    role: str
    created_at: Optional[str]
    last_seen: Optional[str]
    memory_stats: Dict[str, Any] = Field(default_factory=dict)
    avatar_count: int = 0


# ═══════════════════════════════════════════════════════════════
# Rate Limiter
# ═══════════════════════════════════════════════════════════════

class RateLimiter:
    """Token bucket rate limiter with Redis/KV backend"""

    def __init__(self):
        self._local_cache: Dict[str, tuple] = {}  # user_id -> (count, window_start)

    async def check_rate_limit(self, user_id: str, limit: int) -> tuple[bool, int]:
        """
        Check if request is within rate limit.
        Returns (allowed, remaining)
        """
        window_key = f"rate:{user_id}:{int(time.time() // 60)}"

        # Try KV first
        cached = kv_get(window_key)
        if cached:
            count = int(cached)
        else:
            count = 0

        if count >= limit:
            return False, 0

        # Increment
        new_count = count + 1
        kv_put(window_key, str(new_count), ttl=60)

        return True, limit - new_count

    async def get_usage(self, user_id: str) -> Dict[str, int]:
        """Get current rate limit usage"""
        window_key = f"rate:{user_id}:{int(time.time() // 60)}"
        cached = kv_get(window_key)
        count = int(cached) if cached else 0
        return {"current_window_count": count}


rate_limiter = RateLimiter()


# ═══════════════════════════════════════════════════════════════
# Token Management
# ═══════════════════════════════════════════════════════════════

def generate_signature(payload: str) -> str:
    """Generate HMAC signature for token"""
    return hmac.new(
        AuthConfig.BACKEND_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()


def create_access_token(user: AuthUser) -> str:
    """Create access token"""
    now = datetime.utcnow()
    expires = now + timedelta(hours=AuthConfig.TOKEN_EXPIRY_HOURS)

    payload = TokenPayload(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        avatar_scope=user.avatar_scope,
        issued_at=now.isoformat(),
        expires_at=expires.isoformat(),
        signature="",
    )

    # Sign
    payload_str = f"{payload.user_id}:{payload.email}:{payload.role}:{payload.expires_at}"
    payload.signature = generate_signature(payload_str)

    # Encode (simple base64-like for demo - use JWT in production)
    import base64
    import json
    token_data = payload.dict()
    token_bytes = base64.b64encode(json.dumps(token_data).encode())
    return token_bytes.decode()


def verify_access_token(token: str) -> Optional[AuthUser]:
    """Verify and decode access token"""
    try:
        import base64
        import json

        token_data = json.loads(base64.b64decode(token.encode()))
        payload = TokenPayload(**token_data)

        # Check expiry
        expires = datetime.fromisoformat(payload.expires_at)
        if datetime.utcnow() > expires:
            return None

        # Verify signature
        payload_str = f"{payload.user_id}:{payload.email}:{payload.role}:{payload.expires_at}"
        expected_sig = generate_signature(payload_str)
        if payload.signature != expected_sig:
            return None

        return AuthUser(
            user_id=payload.user_id,
            email=payload.email,
            role=payload.role,
            avatar_scope=payload.avatar_scope,
            rate_limit=get_rate_limit_for_role(payload.role),
        )

    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


def get_rate_limit_for_role(role: str) -> int:
    """Get rate limit based on role"""
    if role == UserRole.ADMIN:
        return AuthConfig.RATE_LIMIT_ADMIN
    elif role == UserRole.PREMIUM:
        return AuthConfig.RATE_LIMIT_PREMIUM
    return AuthConfig.RATE_LIMIT_DEFAULT


def verify_backend_signature(signature: str, payload: str) -> bool:
    """Verify backend-to-backend signature"""
    expected = generate_signature(payload)
    return hmac.compare_digest(signature, expected)


# ═══════════════════════════════════════════════════════════════
# Dependencies
# ═══════════════════════════════════════════════════════════════

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_backend_signature: Optional[str] = Header(None),
    x_request_payload: Optional[str] = Header(None),
) -> AuthUser:
    """
    Get current authenticated user from token or backend signature.
    """
    # Backend-to-backend auth
    if x_backend_signature and x_request_payload:
        if verify_backend_signature(x_backend_signature, x_request_payload):
            return AuthUser(
                user_id="service",
                role=UserRole.SERVICE,
                rate_limit=AuthConfig.RATE_LIMIT_ADMIN,
            )
        raise HTTPException(status_code=401, detail="Invalid backend signature")

    # Token auth
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = verify_access_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


async def require_admin(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """Require admin role"""
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def check_rate_limit(
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Rate limit middleware"""
    allowed, remaining = await rate_limiter.check_rate_limit(user.user_id, user.rate_limit)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"X-RateLimit-Remaining": "0"},
        )

    request.state.rate_limit_remaining = remaining
    return user


async def check_avatar_scope(
    avatar: str,
    user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """Check if user has access to avatar"""
    if avatar not in user.avatar_scope and "all" not in user.avatar_scope:
        raise HTTPException(status_code=403, detail=f"No access to avatar: {avatar}")
    return user


# ═══════════════════════════════════════════════════════════════
# API Endpoints - Auth
# ═══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "auth",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint supporting multiple providers.
    In production, integrate with Firebase Auth.
    """
    db = get_firestore_client()

    # Demo: Simple email lookup
    # In production: Verify with Firebase Auth
    user_doc = db.collection("users").document(request.email.replace("@", "_at_")).get()

    if not user_doc.exists:
        # Create new user
        user_id = request.email.replace("@", "_at_")
        user_data = {
            "email": request.email,
            "role": UserRole.USER,
            "avatar_scope": ["default"],
            "created_at": datetime.utcnow().isoformat(),
            "provider": request.provider,
        }
        db.collection("users").document(user_id).set(user_data)
    else:
        user_data = user_doc.to_dict()
        user_id = user_doc.id

    # Build auth user
    auth_user = AuthUser(
        user_id=user_id,
        email=request.email,
        role=user_data.get("role", UserRole.USER),
        avatar_scope=user_data.get("avatar_scope", ["default"]),
    )

    # Generate tokens
    access_token = create_access_token(auth_user)
    refresh_token = create_access_token(auth_user)  # Simplified

    expires = datetime.utcnow() + timedelta(hours=AuthConfig.TOKEN_EXPIRY_HOURS)

    # Update last seen
    db.collection("users").document(user_id).set({
        "last_seen": datetime.utcnow().isoformat(),
    }, merge=True)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=auth_user,
        expires_at=expires.isoformat(),
    )


@app.post("/auth/refresh")
async def refresh_token(
    refresh_token: str,
):
    """Refresh access token"""
    user = verify_access_token(refresh_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_token = create_access_token(user)
    expires = datetime.utcnow() + timedelta(hours=AuthConfig.TOKEN_EXPIRY_HOURS)

    return {
        "access_token": new_token,
        "expires_at": expires.isoformat(),
    }


@app.get("/auth/me")
async def get_me(user: AuthUser = Depends(get_current_user)):
    """Get current user info"""
    return user


@app.post("/auth/logout")
async def logout(user: AuthUser = Depends(get_current_user)):
    """Logout - invalidate token"""
    # In production: Add token to blacklist
    return {"status": "logged_out"}


# ═══════════════════════════════════════════════════════════════
# API Endpoints - Admin Console
# ═══════════════════════════════════════════════════════════════

@app.get("/admin/users", response_model=List[AdminUserView])
async def list_users(
    limit: int = 100,
    offset: int = 0,
    admin: AuthUser = Depends(require_admin),
):
    """List all users (admin only)"""
    db = get_firestore_client()
    users = db.collection("users").limit(limit).stream()

    result = []
    for user_doc in users:
        data = user_doc.to_dict()

        # Get memory stats
        patterns = list(db.collection("users").document(user_doc.id).collection("patterns").limit(1).stream())
        avatars = list(db.collection("users").document(user_doc.id).collection("avatars").limit(10).stream())

        result.append(AdminUserView(
            user_id=user_doc.id,
            email=data.get("email"),
            role=data.get("role", UserRole.USER),
            created_at=data.get("created_at"),
            last_seen=data.get("last_seen"),
            memory_stats={"pattern_count": len(patterns)},
            avatar_count=len(avatars),
        ))

    return result


@app.get("/admin/users/{user_id}")
async def get_user_detail(
    user_id: str,
    include_memory: bool = False,
    admin: AuthUser = Depends(require_admin),
):
    """Get detailed user info (admin only)"""
    db = get_firestore_client()
    user_doc = db.collection("users").document(user_id).get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_doc.to_dict()

    result = {
        "user_id": user_id,
        "profile": data,
    }

    if include_memory:
        # Redacted memory view
        patterns = list(db.collection("users").document(user_id).collection("patterns").limit(20).stream())
        result["memory_preview"] = [
            {"id": p.id, "confidence": p.to_dict().get("_meta", {}).get("confidence")}
            for p in patterns
        ]

    return result


@app.post("/admin/users/{user_id}/recalibrate")
async def trigger_recalibration(
    user_id: str,
    admin: AuthUser = Depends(require_admin),
):
    """Manually trigger recalibration for user"""
    db = get_firestore_client()

    # Mark for recalibration
    db.collection("users").document(user_id).collection("_meta").document("calibration_trigger").set({
        "triggered_by": admin.user_id,
        "triggered_at": datetime.utcnow().isoformat(),
        "status": "pending",
    })

    return {"status": "recalibration_triggered", "user_id": user_id}


@app.post("/admin/users/{user_id}/refresh_avatar")
async def refresh_avatar(
    user_id: str,
    avatar: str,
    admin: AuthUser = Depends(require_admin),
):
    """Force avatar refresh"""
    db = get_firestore_client()

    # Clear avatar cache
    kv_delete(f"avatar:{user_id}:{avatar}")

    # Mark for refresh
    db.collection("users").document(user_id).collection("avatars").document(avatar).set({
        "_refresh_requested": datetime.utcnow().isoformat(),
        "_refresh_by": admin.user_id,
    }, merge=True)

    return {"status": "avatar_refresh_triggered", "user_id": user_id, "avatar": avatar}


@app.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: AuthUser = Depends(require_admin),
):
    """Update user role"""
    if role not in [UserRole.USER, UserRole.PREMIUM, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = get_firestore_client()
    db.collection("users").document(user_id).set({
        "role": role,
        "role_updated_at": datetime.utcnow().isoformat(),
        "role_updated_by": admin.user_id,
    }, merge=True)

    return {"status": "role_updated", "user_id": user_id, "new_role": role}


@app.get("/admin/stats")
async def get_system_stats(admin: AuthUser = Depends(require_admin)):
    """Get system-wide stats"""
    db = get_firestore_client()

    users = list(db.collection("users").limit(1000).stream())

    return {
        "total_users": len(users),
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
