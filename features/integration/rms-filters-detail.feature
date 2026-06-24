@rms
Feature: Detailed filter options in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Filter by File Type shows results
    When I apply filter "File Type" with value "Video"
    Then the file list shows at least 1 result

  Scenario: Filter by Upload Status shows results
    When I apply filter "Upload Status" with value "Success"
    Then the file list shows at least 1 result

  Scenario: Filter by Restriction Status shows results
    When I apply filter "Restriction Status" with value "Private"
    Then the file list shows at least 1 result

  Scenario: Clear all filters restores full list
    When I apply filter "File Type" with value "Video"
    And I clear all filters
    Then the file list shows at least 1 result
