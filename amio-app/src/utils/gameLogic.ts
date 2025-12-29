import { TileData, TileType, MAX_SLOTS } from '../constants/game';

// Simple overlap check: assumes tile size is roughly 2x2 units in the grid system
const TILE_WIDTH_UNIT = 2;
const TILE_HEIGHT_UNIT = 2;

export const isTileBlocked = (target: TileData, allTiles: TileData[]): boolean => {
    return allTiles.some(other => {
        if (other.id === target.id) return false;
        if (other.layer <= target.layer) return false; // Only higher layers block lower ones

        // Check collision
        // Using a slightly smaller collision box to allow visual overlap but logical separation if needed,
        // but for standard Mahjong/3-tiles, it's usually strict overlap.
        const xOverlap = Math.abs(other.x - target.x) < TILE_WIDTH_UNIT;
        const yOverlap = Math.abs(other.y - target.y) < TILE_HEIGHT_UNIT;

        return xOverlap && yOverlap;
    });
};

export const updateClickableStatus = (tiles: TileData[]): TileData[] => {
    return tiles.map(tile => ({
        ...tile,
        isClickable: !isTileBlocked(tile, tiles),
    }));
};

export const generateLevel = (totalTriples: number = 10): TileData[] => {
    const types = Object.values(TileType);
    let tiles: TileData[] = [];
    let idCounter = 0;

    for (let i = 0; i < totalTriples; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        // Generate 3 instances
        for (let j = 0; j < 3; j++) {
            // Random position logic (very basic for MVP)
            // Ideally this should use a proper level layout generator
            // For now: random pile
            tiles.push({
                id: `tile-${idCounter++}`,
                type,
                layer: Math.floor(Math.random() * 5), // 0-4 layers
                x: Math.floor(Math.random() * 8), // 0-7 x pos
                y: Math.floor(Math.random() * 10), // 0-9 y pos
                isClickable: true, // Will be updated
            });
        }
    }

    // Sort by layer for better rendering order (though zIndex handles it)
    tiles.sort((a, b) => a.layer - b.layer);

    return updateClickableStatus(tiles);
};

export const checkMatch = (slotTiles: TileData[]): { newSlots: TileData[], matched: boolean } => {
    // Check if any type has 3 counts
    const counts: Record<string, number> = {};
    slotTiles.forEach(t => {
        counts[t.type] = (counts[t.type] || 0) + 1;
    });

    const matchType = Object.keys(counts).find(key => counts[key] >= 3);

    if (matchType) {
        // Remove 3 instances of matchType
        // Find indices or filter. We need to remove exactly 3.
        let removedCount = 0;
        const newSlots = slotTiles.filter(t => {
            if (t.type === matchType && removedCount < 3) {
                removedCount++;
                return false;
            }
            return true;
        });
        return { newSlots, matched: true };
    }

    return { newSlots: slotTiles, matched: false };
};
