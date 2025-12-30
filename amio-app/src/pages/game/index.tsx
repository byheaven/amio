import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import Board from '../../components/Board/Board';
import Slot from '../../components/Slot/Slot';
import TempSlot from '../../components/TempSlot/TempSlot';
import ToolBar from '../../components/ToolBar/ToolBar';
import ChestModal from '../../components/ChestModal/ChestModal';
import { TileData, MAX_SLOTS, GameStats, ChestLevel, GameMode } from '../../constants/game';
import { checkMatch, updateClickableStatus } from '../../utils/gameLogic';
import { getDailyLayoutSeed, generateDailyLayout, assignRandomTileTypes } from '../../utils/dailyLevel';
import { generateHeroLevel } from '../../utils/heroLevel';
import { undoLastTile, shuffleBoard, popTilesToTemp, returnTileFromTempStack, TempSlotStacks } from '../../utils/toolsLogic';
import { calculateChestLevel, createInitialStats, upgradeChestForHero } from '../../utils/chestLogic';
import { savePendingChest, updateTodayStatus } from '../../utils/storage';
import './index.scss';

// Layout position type (matches dailyLevel.ts)
interface LayoutPosition {
    x: number;
    y: number;
    layer: number;
}

const Game: React.FC = () => {
    const router = useRouter();
    const [boardTiles, setBoardTiles] = useState<TileData[]>([]);
    const [slotTiles, setSlotTiles] = useState<TileData[]>([]);
    const [tempStacks, setTempStacks] = useState<TempSlotStacks>([[], [], []]);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.NORMAL);
    const [gameStats, setGameStats] = useState<GameStats>(createInitialStats());
    const [chestLevels, setChestLevels] = useState<ChestLevel[]>([ChestLevel.BRONZE]);
    const [heroAttempted, setHeroAttempted] = useState<boolean>(false);
    const [normalCompleted, setNormalCompleted] = useState<boolean>(false);
    const [showResult, setShowResult] = useState<boolean>(false);

    // Store daily layout (fixed positions) - persists across retries
    const dailyLayoutRef = useRef<LayoutPosition[]>([]);
    const dailySeedRef = useRef<number>(0);

    useEffect(() => {
        // Generate daily layout once on mount
        const seed = getDailyLayoutSeed();
        dailySeedRef.current = seed;
        dailyLayoutRef.current = generateDailyLayout(seed, 30); // 10 triples = 30 tiles

        // 检查URL参数决定启动模式
        const mode = router.params.mode;
        if (mode === 'hero') {
            // 直接启动Hero模式
            const heroTiles = generateHeroLevel(seed);
            setBoardTiles(heroTiles);
            setSlotTiles([]);
            setTempStacks([[], [], []]);
            setStatus('playing');
            setGameMode(GameMode.HERO);
            setHeroAttempted(true);
            setNormalCompleted(true); // 从首页进入Hero说明普通模式已通关
        } else {
            startNewGame();
        }
    }, []);

    // 开始新游戏（重试时保留attempts，完全重开时重置）
    const startNewGame = (isRetry: boolean = false) => {
        // Use fixed daily layout, but assign new random tile types
        const tiles = assignRandomTileTypes(dailyLayoutRef.current);
        setBoardTiles(tiles);
        setSlotTiles([]);
        setTempStacks([[], [], []]);
        setStatus('playing');
        setShowResult(false);

        if (isRetry) {
            // 重试时: 保留attempts计数，重置本局道具使用
            setGameStats(prev => ({
                ...prev,
                toolsUsed: 0,
                undoUsed: false,
                shuffleUsed: false,
                popUsed: false,
            }));
        } else {
            // 完全重开: 重置所有统计
            setGameStats(createInitialStats());
            setGameMode(GameMode.NORMAL);
        }
    };

    // 开始Hero模式
    const startHeroMode = () => {
        // 生成Hero模式关卡
        const heroTiles = generateHeroLevel(dailySeedRef.current);
        setBoardTiles(heroTiles);
        setSlotTiles([]);
        setTempStacks([[], [], []]);
        setStatus('playing');
        setShowResult(false);
        setGameMode(GameMode.HERO);
        setHeroAttempted(true);
        // Hero模式重置道具使用
        setGameStats(prev => ({
            ...prev,
            toolsUsed: 0,
            undoUsed: false,
            shuffleUsed: false,
            popUsed: false,
        }));
    };

    // 失败后重试（增加attempts计数）
    const handleRetry = () => {
        setGameStats(prev => ({
            ...prev,
            attempts: prev.attempts + 1,
        }));
        if (gameMode === GameMode.HERO) {
            // Hero模式重试，重新生成Hero关卡
            const heroTiles = generateHeroLevel(dailySeedRef.current);
            setBoardTiles(heroTiles);
            setSlotTiles([]);
            setTempStacks([[], [], []]);
            setStatus('playing');
            setShowResult(false);
            // 重置本局道具使用
            setGameStats(prev => ({
                ...prev,
                toolsUsed: 0,
                undoUsed: false,
                shuffleUsed: false,
                popUsed: false,
            }));
        } else {
            startNewGame(true);
        }
    };

    // 领取宝箱（保存到待领取并返回首页）
    const handleClaim = () => {
        console.log('handleClaim - heroAttempted:', heroAttempted, 'gameMode:', gameMode);
        // 保存宝箱到待领取
        savePendingChest(chestLevels, gameMode === GameMode.HERO);
        // 更新今日状态
        updateTodayStatus(
            gameStats.attempts,
            true,
            chestLevels[0], // 用第一个宝箱作为今日宝箱等级
            heroAttempted,
            gameMode === GameMode.HERO && status === 'won'
        );
        // 返回首页
        Taro.navigateBack();
    };

    const handleTileClick = (tile: TileData) => {
        if (status !== 'playing') return;
        if (slotTiles.length >= MAX_SLOTS) return;

        const newBoardTiles = boardTiles.filter(t => t.id !== tile.id);
        const updatedBoardTiles = updateClickableStatus(newBoardTiles);

        let newSlotTiles = [...slotTiles, tile];

        setBoardTiles(updatedBoardTiles);
        setSlotTiles(newSlotTiles);

        const { newSlots, matched } = checkMatch(newSlotTiles);

        if (matched) {
            setSlotTiles(newSlots);
        } else {
            if (newSlots.length >= MAX_SLOTS) {
                setStatus('lost');
            } else {
                setSlotTiles(newSlots);
            }
        }

        // Check win (no tiles on board, in slot, or in temp stacks)
        const tempTilesCount = tempStacks.reduce((sum, stack) => sum + stack.length, 0);
        if (updatedBoardTiles.length === 0 && newSlots.length === 0 && tempTilesCount === 0) {
            setStatus('won');

            if (gameMode === GameMode.HERO) {
                // Hero模式通关，升级宝箱（可能获得多个）
                const upgradedLevels = upgradeChestForHero(chestLevels[0]);
                setChestLevels(upgradedLevels);
            } else {
                // 普通模式通关，计算宝箱等级
                const level = calculateChestLevel(gameStats);
                setChestLevels([level]);
                setNormalCompleted(true);
            }
            setShowResult(true);
        }
    };

    const handleTempStackClick = (positionIndex: number) => {
        if (status !== 'playing') return;

        const { newSlot, newTempStacks, success } = returnTileFromTempStack(
            positionIndex, slotTiles, tempStacks, MAX_SLOTS
        );

        if (success) {
            setTempStacks(newTempStacks);

            const { newSlots, matched } = checkMatch(newSlot);
            if (matched) {
                setSlotTiles(newSlots);
            } else {
                if (newSlots.length >= MAX_SLOTS) {
                    setStatus('lost');
                } else {
                    setSlotTiles(newSlots);
                }
            }
        }
    };

    const handleUndo = () => {
        if (status !== 'playing') return;
        if (gameStats.undoUsed) return; // 每局只能用一次

        const { newBoard, newSlot, success } = undoLastTile(boardTiles, slotTiles);
        if (success) {
            setBoardTiles(newBoard);
            setSlotTiles(newSlot);
            // 记录道具使用
            setGameStats(prev => ({
                ...prev,
                toolsUsed: prev.toolsUsed + 1,
                undoUsed: true,
            }));
        }
    };

    const handleShuffle = () => {
        if (status !== 'playing') return;
        if (gameStats.shuffleUsed) return; // 每局只能用一次

        const shuffled = shuffleBoard(boardTiles);
        setBoardTiles(shuffled);
        // 记录道具使用
        setGameStats(prev => ({
            ...prev,
            toolsUsed: prev.toolsUsed + 1,
            shuffleUsed: true,
        }));
    };

    const handleRemove = () => {
        if (status !== 'playing') return;
        if (slotTiles.length === 0) return;
        if (gameStats.popUsed) return; // 每局只能用一次

        const { remainSlot, newTempStacks, success } = popTilesToTemp(slotTiles, tempStacks);

        if (success) {
            setSlotTiles(remainSlot);
            setTempStacks(newTempStacks);
            // 记录道具使用
            setGameStats(prev => ({
                ...prev,
                toolsUsed: prev.toolsUsed + 1,
                popUsed: true,
            }));
        }
    };

    // 一键过关（测试用）
    const handleTestWin = () => {
        if (status !== 'playing') return;

        setBoardTiles([]);
        setSlotTiles([]);
        setTempStacks([[], [], []]);
        setStatus('won');

        if (gameMode === GameMode.HERO) {
            // Hero模式通关，升级宝箱（可能获得多个）
            const upgradedLevels = upgradeChestForHero(chestLevels[0]);
            setChestLevels(upgradedLevels);
        } else {
            // 普通模式通关，计算宝箱等级
            const level = calculateChestLevel(gameStats);
            setChestLevels([level]);
            setNormalCompleted(true);
        }
        setShowResult(true);
    };

    // 判断是否可以挑战Hero模式
    const canChallengeHero = normalCompleted && !heroAttempted;

    return (
        <View className={`game-page ${gameMode === GameMode.HERO ? 'hero-mode' : ''}`}>
            <View className={`header ${gameMode === GameMode.HERO ? 'hero-header' : ''}`}>
                <View className="stats-row">
                    <Text className={`day-text ${gameMode === GameMode.HERO ? 'hero-title' : ''}`}>
                        {gameMode === GameMode.HERO ? '🔥 HERO MODE' : 'Day 1'}
                    </Text>
                    <Text className={`attempt-text ${gameMode === GameMode.HERO ? 'hero-attempt' : ''}`}>
                        第 {gameStats.attempts} 次挑战
                    </Text>
                </View>
                <View className="header-right">
                    <Button className="test-win-btn" onClick={handleTestWin}>
                        🎯 一键过关
                    </Button>
                    <View className="tools-status">
                        <Text>道具: {gameStats.toolsUsed}/3</Text>
                    </View>
                </View>
            </View>

            <Board tiles={boardTiles} onTileClick={handleTileClick} />

            <TempSlot stacks={tempStacks} onStackClick={handleTempStackClick} />

            <Slot tiles={slotTiles} />

            <ToolBar
                onUndo={handleUndo}
                onShuffle={handleShuffle}
                onRemove={handleRemove}
                undoDisabled={gameStats.undoUsed}
                shuffleDisabled={gameStats.shuffleUsed}
                removeDisabled={gameStats.popUsed}
            />

            {/* 通关结算弹窗 */}
            {showResult && status === 'won' && (
                <ChestModal
                    chestLevels={chestLevels}
                    stats={gameStats}
                    gameMode={gameMode}
                    canChallengeHero={canChallengeHero}
                    onClaim={handleClaim}
                    onHeroChallenge={startHeroMode}
                    onClose={handleClaim}
                />
            )}

            {/* 普通模式失败弹窗 */}
            {status === 'lost' && gameMode === GameMode.NORMAL && (
                <View className="overlay">
                    <View className="lost-modal">
                        <Text className="lost-title">挑战失败</Text>
                        <Text className="lost-msg">槽位已满，无法继续消除</Text>
                        <Text className="lost-attempt">本次挑战：第 {gameStats.attempts} 次</Text>
                        <Button className="retry-btn" onClick={handleRetry}>再来一次</Button>
                    </View>
                </View>
            )}

            {/* Hero模式失败弹窗 */}
            {status === 'lost' && gameMode === GameMode.HERO && (
                <View className="overlay">
                    <View className="lost-modal hero-lost">
                        <Text className="lost-title">Hero挑战失败</Text>
                        <Text className="lost-msg">再试一次，或领取当前宝箱</Text>
                        <Text className="chest-keep">当前 {chestLevels[0] === ChestLevel.DIAMOND ? '💎' : chestLevels[0] === ChestLevel.GOLD ? '🥇' : chestLevels[0] === ChestLevel.SILVER ? '🥈' : '🥉'} 宝箱</Text>
                        <Text className="lost-attempt">本次挑战：第 {gameStats.attempts} 次</Text>
                        <Button className="retry-btn" onClick={handleRetry}>再来一次</Button>
                        <Button className="claim-btn-secondary" onClick={handleClaim}>领取宝箱</Button>
                    </View>
                </View>
            )}
        </View>
    );
};

export default Game;
