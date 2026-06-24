@rms
Feature: Bulk operations in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Selecting a file shows the bulk toolbar
    When I select the first file
    Then the bulk toolbar is visible

  Scenario: Bulk restrict files
    When I select the first file
    And I click bulk "Restrict"
    Then the restriction dialog is visible

  Scenario: Bulk download files
    When I select the first file
    And I click bulk "Download"
    Then a download dialog or download is initiated

  Scenario: Bulk share files
    When I select the first file
    And I click bulk "Share"
    Then the share dialog is visible
