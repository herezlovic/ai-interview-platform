"""JSON-file session store — survives restarts on a single instance."""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import settings
from app.models.schemas import InterviewSession

logger = logging.getLogger(__name__)


class SessionStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._path = Path(settings.DATA_DIR) / "sessions.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._sessions: Dict[str, InterviewSession] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            raw = json.loads(self._path.read_text())
            for item in raw:
                session = InterviewSession.model_validate(item)
                self._sessions[session.id] = session
            logger.info("Loaded %s sessions from disk", len(self._sessions))
        except Exception as exc:
            logger.warning("Could not load session store: %s", exc)

    def _persist(self) -> None:
        payload = [s.model_dump(mode="json") for s in self._sessions.values()]
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, default=str))
        tmp.replace(self._path)

    def save(self, session: InterviewSession) -> InterviewSession:
        with self._lock:
            self._sessions[session.id] = session
            self._persist()
            return session

    def get(self, session_id: str) -> Optional[InterviewSession]:
        with self._lock:
            return self._sessions.get(session_id)

    def list(self) -> List[InterviewSession]:
        with self._lock:
            return sorted(self._sessions.values(), key=lambda s: s.created_at, reverse=True)

    def delete(self, session_id: str) -> bool:
        with self._lock:
            if session_id not in self._sessions:
                return False
            del self._sessions[session_id]
            self._persist()
            return True


store = SessionStore()
