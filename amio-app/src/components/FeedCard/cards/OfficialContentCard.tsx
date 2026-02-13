import { View, Text, Image } from '@tarojs/components';
import { OfficialContentItem } from '../../../constants/starOcean';

interface OfficialContentCardProps {
  item: OfficialContentItem;
}

const OfficialContentCard: React.FC<OfficialContentCardProps> = ({ item }) => {
  return (
    <View className="feed-card__body feed-card--official">
      <View className="feed-card__official-header">
        <Text className="feed-card__official-badge">{item.badge}</Text>
        <Text className="feed-card__official-title">{item.title}</Text>
      </View>
      <Text className="feed-card__official-summary">{item.summary}</Text>
      <Image
        className="feed-card__official-cover"
        src={item.coverImage}
        mode="aspectFill"
      />
    </View>
  );
};

export default OfficialContentCard;
