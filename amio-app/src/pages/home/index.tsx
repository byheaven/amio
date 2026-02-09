import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import StarTrail from '../../components/StarTrail';
import { loadProgress } from '../../utils/storage';
import { determineLandingBatch } from '../../utils/energyLogic';
import { useTheme } from '../../hooks/useTheme';
import { THEMES } from '../../constants/themes';
import type { GameProgress } from '../../utils/storage';
import './index.scss';

const Home: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const { themeId, switchTheme } = useTheme();

  // 加载进度的函数
  const refreshProgress = () => {
    setProgress(loadProgress());
  };

  // 页面挂载时加载
  useEffect(() => {
    refreshProgress();
  }, []);

  // 页面显示时刷新
  useDidShow(() => {
    refreshProgress();
  });

  if (!progress) return null;

  const landingBatch = determineLandingBatch(progress.ranking.percentile);

  const batchNames: Record<string, string> = {
    pioneer: '首批先驱者',
    early_pioneer: '早期开拓者',
    builder: '建设者',
    resident: '普通居民',
  };

  return (
    <View className="star-trail-page">
      <ScrollView className="star-trail-page__content" scrollY>
        {/* Identity Card */}
        <View className="identity-card">
          <View className="identity-card__header">
            <View className="identity-card__avatar">
              <Text>🦈</Text>
            </View>
            <View className="identity-card__info">
              <Text className="identity-card__name">鲨鱼用户</Text>
              <Text className="identity-card__title">{batchNames[landingBatch]}</Text>
            </View>
          </View>
          <View className="identity-card__priority">
            <Text className="priority-label">🚀 登陆优先级</Text>
            <View className="priority-value">
              <Text className="priority-percent">前 {progress.ranking.percentile}%</Text>
              <Text className="priority-rank">· #{progress.ranking.globalRank}</Text>
            </View>
          </View>
        </View>

        {/* Energy Cards */}
        <View className="energy-cards">
          <View className="energy-card energy-card--power">
            <Text className="energy-card__label">⚡ 动力核心</Text>
            <Text className="energy-card__value">{progress.energy.powerCore.toLocaleString()}</Text>
            <Text className="energy-card__rank">全服Top {progress.ranking.percentile}%</Text>
            <Text className="energy-card__weekly">本周 +2,340</Text>
          </View>
          <View className="energy-card energy-card--wisdom">
            <Text className="energy-card__label">💡 算力晶体</Text>
            <Text className="energy-card__value">{progress.energy.wisdomCrystal.toLocaleString()}</Text>
            <Text className="energy-card__rank">全服Top 8.7%</Text>
            <Text className="energy-card__weekly">本周 +890</Text>
          </View>
        </View>

        {/* Status Quick View */}
        <View className="status-bar">
          <View className="status-item">
            <Text className="status-item__label">📅 连续点亮</Text>
            <Text className="status-item__value">{progress.consecutiveDays}天</Text>
          </View>
          <View className="status-item">
            <Text className="status-item__label">🎯 本周</Text>
            <Text className="status-item__value">4/5</Text>
          </View>
        </View>

        {/* Star Trail Timeline */}
        <StarTrail milestones={progress.milestones} consecutiveDays={progress.consecutiveDays} />

        {/* Achievement Wall */}
        <View className="section">
          <Text className="section__title">🏅 成就墙</Text>
          <View className="achievement-wall">
            {progress.titles.slice(0, 5).map((title, i) => (
              <View key={i} className="achievement-badge">
                <Text>{title.icon}</Text>
                <Text className="achievement-badge__name">{title.name}</Text>
              </View>
            ))}
            <View className="achievement-badge achievement-badge--more">
              <Text>+3</Text>
            </View>
          </View>
        </View>

        {/* Theme Switcher */}
        <View className="section">
          <Text className="section__title">🎨 主题切换</Text>
          <View className="theme-picker">
            {THEMES.map((theme) => (
              <View
                key={theme.id}
                className={`theme-picker__item${themeId === theme.id ? ' theme-picker__item--active' : ''}`}
                onClick={() => switchTheme(theme.id)}
              >
                <View
                  className="theme-picker__preview"
                  style={{ background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 60%, ${theme.colors[2]} 100%)` }}
                >
                  <Text className="theme-picker__icon">{theme.icon}</Text>
                </View>
                <Text className="theme-picker__name">{theme.name}</Text>
                {themeId === theme.id && <Text className="theme-picker__check">✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Footer Links */}
        <View className="footer-links">
          <Text className="footer-link">⚙️ 设置</Text>
          <Text className="footer-link">📜 历史贡献</Text>
          <Text className="footer-link">❓ 帮助</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
