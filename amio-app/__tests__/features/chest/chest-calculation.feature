Feature: Chest Level Calculation
  As a player
  I want the game to award me a chest based on my performance
  So that I am rewarded for playing efficiently

  # PRD Truth Table: attempts × toolsUsed → ChestLevel
  # | Attempts | 0 tools | 1 tool | 2 tools | 3 tools |
  # |----------|---------|--------|---------|---------|
  # | 1        | 💎      | 🥇     | 🥈      | 🥈      |
  # | 2        | 🥇      | 🥇     | 🥈      | 🥈      |
  # | 3        | 🥈      | 🥈     | 🥈      | 🥉      |
  # | 4-5      | 🥈      | 🥈     | 🥉      | 🥉      |
  # | 6+       | 🥉      | 🥉     | 🥉      | 🥉      |

  Scenario Outline: Calculate chest level for normal mode
    Given the player completed the level in <attempts> attempts
    And the player used <toolsUsed> tools
    When the chest level is calculated
    Then the chest should be <chestLevel>

    Examples:
      | attempts | toolsUsed | chestLevel |
      # 1 attempt row
      | 1        | 0         | diamond    |
      | 1        | 1         | gold       |
      | 1        | 2         | silver     |
      | 1        | 3         | silver     |
      # 2 attempts row
      | 2        | 0         | gold       |
      | 2        | 1         | gold       |
      | 2        | 2         | silver     |
      | 2        | 3         | silver     |
      # 3 attempts row
      | 3        | 0         | silver     |
      | 3        | 1         | silver     |
      | 3        | 2         | silver     |
      | 3        | 3         | bronze     |
      # 4 attempts row
      | 4        | 0         | silver     |
      | 4        | 1         | silver     |
      | 4        | 2         | bronze     |
      | 4        | 3         | bronze     |
      # 5 attempts row
      | 5        | 0         | silver     |
      | 5        | 1         | silver     |
      | 5        | 2         | bronze     |
      | 5        | 3         | bronze     |
      # 6+ attempts row
      | 6        | 0         | bronze     |
      | 6        | 1         | bronze     |
      | 6        | 2         | bronze     |
      | 6        | 3         | bronze     |
      | 10       | 0         | bronze     |
      | 10       | 2         | bronze     |

  Scenario Outline: Upgrade chest for Hero mode completion
    Given the player earned a <originalLevel> chest in normal mode
    When the chest is upgraded for Hero mode
    Then the player should receive <expectedChests>

    Examples:
      | originalLevel | expectedChests      |
      | bronze        | gold                |
      | silver        | diamond             |
      | gold          | diamond, gold       |
      | diamond       | diamond, diamond    |

  Scenario: Edge case - zero attempts should not crash
    Given the player completed the level in 0 attempts
    And the player used 0 tools
    When the chest level is calculated
    Then the chest should be bronze
