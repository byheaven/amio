import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Board from '../../components/Board/Board';
import Slot from '../../components/Slot/Slot';
import TempSlot from '../../components/TempSlot/TempSlot';
import ToolBar from '../../components/ToolBar/ToolBar';
import ChestModal from '../../components/ChestModal/ChestModal';
import { TileData, MAX_SLOTS } from '../../constants/game';
import { checkMatch, updateClickableStatus } from '../../utils/gameLogic';
import { getDailyLayoutSeed, generateDailyLayout, assignRandomTileTypes } from '../../utils/dailyLevel';
import { undoLastTile, shuffleBoard, popTilesToTemp, returnTileFromTempStack, TempSlotStacks } from '../../utils/toolsLogic';
import './index.scss';

// Layout position type (matches dailyLevel.ts)
interface LayoutPosition {
    x: number;
    y: number;
    layer: number;
}

const Game: React.FC = () => {
    const [boardTiles, setBoardTiles] = useState<TileData[]>([]);
    const [slotTiles, setSlotTiles] = useState<TileData[]>([]);
    const [tempStacks, setTempStacks] = useState<TempSlotStacks>([[], [], []]);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    // Store daily layout (fixed positions) - persists across retries
    const dailyLayoutRef = useRef<LayoutPosition[]>([]);

    useEffect(() => {
        // Generate daily layout once on mount
        const seed = getDailyLayoutSeed();
        dailyLayoutRef.current = generateDailyLayout(seed, 30); // 10 triples = 30 tiles
        startNewGame();
    }, []);

    const startNewGame = () => {
        // Use fixed daily layout, but assign new random tile types
        const tiles = assignRandomTileTypes(dailyLayoutRef.current);
        setBoardTiles(tiles);
        setSlotTiles([]);
        setTempStacks([[], [], []]);
        setStatus('playing');
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
        const { newBoard, newSlot, success } = undoLastTile(boardTiles, slotTiles);
        if (success) {
            setBoardTiles(newBoard);
            setSlotTiles(newSlot);
        }
    };

    const handleShuffle = () => {
        if (status !== 'playing') return;
        const shuffled = shuffleBoard(boardTiles);
        setBoardTiles(shuffled);
    };

    const handleRemove = () => {
        if (status !== 'playing') return;
        if (slotTiles.length === 0) return;

        const { remainSlot, newTempStacks, success } = popTilesToTemp(slotTiles, tempStacks);

        if (success) {
            setSlotTiles(remainSlot);
            setTempStacks(newTempStacks);
        }
    };

    return (
        <View className="game-page">
            <View className="header">
                <Text>Game Status: {status.toUpperCase()}</Text>
                <View style={{ display: 'flex', gap: '10px' }}>
                    <Button size="mini" onClick={startNewGame}>Restart</Button>
                    <Button size="mini" onClick={() => setStatus('won')}>Test Win</Button>
                </View>
            </View>

            <Board tiles={boardTiles} onTileClick={handleTileClick} />

            <TempSlot stacks={tempStacks} onStackClick={handleTempStackClick} />

            <Slot tiles={slotTiles} />

            <ToolBar
                onUndo={handleUndo}
                onShuffle={handleShuffle}
                onRemove={handleRemove}
            />

            {status === 'won' && (
                <ChestModal
                    onClaim={() => console.log('Reward claimed!')}
                    onClose={startNewGame}
                />
            )}
            {status === 'lost' && <View className="overlay"><Text className="msg">GAME OVER</Text></View>}
        </View>
    );
};

export default Game;
