import { View, Text } from '@tarojs/components';
import { FeedItem, FeedCardType, CardInteractions } from '../../constants/starOcean';
import AiAggregatedCard from './cards/AiAggregatedCard';
import ImageTextPostCard from './cards/ImageTextPostCard';
import MilestoneCard from './cards/MilestoneCard';
import StarExpressCard from './cards/StarExpressCard';
import OfficialContentCard from './cards/OfficialContentCard';
import './index.scss';

interface CardActionsProps {
  interactions: CardInteractions;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

const CardActions: React.FC<CardActionsProps> = ({
  interactions,
  onLike,
  onComment,
  onShare,
}) => {
  const formatCount = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <View className="card-actions">
      <View className="card-actions__item" onClick={onLike}>
        <Text>❤️ {formatCount(interactions.likes)}</Text>
      </View>
      <View className="card-actions__item" onClick={onComment}>
        <Text>💬 {formatCount(interactions.comments)}</Text>
      </View>
      <View className="card-actions__item" onClick={onShare}>
        <Text>↗️ 分享</Text>
      </View>
    </View>
  );
};

interface FeedCardProps {
  item: FeedItem;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

function renderCard(item: FeedItem) {
  switch (item.type) {
    case FeedCardType.AI_AGGREGATED:
      return <AiAggregatedCard item={item} />;
    case FeedCardType.IMAGE_TEXT_POST:
      return <ImageTextPostCard item={item} />;
    case FeedCardType.MILESTONE:
      return <MilestoneCard item={item} />;
    case FeedCardType.STAR_EXPRESS:
      return <StarExpressCard item={item} />;
    case FeedCardType.OFFICIAL_CONTENT:
      return <OfficialContentCard item={item} />;
  }
}

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <View className="feed-card">
      {renderCard(item)}
      <CardActions
        interactions={item.interactions}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </View>
  );
};

export default FeedCard;
