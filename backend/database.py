from dotenv import load_dotenv
from os import getenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

import certifi

load_dotenv(override=True)

uri = f"mongodb+srv://{getenv('DB_USERNAME')}:{getenv('DB_PASSWORD')}@urlencurtador.2mquheb.mongodb.net/?appName=urlencurtador"

client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where(), tz_aware=True)

db = client.url_db

url_collection = db.url_collection

user_collection = db.user_collection

async def db_init():
    await url_collection.create_index("short_url", unique=True)
    await user_collection.create_index("email", unique=True)
    await url_collection.create_index([("user_id", 1), ("created_at", -1)])