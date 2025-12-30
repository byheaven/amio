import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { getStoryByDay } from '../../constants/storyData';
import './StoryModal.scss';

interface StoryModalProps {
    storyDay: number;
    onComplete: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ storyDay, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [showSkip, setShowSkip] = useState(false);

    const story = getStoryByDay(storyDay);

    useEffect(() => {
        if (!story) {
            onComplete();
            return;
        }

        // Show skip button after 1 second
        const skipTimer = setTimeout(() => {
            setShowSkip(true);
        }, 1000);

        // Typewriter effect
        const content = story.content;
        let currentIndex = 0;
        const typingSpeed = 50; // ms per character

        const typingInterval = setInterval(() => {
            if (currentIndex < content.length) {
                setDisplayedContent(content.slice(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                setIsTypingComplete(true);
            }
        }, typingSpeed);

        return () => {
            clearTimeout(skipTimer);
            clearInterval(typingInterval);
        };
    }, [story, onComplete]);

    const handleSkip = () => {
        if (story) {
            setDisplayedContent(story.content);
            setIsTypingComplete(true);
        }
    };

    const handleContinue = () => {
        onComplete();
    };

    if (!story) {
        return null;
    }

    return (
        <View className="story-modal-overlay">
            <View className="story-modal">
                <View className="story-header">
                    <Text className="story-day">Day {storyDay}</Text>
                    <Text className="story-title">{story.title}</Text>
                    <Text className="story-subtitle">{story.subtitle}</Text>
                </View>

                <View className="story-content">
                    <Text className="story-text">{displayedContent}</Text>
                    {!isTypingComplete && <Text className="typing-cursor">|</Text>}
                </View>

                <View className="story-actions">
                    {showSkip && !isTypingComplete && (
                        <Button className="skip-btn" onClick={handleSkip}>
                            跳过
                        </Button>
                    )}
                    {isTypingComplete && (
                        <Button className="continue-btn" onClick={handleContinue}>
                            继续 →
                        </Button>
                    )}
                </View>
            </View>
        </View>
    );
};

export default StoryModal;
