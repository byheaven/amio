import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import { ChestLevel, GameStats, GameMode } from '../../constants/game';
import { getChestLevelInfo, upgradeChestForHero } from '../../utils/chestLogic';
import './ChestModal.scss';

interface ChestModalProps {
    chestLevels: ChestLevel[];
    stats: GameStats;
    gameMode: GameMode;
    canChallengeHero: boolean;
    onClaim: () => void;
    onHeroChallenge: () => void;
    onClose: () => void;
}

const ChestModal: React.FC<ChestModalProps> = ({
    chestLevels,
    stats,
    gameMode,
    canChallengeHero,
    onClaim,
    onHeroChallenge,
    onClose,
}) => {
    const isHeroMode = gameMode === GameMode.HERO;
    const chestInfos = chestLevels.map(level => getChestLevelInfo(level));

    // 计算Hero模式可能升级到的等级（用于预览）
    const upgradedLevels = upgradeChestForHero(chestLevels[0]);
    const upgradedInfos = upgradedLevels.map(level => getChestLevelInfo(level));

    return (
        <View className="chest-modal-overlay">
            <View className="chest-modal">
                <Text className="victory-text">
                    {isHeroMode ? '🏆 Hero通关！' : '🎉 恭喜通关！'}
                </Text>

                <View className="chest-container">
                    <View className="chest-row">
                        {chestInfos.map((info, index) => (
                            <View
                                key={index}
                                className={`chest-display chest-${chestLevels[index]}`}
                                style={{ borderColor: info.color }}
                            >
                                <Text className="chest-emoji">{info.emoji}</Text>
                            </View>
                        ))}
                    </View>
                    <Text className="chest-name" style={{ color: chestInfos[0].color }}>
                        {chestLevels.length > 1
                            ? `${chestInfos.map(i => i.name).join(' + ')}`
                            : chestInfos[0].name
                        }
                    </Text>
                    {isHeroMode && (
                        <Text className="hero-bonus">🔥 Hero加成生效！</Text>
                    )}
                </View>

                <View className="stats-container">
                    <View className="stat-item">
                        <Text className="stat-label">挑战次数</Text>
                        <Text className="stat-value">{stats.attempts}次</Text>
                    </View>
                    <View className="stat-item">
                        <Text className="stat-label">道具使用</Text>
                        <Text className="stat-value">{stats.toolsUsed}个</Text>
                    </View>
                </View>

                {/* 只在普通模式通关且可以挑战Hero时显示Hero区域 */}
                {canChallengeHero && (
                    <View className="hero-section">
                        <Text className="hero-title">🔥 挑战Hero模式？</Text>
                        <Text className="hero-desc">
                            通关可升级为 {upgradedInfos.map(i => `${i.emoji} ${i.name}`).join(' + ')}
                        </Text>
                        <Text className="hero-warning">⚠️ 仅有1次机会，失败不扣宝箱</Text>
                    </View>
                )}

                <View className="button-group">
                    {canChallengeHero ? (
                        <>
                            <Button className="btn-secondary" onClick={onClaim}>
                                领取宝箱
                            </Button>
                            <Button className="btn-primary" onClick={onHeroChallenge}>
                                挑战Hero！
                            </Button>
                        </>
                    ) : (
                        <Button className="btn-primary full-width" onClick={onClaim}>
                            领取宝箱
                        </Button>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ChestModal;
