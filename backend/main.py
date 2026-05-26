from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routers import runs
from config import Settings

app = FastAPI()
settings = Settings()

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)

# Register routers
app.include_router(runs.router)

@app.get("/")
async def root():
    return {"status": "Working"}

    