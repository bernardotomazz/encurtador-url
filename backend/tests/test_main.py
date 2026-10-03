import pytest
from fastapi.testclient import TestClient
from main import app
import secrets

app.state.limiter.enabled = False
@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

def test_create_short_url_anonymous(client):
    #Testa o encurtamento de uma URL por um visitante anônimo.
    payload = {"original_url": "https://www.google.com"}
    response = client.post("/", json=payload)
    
    data = response.json()
    assert response.status_code == 200
    assert "short_url" in data
    assert data["original_url"] == "https://www.google.com/"

def test_create_invalid_url(client):
    #Testa se o encurtamento de uma URL inválida causa erro.
    payload = {"original_url": "lionelmessi"}
    response = client.post("/", json=payload)

    assert response.status_code == 422

def test_redirect_and_increment_clicks(client):
    #Testa se ao acessar um short_url devolve o endereçamento HTTP com a url original e se incrementa os cliques
    create = client.post("/", json={"original_url": "https://www.github.com/"})
    assert create.status_code == 200
    short_code = create.json()["short_url"]
    redirect_res = client.get(f"/{short_code}", follow_redirects=False)

    dados = client.get(f"/{short_code}/dashboard")
    assert redirect_res.status_code in [302, 307]
    assert redirect_res.headers["location"] == "https://www.github.com/"
    assert dados.status_code == 200
    assert dados.json()["clicks"] == create.json()["clicks"] + 1

def test_register_and_login_flow(client):
    #Testa o ciclo completo de cadastro e login com token JWT
    unique_email = f"user_{secrets.token_hex(4)}@test.com"
    user_payload = {
        "name": "Test",
        "email": unique_email,
        "password": "password"
    }
    reg_res = client.post("/auth/register", json=user_payload)
    assert reg_res.status_code == 200
    assert "access_token" in reg_res.json()

    login_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": "password"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_security_protection(client):
    #Testa se Usuário B não pode acessar o dashboard do link do Usuário A
    email_a = f"user_a_{secrets.token_hex(4)}@test.com"
    res_a = client.post("/auth/register", json={"name": "User A", "email": email_a, "password": "password123"})
    token_a = res_a.json()["access_token"]
    
    link_res = client.post(
        "/", 
        json={"original_url": "https://github.com/bernardotomazz/"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    short_code = link_res.json()["short_url"]

    email_b = f"user_b_{secrets.token_hex(4)}@test.com"
    res_b = client.post("/auth/register", json={"name": "User B", "email": email_b, "password": "password123"})
    token_b = res_b.json()["access_token"]
    spy_res = client.get(
        f"/{short_code}/dashboard",
        headers={"Authorization": f"Bearer {token_b}"}
    )

    assert spy_res.status_code == 403
    assert "Acesso negado" in spy_res.json()["detail"]