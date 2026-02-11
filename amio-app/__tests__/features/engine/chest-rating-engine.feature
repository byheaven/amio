Feature: Chest Rating Engine
  Scenario: Rate chest level from thresholds and tool usage
    Given a rating config and performance metrics
    When I evaluate chest level
    Then the result should match threshold boundaries
