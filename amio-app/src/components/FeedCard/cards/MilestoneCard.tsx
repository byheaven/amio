import { View, Text } from '@tarojs/components';
import { MilestoneItem } from '../../../constants/starOcean';

interface MilestoneCardProps {
  item: MilestoneItem;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ item }) => {
  return (
    <View className="feed-card__body feed-card--milestone">
      <Text className="feed-card__milestone-emoji">{item.emoji}</Text>
      <Text className="feed-card__milestone-title">里程碑达成！</Text>
      <Text className="feed-card__milestone-text">{item.milestoneText}</Text>
      <Text className="feed-card__milestone-participants">
        全服 {item.participantCount.toLocaleString()} 位鲨鱼共同推动 🚀
      </Text>
    </View>
  );
};

export default MilestoneCard;
