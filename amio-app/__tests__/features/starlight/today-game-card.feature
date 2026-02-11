Feature: Today Game Card
  Scenario: Card renders metadata from game plugin
    Given a game metadata payload
    When I render the today game card in idle state
    Then card should display narrative name, description, and reward
