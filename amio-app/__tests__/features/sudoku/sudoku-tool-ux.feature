Feature: Sudoku Tool UX
  Scenario: Hint tool fills one incorrect editable cell and decrements remaining hint
    Given a sudoku game where hint is available
    When I use the hint tool once
    Then one editable cell should be filled correctly and remaining hint should decrease

  Scenario: Check tool is unavailable with explicit reason and no board mutation
    Given a sudoku game with a recorded board snapshot
    When I use the check tool
    Then the board should remain unchanged and unavailable reason should be visible
