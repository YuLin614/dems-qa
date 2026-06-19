# steps/api/audit_steps.py
import os
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import api_client

scenarios('../../features/audit/chain-of-custody.feature')


@given('a file has upload, view, and download events')
def file_with_events(context, officer_token):
    # Setup: create a record, upload a file, view it, download it — generates 3 audit events
    setup_client = api_client(officer_token)
    context['token'] = officer_token
    context['client'] = setup_client

    # Create record
    # VERIFY: POST /records is the correct record creation endpoint
    r = setup_client.post('/records', json={'title': '[E2E] Audit Test'})
    assert r.status_code == 201, f"Setup failed: {r.text}"
    context['record_id'] = r.json()['id']

    # Upload file
    # VERIFY: POST /records/{id}/files is the correct upload endpoint
    file_path = os.path.join(os.path.dirname(__file__), '../../fixtures/test-files/sample.pdf')
    with open(file_path, 'rb') as f:
        r2 = setup_client.post(
            f"/records/{context['record_id']}/files",
            files={'file': ('sample.pdf', f)},
        )
    assert r2.status_code == 201, f"Upload failed: {r2.text}"
    context['file_id'] = r2.json()['id']

    # View file (GET triggers VIEW audit event)
    # VERIFY: GET /records/{id}/files/{file_id} is the correct view endpoint
    r3 = setup_client.get(f"/records/{context['record_id']}/files/{context['file_id']}")
    assert r3.status_code == 200

    # Download file — verify the actual download endpoint from record-service
    # VERIFY: GET /records/{id}/files/{file_id}/download is the correct download endpoint
    r4 = setup_client.get(f"/records/{context['record_id']}/files/{context['file_id']}/download")
    assert r4.status_code == 200, f"Download failed: {r4.status_code}: {r4.text}"


@when('I export the chain of custody for that file')
def export_chain_of_custody(context):
    # Verify the actual endpoint from audit-service routes
    # VERIFY: GET /records/{id}/files/{file_id}/chain-of-custody OR GET /audit/files/{file_id}
    resp = context['client'].get(
        f"/records/{context['record_id']}/files/{context['file_id']}/chain-of-custody"
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    context['chain_of_custody'] = resp.json()


@then('the export should contain all audit events in order')
def events_in_order(context):
    events = context['chain_of_custody']
    assert len(events) >= 3, f"Expected at least 3 events (upload, view, download), got {len(events)}: {events}"
    # Events should be ordered by timestamp ascending
    timestamps = [e['timestamp'] for e in events]
    assert timestamps == sorted(timestamps), f"Events not in chronological order: {timestamps}"


@then("each event should include the actor's name and timestamp")
def events_have_actor_and_timestamp(context):
    for event in context['chain_of_custody']:
        assert 'timestamp' in event, f"Missing 'timestamp' in event: {event}"
        # Check for actor name — field may be 'actor_name', 'user', 'performed_by', etc.
        # VERIFY: field name from audit-service response schema
        has_actor = any(k in event for k in ('actor_name', 'user', 'performed_by', 'actor'))
        assert has_actor, f"No actor field found in event: {event}"


@when('I try to access the audit log')
def try_access_audit_log(context):
    # VERIFY: GET /audit/events is the correct audit log listing endpoint
    resp = context['client'].get('/audit/events')
    context['last_response'] = resp

# NOTE: @then('I should receive a 403 error') is defined in conftest.py
# and is available to all test files automatically — do NOT redefine it here.
