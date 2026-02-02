import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import PlanetView from '../../components/PlanetView';
import { syncPlanetProgress } from '../../utils/energyLogic';
import './index.scss';

const StarOcean: React.FC = () => {
  const [planetProgress, setPlanetProgress] = useState(67.3);
  const [activeUsers, setActiveUsers] = useState(12847);

  useEffect(() => {
    syncPlanetProgress().then(data => {
      setPlanetProgress(data.progress);
      setActiveUsers(data.activeUsers);
    });
  }, []);

  return (
    <View className="star-ocean">
      {/* Header */}
      <View className="star-ocean__header">
        <Text className="star-ocean__title">🌊 星海</Text>
        <Text className="star-ocean__notify">🔔</Text>
      </View>

      <ScrollView className="star-ocean__content" scrollY>
        {/* Planet Card */}
        <View className="planet-card">
          <PlanetView progress={planetProgress} size="small" showLabel={false} />
          <View className="planet-card__stats">
            <Text className="stat">已苏醒 {planetProgress.toFixed(1)}%</Text>
            <Text className="stat">今日 {activeUsers.toLocaleString()} 人在线</Text>
            <Text className="stat">今日全服 +0.12%</Text>
          </View>
        </View>

        {/* Planet Ranking */}
        <View className="section">
          <Text className="section__title">星际开发进度榜</Text>
          <ScrollView className="planet-rankings" scrollX>
            <View className="ranking-card ranking-card--current">
              <Text className="ranking-card__icon">🦈</Text>
              <Text className="ranking-card__rank">#1</Text>
              <Text className="ranking-card__name">鲨之星</Text>
              <Text className="ranking-card__progress">67.3%</Text>
            </View>
            <View className="ranking-card">
              <Text className="ranking-card__icon">🐟</Text>
              <Text className="ranking-card__rank">#2</Text>
              <Text className="ranking-card__name">鳗鱼星</Text>
              <Text className="ranking-card__progress">61.8%</Text>
            </View>
            <View className="ranking-card">
              <Text className="ranking-card__icon">🌙</Text>
              <Text className="ranking-card__rank">#3</Text>
              <Text className="ranking-card__name">月光星</Text>
              <Text className="ranking-card__progress">58.2%</Text>
            </View>
          </ScrollView>
        </View>

        {/* Community Feed */}
        <View className="section">
          <Text className="section__title">社区动态</Text>
          <View className="feed-item">
            <Text className="feed-item__badge">📢</Text>
            <View className="feed-item__content">
              <Text className="feed-item__title">鲨之星今日突破67%！</Text>
              <Text className="feed-item__desc">距离下一个里程碑"飞船就绪"还需12.7%</Text>
            </View>
          </View>
          <View className="feed-item">
            <Text className="feed-item__avatar">🦈</Text>
            <View className="feed-item__content">
              <Text className="feed-item__author">鲨鱼小明</Text>
              <Text className="feed-item__text">今天Hero模式一把过！太爽了 🎉</Text>
              <View className="feed-item__actions">
                <Text>❤️ 234</Text>
                <Text>💬 56</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Post Button */}
      <View className="post-button">✏️</View>
    </View>
  );
};

export default StarOcean;
