Feature: Retention Policies

  @api
  Scenario: Sysops can set retention policy for an agency
    Given I am logged in as "sysops1"
    When I set the retention period for my agency to 90 days
    Then the retention policy should be saved

  @api
  Scenario: Standard user cannot modify retention policy
    Given I am logged in as "officer1"
    When I try to set a retention policy
    Then I should receive a 403 error
