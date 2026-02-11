import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { GameEngine } from '@/engine/game-engine';
import { FeedbackValue, GameResult, GameState, SettlementPayload } from '@/engine/types';
import { gameRegistry } from '@/engine/game-registry';
import { registerBuiltInGames } from '@/games/registry';
import { GamePlugin } from '@/types/game-plugin';
import ChestModal from '@/components/ChestModal/ChestModal';
import StoryModal from '@/components/StoryModal/StoryModal';
import {
  getTodayDateString,
  getNextStoryDay,
  loadProgress,
  markStoryViewed,
  savePendingChest,
  updateEnergyAfterGame,
  updateTodayStatus,
} from '@/utils/storage';
import { ChestLevel, GameMode, GameStats } from '@/constants/game';
import { upgradeChestForHero } from '@/utils/chestLogic';
import './index.scss';

const mapMode = (mode: 'normal' | 'hero'): GameMode => {
  return mode === 'hero' ? GameMode.HERO : GameMode.NORMAL;
};

const navigateToStarlight = (): void => {
  Taro.switchTab({
    url: '/pages/starlight/index',
    fail: (error) => {
      console.error('Navigation to starlight failed:', error);
      Taro.reLaunch({ url: '/pages/starlight/index' });
    },
  });
};

const toChestEnum = (
  value: 'diamond' | 'gold' | 'silver' | 'bronze'
): ChestLevel => {
  switch (value) {
    case 'diamond':
      return ChestLevel.DIAMOND;
    case 'gold':
      return ChestLevel.GOLD;
    case 'silver':
      return ChestLevel.SILVER;
    default:
      return ChestLevel.BRONZE;
  }
};

const isThreeTilesState = (
  state: GameState
): state is GameState & { undoUsed: boolean; shuffleUsed: boolean; popUsed: boolean } => {
  return (
    typeof (state as Record<string, unknown>).undoUsed === 'boolean' &&
    typeof (state as Record<string, unknown>).shuffleUsed === 'boolean' &&
    typeof (state as Record<string, unknown>).popUsed === 'boolean'
  );
};

