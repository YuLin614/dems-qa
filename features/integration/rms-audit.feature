@rms
Feature: Audit log in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Audit tab shows log entries
    When I click "Audit"
    Then the audit log has at least 1 entry

  Scenario: Full audit log can be opened
    When I click "Audit"
    And I open the full audit log
    Then the full audit log is visible
