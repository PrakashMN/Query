from contextlib import asynccontextmanager

from fastapi import FastAPI
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

from fastapi import Request

@app.middleware("http")
async def force_cors_middleware(request: Request, call_next):
    # If it's a preflight OPTIONS request, we handle it immediately
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        response = Response()
    else:
        response = await call_next(request)
        
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

# Standard middleware as backup
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
