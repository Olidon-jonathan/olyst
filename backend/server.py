from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import hashlib
import secrets
import base64
from werkzeug.security import generate_password_hash, check_password_hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# --- MODELS ---
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    password_hash: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # ebooks, templates, audio, videos, ai_packs
    image_base64: Optional[str] = None
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_base64: Optional[str] = None
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

class AuthSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    products: List[dict]  # [{product_id, name, price}]
    total_amount: float
    status: str = "pending"  # pending, completed, failed
    payment_method: str = "fedapay"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- HELPER FUNCTIONS ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    session = await db.auth_sessions.find_one({"token": token})
    
    if not session or session["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    user = await db.users.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    return user

async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès administrateur requis")
    return user

# --- AUTH ROUTES ---
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    password_hash = generate_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=password_hash,
        is_admin=False  # First user can be made admin manually in DB
    )
    
    await db.users.insert_one(user.dict())
    
    # Create session
    token = secrets.token_urlsafe(32)
    session = AuthSession(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    await db.auth_sessions.insert_one(session.dict())
    
    return {
        "token": token,
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_admin=user.is_admin
        )
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not check_password_hash(user["password_hash"], login_data.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Create session
    token = secrets.token_urlsafe(32)
    session = AuthSession(
        user_id=user["id"],
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    await db.auth_sessions.insert_one(session.dict())
    
    return {
        "token": token,
        "user": UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            is_admin=user["is_admin"]
        )
    }

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    # Delete all sessions for user
    await db.auth_sessions.delete_many({"user_id": user["id"]})
    return {"message": "Déconnexion réussie"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        is_admin=user["is_admin"]
    )

# --- PRODUCT ROUTES ---
@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(1000)
    
    if search:
        products = [p for p in products if search.lower() in p["name"].lower() or search.lower() in p["description"].lower()]
    
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return product

@api_router.post("/products")
async def create_product(product_data: ProductCreate, user: dict = Depends(get_admin_user)):
    product = Product(**product_data.dict(), created_by=user["id"])
    await db.products.insert_one(product.dict())
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, user: dict = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return {"message": "Produit mis à jour"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return {"message": "Produit supprimé"}

@api_router.get("/admin/products")
async def get_admin_products(user: dict = Depends(get_admin_user)):
    products = await db.products.find().to_list(1000)
    return products

# --- ORDER ROUTES ---
@api_router.post("/orders")
async def create_order(order_data: dict):
    order = Order(**order_data)
    await db.orders.insert_one(order.dict())
    return order

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    return order

# --- CATEGORIES ROUTE ---
@api_router.get("/categories")
async def get_categories():
    return [
        {"id": "ebooks", "name": "E-books", "description": "Livres numériques"},
        {"id": "templates", "name": "Templates", "description": "Modèles et templates"},
        {"id": "audio", "name": "Audio", "description": "Fichiers audio"},
        {"id": "videos", "name": "Vidéos", "description": "Contenus vidéo"},
        {"id": "ai_packs", "name": "Packs IA", "description": "Outils et ressources IA"}
    ]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()