Feature: File Lock

  @api
  Scenario: Officer locks a file as private
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I set the file lock to "private"
    Then the file should not be visible to "officer2"
    But the file should be visible to "sergeant1"

  @api
  Scenario: Internal Affairs can view locked files
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I set the file lock to "invisible"
    And I switch to user "iauser"
    Then I should be able to see the file
