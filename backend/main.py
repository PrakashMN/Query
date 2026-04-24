from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import close_mongo_connection, connect_to_mongo
from routers.properties import router as properties_router


# Ensure upload directory exists before mounting StaticFiles
settings.upload_dir.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

@app.middleware("http")
async def force_https_middleware(request: Request, call_next):
    # Force the scheme to https so redirects use https://
    request.scope["scheme"] = "https"
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(properties_router)


@app.get("/health")
async def healthcheck():
    return {"status": "ok"}
