from fastapi import FastAPI
from app.api.routes import router
from app.cache.static_cache import StaticCache

app = FastAPI(title="Ask-M Backend")

@app.on_event("startup")
def startup_event():
    cache = StaticCache()
    cache.load()
    app.state.static_cache = cache
    print("Backend ready (cache + routing)")

app.include_router(router)
