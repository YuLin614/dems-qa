@rms
Feature: Upload evidence in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Upload modal opens with pre-filled record details
    When I click "Upload Evidence"
    Then the Manage Uploads modal is visible
    And the case number shows "GOPP202612300"
    And the incident type shows "Arson"

  Scenario: Cancel closes the upload modal
    When I click "Upload Evidence"
    And I click "Cancel"
    Then the Manage Uploads modal is closed

  Scenario: Upload a video file
    When I upload the file "fixtures/test-files/sample.mp4"
    Then the file "sample.mp4" appears in the evidence list

  Scenario: Upload an image file
    When I upload the file "fixtures/test-files/sample.png"
    Then the file "sample.png" appears in the evidence list

  Scenario: Upload a PDF file
    When I upload the file "fixtures/test-files/sample.pdf"
    Then the file "sample.pdf" appears in the evidence list
