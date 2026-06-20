def test_register(client):
    resp = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "MyPassword1",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "username": "dup1", "password": "pass123"}
    client.post("/api/auth/register", json=payload)
    payload["username"] = "dup2"
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "password": "pass123",
    })
    resp = client.post("/api/auth/login", data={
        "username": "login@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "username": "wrongpass",
        "password": "correct",
    })
    resp = client.post("/api/auth/login", data={
        "username": "wrong@example.com",
        "password": "incorrect",
    })
    assert resp.status_code == 401


def test_get_me(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@finforesight.io"


def test_get_me_unauthorized(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
