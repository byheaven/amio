Feature: Unified Settlement Component
  Scenario: Settlement renders generic result and hero entry
    Given a generic settlement payload
    When I render the settlement component
    Then it should show chest, feedback, and hero action when enabled
