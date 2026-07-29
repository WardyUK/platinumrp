# Neon City RP — FiveM Server Website

## Original Problem Statement
Premium, responsive FiveM server website with 5 modules: Live Server Status & Stats, Interactive Leaflet Map, Player UCP with Discord Auth, Donation/Store Hub, Server Rules & Lore Hub. Dark neon glassmorphism aesthetic.

## Stack & Architecture
- Frontend: React (CRA/craco), Tailwind, framer-motion, react-leaflet, sonner, lucide-react.
- Backend: FastAPI, MongoDB (motor), httpx, PyJWT. All routes under /api.
- Auth: Real Discord OAuth2 (authorization-code flow, server-side token exchange → JWT stored in localStorage `ncrp_token`).

## User Choices
- React/FastAPI stack. Real Discord OAuth2. Store = pricing cards + Tebex guide (no live checkout). Placeholder server IP. Support both QBCore & ESX (schema comments in server.py).

## Implemented (2026-06-27)
- Module 1: `/api/server/status` proxies FiveM info.json/players.json with mock fallback; Hero with Connect (fivem://) + Copy IP (toast) + live stats (auto-refresh 30s).
- Module 2: Leaflet dark map (CartoDB) with neon CircleMarker blips (police/safe/business) + filters + legend.
- Module 3: Player UCP — real Discord OAuth2 login; logged-in dashboard cards (Character, Licenses, Property, Garage/Vehicles) from mock-seeded per-user data in Mongo `players`.
- Module 4: Store hub — 3 tiers (Bronze VIP, Import Car Slot, Gang Whitelist) with featured card + Tebex checkout demo (toast).
- Module 5: Rules & Lore — sticky sidebar tabs + rules accordion + lore timeline.
- Fully tested: 100% backend (5/5) + all frontend flows (test_reports/iteration_1.json).

## Backlog / Remaining
- P1: Replace mock UCP data with live MySQL queries against QBCore/ESX tables (players, player_vehicles, users).
- P1: Set real FIVEM_SERVER_IP / FIVEM_ENDPOINT for live status.
- P2: Wire real Tebex store links; custom GTA-V tile set via L.CRS.Simple.
- P2: Rotate committed Discord secret before production; enforce JWT_SECRET presence.

## Next Tasks
- Connect real game DB and server IP when available.

## Advanced Dashboard + Map Upgrades (2026-06-27, iteration 3)
- Advanced Player UCP: multi-character switcher, vitals (health/armor/hunger/thirst/stress bars), cash/bank/crypto/net-worth, tabbed Overview/Inventory/Bank/Assets (inventory grid w/ weight + rarity, skills, licenses, bank transactions, properties, vehicles). `/api/auth/me` new multi-character schema; legacy docs auto-migrate.
- Map: switched to self-hosted GTA V tiles (`/public/tiles/{atlas,satellite,road}` z3-5), Leaflet CRS.Simple, precise game-coordinate blip placement (`gameToLatLng` calibration), custom neon icon blips, live moving player blips via `/api/server/players-live` (polled 3s), style toggle + live toggle.
- Verified 100% (backend 7/7, all frontend flows) — test_reports/iteration_3.json.
