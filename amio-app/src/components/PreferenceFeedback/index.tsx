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
      <Text className="preference-feedback__title">How do you like this game mode?</Text>
      <View className="preference-feedback__actions">
        <View
          className={`preference-feedback__button ${value === 'liked' ? 'is-active' : ''}`}
          onClick={() => onChange('liked')}
        >
          <Text>💙 Like</Text>
        </View>
        <View
          className={`preference-feedback__button ${value === 'disliked' ? 'is-active' : ''}`}
          onClick={() => onChange('disliked')}
        >
          <Text>💔 Dislike</Text>
        </View>
      </View>
      {value !== 'skipped' && <Text className="preference-feedback__saved">Preference saved.</Text>}
    </View>
  );
};

export default PreferenceFeedback;
