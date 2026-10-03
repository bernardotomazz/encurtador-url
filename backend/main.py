from fastapi import FastAPI
from routes.url_routes import url_router
from routes.auth_routes import auth_router
from fastapi.middleware.cors import CORSMiddleware
from os import getenv
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from database import db_init
from limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler 

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_init()
    yield


app = FastAPI(title="Encurtador de URL", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(url_router)
app.include_router(auth_router)

cors_origins = getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)