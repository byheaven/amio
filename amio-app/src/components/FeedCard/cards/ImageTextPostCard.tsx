import { View, Text, Image } from '@tarojs/components';
import { ImageTextPostItem } from '../../../constants/starOcean';

interface ImageTextPostCardProps {
  item: ImageTextPostItem;
}

const ImageTextPostCard: React.FC<ImageTextPostCardProps> = ({ item }) => {
  const imageCount = item.images.length;
  const gridClass = imageCount <= 9 ? `image-grid--${imageCount}` : 'image-grid--9';

  return (
    <View className="feed-card__body feed-card--post">
      <View className="feed-card__post-header">
        <Text className="feed-card__post-avatar">{item.userAvatar}</Text>
        <Text className="feed-card__post-name">{item.userName}</Text>
      </View>
      <Text className="feed-card__post-content">{item.content}</Text>
      {imageCount > 0 && (
        <View className={`feed-card__image-grid ${gridClass}`}>
          {item.images.map((img, idx) => (
            <Image
              key={idx}
              className="feed-card__image-item"
              src={img}
              mode="aspectFill"
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ImageTextPostCard;
