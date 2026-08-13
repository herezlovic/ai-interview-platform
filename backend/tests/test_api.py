from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["demo_ready"] is True


def test_demo_pipeline():
    create = client.post(
        "/api/interviews/",
        data={"candidate_name": "Alex Rivera", "position": "Staff Engineer"},
    )
    assert create.status_code == 200
    session_id = create.json()["id"]

    demo = client.post(f"/api/interviews/{session_id}/demo")
    assert demo.status_code == 200

    # BackgroundTasks run inline with TestClient
    status = client.get(f"/api/analysis/{session_id}/status")
    assert status.status_code == 200
    payload = status.json()
    assert "stage" in payload
    assert "progress" in payload
    assert "message" in payload
    assert payload["status"] == "completed"
    assert payload["progress"] == 100

    report = client.get(f"/api/reports/{session_id}")
    assert report.status_code == 200
    data = report.json()
    assert data["overall_score"] >= 0
    assert data["llm_analysis"]["hiring_recommendation"]
    assert len(data["transcript"]["segments"]) > 0
