import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import './ChestModal.scss';

interface ChestModalProps {
    onClaim: () => void;
    onClose: () => void;
}

const ChestModal: React.FC<ChestModalProps> = ({ onClaim, onClose }) => {
    const [isOpened, setIsOpened] = useState(false);

    const handleClaim = () => {
        if (!isOpened) {
            setIsOpened(true);
            // Delay before calling onClaim to show animation
            setTimeout(() => {
                onClaim();
            }, 800);
        }
    };

    return (
        <View className="chest-modal">
            <Text className="victory-text">🎉 恭喜过关！</Text>

            <View className="chest-container">
                <View className={`chest-icon ${isOpened ? 'chest-opened' : ''}`} onClick={handleClaim} />

                <Text className="reward-text">
                    {isOpened ? '获得今日奖励！' : '点击宝箱领取奖励'}
                </Text>
            </View>

            {!isOpened ? (
                <Button className="claim-button" onClick={handleClaim}>
                    开启宝箱
                </Button>
            ) : (
                <Button className="close-button" onClick={onClose}>
                    继续
                </Button>
            )}
        </View>
    );
};

export default ChestModal;
