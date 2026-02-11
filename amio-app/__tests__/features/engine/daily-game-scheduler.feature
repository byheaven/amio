Feature: Daily Game Scheduler
  Scenario: Scheduler deterministic alternation
    Given two consecutive dates for the same user
    When I query the scheduler
    Then game type should alternate between 3tiles and sudoku
