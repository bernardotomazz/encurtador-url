from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse
from models.url import OriginalURL, CreateURLResponse, UpdateURL
from database import url_collection
from schema.schemas import url_schema, list_urls
from datetime import datetime, timezone
import secrets
from auth import get_optional_user, get_current_user
from limiter import limiter

RESERVED_LINKS = {
    "dashboard", "urls", "auth", "docs", "redoc",
    "openapi.json", "favicon.ico", "api", "login", "register", "google", "health"
}

url_router = APIRouter(tags=["URLS"])

@url_router.get("/dashboard/status")
async def get_dashboard_status(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_clicks": {"$sum": "$clicks"},
            "total_links": {"$sum": 1}
        }}
    ]
    cursor = url_collection.aggregate(pipeline)
    stats = await cursor.to_list(length=1)

    top_link = await url_collection.find_one({"user_id": user_id}, sort=[("clicks", -1)])
    total_clicks = stats[0]["total_clicks"] if stats else 0
    total_links = stats[0]["total_links"] if stats else 0

    return {
        "total_clicks": total_clicks,
        "total_links": total_links,
        "top_link": {
            "short_url": top_link["short_url"],
            "original_url": top_link["original_url"],
            "clicks": top_link["clicks"]
        } if top_link else None
    }

@url_router.get("/urls")
async def get_user_links(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    links = url_collection.find({"user_id": user_id}).sort("created_at", -1)
    raw_links = await links.to_list(length=100)
    return list_urls(raw_links)
    



@url_router.post("/", response_model=CreateURLResponse)
@limiter.limit("5/minute")
async def create_url(request: Request,original_url: OriginalURL, current_user = Depends(get_optional_user)):
    
    target_url = str(original_url.original_url)
    user_id = str(current_user["_id"]) if current_user else None

    url = await url_collection.find_one({"original_url": target_url, "user_id": user_id})
    if url:
        return url
    else:
        new_url = {"short_url": await generate_short_code(), "original_url": target_url, 
                   "user_id": user_id, "clicks": 0, "created_at": datetime.now(timezone.utc), 
                   "last_click_at": None}
        await url_collection.insert_one(new_url)
        return new_url
    
@url_router.delete("/{short_url}")
async def delete_url(short_url: str, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    deleted = await url_collection.delete_one({"short_url": short_url, "user_id": user_id})
    if deleted.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL encurtada não encontrada"
        )
    return {"message": "Link excluído com sucesso"}

@url_router.patch("/{short_url}")
async def edit_url(short_url: str, body: UpdateURL, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    original_url = str(body.original_url)
    url = await url_collection.update_one({"short_url": short_url, "user_id": user_id}, {"$set": {"original_url": original_url}})
    if url.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL encurtada não encontrada"
        )
    return {"message": "Link atualizado com sucesso", "original_url": original_url}
    
@url_router.get("/{short_url}/dashboard")
async def get_url_data(short_url: str, current_user = Depends(get_optional_user)):
    url = await find_url_by_short_url(short_url)
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL encurtada não encontrada"
        )
    link_owner = url["user_id"]
    if link_owner:
        if not current_user or str(current_user["_id"]) != link_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: este link pertence a outro usuário."
            )
    return url_schema(url)

@url_router.get("/{short_url}", response_class=RedirectResponse)
async def redirect_to_original_url(short_url: str):
    url = await url_collection.find_one_and_update(
        {"short_url":short_url}, 
        {
        "$inc": {"clicks": 1},
        "$set": {"last_click_at": datetime.now(timezone.utc)}
    })
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL encurtada não encontrada"
        )
    return RedirectResponse(url=url["original_url"])



async def find_url_by_short_url(short_url: str):
    return await url_collection.find_one({"short_url": short_url})


async def generate_short_code(length: int = 6) -> str:
    while True:
        url = secrets.token_urlsafe(length)[:length]
        if url.lower() not in RESERVED_LINKS and not (await url_collection.find_one({"short_url": url})):
            return url
        

