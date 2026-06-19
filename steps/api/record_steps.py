# steps/api/record_steps.py
import os
from pytest_bdd import scenarios, when, then, parsers

# Bind all scenarios in upload-evidence.feature to this test module
scenarios('../../features/evidence/upload-evidence.feature')


@when(parsers.parse('I create a new evidence record titled "{title}"'))
def create_record(context, title):
    # RESOLVED: actual endpoint confirmed from source
    resp = context['client'].post('/api/v1/records', json={'category': 'id', 'external_record_id': title})
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    context['record_id'] = resp.json()['id']


@when(parsers.parse('I upload the file "{filename}"'))
def upload_file_step(context, filename):
    from upload_helper import upload_file as _upload
    context['file_id'] = _upload(context['client'], context['record_id'], filename)


@then("the file should appear in the record's file list")
def file_in_list(context):
    # RESOLVED: actual endpoint confirmed from source
    resp = context['client'].get(f"/api/v1/records/{context['record_id']}/files")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    ids = [f['id'] for f in data.get('items', data)]
    assert context['file_id'] in ids, f"File {context['file_id']} not in {ids}"


@then(parsers.parse('an audit event "{event_type}" should exist for the file'))
def audit_event_exists(context, event_type):
    resp = context['client'].get(
        '/api/v1/audit/logs',
        params={'file_id': context['file_id']},
    )
    assert resp.status_code == 200, f"{resp.status_code}: {resp.text}"
    items = resp.json().get('items', [])
    types = [e.get('event_type') for e in items]
    assert event_type in types, f"Expected {event_type!r} in {types}"
