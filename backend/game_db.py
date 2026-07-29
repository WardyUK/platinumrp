"""
TMC / QBCore / ESX MySQL integration layer for the Player UCP.

This module reads a player's live character data straight from your FiveM
game database. It is fully OPTIONAL and driven by environment variables — if
the game DB is not configured (or a query fails) every function returns None
and the app gracefully falls back to the mock profile in server.py.

--------------------------------------------------------------------------
SETUP (to go live with real player data):
  1. Add these to backend/.env (leave blank to stay on mock data):
       GAME_DB_HOST=your.mysql.host
       GAME_DB_PORT=3306
       GAME_DB_USER=fivem
       GAME_DB_PASSWORD=********
       GAME_DB_NAME=your_server_db
  2. Make sure the MySQL host is reachable from this backend (whitelist IP).
  3. Adjust the SQL + column mapping in fetch_player_by_discord() to match
     your exact TMC schema. The query below targets the common QBCore-style
     `players` layout that most TMC forks are based on.

--------------------------------------------------------------------------
FRAMEWORK NOTES:
  * TMC / QBCore: single `players` row per character. JSON columns:
       charinfo  -> {firstname,lastname,...}
       money     -> {cash, bank, crypto}
       job       -> {label, grade,...}
       metadata  -> {licences:{driver,weapon,...}, ...}
    The Discord identifier is usually stored in the `players` row (a `discord`
    column) OR in a separate identifiers table. Adjust WHERE clause accordingly.
  * ESX: `users` table, `accounts` JSON, `licenses` table, `owned_vehicles`.
  * Vehicles live in `player_vehicles` (QBCore/TMC) or `owned_vehicles` (ESX).
  * Properties live in your housing resource's table (e.g. `player_houses`,
    `properties`) — swap the query to match the housing script you run.
"""
import os
import json
import logging

try:
    import aiomysql
except ImportError:  # pragma: no cover
    aiomysql = None

logger = logging.getLogger(__name__)

_pool = None


def is_configured() -> bool:
    return bool(
        aiomysql
        and os.environ.get("GAME_DB_HOST")
        and os.environ.get("GAME_DB_USER")
        and os.environ.get("GAME_DB_NAME")
    )


async def _get_pool():
    global _pool
    if _pool is None:
        _pool = await aiomysql.create_pool(
            host=os.environ["GAME_DB_HOST"],
            port=int(os.environ.get("GAME_DB_PORT", 3306)),
            user=os.environ["GAME_DB_USER"],
            password=os.environ.get("GAME_DB_PASSWORD", ""),
            db=os.environ["GAME_DB_NAME"],
            autocommit=True,
            minsize=1,
            maxsize=5,
        )
    return _pool


def _load_json(value, default):
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (ValueError, TypeError):
        return default


async def fetch_player_by_discord(discord_id: str):
    """Return a profile dict shaped like server._seed_fivem_profile, or None.

    `discord_id` is the raw Discord snowflake. Most TMC/QBCore setups store the
    Discord identifier as `discord:<id>` inside the identifiers, so we match on
    both the bare id and the prefixed form.
    """
    if not is_configured():
        return None
    try:
        pool = await _get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                # ---- Character row (TMC/QBCore `players` table) ----
                await cur.execute(
                    """
                    SELECT citizenid, charinfo, money, job, metadata
                    FROM players
                    WHERE discord = %s OR discord = %s
                    LIMIT 1
                    """,
                    (discord_id, f"discord:{discord_id}"),
                )
                row = await cur.fetchone()
                if not row:
                    return None

                charinfo = _load_json(row.get("charinfo"), {})
                money = _load_json(row.get("money"), {})
                job = _load_json(row.get("job"), {})
                metadata = _load_json(row.get("metadata"), {})
                licences = metadata.get("licences", metadata.get("licenses", {}))
                citizenid = row.get("citizenid")

                name = f"{charinfo.get('firstname', '')} {charinfo.get('lastname', '')}".strip() or "Citizen"

                # ---- Vehicles (`player_vehicles`) ----
                await cur.execute(
                    "SELECT vehicle, plate, garage, state FROM player_vehicles WHERE citizenid = %s",
                    (citizenid,),
                )
                veh_rows = await cur.fetchall()
                vehicles = [
                    {
                        "model": v.get("vehicle", "Unknown"),
                        "plate": (v.get("plate") or "").strip(),
                        "garage": v.get("garage") or "Unknown",
                        "stored": str(v.get("state")) in ("1", "True", "stored"),
                    }
                    for v in (veh_rows or [])
                ]

                # ---- Properties (adjust table to your housing script) ----
                properties = []
                try:
                    await cur.execute(
                        "SELECT label, price FROM player_houses WHERE citizenid = %s",
                        (citizenid,),
                    )
                    for p in (await cur.fetchall()) or []:
                        properties.append(
                            {"type": "Property", "location": p.get("label", "House"), "value": int(p.get("price") or 0)}
                        )
                except Exception:
                    pass  # housing table optional / script-specific

                character = {
                    "id": f"char_{citizenid}",
                    "citizen_id": citizenid,
                    "name": name.upper(),
                    "firstname": charinfo.get("firstname", ""),
                    "lastname": charinfo.get("lastname", ""),
                    "cash": int(money.get("cash", 0)),
                    "bank": int(money.get("bank", 0)),
                    "crypto": float(money.get("crypto", 0) or 0),
                    "job": {
                        "label": job.get("label", job.get("name", "Unemployed")),
                        "grade": str((job.get("grade") or {}).get("name", "") if isinstance(job.get("grade"), dict) else job.get("grade", "")),
                        "onduty": bool(job.get("onduty", False)),
                    },
                    "gang": metadata.get("gang", {}).get("label", "None")
                    if isinstance(metadata.get("gang"), dict)
                    else "None",
                    "phone": charinfo.get("phone", ""),
                    "playtime_hours": int(metadata.get("playtime", 0) or 0) // 60,
                    "status": {
                        "health": int(metadata.get("health", 100) or 100),
                        "armor": int(metadata.get("armor", 0) or 0),
                        "hunger": int(metadata.get("hunger", 100) or 100),
                        "thirst": int(metadata.get("thirst", 100) or 100),
                        "stress": int(metadata.get("stress", 0) or 0),
                    },
                    "skills": [],
                    "licenses": {
                        "drivers": bool(licences.get("driver", False)),
                        "weapons": bool(licences.get("weapon", False)),
                        "commercial": bool(licences.get("commercial", licences.get("business", False))),
                        "pilot": bool(licences.get("pilot", False)),
                    },
                    # ox_inventory / qb-inventory: parse the `inventory` JSON column here.
                    "inventory": _load_json(row.get("inventory"), []) if "inventory" in row else [],
                    "max_weight": 120.0,
                    "properties": properties,
                    "vehicles": vehicles,
                    "transactions": [],
                    "position": {"x": 0, "y": 0},
                    "primary": True,
                }
                return {
                    "discord_id": discord_id,
                    "characters": [character],
                    "active_character": 0,
                    "data_source": "live",
                }
    except Exception as e:
        logger.error(f"Game DB fetch failed, falling back to mock: {e}")
        return None
