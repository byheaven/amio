Feature: Post Clear Card State
  Scenario: Card enters completed state with hero action
    Given a completed card state
    When I render the card
    Then it should expose hero challenge and done controls
