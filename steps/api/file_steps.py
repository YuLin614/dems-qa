# steps/api/file_steps.py
import os
import httpx
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import api_client


@when(parsers.parse('I try to upload the file "{filename}"'))
def try_upload_file(context, filename):
    file_path = os.path.join(
        os.path.dirname(__file__), '../../fixtures/test-files', filename
    )
    # VERIFY: check actual endpoint in record-service/app/
    with open(file_path, 'rb') as f:
        resp = context['client'].post(
            f"/records/{context['record_id']}/files",
            files={'file': (filename, f)},
        )
    context['last_response'] = resp


@then('I should see an error about unsupported file type')
def error_unsupported_type(context):
    resp = context['last_response']
    assert resp.status_code in (400, 422), \
        f"Expected 400/422, got {resp.status_code}: {resp.text}"
    body = resp.text.lower()
    assert 'file type' in body or 'extension' in body or 'unsupported' in body, \
        f"Expected file type error message in: {resp.text}"


@when("I try to upload a file to officer1's record")
def try_upload_cross_user(context, officer_token):
    # Create a record as officer1 (owner), then attempt upload as the current user (officer2)
    officer1_client = api_client(officer_token)
    # VERIFY: check actual endpoint in record-service/app/
    r = officer1_client.post('/records', json={'title': '[E2E] Cross-Upload Target'})
    assert r.status_code == 201, f"Setup failed creating officer1 record: {r.text}"
    officer1_record_id = r.json()['id']

    file_path = os.path.join(
        os.path.dirname(__file__), '../../fixtures/test-files/sample.pdf'
    )
    # VERIFY: check actual endpoint in record-service/app/
    with open(file_path, 'rb') as f:
        resp = context['client'].post(
            f"/records/{officer1_record_id}/files",
            files={'file': ('sample.pdf', f)},
        )
    context['last_response'] = resp

# NOTE: @then('I should receive a 403 error') is defined in conftest.py
# and is available to all test files automatically — do NOT redefine it here.


# ---------------------------------------------------------------------------
# External share scenarios
# ---------------------------------------------------------------------------
scenarios('../../features/sharing/external-share.feature')


@given('I have a record with an uploaded file')
def have_record_with_file(context, officer_token):
    # Creates an [E2E] record as officer1 and uploads sample.pdf.
    # Uses officer_token regardless of current context role — this is setup state.
    setup_client = api_client(officer_token)
    # VERIFY: confirm POST /records is the correct creation endpoint
    r = setup_client.post('/records', json={'title': '[E2E] Share Test Record'})
    assert r.status_code == 201, f"Setup failed: {r.text}"
    context['record_id'] = r.json()['id']

    file_path = os.path.join(os.path.dirname(__file__), '../../fixtures/test-files/sample.pdf')
    with open(file_path, 'rb') as f:
        # VERIFY: confirm POST /records/{id}/files is the correct upload endpoint
        r2 = setup_client.post(
            f"/records/{context['record_id']}/files",
            files={'file': ('sample.pdf', f)},
        )
    assert r2.status_code == 201, f"Upload failed: {r2.text}"
    context['file_id'] = r2.json()['id']


@when('I create an external share link for the file')
def create_share_link(context):
    # VERIFY: confirm POST /records/{id}/files/{file_id}/shares → 201 {"token": "...", "url": "..."}
    resp = context['client'].post(
        f"/records/{context['record_id']}/files/{context['file_id']}/shares",
        json={},
    )
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    # VERIFY: confirm response field name is 'token' (update if different)
    context['share_token'] = resp.json()['token']
    context['share_url'] = resp.json().get('url') or \
        f"{os.environ['FRONTEND_URL']}/share/{context['share_token']}"


@then('the share link should be accessible without login')
def share_accessible_without_login(context):
    # Access the share URL without an auth token — expect 200, not a redirect to Keycloak
    # VERIFY: GET /shares/{token}/download → 200 (confirm endpoint path)
    resp = httpx.get(context['share_url'], follow_redirects=True)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert 'auth.dems' not in str(resp.url), f"Redirected to auth: {resp.url}"


