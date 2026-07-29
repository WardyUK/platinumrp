"""Backend regression tests for Neon City RP FiveM hub."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fivem-hub-11.preview.emergentagent.com").rstrip("/")

VALID_JWT = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiI5OTkwMDAxMTEyMjIzMzM0NDQiLCJleHAiOjE3ODU5NDMwMjMsImlhdCI6MTc4NTMzODIyM30."
    "3RVXgHswNrTReYFQ13TldzQ6eBYaJw4UZAc3Z6miDEU"
)


# --------------------- /api/server/status ---------------------
class TestServerStatus:
    def test_status_returns_expected_shape(self):
        r = requests.get(f"{BASE_URL}/api/server/status", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["online", "hostname", "players", "max_players", "staff_online", "uptime", "server_ip", "source"]:
            assert k in d, f"missing {k}"
        assert isinstance(d["players"], int)
        assert isinstance(d["max_players"], int)
        assert d["source"] in ("live", "mock")
        # Since placeholder IP, should be mock
        assert d["server_ip"] == "123.45.67.89:30120"


# --------------------- /api/auth/discord/login ---------------------
class TestDiscordLogin:
    def test_login_returns_url(self):
        r = requests.get(f"{BASE_URL}/api/auth/discord/login", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "url" in d
        url = d["url"]
        assert url.startswith("https://discord.com/api/oauth2/authorize")
        assert "client_id=1532041468955590916" in url
        assert "redirect_uri=" in url
        assert "response_type=code" in url


# --------------------- /api/auth/me ---------------------
class TestAuthMe:
    def test_me_without_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_invalid_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer nonsense"}, timeout=10)
        assert r.status_code == 401

    def test_me_valid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {VALID_JWT}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["discord_id"] == "999000111222333444"
        assert d["discord"]["username"] == "TestCitizen"
        assert "_id" not in d
        # New multi-character schema
        assert "characters" in d and isinstance(d["characters"], list) and len(d["characters"]) == 2
        assert "active_character" in d
        for ch in d["characters"]:
            for k in ["cash", "bank", "crypto", "status", "inventory", "skills", "licenses",
                      "properties", "vehicles", "transactions"]:
                assert k in ch, f"character missing {k}"
            for vk in ["health", "armor", "hunger", "thirst", "stress"]:
                assert vk in ch["status"], f"status missing {vk}"
            assert isinstance(ch["inventory"], list) and len(ch["inventory"]) > 0
            assert isinstance(ch["transactions"], list) and len(ch["transactions"]) > 0


# --------------------- /api/server/players-live ---------------------
class TestPlayersLive:
    def test_players_live_shape(self):
        r = requests.get(f"{BASE_URL}/api/server/players-live", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "count" in d and "players" in d
        assert d["count"] == 8
        assert len(d["players"]) == 8
        for p in d["players"]:
            for k in ["id", "name", "type", "x", "y", "heading"]:
                assert k in p

    def test_players_live_moves(self):
        import time as _t
        r1 = requests.get(f"{BASE_URL}/api/server/players-live", timeout=10).json()
        _t.sleep(2.5)
        r2 = requests.get(f"{BASE_URL}/api/server/players-live", timeout=10).json()
        # At least one player's coords should differ
        moved = any(
            r1["players"][i]["x"] != r2["players"][i]["x"] or r1["players"][i]["y"] != r2["players"][i]["y"]
            for i in range(len(r1["players"]))
        )
        assert moved, "players did not move between polls"
