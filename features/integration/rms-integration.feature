@rms
Feature: RMS to DEMS integration

  Scenario: Open DEMS integration mode from RMS record
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the record header shows "GOPP202612300"
    And the "Upload Evidence" button is visible
