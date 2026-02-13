import { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { ContentTab, FeedItem, PlanetPulseData } from '../../constants/starOcean';
import { syncPlanetProgress } from '../../utils/energyLogic';
import { MOCK_PLANET_PULSE, AI_TAGLINES, getMockFeedByTab } from '../../mocks/starOceanMock';
import PlanetPulse from '../../components/PlanetPulse';
import ContentTabBar from '../../components/ContentTabBar';
import ContentFeed from '../../components/ContentFeed';
import FloatingPostButton from '../../components/FloatingPostButton';
import './index.scss';

const ALL_TABS = [
  ContentTab.RECOMMEND,
  ContentTab.HOT,
  ContentTab.PLANET_UPDATE,
  ContentTab.CREATION,
  ContentTab.COMPETITION,
];

const StarOcean: React.FC = () => {
  const [planetPulse, setPlanetPulse] = useState<PlanetPulseData>(MOCK_PLANET_PULSE);
  const [activeTab, setActiveTab] = useState<ContentTab>(ContentTab.RECOMMEND);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(getMockFeedByTab(ContentTab.RECOMMEND));
  const [currentTagline, setCurrentTagline] = useState<string>(AI_TAGLINES[0]);
  const taglineIndexRef = useRef(0);

  // Rotate AI tagline every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      taglineIndexRef.current = (taglineIndexRef.current + 1) % AI_TAGLINES.length;
      setCurrentTagline(AI_TAGLINES[taglineIndexRef.current]);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Refresh planet data
  const refreshData = useCallback(() => {
    syncPlanetProgress().then((data) => {
      setPlanetPulse({
        progress: data.progress,
        dailyChange: MOCK_PLANET_PULSE.dailyChange,
        onlineCount: data.activeUsers,
      });
    });
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Refresh on tab show (tab bar pages stay in memory)
  useDidShow(() => {
    refreshData();
  });

  const handleTabChange = useCallback((tab: ContentTab) => {
    setActiveTab(tab);
    setFeedItems(getMockFeedByTab(tab));
  }, []);

  const handleLike = useCallback((id: string) => {
    console.log('Like:', id);
  }, []);

  const handleComment = useCallback((id: string) => {
    console.log('Comment:', id);
  }, []);

  const handleShare = useCallback((id: string) => {
    console.log('Share:', id);
  }, []);

  const handlePostTap = useCallback(() => {
    Taro.showToast({ title: '即将开放', icon: 'none' });
  }, []);

  return (
    <View className="star-ocean">
      <PlanetPulse
        progress={planetPulse.progress}
        dailyChange={planetPulse.dailyChange}
        onlineCount={planetPulse.onlineCount}
        aiTagline={currentTagline}
      />
      <ScrollView scrollY className="star-ocean__body">
        <ContentTabBar
          tabs={ALL_TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <ContentFeed
          items={feedItems}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
      </ScrollView>
      <FloatingPostButton onTap={handlePostTap} />
    </View>
  );
};

export default StarOcean;
