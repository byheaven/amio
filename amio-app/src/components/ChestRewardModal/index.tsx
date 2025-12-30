import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { ChestLevel } from '../../constants/game';
import { getChestLevelInfo, generateRewardsFromChest } from '../../utils/chestLogic';
import './index.scss';

interface ChestRewardModalProps {
    visible: boolean;
    chestLevels: ChestLevel[];
    onClose: () => void;
}

export const ChestRewardModal: React.FC<ChestRewardModalProps> = ({ visible, chestLevels, onClose }) => {
    const [step, setStep] = useState<'idle' | 'opening' | 'revealing' | 'completed'>('idle');
    const [currentChestIndex, setCurrentChestIndex] = useState(0);
    const [revealedRewards, setRevealedRewards] = useState<string[]>([]);
    const [currentRewardsQueue, setCurrentRewardsQueue] = useState<string[]>([]);

    // 初始化
    useEffect(() => {
        if (visible) {
            setStep('idle');
            setCurrentChestIndex(0);
            setRevealedRewards([]);
            setCurrentRewardsQueue([]);
        }
    }, [visible]);

    const currentChestLevel = chestLevels[currentChestIndex];
    const chestInfo = currentChestLevel ? getChestLevelInfo(currentChestLevel) : null;

    const handleInteract = () => {
        if (step === 'idle') {
            // 开始开启第一个/下一个宝箱
            setStep('opening');

            // 模拟开箱动画时间
            setTimeout(() => {
                const rewards = generateRewardsFromChest(currentChestLevel);
                setCurrentRewardsQueue(rewards);
                setStep('revealing');
            }, 1000); // 1秒摇晃动画
        } else if (step === 'revealing') {
            if (currentRewardsQueue.length > 0) {
                // 每次点击显示一个奖励
                const nextReward = currentRewardsQueue[0];
                setRevealedRewards(prev => [...prev, nextReward]);
                setCurrentRewardsQueue(prev => prev.slice(1));
            } else {
                // 当前宝箱奖励展示完毕
                if (currentChestIndex < chestLevels.length - 1) {
                    // 还有下一个宝箱
                    setCurrentChestIndex(prev => prev + 1);
                    setStep('idle'); // 回到待开启状态
                } else {
                    // 所有宝箱开启完毕
                    setStep('completed');
                }
            }
        } else if (step === 'completed') {
            onClose();
        }
    };

    if (!visible || !chestInfo) return null;

    return (
        <View className={`chest-reward-modal ${visible ? 'visible' : ''}`} onClick={handleInteract}>
            <View className="modal-content" onClick={(e) => e.stopPropagation()}>
                <View className="chest-container">
                    <Text className={`chest-icon ${step === 'opening' ? 'shaking' : ''} ${step === 'completed' ? 'opened' : ''}`}>
                        {step === 'completed' ? '🎁' : chestInfo.emoji}
                    </Text>
                </View>

                {step === 'idle' && (
                    <>
                        <Text className="message">点击开启 {chestInfo.name}</Text>
                        <Text className="sub-message">
                            {chestLevels.length > 1 ? `(${currentChestIndex + 1}/${chestLevels.length})` : ''}
                        </Text>
                        <Button className="action-btn" onClick={handleInteract}>开启</Button>
                    </>
                )}

                {step === 'opening' && (
                    <Text className="message">正在开启...</Text>
                )}

                {(step === 'revealing' || step === 'completed') && (
                    <View className="rewards-list">
                        {/* 显示当前宝箱已揭示的奖励。如果是多宝箱，这里可以优化的更好，比如区分来源。暂时只简单列表显示。 */}
                        {/* 为了简化，我们只显示当前session揭示的所有奖励，或者只显示当前宝箱的。 */}
                        {/* 现在的逻辑是revealedRewards会累积所有宝箱的奖励吗？ */}
                        {/* handleInteract里 setRevealedRewards(prev => [...prev, nextReward]) 会持续累积。 */}
                        {/* 这样也好，最后显示总收获。 */}
                        {revealedRewards.map((reward, index) => (
                            <Text key={index} className="reward-item">{reward}</Text>
                        ))}
                    </View>
                )}

                {step === 'revealing' && (
                    <>
                        <Text className="sub-message">点击继续...</Text>
                        {/* 点击整个遮罩也可以继续 */}
                        <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} onClick={handleInteract} />
                    </>
                )}

                {step === 'completed' && (
                    <>
                        <Text className="message">🎉 领取成功！</Text>
                        <Button className="action-btn" onClick={onClose}>太棒了</Button>
                    </>
                )}
            </View>
        </View>
    );
};
