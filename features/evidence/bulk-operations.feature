Feature: Bulk File Operations

  @ui
  Scenario: Officer selects a file and sees the bulk toolbar
    Given I am logged in as "officer1"
    And I am on a record with files
    When I select the first file with checkbox
    Then the bulk toolbar should appear
