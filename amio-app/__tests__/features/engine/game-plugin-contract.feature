Feature: Game Plugin Contract
  Scenario: Plugin contract enforcement
    Given a registered game plugin
    When I inspect its required fields
    Then it should expose id, meta, lifecycle methods, tools, and hero config
