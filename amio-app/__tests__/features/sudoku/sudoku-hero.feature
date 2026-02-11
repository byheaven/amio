Feature: Sudoku Hero
  Scenario: Hero mode fails when timer reaches zero
    Given a sudoku game in hero mode
    When timer ticks down past zero
    Then game status should become failed
