Feature: Game Session Logging
  Scenario: Log one record per completed or failed game
    Given a game logger with empty storage
    When I append completed and failed sessions
    Then both sessions should be persisted for the user
