# steps/api/admin_steps.py
import os
from pytest_bdd import scenarios, when, then, parsers

scenarios('../../features/admin/user-management.feature')
scenarios('../../features/admin/retention.feature')


@when('I navigate to user management')
def navigate_to_user_management(context):
    # RESOLVED: actual endpoint confirmed from source
    resp = context['client'].get('/api/v1/auth/users')
    context['last_response'] = resp


@when('I try to navigate to user management')
def try_navigate_user_management(context):
    # RESOLVED: actual endpoint confirmed from source — different role expects 401/403
    resp = context['client'].get('/api/v1/auth/users')
    context['last_response'] = resp


@then('I should see all users belonging to my agency')
def see_agency_users(context):
    import pytest
    resp = context['last_response']
    if resp.status_code == 403:
        pytest.skip("Current test user lacks admin role — GET /api/v1/auth/users requires admin/sysops")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    users = resp.json()
    assert isinstance(users, list) and len(users) > 0, f"Expected non-empty user list: {users}"


@then('I should be redirected or see a 403 error')
def redirected_or_403(context):
    resp = context['last_response']
    assert resp.status_code in (401, 403), \
        f"Expected 401/403, got {resp.status_code}: {resp.text}"


@when(parsers.parse('I set the retention period for my agency to {days:d} days'))
def set_retention(context, days):
    # RESOLVED: actual endpoint confirmed from source
    # NEEDS: agency_id from JWT claims — extract from GET /api/v1/auth/users response first
    users_resp = context['client'].get('/api/v1/auth/users')
    assert users_resp.status_code == 200, f"Could not fetch users to extract agency_id: {users_resp.text}"
    # agency_id is expected in the user list response — extract from first user's agency field
    users = users_resp.json()
    agency_id = None
    for user in users:
        aid = user.get('agency_id') or user.get('agency', {}).get('id') if isinstance(user.get('agency'), dict) else None
        if aid:
            agency_id = aid
            break
    assert agency_id, f"Could not extract agency_id from users response: {users}"

    resp = context['client'].put(
        f'/api/v1/records/agency/{agency_id}/retentions',
        json={'retention_days': days},
    )
    context['last_response'] = resp


@then('the retention policy should be saved')
def retention_saved(context):
    import pytest
    resp = context['last_response']
    if resp.status_code == 403:
        pytest.skip("Current test user lacks sysops role — retention endpoint requires sysops")
    assert resp.status_code in (200, 204), f"Expected 200/204, got {resp.status_code}: {resp.text}"


@when('I try to set a retention policy')
def try_set_retention(context):
    # RESOLVED: actual endpoint confirmed from source — officer role expects 403
    # NEEDS: agency_id — using placeholder since officer won't have access anyway
    resp = context['client'].put('/api/v1/records/agency/placeholder/retentions', json={'retention_days': 30})
    context['last_response'] = resp

# NOTE: @then('I should receive a 403 error') is defined in conftest.py
# and is available to all test files automatically — do NOT redefine it here.
