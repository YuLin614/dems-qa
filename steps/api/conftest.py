# steps/api/conftest.py
import os
import httpx
import pytest
from dotenv import load_dotenv
from pytest_bdd import given, then, parsers

load_dotenv()

KEYCLOAK_URL = os.environ["KEYCLOAK_URL"]
REALM        = os.environ["KEYCLOAK_REALM"]
CLIENT_ID    = os.environ["KEYCLOAK_CLIENT_ID"]
BACKEND_URL  = os.environ["BACKEND_URL"]


def fetch_token(username: str, password: str) -> str:
    resp = httpx.post(
        f"{KEYCLOAK_URL}/oidc/realms/{REALM}/protocol/openid-connect/token",
        data={"client_id": CLIENT_ID, "grant_type": "password",
              "username": username, "password": password},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def api_client(token: str) -> httpx.Client:
    return httpx.Client(
        base_url=BACKEND_URL,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )


@pytest.fixture(scope="session")
def officer_token() -> str:
    return fetch_token(os.environ["TEST_OFFICER_USERNAME"], os.environ["TEST_OFFICER_PASSWORD"])

@pytest.fixture(scope="session")
def officer2_token() -> str:
    return fetch_token(os.environ["TEST_OFFICER2_USERNAME"], os.environ["TEST_OFFICER2_PASSWORD"])

@pytest.fixture(scope="session")
def sergeant_token() -> str:
    return fetch_token(os.environ["TEST_SUPERVISOR_USERNAME"], os.environ["TEST_SUPERVISOR_PASSWORD"])

@pytest.fixture(scope="session")
def admin_token() -> str:
    return fetch_token(os.environ["TEST_ADMIN_USERNAME"], os.environ["TEST_ADMIN_PASSWORD"])

@pytest.fixture(scope="session")
def iauser_token() -> str:
    return fetch_token(os.environ["TEST_IA_USERNAME"], os.environ["TEST_IA_PASSWORD"])

@pytest.fixture(scope="session")
def sysops_token() -> str:
    return fetch_token(os.environ["TEST_SYSOPS_USERNAME"], os.environ["TEST_SYSOPS_PASSWORD"])


# Shared mutable state for each scenario — reset per test automatically (function scope)
@pytest.fixture
def context() -> dict:
    return {}


# Shared Given step — available to all step files in steps/api/
@given(parsers.parse('I am logged in as "{role}"'))
def i_am_logged_in_as(context, officer_token, officer2_token, sergeant_token,
                       admin_token, iauser_token, sysops_token, role):
    token_map = {
        "officer1":  officer_token,
        "officer2":  officer2_token,
        "sergeant1": sergeant_token,
        "admin":     admin_token,
        "iauser":    iauser_token,
        "sysops1":   sysops_token,
    }
    token = token_map.get(role)
    if token is None:
        raise ValueError(f"Unknown role: {role!r}. Valid roles: {list(token_map)}")
    context["token"] = token
    context["client"] = api_client(token)


# Pre-flight shared Then step — used by upload, audit, and admin scenarios
@then('I should receive a 403 error')
def receive_403(context):
    assert context["last_response"].status_code == 403, \
        f"Expected 403, got {context['last_response'].status_code}: {context['last_response'].text}"
