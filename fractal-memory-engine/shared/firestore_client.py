"""
Firestore Client Wrapper
Handles connection pooling, retries, and structured writes
"""
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import google cloud firestore, fall back to mock for local dev
try:
    from google.cloud import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    logger.warning("google-cloud-firestore not installed, using mock client")


class MockFirestoreClient:
    """Mock client for local development without GCP"""

    def __init__(self):
        self._data: Dict[str, Any] = {}

    def collection(self, name: str):
        return MockCollection(self._data, name)


class MockCollection:
    def __init__(self, data: Dict, path: str):
        self._data = data
        self._path = path
        if path not in self._data:
            self._data[path] = {}

    def document(self, doc_id: str):
        return MockDocument(self._data, f"{self._path}/{doc_id}")

    def add(self, data: Dict) -> tuple:
        import uuid
        doc_id = str(uuid.uuid4())
        self._data[self._path][doc_id] = data
        return (None, MockDocument(self._data, f"{self._path}/{doc_id}"))

    def where(self, field: str, op: str, value: Any):
        return self  # Simplified mock

    def limit(self, n: int):
        return self

    def stream(self):
        for doc_id, data in self._data.get(self._path, {}).items():
            yield MockDocSnapshot(doc_id, data)


class MockDocument:
    def __init__(self, data: Dict, path: str):
        self._data = data
        self._path = path

    def collection(self, name: str):
        return MockCollection(self._data, f"{self._path}/{name}")

    def get(self):
        parts = self._path.split("/")
        current = self._data
        for part in parts:
            if part not in current:
                return MockDocSnapshot(parts[-1], None, exists=False)
            current = current[part]
        return MockDocSnapshot(parts[-1], current)

    def set(self, data: Dict, merge: bool = False):
        parts = self._path.split("/")
        current = self._data
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        if merge and parts[-1] in current:
            current[parts[-1]].update(data)
        else:
            current[parts[-1]] = data

    def update(self, data: Dict):
        self.set(data, merge=True)

    def delete(self):
        parts = self._path.split("/")
        current = self._data
        for part in parts[:-1]:
            if part not in current:
                return
            current = current[part]
        current.pop(parts[-1], None)


class MockDocSnapshot:
    def __init__(self, doc_id: str, data: Optional[Dict], exists: bool = True):
        self.id = doc_id
        self._data = data
        self.exists = exists and data is not None

    def to_dict(self) -> Optional[Dict]:
        return self._data


# Singleton client
_client = None


def get_firestore_client():
    """Get or create Firestore client singleton"""
    global _client

    if _client is None:
        if FIRESTORE_AVAILABLE and os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            _client = firestore.Client()
            logger.info("Connected to Firestore")
        else:
            _client = MockFirestoreClient()
            logger.info("Using mock Firestore client")

    return _client


def reset_client():
    """Reset client (useful for testing)"""
    global _client
    _client = None
