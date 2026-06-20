import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_finforesight.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    client.post("/api/auth/register", json={
        "email": "test@finforesight.io",
        "username": "testuser",
        "password": "SecurePass123",
        "full_name": "Test User",
    })
    resp = client.post("/api/auth/login", data={
        "username": "test@finforesight.io",
        "password": "SecurePass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
