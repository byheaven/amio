import { View, Text, ScrollView } from '@tarojs/components';
import { ContentTab, CONTENT_TAB_LABELS } from '../../constants/starOcean';
import './index.scss';

interface ContentTabBarProps {
  tabs: ContentTab[];
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
}

const ContentTabBar: React.FC<ContentTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <ScrollView scrollX className="content-tab-bar">
      <View className="content-tab-bar__inner">
        {tabs.map((tab) => (
          <View
            key={tab}
            className={`content-tab-bar__item${tab === activeTab ? ' content-tab-bar__item--active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            <Text className="content-tab-bar__label">
              {CONTENT_TAB_LABELS[tab]}
            </Text>
            {tab === activeTab && (
              <View className="content-tab-bar__indicator" />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default ContentTabBar;