@then('the recipient can download the file with a download reason')
def download_with_reason(context):
    # VERIFY: POST /shares/{token}/download with reason body → 200
    resp = httpx.post(
        f"{os.environ['BACKEND_URL']}/shares/{context['share_token']}/download",
        json={'reason': 'E2E test download'},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


@given('an external share link has expired')
def create_expired_share(context, officer_token):
    # Create a record + file as officer1, then create a share with expires_at in the past.
    setup_client = api_client(officer_token)
    context['token'] = officer_token
    context['client'] = setup_client

    # VERIFY: confirm POST /records creation endpoint
    r = setup_client.post('/records', json={'title': '[E2E] Expiry Test'})
    assert r.status_code == 201, f"Setup failed: {r.text}"
    context['record_id'] = r.json()['id']

    file_path = os.path.join(os.path.dirname(__file__), '../../fixtures/test-files/sample.pdf')
    with open(file_path, 'rb') as f:
        r2 = setup_client.post(
            f"/records/{context['record_id']}/files",
            files={'file': ('sample.pdf', f)},
        )
    assert r2.status_code == 201, f"Upload failed: {r2.text}"
    context['file_id'] = r2.json()['id']

    # VERIFY: confirm API accepts 'expires_at' field on share creation with a past date
    # If the API rejects past dates, use a sysops/admin endpoint to force-expire the share instead
    resp = setup_client.post(
        f"/records/{context['record_id']}/files/{context['file_id']}/shares",
        json={'expires_at': '2020-01-01T00:00:00Z'},
    )
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    # VERIFY: confirm response field name is 'token' (update if different)
    context['share_token'] = resp.json()['token']
    context['share_url'] = resp.json().get('url') or \
        f"{os.environ['FRONTEND_URL']}/share/{context['share_token']}"


@when('I visit the share link')
def visit_share_link(context):
    resp = httpx.get(context['share_url'], follow_redirects=False)
    context['last_response'] = resp


@then('I should see an "expired" message')
def see_expired_message(context):
    resp = context['last_response']
    # VERIFY: confirm whether the API returns 410 Gone or 200 with "expired" in body
    assert resp.status_code in (200, 410), f"Unexpected status: {resp.status_code}"
    body = resp.text.lower()
    assert 'expired' in body or 'expir' in body, \
        f"Expected 'expired' in response body: {resp.text[:200]}"


@when(parsers.parse('I switch to user "{role}"'))
def switch_user(context, officer_token, officer2_token, sergeant_token,
                admin_token, iauser_token, sysops_token, role):
    # Stub — re-sets context['client'] for the named role.
    # Used by file-lock scenarios (Task 8); token fixtures injected via pytest-bdd.
    token_map = {
        'officer1':  officer_token,
        'officer2':  officer2_token,
        'sergeant1': sergeant_token,
        'admin':     admin_token,
        'iauser':    iauser_token,
        'sysops1':   sysops_token,
    }
    token = token_map.get(role)
    if token is None:
        raise ValueError(f"Unknown role: {role!r}. Valid roles: {list(token_map)}")
    context['token'] = token
    context['client'] = api_client(token)


# ---------------------------------------------------------------------------
# File-lock scenarios
# ---------------------------------------------------------------------------
scenarios('../../features/evidence/file-lock.feature')


@when(parsers.parse('I set the file lock to "{lock_level}"'))
def set_file_lock(context, lock_level):
    # VERIFY: confirm PATCH /records/{id}/files/{file_id} is the correct endpoint
    # VERIFY: confirm the request body field name is 'lock' (may differ in record-service)
    resp = context['client'].patch(
        f"/records/{context['record_id']}/files/{context['file_id']}",
        json={'lock': lock_level},
    )
    assert resp.status_code in (200, 204), \
        f"Expected 200/204 setting lock, got {resp.status_code}: {resp.text}"


@then(parsers.parse('the file should not be visible to "{role}"'))
def file_not_visible_to(context, officer2_token, role):
    role_token = {'officer2': officer2_token}.get(role)
    if not role_token:
        raise ValueError(f"Role {role!r} not mapped to a token fixture")
    other_client = api_client(role_token)
    # VERIFY: confirm GET /records/{id}/files/{file_id} returns 403 or 404 for locked files
    resp = other_client.get(
        f"/records/{context['record_id']}/files/{context['file_id']}"
    )
    assert resp.status_code in (403, 404), \
        f"Expected 403/404 for {role}, got {resp.status_code}: {resp.text}"


@then(parsers.parse('the file should be visible to "{role}"'))
def file_visible_to(context, sergeant_token, role):
    role_token = {'sergeant1': sergeant_token}.get(role)
    if not role_token:
        raise ValueError(f"Role {role!r} not mapped — add to fixture map if needed")
    other_client = api_client(role_token)
    # VERIFY: confirm GET /records/{id}/files/{file_id} returns 200 for supervisor roles
    resp = other_client.get(
        f"/records/{context['record_id']}/files/{context['file_id']}"
    )
    assert resp.status_code == 200, \
        f"Expected 200 for {role}, got {resp.status_code}: {resp.text}"


@then('I should be able to see the file')
def can_see_file(context):
    # Uses context['client'] — already switched to iauser via 'I switch to user' step
    # VERIFY: confirm GET /records/{id}/files/{file_id} returns 200 for iauser on locked files
    resp = context['client'].get(
        f"/records/{context['record_id']}/files/{context['file_id']}"
    )
    assert resp.status_code == 200, \
        f"Expected 200, got {resp.status_code}: {resp.text}"
