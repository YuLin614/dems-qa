@rms
Feature: File actions in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Actions menu shows all options
    When I open the file actions menu
    Then the menu shows "Restrict"
    And the menu shows "Download"
    And the menu shows "Share"

  Scenario: Download file
    When I open the file actions menu
    And I click "Download"
    Then a download dialog or download is initiated
    When I enter download reason "QA test download"
    And I confirm the download
    Then the file downloads successfully

  Scenario: Restrict opens restriction dialog
    When I open the file actions menu
    And I click "Restrict"
    Then the restriction dialog is visible
