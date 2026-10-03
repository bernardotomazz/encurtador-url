from fastapi import APIRouter, HTTPException, status, Depends, Request
from models.user import UserCreate, LoginResponse, LoginRequest
import auth
from database import user_collection
from datetime import datetime, timezone
from limiter import limiter


auth_router = APIRouter(prefix="/auth", tags=["Autenticação"])

@auth_router.post("/register", response_model=LoginResponse)
@limiter.limit("5/minute")
async def create_user(request: Request, user: UserCreate):
    if await user_collection.find_one({"email": user.email.lower().strip()}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    new_user = {
        "name": user.name,
        "email": user.email.lower().strip(),
        "password_hash": auth.hash_password(user.password), # Salva como password_hash!
        "created_at": datetime.now(timezone.utc)
    }
    result = await user_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    token = auth.generate_token(user_id)
    return {
    "access_token": token,
    "token_type": "bearer",
    "user": {
        "id": user_id,
        "name": new_user["name"],
        "email": new_user["email"],
        "created_at": new_user["created_at"]
    }
}

@auth_router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def signin_user(request: Request, login: LoginRequest):
    user = await user_collection.find_one({"email": login.email.lower().strip()})
    if not user or not auth.verify_password(login.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas"
        )
    user_id = str(user["_id"])
    token = auth.generate_token(user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    }

@auth_router.get("/me")
async def get_user_resume(current_user = Depends(auth.get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"]
    }


    
    