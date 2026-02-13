import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import { ChestLevel, GameStats, GameMode } from '../../constants/game';
import { getChestLevelInfo, upgradeChestForHero } from '../../utils/chestLogic';
import { FeedbackValue } from '../../engine/types';
import './ChestModal.scss';

interface ChestModalProps {
    chestLevels: ChestLevel[];
    stats: GameStats;
    gameMode: GameMode;
    canChallengeHero: boolean;
    feedback?: FeedbackValue;
    onFeedbackChange?: (value: FeedbackValue) => void;
    onClaim: () => void;
    onHeroChallenge: () => void;
    onClose: () => void;
}

const ChestModal: React.FC<ChestModalProps> = ({
    chestLevels,
    stats,
    gameMode,
    canChallengeHero,
    feedback = 'skipped',
    onFeedbackChange,
    onClaim,
    onHeroChallenge,
}) => {
    const isHeroMode = gameMode === GameMode.HERO;
    const chestInfos = chestLevels.map(level => getChestLevelInfo(level));

    // Preview chest upgrade path for Hero challenge.
    const upgradedLevels = upgradeChestForHero(chestLevels[0]);
    const upgradedInfos = upgradedLevels.map(level => getChestLevelInfo(level));

    return (
        <View className="chest-modal-overlay">
            <View className="chest-modal">
                <Text className="victory-text">
                    {isHeroMode ? '🏆 英雄模式通关！' : '🎉 恭喜通关！'}
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
                        <Text className="hero-bonus">🔥 英雄模式加成生效！</Text>
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

                <View className="feedback-section">
                    <Text className="feedback-title">这局体验怎么样？</Text>
                    <View className="feedback-options">
                        <View
                            className={`feedback-option${feedback === 'liked' ? ' feedback-option--active' : ''}`}
                            onClick={() => onFeedbackChange?.('liked')}
                        >
                            <Text>👍 喜欢</Text>
                        </View>
                        <View
                            className={`feedback-option${feedback === 'disliked' ? ' feedback-option--active' : ''}`}
                            onClick={() => onFeedbackChange?.('disliked')}
                        >
                            <Text>👎 不喜欢</Text>
                        </View>
                    </View>
                </View>

                {/* Hero prompt only appears after a normal clear when Hero mode is enabled. */}
                {canChallengeHero && (
                    <View className="hero-section">
                        <Text className="hero-title">🔥 挑战英雄模式？</Text>
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
                                挑战英雄！
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
