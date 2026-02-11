Feature: Three Tiles Plugin Parity
  Scenario: Normal clear path keeps parity
    Given a 3tiles plugin state close to clear
    When I click the final matching tile
    Then the game status should be cleared

  Scenario: Hero retry and tools usage constraints
    Given a 3tiles hero state
    When I use undo twice and retry once
    Then tool usage should only count once and attempts should increment

  Scenario: Loss on max slots remains unchanged
    Given a 3tiles state with six slot tiles
    When I click a non-matching tile
    Then the game status should be failed
