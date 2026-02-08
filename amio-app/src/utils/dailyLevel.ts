import { TileData, TileType } from '../constants/game';
import { updateClickableStatus } from './gameLogic';

// Simple hash function for date string
const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Seeded random number generator (Linear Congruential Generator)
const createSeededRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
};

// Get today's date seed
export const getDailyLayoutSeed = (): number => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return hashString(dateString);
};

// Layout position definition (fixed positions/layers, without types)
interface LayoutPosition {
    x: number;
    y: number;
    layer: number;
}

// Generate fixed layout positions based on seed
export const generateDailyLayout = (seed: number, totalTiles: number = 75): LayoutPosition[] => {
    const random = createSeededRandom(seed);
    const positions: LayoutPosition[] = [];

    for (let i = 0; i < totalTiles; i++) {
        positions.push({
            x: Math.floor(random() * 9),      // 0-8 x pos (9 columns)
            y: Math.floor(random() * 12),     // 0-11 y pos (12 rows)
            layer: Math.floor(random() * 6),  // 0-5 layers (more stacking)
        });
    }

    // Sort by layer for rendering order
    positions.sort((a, b) => a.layer - b.layer);

    return positions;
};

// Assign random tile types to fixed layout (changes on each retry)
export const assignRandomTileTypes = (layout: LayoutPosition[]): TileData[] => {
    const types = Object.values(TileType).filter((v): v is TileType => typeof v === 'number');
    const totalTriples = Math.floor(layout.length / 3);

    // Generate type assignments (each type appears 3 times)
    const typeAssignments: TileType[] = [];
    for (let i = 0; i < totalTriples; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        typeAssignments.push(type, type, type);
    }

    // Shuffle type assignments
    for (let i = typeAssignments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [typeAssignments[i], typeAssignments[j]] = [typeAssignments[j], typeAssignments[i]];
    }

    // Create tiles with fixed positions and random types
    const tiles: TileData[] = layout.map((pos, index) => ({
        id: `tile-${index}`,
        type: typeAssignments[index] || TileType.STAR, // fallback
        x: pos.x,
        y: pos.y,
        layer: pos.layer,
        isClickable: true,
    }));

    return updateClickableStatus(tiles);
};

// Main function: Generate daily level
export const generateDailyLevel = (totalTriples: number = 10): TileData[] => {
    const seed = getDailyLayoutSeed();
    const totalTiles = totalTriples * 3;
    const layout = generateDailyLayout(seed, totalTiles);
    return assignRandomTileTypes(layout);
};
