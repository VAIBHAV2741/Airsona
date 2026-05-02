from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import traceback

load_dotenv()

from app.routers.air_quality import router

app = FastAPI(
    title="Airsona Time Series API",
    description="ML-powered air quality time series analysis using Open-Meteo + WAQI",
    version="1.0.0",
    docs_url="/docs",
)

# CORS must be registered BEFORE any other middleware / exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return JSON 500 with CORS headers intact (Starlette propagates them)."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Airsona Time Series API"}
