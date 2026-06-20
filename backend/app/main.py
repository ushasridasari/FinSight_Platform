from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api import auth, market, portfolio

app = FastAPI(
    title=settings.app_name,
    description="AI-powered financial analytics platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(auth.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "FinForesight API", "docs": "/docs", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}
