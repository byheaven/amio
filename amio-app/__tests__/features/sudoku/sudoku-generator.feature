Feature: Sudoku Generator
  Scenario: Generated puzzle is uniquely solvable
    Given a generated normal sudoku puzzle
    When I count its solutions
    Then solution count should be exactly one
