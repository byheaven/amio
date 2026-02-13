import { View, Text } from '@tarojs/components';
import './index.scss';

interface FloatingPostButtonProps {
  onTap?: () => void;
}

const FloatingPostButton: React.FC<FloatingPostButtonProps> = ({ onTap }) => {
  return (
    <View className="floating-post-btn" onClick={onTap}>
      <Text className="floating-post-btn__icon">+</Text>
    </View>
  );
};

export default FloatingPostButton;
