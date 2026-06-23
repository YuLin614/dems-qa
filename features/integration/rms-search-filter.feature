@rms
Feature: Search and filter in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Search for existing file returns results
    When I search for "GOPP202612300"
    Then the file list shows at least 1 result
    And the results contain "GOPP202612300"

  Scenario: Search for non-existent term shows empty state
    When I search for "zzz_nonexistent_xyz_abc"
    Then the file list shows no results

  Scenario: Clear search restores full list
    When I search for "zzz_nonexistent_xyz_abc"
    And I clear the search
    Then the file list shows at least 1 result

  Scenario: Filter panel opens with correct options
    When I open the filter panel
    Then the filter options include "Incident"
    And the filter options include "Captured Date"
    And the filter options include "File Type"
    And the filter options include "Restriction Status"
