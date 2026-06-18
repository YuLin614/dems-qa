Feature: View Evidence Record

  @ui
  Scenario: Officer views their own record
    Given I am logged in as "officer1"
    When I navigate to my records
    Then I should see my records listed

  @ui
  Scenario: Officer cannot view another officer's record
    Given I am logged in as "officer2"
    When I try to navigate to officer1's record
    Then I should be redirected or see a 403 error
