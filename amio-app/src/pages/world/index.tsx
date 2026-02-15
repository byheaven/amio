import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import WorldViewport from '@/world3d/ui/WorldViewport';
import './index.scss';

const World: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    Taro.switchTab({
      url: '/pages/starlight/index',
      fail: (error) => {
        console.error('Navigation back to starlight failed:', error);
        Taro.navigateTo({
          url: '/pages/starlight/index',
          fail: (navigateError) => {
            console.error('Fallback navigateTo starlight failed:', navigateError);
            Taro.reLaunch({ url: '/pages/starlight/index' });
          },
        });
      },
    });
  };

  const handleLoaded = () => {
    setLoading(false);
  };

  return (
    <View className="world-page">
      <View className="world-page__header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-btn__text">{'< Back to Starlight'}</Text>
        </View>
      </View>

      <WorldViewport onLoaded={handleLoaded} />

      {loading && (
        <View className="world-page__loading">
          <Text className="loading-text">Loading SharkStar...</Text>
          <View className="loading-spinner" />
        </View>
      )}
    </View>
  );
};

export default World;
