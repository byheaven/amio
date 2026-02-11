Feature: Streak Milestones
  Scenario: Milestone states show completed, next, and future
    Given streak milestones with current progress
    When I render the milestones component
    Then next milestone hint should be displayed
