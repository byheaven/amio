import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import type { Milestone } from '../../constants/game';
import './index.scss';

export interface StarTrailProps {
  milestones: Milestone[];
  consecutiveDays: number;
}

const StarTrail: React.FC<StarTrailProps> = ({ milestones, consecutiveDays }) => {
  // Sort milestones: unlocked first (by date desc), then locked (by day asc)
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    }
    if (a.unlockedAt) return -1;
    if (b.unlockedAt) return 1;
    return a.day - b.day;
  });

  const getNextMilestone = () => {
    return sortedMilestones.find(m => !m.unlockedAt);
  };

  const nextMilestone = getNextMilestone();

  return (
    <View className="star-trail">
      <View className="star-trail__header">
        <Text className="star-trail__title">我的星轨</Text>
        <Text className="star-trail__subtitle">已连续点亮 {consecutiveDays} 天</Text>
      </View>

      <ScrollView className="star-trail__timeline" scrollY>
        <View className="timeline">
          {sortedMilestones.filter(m => m.unlockedAt).map((milestone, index) => (
            <View key={milestone.id} className="timeline__item timeline__item--unlocked">
              <View className="timeline__node">
                <Text className="timeline__icon">{milestone.icon}</Text>
                <View className="timeline__glow" />
              </View>
              <View className="timeline__content">
                <Text className="timeline__day">Day {milestone.day || '?'}</Text>
                <Text className="timeline__title">{milestone.title}</Text>
                <Text className="timeline__desc">{milestone.description}</Text>
                <Text className="timeline__date">{milestone.unlockedAt}</Text>
              </View>
              {index < sortedMilestones.filter(m => m.unlockedAt).length - 1 && (
                <View className="timeline__line" />
              )}
            </View>
          ))}

          {nextMilestone && (
            <View className="timeline__item timeline__item--next">
              <View className="timeline__node timeline__node--next">
                <Text className="timeline__icon">?</Text>
              </View>
              <View className="timeline__content">
                <Text className="timeline__day">Day {nextMilestone.day || '?'}</Text>
                <Text className="timeline__title">{nextMilestone.title}</Text>
                <Text className="timeline__desc">{nextMilestone.description}</Text>
                <Text className="timeline__hint">下一个里程碑等你解锁</Text>
              </View>
              <View className="timeline__line timeline__line--dashed" />
            </View>
          )}

          <View className="timeline__item timeline__item--locked">
            <View className="timeline__node timeline__node--locked">
              <Text className="timeline__icon">···</Text>
            </View>
            <View className="timeline__content">
              <Text className="timeline__title">更多成就等你发现</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StarTrail;
