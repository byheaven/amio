import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

const Home: React.FC = () => {
    const startGame = () => {
        Taro.navigateTo({ url: '/pages/game/index' });
    };

    return (
        <View className="home-page">
            <View className="title-container">
                <Text className="title">Shark Star</Text>
                <Text className="subtitle">AMIO MVP</Text>
            </View>
            <Button className="start-btn" onClick={startGame}>Start Game</Button>
        </View>
    );
};

export default Home;
