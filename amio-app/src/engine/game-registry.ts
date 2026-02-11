import { GamePlugin } from '@/types/game-plugin';

export class GameRegistry {
  private readonly plugins = new Map<string, GamePlugin>();

  register(plugin: GamePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  get(gameId: string): GamePlugin {
    const plugin = this.plugins.get(gameId);
    if (!plugin) {
      throw new Error(`Game plugin not found: ${gameId}`);
    }
    return plugin;
  }

  list(): GamePlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const gameRegistry = new GameRegistry();
