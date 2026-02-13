import { View } from '@tarojs/components';
import { FeedItem } from '../../constants/starOcean';
import FeedCard from '../FeedCard';
import './index.scss';

interface ContentFeedProps {
  items: FeedItem[];
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
}

const ContentFeed: React.FC<ContentFeedProps> = ({
  items,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <View className="content-feed">
      {items.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          onLike={() => onLike?.(item.id)}
          onComment={() => onComment?.(item.id)}
          onShare={() => onShare?.(item.id)}
        />
      ))}
    </View>
  );
};

export default ContentFeed;
