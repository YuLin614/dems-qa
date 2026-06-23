@rms
Feature: File detail view in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Video player is visible
    Then the video player is visible

  Scenario: Information tab shows file metadata
    Then the "Information" tab is active
    And the file status shows "SUCCESS"
    And the file type is displayed
    And the uploaded by field is displayed

  Scenario: Shared tab is accessible
    When I click "Shared"
    Then the "Shared" tab is active

  Scenario: Audit tab is accessible
    When I click "Audit"
    Then the "Audit" tab is active

  Scenario: Notes section is visible
    Then the Notes section shows "Add your first note"
