import React, { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
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
            // 获取当前页面路径
            const router = Taro.getCurrentInstance().router;
            const currentPath = router?.path || '';
            console.log('Current path:', currentPath);

            // 判断是否是根路径访问（path 为空或者是 intro 页面本身）
            const isRootAccess = !currentPath ||
                                 currentPath === '/' ||
                                 currentPath.includes('/pages/intro/index');

            if (isRootAccess) {
                // 根路径访问：始终显示 intro
                console.log('Root access: always show intro');
                setFadeIn(true);
            } else {
                // 直接访问子页面：检查是否已看过 intro
                const progress = loadProgress();
                console.log('Direct subpage access, progress:', progress);
                if (progress?.hasSeenIntro) {
                    console.log('Intro already seen, redirecting...');
                    redirectToHome();
                } else {
                    console.log('Intro not seen yet, showing intro');
                    setFadeIn(true);
                }
            }
        } catch (error) {
            console.error('Error in IntroPage useEffect:', error);
            // Fallback: show intro on error
            setFadeIn(true);
        }
    }, []);

    const redirectToHome = () => {
        console.log('Attempting to navigate to starlight...');
        Taro.switchTab({
            url: '/pages/starlight/index',
            success: () => {
                console.log('Navigation successful');
            },
            fail: (err) => {
                console.error('Navigation failed:', err);
                Taro.navigateTo({
                    url: '/pages/starlight/index',
                    fail: (navigateError) => {
                        console.error('Fallback navigateTo failed:', navigateError);
                        Taro.reLaunch({ url: '/pages/starlight/index' });
                    }
                });
            }
        });
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
