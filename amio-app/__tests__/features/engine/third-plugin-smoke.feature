Feature: Third Plugin Smoke
  Scenario: Registering a third plugin works without framework edits
    Given a game registry
    When I register built-in plugins and a mock plugin
    Then registry lookup should return all three plugins
