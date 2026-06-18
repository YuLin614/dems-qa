Feature: User Management

  @ui @api
  Scenario: Agency admin can view all users in their agency
    Given I am logged in as "admin"
    When I navigate to user management
    Then I should see all users belonging to my agency

  @ui @api
  Scenario: Standard user cannot access user management
    Given I am logged in as "officer1"
    When I try to navigate to user management
    Then I should be redirected or see a 403 error
