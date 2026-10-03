from dotenv import load_dotenv
from os import getenv
import bcrypt
from fastapi import HTTPException, status, Depends
from database import user_collection
from datetime import datetime, timezone, timedelta
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId


load_dotenv()

SECRET_KEY = getenv("SECRET_KEY")
ALGORITHM = getenv("ALGORITHM")
ACESS_TOKEN_EXPIRE_MINUTES = int(getenv("ACESS_TOKEN_EXPIRE_MINUTES", 720))

security = HTTPBearer()
security_opcional = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(password_bytes, salt)
    return hash_bytes.decode("utf-8")

def verify_password(str_password: str, hash_password: str):
    return bcrypt.checkpw(str_password.encode("utf-8"), hash_password.encode("utf-8"))

async def create_token(email: str, password: str):
    user = await user_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas")
    elif not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas")
    
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=ACESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user["_id"]),
        "exp": expire_time
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

def generate_token(user_id: str) -> str:
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=ACESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire_time
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return await decode_token(token)

async def get_optional_user(credentials: HTTPAuthorizationCredentials | None = Depends(security_opcional)):
    if credentials is None:
        return None
    token = credentials.credentials
    return await decode_token(token)

async def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    return user