@rms
Feature: DEMS integration mode landing page

  Scenario: Record header shows case number and incident type
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the record header shows "GOPP202612300"
    And the incident type shows "Arson"
    And the "Upload Evidence" button is visible

  Scenario: Evidence file list shows correct columns
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the file list is visible
    And the list shows "Captured" column
    And the list shows "Incident" column
    And the total item count is displayed
