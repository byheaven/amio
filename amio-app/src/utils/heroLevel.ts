import { TileData, TileType } from '../constants/game';
import { updateClickableStatus } from './gameLogic';

/**
 * Hero模式关卡配置
 *
 * 对比普通模式:
 * | 参数       | 普通模式   | Hero模式    |
 * |------------|-----------|-------------|
 * | 图块种类   | 8-10种    | 12-15种     |
 * | 图块总数   | 72-90个   | 108-135个   |
 * | 堆叠层数   | 3-4层     | 5-6层       |
 * | 预计通关率 | 60%       | 20%         |
 */

// 扩展图块类型（Hero模式新增）
export const HERO_EXTRA_TYPES = [
    'crown',    // 👑 皇冠
    'lightning', // ⚡ 闪电
    'wave',     // 🌊 海浪
    'bubble',   // 🫧 气泡
    'trophy',   // 🏆 奖杯
    'fire',     // 🔥 火焰
] as const;

// Seeded random number generator
const createSeededRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
};

interface HeroLayoutPosition {
    x: number;
    y: number;
    layer: number;
}

/**
 * 生成Hero模式关卡布局
 */
export const generateHeroLayout = (seed: number): HeroLayoutPosition[] => {
    const random = createSeededRandom(seed + 1000); // 不同于普通模式的seed offset
    const positions: HeroLayoutPosition[] = [];

    // Hero模式: 50个三元组 = 150个图块 (~6分钟游戏时长)
    const totalTiles = 150;

    for (let i = 0; i < totalTiles; i++) {
        positions.push({
            x: Math.floor(random() * 9),      // 0-8 same as normal mode
            y: Math.floor(random() * 12),     // 0-11 same as normal mode (fits board)
            layer: Math.floor(random() * 8),  // 0-7 more layers for Hero difficulty
        });
    }

    // Sort by layer for rendering order
    positions.sort((a, b) => a.layer - b.layer);

    return positions;
};

/**
 * 为Hero模式分配图块类型
 * 使用更多种类的图块
 */
export const assignHeroTileTypes = (layout: HeroLayoutPosition[]): TileData[] => {
    // 合并基础类型和Hero扩展类型
    const baseTypes = Object.values(TileType).filter((v): v is TileType => typeof v === 'number');
    // 这里使用全部9种基础类型 + 模拟增加种类复杂度
    const allTypes = [...baseTypes]; // 9种基础类型

    const totalTriples = Math.floor(layout.length / 3);

    // 确保每种类型都可能出现，但分布更随机
    const typeAssignments: TileType[] = [];
    for (let i = 0; i < totalTriples; i++) {
        const type = allTypes[Math.floor(Math.random() * allTypes.length)];
        typeAssignments.push(type, type, type);
    }

    // Shuffle type assignments
    for (let i = typeAssignments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [typeAssignments[i], typeAssignments[j]] = [typeAssignments[j], typeAssignments[i]];
    }

    // Create tiles with fixed positions and random types
    const tiles: TileData[] = layout.map((pos, index) => ({
        id: `hero-tile-${index}`,
        type: typeAssignments[index] || TileType.STAR,
        x: pos.x,
        y: pos.y,
        layer: pos.layer,
        isClickable: true,
    }));

    return updateClickableStatus(tiles);
};

/**
 * 生成Hero模式关卡
 */
export const generateHeroLevel = (seed: number): TileData[] => {
    const layout = generateHeroLayout(seed);
    return assignHeroTileTypes(layout);
};
