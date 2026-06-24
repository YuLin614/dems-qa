@rms
Feature: Restrict access in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Restrict modal shows all options
    When I open the file actions menu
    And I click "Restrict"
    Then the Restrict Access modal is visible
    And the modal shows "No restriction" option
    And the modal shows "Privatized" option
    And the modal shows "Invisible" option
    And the reason field is visible

  Scenario: Set file to Privatized
    When I open the file actions menu
    And I click "Restrict"
    And I select restriction "Privatized"
    And I enter restriction reason "test"
    And I confirm the restriction
    Then the file has a Private badge
    When I open the file actions menu
    Then the menu shows "Manage Restriction"
    And the menu does not show "Restrict"

  Scenario: Remove restriction
    When I open the file actions menu
    And I click "Restrict"
    And I select restriction "No restriction"
    And I confirm the restriction
    Then the Private badge is gone
