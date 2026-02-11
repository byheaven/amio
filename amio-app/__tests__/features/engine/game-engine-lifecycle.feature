Feature: Game Engine Lifecycle
  Scenario: Engine drives plugin lifecycle and settlement payload
    Given a game engine with registered plugins
    When I start, act, and finish a game
    Then settlement payload should include result, performance, and chest level
