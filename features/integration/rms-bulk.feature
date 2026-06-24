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
    When I select restriction "Privatized"
    And I enter restriction reason "bulk test"
    And I confirm the restriction
    Then the restriction was applied
    When I click bulk "Restrict"
    And I select restriction "No restriction"
    And I enter restriction reason "cleanup"
    And I confirm the restriction
    Then the restriction was applied

  Scenario: Bulk download files
    When I select the first file
    And I click bulk "Download"
    Then a download dialog or download is initiated
    When I enter download reason "QA bulk download"
    And I confirm the download
    Then the file downloads successfully

  Scenario: Bulk share files
    When I select the first file
    And I click bulk "Share"
    Then the share dialog is visible
    When I enter share email "kloselyc+1@gmail.com"
    And I enter share reason "Prosecutor Review"
    And I send the share
    Then the share is confirmed
