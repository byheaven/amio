import { TileData } from '../constants/game';
import { updateClickableStatus } from './gameLogic';

// Undo: Move last tile from slot back to board
export const undoLastTile = (
    boardTiles: TileData[],
    slotTiles: TileData[]
): { newBoard: TileData[], newSlot: TileData[], success: boolean } => {
    if (slotTiles.length === 0) return { newBoard: boardTiles, newSlot: slotTiles, success: false };

    const tileToReturn = slotTiles[slotTiles.length - 1]; // Last entered
    const newSlot = slotTiles.slice(0, -1);

    // Naively put back. 
    const newBoard = [...boardTiles, tileToReturn];

    return {
        newBoard: updateClickableStatus(newBoard),
        newSlot,
        success: true
    };
};

// Shuffle: Randomize positions of board tiles
export const shuffleBoard = (boardTiles: TileData[]): TileData[] => {
    const positions = boardTiles.map(t => ({ x: t.x, y: t.y, layer: t.layer }));

    const shuffledPositions = [...positions];
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }

    const result = boardTiles.map((tile, index) => ({
        ...tile,
        x: shuffledPositions[index].x,
        y: shuffledPositions[index].y,
        layer: shuffledPositions[index].layer
    }));

    return updateClickableStatus(result);
};

// POP: Move tiles from Main Slot -> Temp Slot
// Temp Slot has 3 POSITIONS, but tiles can STACK on each position.
export const MAX_TEMP_POSITIONS = 3;

// TempSlot data structure: array of stacks (each stack is an array of tiles)
export type TempSlotStacks = TileData[][];

export const popTilesToTemp = (
    slotTiles: TileData[],
    tempStacks: TempSlotStacks
): { remainSlot: TileData[], newTempStacks: TempSlotStacks, success: boolean } => {
    if (slotTiles.length === 0) return { remainSlot: slotTiles, newTempStacks: tempStacks, success: false };

    // Move up to 3 tiles from the start of the slot
    const tilesToMoveCount = Math.min(slotTiles.length, MAX_TEMP_POSITIONS);
    const tilesToMove = slotTiles.slice(0, tilesToMoveCount);
    const remainSlot = slotTiles.slice(tilesToMoveCount);

    // Stack tiles onto the 3 positions
    // Initialize stacks if empty
    const newTempStacks: TempSlotStacks = tempStacks.length === MAX_TEMP_POSITIONS
        ? tempStacks.map(stack => [...stack])
        : [[], [], []];

    // Add each tile to its corresponding position (stacking on top)
    tilesToMove.forEach((tile, index) => {
        newTempStacks[index].push(tile);
    });

    return { remainSlot, newTempStacks, success: true };
};

// Return top tile from a specific position in Temp Slot -> Main Slot
export const returnTileFromTempStack = (
    positionIndex: number,
    slotTiles: TileData[],
    tempStacks: TempSlotStacks,
    maxSlots: number
): { newSlot: TileData[], newTempStacks: TempSlotStacks, success: boolean } => {
    if (slotTiles.length >= maxSlots) return { newSlot: slotTiles, newTempStacks: tempStacks, success: false };
    if (positionIndex < 0 || positionIndex >= tempStacks.length) return { newSlot: slotTiles, newTempStacks: tempStacks, success: false };
    if (tempStacks[positionIndex].length === 0) return { newSlot: slotTiles, newTempStacks: tempStacks, success: false };

    const newTempStacks = tempStacks.map(stack => [...stack]);
    const tileToReturn = newTempStacks[positionIndex].pop()!; // Get top tile from stack
    const newSlot = [...slotTiles, tileToReturn];

    return { newSlot, newTempStacks, success: true };
};
