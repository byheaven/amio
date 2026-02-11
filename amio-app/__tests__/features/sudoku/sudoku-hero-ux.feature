Feature: Sudoku Hero UX
  Scenario: Hero timer enters danger visual state at thirty seconds
    Given a sudoku hero timer at thirty seconds remaining
    When I render the hero timer
    Then the timer should have danger visual state

  Scenario: Hero timer reaching zero transitions to failed
    Given a sudoku game in hero mode with remaining time
    When I tick hero timer to zero
    Then the sudoku game should become failed

  Scenario: Sudoku completion provides settlement payload
    Given a sudoku game engine run
    When I complete the sudoku game and enter settlement
    Then settlement payload should include chest level and performance
