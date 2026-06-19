Feature: File Lock

  @api
  Scenario: Officer locks a file as private
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I set the file lock to "private"
    Then the file should not be visible to "officer2"
    But the file should be visible to "sergeant1"

  # NOTE: This scenario uses 'I switch to user' instead of 'Given a file is locked as'
  # to avoid ambiguous step definitions. The step 'I switch to user' re-sets context['client'].
  @api
  Scenario: Internal Affairs can view locked files
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I set the file lock to "invisible"
    And I switch to user "iauser"
    Then I should be able to see the file
