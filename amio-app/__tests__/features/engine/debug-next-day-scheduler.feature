Feature: Debug Next Day Scheduler
  Scenario: Next-day debug advance switches effective day and game type
    Given today is fixed and debug offset is zero
    When I advance debug day by one
    Then effective date and scheduled game type should both change
