# steps/api/record_steps.py
import os
from pytest_bdd import scenarios, when, then, parsers

from conftest import api_client  # noqa: F401 — imported so callers can reference it

# Bind all scenarios in upload-evidence.feature to this test module
scenarios('../../features/evidence/upload-evidence.feature')


@when(parsers.parse('I create a new evidence record titled "{title}"'))
def create_record(context, title):
    # VERIFY: check actual endpoint in record-service/app/
    resp = context['client'].post('/records', json={'title': title})
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    context['record_id'] = resp.json()['id']


@when(parsers.parse('I upload the file "{filename}"'))
def upload_file(context, filename):
    file_path = os.path.join(
        os.path.dirname(__file__), '../../fixtures/test-files', filename
    )
    # VERIFY: check actual endpoint in record-service/app/
    with open(file_path, 'rb') as f:
        resp = context['client'].post(
            f"/records/{context['record_id']}/files",
            files={'file': (filename, f)},
        )
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    context['file_id'] = resp.json()['id']


@then("the file should appear in the record's file list")
def file_in_list(context):
    # VERIFY: check actual endpoint in record-service/app/
    resp = context['client'].get(f"/records/{context['record_id']}/files")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    ids = [f['id'] for f in resp.json()]
    assert context['file_id'] in ids, f"File {context['file_id']} not in {ids}"


@then(parsers.parse('an audit event "{event_type}" should exist for the file'))
def audit_event_exists(context, event_type):
    # VERIFY: check actual endpoint in record-service/app/
    resp = context['client'].get(
        f"/records/{context['record_id']}/files/{context['file_id']}/audit-events"
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    types = [e['event_type'] for e in resp.json()]
    assert event_type in types, f"Expected {event_type!r} in {types}"
