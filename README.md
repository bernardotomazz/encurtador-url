# 🔗 Encurtador de URL

Aplicação _full-stack_ moderna e segura para encurtamento de URLs, geração de QR Code e monitoramento de métricas de cliques em tempo real.

---

## 📌 Sobre o Projeto

O **Encurtador de URL** permite transformar links extensos em identificadores curtos e fáceis de compartilhar.

- **Modo Anônimo:** Qualquer visitante pode encurtar links rapidamente na página inicial e copiar o resultado ou baixar o QR Code.
- **Modo Autenticado:** Usuários cadastrados têm acesso a um painel (_dashboard_) com métricas detalhadas de cada link criado (total de cliques, data de criação e links originais).
- **Redirecionamento Rápido:** Acesso direto via slug curto redirecionando instantaneamente para a URL original com incremento automático de acessos.

---

## 🚀 Tecnologias Utilizadas

### Backend

- **Python 3.13** com **FastAPI**
- **Motor & PyMongo**
- **Pydantic**
- **PyJWT & Bcrypt**
- **SlowAPI**
- **Pytest & HTTPX**

### Frontend

- **React 19** com **TypeScript** e **Vite**
- **Tailwind CSS v4**
- **React Router DOM**
- **Axios**
- **QRCode** & **React Icons**

### Banco de Dados

- **MongoDB Atlas** com índices B-Tree configurados na inicialização para busca rápida $O(\log N)$ e integridade única.

---

## 🛡️ Destaques de Segurança e Engenharia

- **Mitigação de IDOR:** Verificação rigorosa de propriedade de link no dashboard — um usuário não consegue consultar dados de links pertencentes a outro usuário.
- **Rate Limiting:** Proteção contra abusos e ataques de negação de serviço (DoS) em rotas sensíveis como login, registro e encurtamento.
- **Slugs Criptográficos e Seguros:** Geração de códigos aleatórios seguros com bloqueio de palavras e rotas reservadas do sistema (`login`, `register`, `dashboard`, etc.).
- **Tratamento de Timezone:** Persistência de datas com fuso horário UTC consciente (`tz_aware=True`).

---

## 🧪 Testes Automatizados

O backend conta com uma suíte de testes de integração automatizados com **Pytest**, cobrindo os principais fluxos do sistema:

1. Encurtamento de URL por usuário anônimo.
2. Rejeição de URLs inválidas (HTTP 422).
3. Redirecionamento correto (HTTP 307) e incremento de cliques.
4. Fluxo completo de cadastro, login e emissão de JWT.
5. Validação de segurança e proteção de acesso (anti-IDOR).

Para rodar os testes:

```bash
cd backend
pytest -v
```

---

## ⚙️ Como Executar Localmente

### Pré-requisitos

- **Python 3.11+**
- **Node.js 18+** e **npm**
- Conta ou instância do **MongoDB Atlas**

---

### 1. Configurando o Backend

1. Entre na pasta do backend e crie um ambiente virtual:

   ```bash
   cd backend
   python -m venv venv
   ```

2. Ative o ambiente virtual:
   - **Windows:** `.\venv\Scripts\activate`
   - **Linux/Mac:** `source venv/bin/activate`

3. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

4. Crie o arquivo `.env` dentro da pasta `backend/`:

   ```env
   DB_USERNAME=seu_usuario_mongodb
   DB_PASSWORD=sua_senha_mongodb
   SECRET_KEY=sua_chave_secreta_jwt
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. Inicie o servidor FastAPI:
   ```bash
   uvicorn main:app --reload
   ```
   _O backend estará rodando em `http://localhost:8000` (documentação Swagger em `http://localhost:8000/docs`)._

---

### 2. Configurando o Frontend

1. Em outro terminal, acesse a pasta do frontend:

   ```bash
   cd frontend
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o arquivo `.env` dentro da pasta `frontend/`:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SHORT_URL_BASE=http://localhost:8000
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   _O frontend estará disponível em `http://localhost:5173`._
