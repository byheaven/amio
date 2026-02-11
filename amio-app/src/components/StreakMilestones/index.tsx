import React from 'react';
import { ScrollView, View, Text } from '@tarojs/components';
import './index.scss';

interface MilestoneItem {
  days: number;
  label: string;
}

interface StreakMilestonesProps {
  currentDays: number;
  milestones: MilestoneItem[];
}

const StreakMilestones: React.FC<StreakMilestonesProps> = ({ currentDays, milestones }) => {
  const next = milestones.find((item) => currentDays < item.days) || null;

  return (
    <View className="streak-milestones">
      <Text className="streak-milestones__title">🔥 Streak {currentDays} days</Text>
      <ScrollView scrollX className="streak-milestones__scroll">
        <View className="streak-milestones__items">
          {milestones.map((item) => {
            const completed = currentDays >= item.days;
            const isNext = next?.days === item.days;
            const missing = Math.max(0, item.days - currentDays);
            return (
              <View key={item.days} className="streak-milestones__item">
                <Text className={`streak-milestones__dot${completed ? ' is-completed' : ''}${isNext ? ' is-next' : ''}`}>
                  {completed ? '✅' : '○'}
                </Text>
                <Text className="streak-milestones__label">{item.label}</Text>
                {isNext && <Text className="streak-milestones__hint">{missing} days left</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default StreakMilestones;
