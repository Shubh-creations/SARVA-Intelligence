def test_health_and_live_are_process_only(client):
    for path in ("/api/v1/health", "/api/v1/live"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.headers["X-Request-ID"]


def test_ready_reports_dependency_state(client):
    response = client.get("/api/v1/ready")
    assert response.status_code in {200, 503}
    if response.status_code == 200:
        assert response.json()["status"] == "ok"
    else:
        assert response.json()["error"]["code"] == "dependency_unavailable"
