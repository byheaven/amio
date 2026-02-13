import React from 'react';
import { View, Text } from '@tarojs/components';
import './thumbnail.scss';

const ThreeTilesThumbnail: React.FC = () => {
  return (
    <View className="three-tiles-thumbnail" aria-hidden="true">
      <Text className="three-tiles-thumbnail__title">星潮同调</Text>
      <Text className="three-tiles-thumbnail__subtitle">轻快消除</Text>
    </View>
  );
};

export default ThreeTilesThumbnail;
