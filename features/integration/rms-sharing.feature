@rms
Feature: Share files in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Share dialog opens
    When I open the file actions menu
    And I click "Share"
    Then the share dialog is visible

  Scenario: Share file with external user
    When I open the file actions menu
    And I click "Share"
    And I enter share email "kloselyc+1@gmail.com"
    And I send the share
    Then the share is confirmed
