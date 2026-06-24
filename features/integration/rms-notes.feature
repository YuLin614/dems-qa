@rms
Feature: Notes in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Add a note to a file
    When I add a note "test note from automation"
    Then the note "test note from automation" is visible
