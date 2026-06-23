@rms
Feature: RMS to DEMS integration

  Scenario: Open DEMS integration mode from RMS record
    Given I am on the RMS site
    When I navigate to record "PP 2026-12300" via Quick Launch Recent
    And I click Digital Evidence
    Then DEMS opens in a new tab in integration mode
