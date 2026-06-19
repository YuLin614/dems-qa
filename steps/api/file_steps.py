# steps/api/file_steps.py
import os
from pytest_bdd import when, then, parsers

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
