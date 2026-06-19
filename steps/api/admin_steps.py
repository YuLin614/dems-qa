# steps/api/admin_steps.py
import os
from pytest_bdd import scenarios, when, then, parsers

scenarios('../../features/admin/user-management.feature')
scenarios('../../features/admin/retention.feature')


@when('I navigate to user management')
def navigate_to_user_management(context):
    # VERIFY: check actual user-management endpoint in auth-service/app/
    resp = context['client'].get('/admin/users')
    context['last_response'] = resp


@when('I try to navigate to user management')
def try_navigate_user_management(context):
    # VERIFY: same endpoint, different role — expect 401/403
    resp = context['client'].get('/admin/users')
    context['last_response'] = resp


@then('I should see all users belonging to my agency')
def see_agency_users(context):
    resp = context['last_response']
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
    # VERIFY: check actual retention endpoint in the service that owns retention policies
    resp = context['client'].put(
        '/admin/retention',  # VERIFY: endpoint from retention/policy service
        json={'retention_days': days},
    )
    context['last_response'] = resp


@then('the retention policy should be saved')
def retention_saved(context):
    resp = context['last_response']
    assert resp.status_code in (200, 204), f"Expected 200/204, got {resp.status_code}: {resp.text}"


@when('I try to set a retention policy')
def try_set_retention(context):
    # VERIFY: same endpoint, officer role — expect 403
    resp = context['client'].put('/admin/retention', json={'retention_days': 30})
    context['last_response'] = resp

# NOTE: @then('I should receive a 403 error') is defined in conftest.py
# and is available to all test files automatically — do NOT redefine it here.
