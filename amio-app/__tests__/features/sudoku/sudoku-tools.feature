Feature: Sudoku Tools
  Scenario: Hint fills one cell and check is unavailable by default
    Given a sudoku game with tools
    When I use hint and check tools
    Then hint should consume one use and check should report unavailable
