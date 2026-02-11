const SCHEDULER_KEY = 'amio_game_scheduler_v1';

export class GameScheduler {
  getTodayGameType(userId: string, date: string): string {
    const daysSinceEpoch = Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000);
    void userId;
    return daysSinceEpoch % 2 === 0 ? '3tiles' : 'sudoku';
  }

  getStorageKey(): string {
    return SCHEDULER_KEY;
  }
}

export const gameScheduler = new GameScheduler();
