Feature: Preference Feedback
  Scenario: Feedback can be saved and switched
    Given a preference feedback component
    When I switch feedback from liked to disliked
    Then selected state should update
