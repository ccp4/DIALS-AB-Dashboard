from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routers import runs
from config import Settings
from models import MetricDefinition
from runs.metrics import METRICS

app = FastAPI()
settings = Settings()

from time import perf_counter

@app.middleware("http")
async def timing_middleware(request, call_next):
    start = perf_counter()

    response = await call_next(request)

    elapsed = perf_counter() - start
    print(f"[BACKEND] {request.url.path} TOTAL: {elapsed:.3f}s")

    return response

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

@app.get("/ping")
async def ping():
    return {"ok": True}

@app.get("/metrics", response_model=list[MetricDefinition])
async def get_metrics():
    """
    The metric registry, standalone — the same list every `/cohort` response
    embeds, for callers that need it before any run is picked.
    """
    return METRICS

    