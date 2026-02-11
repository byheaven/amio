Feature: Preference Storage
  Scenario: Preference feedback persistence supports liked, disliked, and skipped
    Given an empty preference store
    When I save liked disliked and skipped records
    Then all feedback values should be retrievable
