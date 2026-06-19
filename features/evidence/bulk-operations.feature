Feature: Bulk File Operations

  @ui
  Scenario: Officer selects a file and sees the bulk toolbar
    Given I am logged in as "officer1"
    When I create a new evidence record titled "[E2E] Bulk Test"
    And I upload the file "sample.pdf"
    And I navigate to the record page
    And I select the first file with checkbox
    Then the bulk toolbar should appear
