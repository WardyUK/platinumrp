from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import time
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
import jwt
import httpx
import game_db

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


# Base "patrol routes" for the live map. Each player orbits a home point so the
# blips visibly move on every poll. In production, feed real positions from your
# server (e.g. an OneSync export writing player coords to Redis/Mongo).
_LIVE_PLAYERS = [
    {"id": 1, "name": "Vinnie Calabria", "type": "civ", "home": (215, -810), "r": 260, "spd": 0.7},
    {"id": 2, "name": "Officer Dane", "type": "police", "home": (428, -984), "r": 180, "spd": 1.1},
    {"id": 3, "name": "Dr. Alvarez", "type": "ems", "home": (307, -1433), "r": 120, "spd": 0.9},
    {"id": 4, "name": "Rico Vagos", "type": "civ", "home": (1200, -1600), "r": 340, "spd": 0.8},
    {"id": 5, "name": "Mika Drift", "type": "civ", "home": (-330, -140), "r": 300, "spd": 1.4},
    {"id": 6, "name": "Sgt. Boone", "type": "police", "home": (-450, 6015), "r": 220, "spd": 1.0},
    {"id": 7, "name": "Lena Frost", "type": "civ", "home": (-1180, -1500), "r": 280, "spd": 0.6},
    {"id": 8, "name": "Tow Joe", "type": "civ", "home": (900, -2100), "r": 200, "spd": 1.2},
]


@api_router.get("/server/players-live")
async def players_live():
    """Live (mock) player positions in GTA game coordinates for the web map."""
    t = time.time()
    out = []
    for p in _LIVE_PLAYERS:
        ang = (t * 0.15 * p["spd"] + p["id"]) % (2 * math.pi)
        x = p["home"][0] + math.cos(ang) * p["r"]
        y = p["home"][1] + math.sin(ang) * p["r"]
        out.append({
            "id": p["id"],
            "name": p["name"],
            "type": p["type"],
            "x": round(x, 1),
            "y": round(y, 1),
            "heading": round((math.degrees(ang) + 90) % 360, 1),
        })
    return {"count": len(out), "players": out}


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
    # Migrate legacy single-character docs to the new multi-character schema.
    if "characters" not in user:
        username = (user.get("discord") or {}).get("username", "Citizen")
        seeded = _seed_fivem_profile(payload["sub"], username)
        seeded["discord"] = user.get("discord")
        await db.players.update_one({"discord_id": payload["sub"]}, {"$set": seeded})
        seeded.pop("_id", None)
        user = {**user, **seeded}
    return user


