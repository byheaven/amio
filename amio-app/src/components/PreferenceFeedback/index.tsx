import React from 'react';
import { View, Text } from '@tarojs/components';
import { FeedbackValue } from '@/engine/types';
import './index.scss';

interface PreferenceFeedbackProps {
  value: FeedbackValue;
  onChange: (value: FeedbackValue) => void;
}

const PreferenceFeedback: React.FC<PreferenceFeedbackProps> = ({ value, onChange }) => {
  return (
    <View className="preference-feedback">
      <Text className="preference-feedback__title">你觉得这个模式怎么样？</Text>
      <View className="preference-feedback__actions">
        <View
          className={`preference-feedback__button ${value === 'liked' ? 'is-active' : ''}`}
          onClick={() => onChange('liked')}
        >
          <Text>💙 喜欢</Text>
        </View>
        <View
          className={`preference-feedback__button ${value === 'disliked' ? 'is-active' : ''}`}
          onClick={() => onChange('disliked')}
        >
          <Text>💔 不喜欢</Text>
        </View>
      </View>
      {value !== 'skipped' && <Text className="preference-feedback__saved">偏好已保存。</Text>}
    </View>
  );
};

export default PreferenceFeedback;
