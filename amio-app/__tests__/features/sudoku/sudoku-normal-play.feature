Feature: Sudoku Normal Play
  Scenario: Fill and clear editable cells while givens stay immutable
    Given a sudoku game in normal mode
    When I select an editable cell and input then clear a symbol
    Then the cell value should change and given cells remain unchanged
