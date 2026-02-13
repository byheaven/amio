import { View, Text, Image } from '@tarojs/components';
import { AiAggregatedItem } from '../../../constants/starOcean';

interface AiAggregatedCardProps {
  item: AiAggregatedItem;
}

const AiAggregatedCard: React.FC<AiAggregatedCardProps> = ({ item }) => {
  return (
    <View className="feed-card__body feed-card--ai">
      <View className="feed-card__ai-header">
        <Text className="feed-card__ai-icon">🤖</Text>
        <Text className="feed-card__ai-quote">"{item.aiQuote}"</Text>
      </View>
      <View className="feed-card__ai-content">
        <Image
          className="feed-card__ai-thumb"
          src={item.thumbnail}
          mode="aspectFill"
        />
        <View className="feed-card__ai-info">
          <Text className="feed-card__ai-title">{item.title}</Text>
          <Text className="feed-card__ai-source">来源：{item.source}</Text>
        </View>
      </View>
    </View>
  );
};

export default AiAggregatedCard;
