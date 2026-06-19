Feature: Record Search

  @ui
  Scenario: Officer searches for records by case number
    Given I am logged in as "officer1"
    When I navigate to my records
    And I search for "[E2E]"
    Then I should see records matching the search
