Feature: File Detail View

  @ui
  Scenario: Officer opens a file and views its detail
    Given I am logged in as "officer1"
    And I am on a record with files
    When I open the first file in the record
    Then the file detail view should be visible

  @ui
  Scenario: Officer downloads a file with a reason
    Given I am logged in as "officer1"
    And I am on a record with files
    When I open the first file in the record
    And I download the file with reason "E2E test download"
    Then the download should be initiated

  @ui
  Scenario: Officer locks a file as private through the UI
    Given I am logged in as "officer1"
    And I am on a record with files
    When I open the first file in the record
    And I lock the file as "private" with reason "E2E test lock"
    Then the file should show a lock badge

  @ui
  Scenario: Officer views the audit log for a file
    Given I am logged in as "officer1"
    And I am on a record with files
    When I open the first file in the record
    And I open the audit tab
    Then I should see the audit section
