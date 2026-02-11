Feature: Sudoku Plugin Integration
  Scenario: Sudoku plugin can run through game engine and settlement
    Given a game engine with sudoku plugin
    When I start and finish a sudoku game
    Then settlement should be generated successfully
