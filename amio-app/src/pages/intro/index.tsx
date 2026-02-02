import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { loadProgress, markIntroSeen } from '../../utils/storage';
import './index.scss';

const IntroPage: React.FC = () => {
    const [step, setStep] = useState(0);
    const [fadeIn, setFadeIn] = useState(false);

    // 故事文本 - 中英对照
    const storyLines = [
        { en: "In the vast ocean of stars...", cn: "在浩瀚的星海之中……" },
        { en: "A legend is whispered among the waves.", cn: "流传着一个关于波涛的传说。" },
        { en: "The Shark Star.", cn: "那是……鲨之星。" },
        { en: "It is said to bring fortune to those who dare to seek it.", cn: "传说它将为勇敢的寻觅者带来无尽的幸运。" },
        { en: "Your journey begins now.", cn: "你的旅程，由此开始。" }
    ];

    useEffect(() => {
        console.log('IntroPage mounted');
        try {
            // Check if already seen
            const progress = loadProgress();
            console.log('IntroPage progress:', progress);
            if (progress && progress.hasSeenIntro) {
                console.log('Intro already seen, redirecting...');
                redirectToHome();
            } else {
                console.log('Starting intro animation');
                // Start animation
                setFadeIn(true);
            }
        } catch (error) {
            console.error('Error in IntroPage useEffect:', error);
            // Fallback to home if error
            redirectToHome();
        }
    }, []);

    const redirectToHome = () => {
        Taro.switchTab({ url: '/pages/starlight/index' });
    };

    const handleNext = () => {
        if (step < storyLines.length - 1) {
            setFadeIn(false);
            setTimeout(() => {
                setStep(step + 1);
                setFadeIn(true);
            }, 300);
        } else {
            finishIntro();
        }
    };

    const finishIntro = () => {
        markIntroSeen();
        redirectToHome();
    };

    return (
        <View className="intro-page">
            <View className={`story-container ${fadeIn ? 'fade-in' : 'fade-out'}`}>
                <View className="text-wrapper">
                    <Text className="story-text-cn">{storyLines[step].cn}</Text>
                    <Text className="story-text-en">{storyLines[step].en}</Text>
                </View>
            </View>

            <View className="controls">
                {step < storyLines.length - 1 ? (
                    <View className="tap-hint" onClick={handleNext}>
                        <Text>点击继续</Text>
                    </View>
                ) : (
                    <Button className="start-btn" onClick={finishIntro}>
                        开启旅程
                    </Button>
                )}

                <View className="skip-btn" onClick={finishIntro}>
                    <Text>跳过</Text>
                </View>
            </View>
        </View>
    );
};

export default IntroPage;
