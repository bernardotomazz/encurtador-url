from models.url import URL

def url_schema(url: dict) -> dict:
    return {
        "id": str(url["_id"]),
        "original_url": url["original_url"],
        "short_url": url["short_url"],
        "clicks": url["clicks"],
        "user_id": url.get("user_id"),
        "created_at": url.get("created_at"),
        "last_click_at": url.get("last_click_at")
    }

def list_urls(urls) -> list:
    return [url_schema(url) for url in urls]