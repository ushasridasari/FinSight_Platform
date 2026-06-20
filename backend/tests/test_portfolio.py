def test_create_portfolio(client, auth_headers):
    resp = client.post("/api/portfolio/", json={"name": "Tech Portfolio", "description": "My tech stocks"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Tech Portfolio"


def test_list_portfolios(client, auth_headers):
    client.post("/api/portfolio/", json={"name": "P1"}, headers=auth_headers)
    resp = client.get("/api/portfolio/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_add_holding(client, auth_headers):
    port = client.post("/api/portfolio/", json={"name": "Holding Test"}, headers=auth_headers).json()
    resp = client.post(
        f"/api/portfolio/{port['id']}/holdings",
        json={"ticker": "AAPL", "shares": 10, "avg_cost": 150.0, "sector": "Technology"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["ticker"] == "AAPL"


def test_add_transaction(client, auth_headers):
    port = client.post("/api/portfolio/", json={"name": "Tx Test"}, headers=auth_headers).json()
    resp = client.post(
        f"/api/portfolio/{port['id']}/transactions",
        json={"ticker": "MSFT", "transaction_type": "BUY", "shares": 5, "price": 300.0},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["transaction_type"] == "BUY"


def test_watchlist_add_and_remove(client, auth_headers):
    add_resp = client.post("/api/portfolio/watchlist", json={"ticker": "NVDA"}, headers=auth_headers)
    assert add_resp.status_code == 201

    wl = client.get("/api/portfolio/watchlist", headers=auth_headers).json()
    assert any(w["ticker"] == "NVDA" for w in wl)

    wl_id = add_resp.json()["id"]
    del_resp = client.delete(f"/api/portfolio/watchlist/{wl_id}", headers=auth_headers)
    assert del_resp.status_code == 204


def test_delete_portfolio(client, auth_headers):
    port = client.post("/api/portfolio/", json={"name": "To Delete"}, headers=auth_headers).json()
    resp = client.delete(f"/api/portfolio/{port['id']}", headers=auth_headers)
    assert resp.status_code == 204


def test_portfolio_not_found(client, auth_headers):
    resp = client.delete("/api/portfolio/99999", headers=auth_headers)
    assert resp.status_code == 404
