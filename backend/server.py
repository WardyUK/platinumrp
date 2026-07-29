from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------------------------------------------------------------------------
# MongoDB connection
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', '')
DISCORD_REDIRECT_URI = os.environ.get('DISCORD_REDIRECT_URI', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
FIVEM_SERVER_IP = os.environ.get('FIVEM_SERVER_IP', 'YOUR_SERVER_IP:PORT')
FIVEM_ENDPOINT = os.environ.get('FIVEM_ENDPOINT', 'http://YOUR_SERVER_IP:PORT')

DISCORD_API = "https://discord.com/api"
JWT_ALGO = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ===========================================================================
# MODELS
# ===========================================================================
class ServerStatus(BaseModel):
    online: bool
    hostname: str
    players: int
    max_players: int
    staff_online: int
    uptime: str
    server_ip: str
    source: str  # "live" or "mock"


# ===========================================================================
# SERVER STATUS
# ---------------------------------------------------------------------------
# This endpoint attempts to read the FiveM server's own JSON endpoints:
#   {FIVEM_ENDPOINT}/players.json  -> array of connected players
#   {FIVEM_ENDPOINT}/info.json     -> server vars (hostname, max clients ...)
# We proxy the request from the backend (server-side) so the browser never
# hits CORS restrictions. If the server is unreachable we fall back to mock
# data so the site always renders premium status cards.
# ===========================================================================
def _mock_status() -> dict:
    players = random.randint(38, 118)
    return {
        "online": True,
        "hostname": "PLATINUM ROLEPLAY | Serious Economy | TMC",
        "players": players,
        "max_players": 128,
        "staff_online": random.randint(2, 7),
        "uptime": "6d 14h 22m",
        "server_ip": FIVEM_SERVER_IP,
        "source": "mock",
    }


@api_router.get("/server/status", response_model=ServerStatus)
async def server_status():
    try:
        async with httpx.AsyncClient(timeout=3.0) as http:
            info_res = await http.get(f"{FIVEM_ENDPOINT}/info.json")
            players_res = await http.get(f"{FIVEM_ENDPOINT}/players.json")
            info = info_res.json()
            players = players_res.json()
            vars_ = info.get("vars", {})
            staff = sum(1 for p in players if p.get("identifiers"))  # placeholder logic
            return ServerStatus(
                online=True,
                hostname=vars_.get("sv_projectName", vars_.get("sv_hostname", "FiveM Server")),
                players=len(players),
                max_players=int(vars_.get("sv_maxClients", 128)),
                staff_online=min(staff, 8),
                uptime="live",
                server_ip=FIVEM_SERVER_IP,
                source="live",
            )
    except Exception as e:
        logging.info(f"FiveM endpoint unreachable, serving mock status: {e}")
        return ServerStatus(**_mock_status())


# ===========================================================================
# DISCORD OAUTH2
# ---------------------------------------------------------------------------
# Standard authorization-code flow, handled server-side for security:
#   1. Frontend hits /auth/discord/login  -> we return the Discord consent URL
#   2. Discord redirects back to /auth/discord/callback?code=...
#   3. We exchange the code for an access token (client secret stays on server)
#   4. We fetch the Discord profile, upsert a player record, mint a JWT
#   5. We redirect back to the SPA with the JWT in the URL for it to store
# ===========================================================================
def _discord_configured() -> bool:
    return bool(DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET and DISCORD_REDIRECT_URI)


def _create_jwt(discord_id: str) -> str:
    payload = {
        "sub": discord_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.players.find_one({"discord_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Player not found")
    return user


def _seed_fivem_profile(discord_id: str, username: str) -> dict:
    """Mock TMC / QBCore / ESX-style character data for a freshly linked account.

    In production this data comes from your MySQL game DB. Query examples per framework:
      TMC    -> SELECT * FROM users WHERE identifier = ? (accounts/job/licenses stored on the
                TMC user row + related character tables; adjust column names to your TMC build)
      QBCore -> SELECT * FROM players WHERE license = ? (charinfo/money/... JSON columns)
      ESX    -> SELECT * FROM users WHERE identifier = ? (accounts/job/... columns)
      Vehicles -> SELECT * FROM player_vehicles WHERE citizenid/owner/identifier = ?
    """
    plates = ["NEON4LYF", "GHOST22", "APEX 09", "V1CE C1TY", "LSPD K9"]
    return {
        "discord_id": discord_id,
        "character": {
            "name": username.upper() + " MERCER",
            "citizen_id": "TMC" + str(random.randint(10000, 99999)),
            "cash": random.randint(1200, 8500),
            "bank": random.randint(45000, 320000),
            "job": random.choice(["Police Officer", "EMS", "Mechanic", "Unemployed"]),
            "gang": random.choice(["Vagos", "Ballas", "None", "The Company"]),
        },
        "licenses": {
            "drivers": True,
            "weapons": random.choice([True, False]),
            "commercial": random.choice([True, False]),
            "pilot": random.choice([True, False]),
        },
        "properties": [
            {"type": "Apartment", "location": "Integrity Way, Apt 4B", "value": 85000},
            {"type": "Warehouse", "location": "La Mesa Docks Unit 12", "value": 250000},
        ],
        "vehicles": [
            {"model": "Karin Sultan RS", "plate": plates[0], "garage": "Legion Square", "stored": True},
            {"model": "Pfister Comet SR", "plate": plates[1], "garage": "Impound", "stored": False},
            {"model": "Bravado Banshee", "plate": plates[2], "garage": "Mirror Park", "stored": True},
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@api_router.get("/auth/discord/login")
async def discord_login():
    if not _discord_configured():
        raise HTTPException(status_code=503, detail="Discord OAuth not configured")
    params = {
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify email",
    }
    return {"url": f"{DISCORD_API}/oauth2/authorize?{urlencode(params)}"}


@api_router.get("/auth/discord/callback")
async def discord_callback(code: Optional[str] = None, error: Optional[str] = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/?auth=error")
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            token_res = await http.post(
                f"{DISCORD_API}/oauth2/token",
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_res.raise_for_status()
            access_token = token_res.json()["access_token"]

            user_res = await http.get(
                f"{DISCORD_API}/users/@me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_res.raise_for_status()
            profile = user_res.json()
    except Exception as e:
        logging.error(f"Discord OAuth exchange failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/?auth=error")

    discord_id = profile["id"]
    username = profile.get("global_name") or profile.get("username", "Citizen")
    avatar = None
    if profile.get("avatar"):
        avatar = f"https://cdn.discordapp.com/avatars/{discord_id}/{profile['avatar']}.png"

    existing = await db.players.find_one({"discord_id": discord_id})
    if not existing:
        doc = _seed_fivem_profile(discord_id, profile.get("username", "citizen"))
        doc["discord"] = {"username": username, "avatar": avatar, "email": profile.get("email")}
        await db.players.insert_one(doc)
    else:
        await db.players.update_one(
            {"discord_id": discord_id},
            {"$set": {"discord": {"username": username, "avatar": avatar, "email": profile.get("email")}}},
        )

    token = _create_jwt(discord_id)
    return RedirectResponse(f"{FRONTEND_URL}/?token={token}")


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


# ===========================================================================
# ROOT
# ===========================================================================
@api_router.get("/")
async def root():
    return {"message": "Platinum Roleplay API", "discord_configured": _discord_configured()}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
