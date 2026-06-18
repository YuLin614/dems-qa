Feature: Evidence Upload

  @ui @api
  Scenario: Officer uploads a video file to a new record
    Given I am logged in as "officer1"
    When I create a new evidence record titled "[E2E] Upload Test"
    And I upload the file "sample.mp4"
    Then the file should appear in the record's file list
    And an audit event "UPLOAD_COMPLETED" should exist for the file

  @api
  Scenario: Uploaded file is rejected if extension is not allowed
    Given I am logged in as "officer1"
    When I create a new evidence record titled "[E2E] Extension Test"
    And I try to upload the file "unsupported.svg"
    Then I should see an error about unsupported file type

  @api
  Scenario: Officer cannot upload to another officer's record
    Given I am logged in as "officer2"
    When I try to upload a file to officer1's record
    Then I should receive a 403 error
