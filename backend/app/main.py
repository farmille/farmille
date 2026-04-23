from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    crops,
    health,
    onboarding,
    product_types,
    products,
    reviews,
)

app = FastAPI(
    title="Farmille API",
    version="0.1.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
app.include_router(onboarding.router, prefix="/v1/onboarding", tags=["onboarding"])
app.include_router(crops.router, prefix="/v1/crops", tags=["crops"])
app.include_router(product_types.router, prefix="/v1/product-types", tags=["product-types"])
app.include_router(products.router, prefix="/v1/products", tags=["products"])
app.include_router(reviews.router, prefix="/v1/reviews", tags=["reviews"])
