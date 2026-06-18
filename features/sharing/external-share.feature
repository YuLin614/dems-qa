Feature: External File Sharing

  @ui @api
  Scenario: Officer shares a file externally and recipient can download
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I create an external share link for the file
    Then the share link should be accessible without login
    And the recipient can download the file with a download reason

  @api
  Scenario: Expired share link shows appropriate error
    Given I am logged in as "officer1"
    And an external share link has expired
    When I visit the share link
    Then I should see an "expired" message
