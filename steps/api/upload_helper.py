# steps/api/upload_helper.py
import os


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), '../../fixtures/test-files')


def upload_file(client, record_id: str, filename: str) -> str:
    """2-step direct upload. Returns file_id."""
    file_path = os.path.join(FIXTURES_DIR, filename)

    # Step 1: Create file resource
    r1 = client.post('/api/v1/records/files', json={
        'filename': filename,
        'record_id': record_id,
    })
    assert r1.status_code == 201, f"File resource creation failed ({r1.status_code}): {r1.text}"
    file_id = r1.json()['file_id']

    # Step 2: Upload raw bytes
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
    r2 = client.post(
        f'/api/v1/records/{record_id}/files/{file_id}',
        content=file_bytes,
        headers={'Content-Type': 'application/octet-stream'},
    )
    assert r2.status_code == 202, f"File upload failed ({r2.status_code}): {r2.text}"
    return file_id
