Feature: Chain of Custody

  @api
  Scenario: Supervisor exports chain of custody report for a file
    Given I am logged in as "sergeant1"
    And a file has upload, view, and download events
    When I export the chain of custody for that file
    Then the export should contain all audit events in order
    And each event should include the actor's name and timestamp

  @api
  Scenario: Standard user cannot view audit logs
    Given I am logged in as "officer1"
    When I try to access the audit log
    Then I should receive a 403 error
