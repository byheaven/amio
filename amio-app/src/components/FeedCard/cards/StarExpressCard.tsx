import { View, Text } from '@tarojs/components';
import { StarExpressItem } from '../../../constants/starOcean';

interface StarExpressCardProps {
  item: StarExpressItem;
}

const StarExpressCard: React.FC<StarExpressCardProps> = ({ item }) => {
  return (
    <View className="feed-card__body feed-card--express">
      <Text className="feed-card__express-headline">{item.headline}</Text>
      <Text className="feed-card__express-text">{item.urgencyText}</Text>
      <View className="feed-card__express-cta">
        <Text className="feed-card__express-cta-label">{item.ctaLabel}</Text>
      </View>
    </View>
  );
};

export default StarExpressCard;