def _make_character(discord_id: str, first: str, last: str, primary: bool) -> dict:
    """Build one rich mock character (QBCore/TMC/ESX shaped)."""
    plates = ["NEON4LYF", "GH0ST22", "APEX09", "V1CE", "PLATNM", "DR1FT"]
    random.shuffle(plates)
    jobs = [
        {"label": "Police Officer", "grade": "Sergeant", "onduty": True},
        {"label": "EMS Paramedic", "grade": "Senior", "onduty": False},
        {"label": "Mechanic", "grade": "Owner", "onduty": True},
        {"label": "Unemployed", "grade": "Freelancer", "onduty": False},
    ]
    inventory_pool = [
        {"name": "phone", "label": "Phone", "type": "item", "weight": 0.19, "rarity": "common"},
        {"name": "water_bottle", "label": "Water", "type": "item", "weight": 0.5, "rarity": "common"},
        {"name": "sandwich", "label": "Sandwich", "type": "item", "weight": 0.4, "rarity": "common"},
        {"name": "bandage", "label": "Bandage", "type": "item", "weight": 0.1, "rarity": "common"},
        {"name": "lockpick", "label": "Lockpick", "type": "tool", "weight": 0.2, "rarity": "uncommon"},
        {"name": "radio", "label": "Radio", "type": "tool", "weight": 0.6, "rarity": "uncommon"},
        {"name": "weapon_pistol", "label": "Pistol", "type": "weapon", "weight": 1.2, "rarity": "rare"},
        {"name": "ammo_9", "label": "9mm Ammo", "type": "ammo", "weight": 0.03, "rarity": "common"},
        {"name": "gold_chain", "label": "Gold Chain", "type": "valuable", "weight": 0.25, "rarity": "epic"},
        {"name": "id_card", "label": "ID Card", "type": "item", "weight": 0.0, "rarity": "common"},
        {"name": "repair_kit", "label": "Repair Kit", "type": "tool", "weight": 2.0, "rarity": "uncommon"},
        {"name": "lockpick_adv", "label": "Adv. Lockpick", "type": "tool", "weight": 0.3, "rarity": "rare"},
    ]
    inv = []
    for it in random.sample(inventory_pool, random.randint(7, 10)):
        amount = 1 if it["type"] in ("weapon", "tool", "valuable") else random.randint(1, 12)
        if it["name"] == "ammo_9":
            amount = random.randint(30, 250)
        inv.append({**it, "amount": amount})

    skills = [
        {"name": "Driving", "level": random.randint(40, 100)},
        {"name": "Shooting", "level": random.randint(20, 95)},
        {"name": "Stamina", "level": random.randint(30, 100)},
        {"name": "Strength", "level": random.randint(25, 90)},
        {"name": "Lung Capacity", "level": random.randint(10, 80)},
    ]
    tx_types = ["deposit", "withdraw", "transfer", "paycheck"]
    transactions = [
        {
            "type": random.choice(tx_types),
            "label": random.choice(["ATM Legion", "Paycheck", "Sent to Vinnie", "Vehicle Sale", "Rent", "Bank Transfer"]),
            "amount": random.randint(50, 25000),
            "date": (datetime.now(timezone.utc) - timedelta(hours=i * 7)).isoformat(),
        }
        for i in range(6)
    ]

    return {
        "id": f"char_{first.lower()}",
        "citizen_id": "TMC" + str(random.randint(10000, 99999)),
        "name": f"{first} {last}",
        "firstname": first,
        "lastname": last,
        "cash": random.randint(1200, 8500),
        "bank": random.randint(45000, 420000),
        "crypto": round(random.uniform(0.1, 4.5), 3),
        "job": random.choice(jobs),
        "gang": random.choice(["Vagos", "Ballas", "The Company", "None"]),
        "phone": f"555-0{random.randint(100,199)}",
        "playtime_hours": random.randint(80, 900),
        "level": random.randint(5, 60),
        "xp": random.randint(0, 100),
        "primary": primary,
        "status": {
            "health": random.randint(60, 100),
            "armor": random.randint(0, 100),
            "hunger": random.randint(35, 100),
            "thirst": random.randint(35, 100),
            "stress": random.randint(0, 60),
        },
        "skills": skills,
        "licenses": {
            "drivers": True,
            "weapons": random.choice([True, False]),
            "commercial": random.choice([True, False]),
            "pilot": random.choice([True, False]),
        },
        "inventory": inv,
        "max_weight": 120.0,
        "properties": [
            {"type": "Apartment", "location": "Integrity Way, Apt 4B", "value": 85000},
            {"type": "Warehouse", "location": "La Mesa Docks Unit 12", "value": 250000},
        ],
        "vehicles": [
            {"model": "Karin Sultan RS", "plate": plates[0], "garage": "Legion Square", "stored": True, "class": "Sports"},
            {"model": "Pfister Comet SR", "plate": plates[1], "garage": "Impound", "stored": False, "class": "Super"},
            {"model": "Bravado Banshee", "plate": plates[2], "garage": "Mirror Park", "stored": True, "class": "Sports"},
        ],
        "transactions": transactions,
        "position": {"x": random.randint(-1500, 1500), "y": random.randint(-2000, 2000)},
    }


def _seed_fivem_profile(discord_id: str, username: str) -> dict:
    """Mock TMC / QBCore / ESX-style multi-character data for a freshly linked account.

    In production this data comes from your MySQL game DB. Query examples per framework:
      TMC    -> SELECT * FROM users WHERE identifier = ? (accounts/job/licenses stored on the
                TMC user row + related character tables; adjust column names to your TMC build)
      QBCore -> SELECT * FROM players WHERE license = ? (charinfo/money/metadata JSON columns)
      ESX    -> SELECT * FROM users WHERE identifier = ? (accounts/job/... columns)
      Vehicles -> SELECT * FROM player_vehicles WHERE citizenid/owner/identifier = ?
      Inventory -> ox_inventory / qb-inventory table or the `inventory` JSON column.
    """
    base = username.split("#")[0][:10].capitalize() or "Citizen"
    return {
        "discord_id": discord_id,
        "characters": [
            _make_character(discord_id, base, "Mercer", True),
            _make_character(discord_id, "Alex", "Kovic", False),
        ],
        "active_character": 0,
        "data_source": "mock",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@api_router.post("/auth/demo-login")
async def demo_login():
    """Instant demo login — mints a session for a demo citizen without Discord.
    Lets you explore the control panel immediately. Remove/disable in production."""
    discord_id = "demo_guest"
    existing = await db.players.find_one({"discord_id": discord_id})
    if not existing:
        doc = _seed_fivem_profile(discord_id, "Demo")
        doc["discord"] = {"username": "Demo Citizen", "avatar": None, "email": None}
        doc["data_source"] = "demo"
        await db.players.insert_one(doc)
    token = _create_jwt(discord_id)
    return {"token": token}


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

    discord_meta = {"username": username, "avatar": avatar, "email": profile.get("email")}

    # Prefer live data from the TMC/QBCore/ESX game DB; fall back to mock seed.
    live = await game_db.fetch_player_by_discord(discord_id)
    existing = await db.players.find_one({"discord_id": discord_id})
    if live:
        live["discord"] = discord_meta
        await db.players.update_one({"discord_id": discord_id}, {"$set": live}, upsert=True)
    elif not existing:
        doc = _seed_fivem_profile(discord_id, profile.get("username", "citizen"))
        doc["discord"] = discord_meta
        doc["data_source"] = "mock"
        await db.players.insert_one(doc)
    else:
        await db.players.update_one({"discord_id": discord_id}, {"$set": {"discord": discord_meta}})

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
