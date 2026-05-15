import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_parse_invalid_file():
    response = client.post("/parse-roster", files={"file": ("test.txt", b"not a pdf")})
    assert response.status_code == 400

def test_parse_empty_pdf():
    # In a real test, we would provide a minimal valid PDF byte string
    pass