const GamePage: React.FC = () => {
  const router = useRouter();
  const modeParam = router.params.mode === 'hero' ? 'hero' : 'normal';
  const requestedGameId = router.params.gameType;

  const engineRef = useRef(new GameEngine());
  const [plugin, setPlugin] = useState<GamePlugin<GameState> | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackValue>('skipped');
  const [settlement, setSettlement] = useState<SettlementPayload | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [storyDay, setStoryDay] = useState(0);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyChecked, setStoryChecked] = useState(false);
  const autoWinHandledRef = useRef(false);

  const date = useMemo(() => getTodayDateString(), []);
  const userId = 'local-user';

  useEffect(() => {
    registerBuiltInGames();

    const engine = engineRef.current;
    const todayGame = requestedGameId || engine.getTodayGame(userId, date).id;

    try {
      const selectedPlugin = gameRegistry.get(todayGame);
      engine.setGame(todayGame);
      setPlugin(selectedPlugin as unknown as GamePlugin<GameState>);
      const initialState = engine.startGame({
        mode: modeParam,
        date,
        userId,
      });
      setState(initialState as unknown as GameState);
      setFinalized(false);
      setSettlement(null);
      setShowSettlement(false);
      setFeedback('skipped');
      setStoryDay(0);
      setShowStoryModal(false);
      setStoryChecked(false);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }, [date, modeParam, requestedGameId]);

  useEffect(() => {
    if (!state || !plugin || state.status !== 'cleared' || storyChecked) {
      return;
    }

    if (modeParam !== 'normal') {
      setStoryChecked(true);
      return;
    }

    const nextDay = getNextStoryDay();
    if (nextDay > 0) {
      setStoryDay(nextDay);
      setShowStoryModal(true);
    }
    setStoryChecked(true);
  }, [modeParam, plugin, state, storyChecked]);

  useEffect(() => {
    if (router.params.autowin !== 'true' || autoWinHandledRef.current || !state) {
      return;
    }

    autoWinHandledRef.current = true;
    const timer = setTimeout(() => {
      setState((prev) => {
        if (!prev || prev.status !== 'playing') {
          return prev;
        }
        return {
          ...prev,
          status: 'cleared',
          endedAt: Date.now(),
        };
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [router.params.autowin, state]);

  useEffect(() => {
    if (!state || !plugin || state.status !== 'playing' || modeParam !== 'hero' || plugin.id !== 'sudoku') {
      return;
    }

    const timer = setInterval(() => {
      const next = engineRef.current.dispatch({ type: 'tick', payload: { deltaSeconds: 1 } });
      setState(next as unknown as GameState);
    }, 1000);

    return () => clearInterval(timer);
  }, [modeParam, plugin, state]);

  useEffect(() => {
    if (!state || !plugin || state.status !== 'cleared' || settlement) {
      return;
    }

    const result: GameResult = {
      gameId: plugin.id,
      mode: modeParam,
      status: 'cleared',
      attempts: state.attempts,
      durationSeconds: Math.max(1, Math.floor(((state.endedAt ?? Date.now()) - state.startedAt) / 1000)),
      toolsUsed: state.toolsUsed,
      heroAttempted: modeParam === 'hero',
      heroResult: modeParam === 'hero' ? 'cleared' : undefined,
      feedback,
    };

    const payload = engineRef.current.enterSettlement(result);
    setSettlement(payload);
    setShowSettlement(true);
  }, [feedback, modeParam, plugin, settlement, state]);

  const handleAction = (type: string, payload?: Record<string, unknown>) => {
    if (!state) {
      return;
    }

    try {
      const next = engineRef.current.dispatch({ type, payload });
      if (type === 'retry') {
        setStoryDay(0);
        setShowStoryModal(false);
        setStoryChecked(false);
      }
      setState(next as unknown as GameState);
    } catch (error) {
      console.error('Failed to dispatch action:', error);
    }
  };

  const handleUseTool = (toolId: string) => {
    if (!state) {
      return;
    }

    try {
      const next = engineRef.current.useTool(toolId);
      setState(next as unknown as GameState);
    } catch (error) {
      console.error('Failed to use tool:', error);
    }
  };

  const persistCompletion = (payload: SettlementPayload, result: GameResult): void => {
    const chestLevel = engineRef.current.getChestLevelAsEnum(payload.chestLevel);
    const progress = loadProgress();

    if (result.mode === 'hero') {
      const baseLevel = progress.pendingChest?.levels?.[0] || chestLevel;
      const upgraded = upgradeChestForHero(baseLevel);
      savePendingChest(upgraded, true);
      updateTodayStatus(result.attempts, true, upgraded[0], true, result.status === 'cleared');
      updateEnergyAfterGame(GameMode.HERO, upgraded[0], progress.consecutiveDays);
      return;
    }

    savePendingChest([chestLevel], false);
    updateTodayStatus(result.attempts, true, chestLevel, false, false);
    updateEnergyAfterGame(mapMode(result.mode), chestLevel, progress.consecutiveDays);
  };

  const finalizeAndExit = (nextMode: 'exit' | 'hero') => {
    if (!state || !plugin || finalized || !settlement) {
      return;
    }

    const result: GameResult = {
      gameId: plugin.id,
      mode: modeParam,
      status: state.status === 'failed' ? 'failed' : state.status === 'quit' ? 'quit' : 'cleared',
      attempts: state.attempts,
      durationSeconds: Math.max(1, Math.floor(((state.endedAt ?? Date.now()) - state.startedAt) / 1000)),
      toolsUsed: state.toolsUsed,
      heroAttempted: modeParam === 'hero' || nextMode === 'hero',
      heroResult: modeParam === 'hero' ? (state.status === 'cleared' ? 'cleared' : 'failed') : undefined,
      feedback,
    };

    const payload = engineRef.current.onGameEnd(result);
    persistCompletion(payload, result);
    setFinalized(true);
    setShowSettlement(false);

    if (nextMode === 'hero') {
      Taro.redirectTo({
        url: `/pages/game/index?mode=hero&gameType=${plugin.id}`,
      });
      return;
    }

    navigateToStarlight();
  };

  const handleTestWin = () => {
    if (!state || state.status !== 'playing') {
      return;
    }

    setState({
      ...state,
      status: 'cleared',
      endedAt: Date.now(),
    });
  };

  const handleStoryComplete = () => {
    if (storyDay > 0) {
      markStoryViewed(storyDay);
    }
    setShowStoryModal(false);
  };

  if (!plugin || !state) {
    return <View className="game-page" />;
  }

  const PluginComponent = plugin.GameComponent as React.ComponentType<{
    state: GameState;
    onAction: (action: { type: string; payload?: Record<string, unknown> }) => void;
    onUseTool: (toolId: string) => void;
    mode: 'normal' | 'hero';
  }>;
  const pageClassName = [
    'game-page',
    modeParam === 'hero' ? 'hero-mode' : '',
    plugin.id === 'sudoku' ? 'game-page--sudoku' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={pageClassName}>
      <View className="header">
        <View className="stats-row">
          <Text className="day-text">{plugin.meta.narrativeName}</Text>
          <Text className="attempt-text">Attempt {state.attempts}</Text>
        </View>
        <View className="header-right">
          <Button className="test-win-btn" onClick={handleTestWin}>
            🎯 One-Click Win
          </Button>
          <View className="tools-status">
            <Text>Tools: {state.toolsUsed}</Text>
          </View>
        </View>
      </View>

      <PluginComponent
        state={state}
        onAction={(action) => handleAction(action.type, action.payload)}
        onUseTool={handleUseTool}
        mode={modeParam}
      />

      {showStoryModal && modeParam === 'normal' && (
        <StoryModal storyDay={storyDay} onComplete={handleStoryComplete} />
      )}

      {state.status === 'failed' && (
        <View className="overlay">
          <View className="lost-modal">
            <Text className="lost-title">Challenge failed</Text>
            <Button className="retry-btn" onClick={() => handleAction('retry')}>Retry</Button>
            {modeParam === 'hero' && (
              <Button className="claim-btn-secondary" onClick={() => navigateToStarlight()}>
                Claim Current Chest
              </Button>
            )}
            <Button className="claim-btn-secondary" onClick={() => navigateToStarlight()}>Exit</Button>
          </View>
        </View>
      )}

      {showSettlement && settlement && plugin.id === '3tiles' && !showStoryModal && (
        <ChestModal
          chestLevels={
            modeParam === 'hero'
              ? upgradeChestForHero(
                  loadProgress().pendingChest?.levels?.[0] || toChestEnum(settlement.chestLevel)
                )
              : [toChestEnum(settlement.chestLevel)]
          }
          stats={
            isThreeTilesState(state)
              ? ({
                  attempts: state.attempts,
                  toolsUsed: state.toolsUsed,
                  undoUsed: state.undoUsed,
                  shuffleUsed: state.shuffleUsed,
                  popUsed: state.popUsed,
                } as GameStats)
              : ({
                  attempts: state.attempts,
                  toolsUsed: state.toolsUsed,
                  undoUsed: false,
                  shuffleUsed: false,
                  popUsed: false,
                } as GameStats)
          }
          gameMode={modeParam === 'hero' ? GameMode.HERO : GameMode.NORMAL}
          canChallengeHero={modeParam === 'normal' && plugin.getHeroConfig().enabled}
          onClaim={() => finalizeAndExit('exit')}
          onHeroChallenge={() => finalizeAndExit('hero')}
          onClose={() => finalizeAndExit('exit')}
          feedback={feedback}
          onFeedbackChange={setFeedback}
        />
      )}

      {showSettlement && settlement && plugin.id !== '3tiles' && !showStoryModal && (
        <ChestModal
          chestLevels={
            modeParam === 'hero'
              ? upgradeChestForHero(
                  loadProgress().pendingChest?.levels?.[0] || toChestEnum(settlement.chestLevel)
                )
              : [toChestEnum(settlement.chestLevel)]
          }
          stats={{
            attempts: state.attempts,
            toolsUsed: state.toolsUsed,
            undoUsed: false,
            shuffleUsed: false,
            popUsed: false,
          }}
          gameMode={modeParam === 'hero' ? GameMode.HERO : GameMode.NORMAL}
          canChallengeHero={modeParam === 'normal' && plugin.getHeroConfig().enabled}
          onClaim={() => finalizeAndExit('exit')}
          onHeroChallenge={() => finalizeAndExit('hero')}
          onClose={() => finalizeAndExit('exit')}
          feedback={feedback}
          onFeedbackChange={setFeedback}
        />
      )}
    </View>
  );
};

export default GamePage;
