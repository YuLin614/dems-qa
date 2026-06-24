@rms
Feature: Detailed filter options in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Filter by File Type Video shows results
    When I apply filter "File Type" with value "Video"
    Then the file list shows at least 1 result

  Scenario: Filter by File Type Image shows results
    When I apply filter "File Type" with value "Image"
    Then the file list shows at least 1 result

  Scenario: Filter by File Type PDF shows results
    When I apply filter "File Type" with value "PDF"
    Then the file list shows at least 1 result

  Scenario: Filter by Upload Status Success shows results
    When I apply filter "Upload Status" with value "Success"
    Then the file list shows at least 1 result

  Scenario: Filter by Upload Status Failure shows no results
    When I apply filter "Upload Status" with value "Failure"
    Then the file list shows no results

  Scenario: Filter by Uploaded On date range shows results
    When I apply date filter "Uploaded On" from "2026-01-01" to "2026-12-31"
    Then the file list shows at least 1 result

  Scenario: Filter by Captured Date date range shows results
    When I apply date filter "Captured Date" from "2026-01-01" to "2026-12-31"
    Then the file list shows at least 1 result

  Scenario: Restriction Status filter option is available
    When I open the filter panel
    Then the filter options include "Restriction Status"

  Scenario: Clear all filters restores full list
    When I apply filter "File Type" with value "Video"
    And I clear all filters
    Then the file list shows at least 1 result
