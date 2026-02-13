import React from 'react';
import { View, Text } from '@tarojs/components';
import './thumbnail.scss';

const SudokuThumbnail: React.FC = () => (
  <View className="sudoku-thumbnail" aria-hidden="true">
    <Text className="sudoku-thumbnail__title">星图解码</Text>
    <Text className="sudoku-thumbnail__subtitle">沉浸解谜</Text>
  </View>
);

export default SudokuThumbnail;
