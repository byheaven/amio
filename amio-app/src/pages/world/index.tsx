import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import WorldScene from '../../components/WorldScene';
import './index.scss';

const World: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    Taro.switchTab({ url: '/pages/starlight/index' });
  };

  const handleLoaded = () => {
    setLoading(false);
  };

  return (
    <View className="world-page">
      <View className="world-page__header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-btn__text">{'< '}返回星光</Text>
        </View>
      </View>

      <WorldScene onLoaded={handleLoaded} />

      {loading && (
        <View className="world-page__loading">
          <Text className="loading-text">正在加载鲨之星...</Text>
          <View className="loading-spinner" />
        </View>
      )}

      <View className="world-page__construction">
        <Text className="construction-text">
          星球探索功能建设中 - 更多内容即将到来
        </Text>
      </View>
    </View>
  );
};

export default World;
