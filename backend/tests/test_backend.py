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
        assert "character" in d and "licenses" in d and "properties" in d and "vehicles" in d
        assert d["discord"]["username"] == "TestCitizen"
        # No mongo ObjectId leak
        assert "_id" not in d
