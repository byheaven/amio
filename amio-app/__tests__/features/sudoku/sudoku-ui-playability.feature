Feature: Sudoku UI Playability
  Scenario: Sudoku board renders correct grid dimensions in normal mode
    Given a sudoku game UI in normal mode
    When I render the sudoku board
    Then I should see 16 sudoku cells

  Scenario: Sudoku board renders correct grid dimensions in hero mode
    Given a sudoku game UI in hero mode
    When I render the sudoku board
    Then I should see 36 sudoku cells

  Scenario: Selecting editable cell enables symbol input and applies chosen symbol
    Given a sudoku game with at least one editable cell
    When I select that editable cell and input a valid symbol
    Then the selected editable cell should contain the symbol

  Scenario: Selecting given cell keeps it immutable and reports lock feedback
    Given a sudoku game with at least one given cell
    When I select that given cell and input a symbol
    Then the given cell should stay unchanged and lock feedback should appear

  Scenario: Clearing selected editable cell does not alter givens
    Given a sudoku game with selected editable and given cells
    When I input a symbol to the editable cell and then clear it
    Then the editable cell should be empty and givens should remain unchanged

  Scenario: Fill-complete with wrong values highlights errors and keeps playing
    Given a sudoku game with editable cells
    When I fill all editable cells with at least one wrong value
    Then the game should remain playing and show error cells

  Scenario: Correcting all cells transitions to cleared
    Given a filled sudoku game with errors
    When I replace editable cells with the correct solution symbols
    Then the game status should become cleared
