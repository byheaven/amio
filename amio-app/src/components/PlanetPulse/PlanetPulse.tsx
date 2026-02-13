import { View, Text } from '@tarojs/components';
import PlanetView from '../PlanetView';
import './index.scss';

interface PlanetPulseProps {
  progress: number;
  dailyChange: number;
  onlineCount: number;
  aiTagline: string;
  onTap?: () => void;
}

const PlanetPulse: React.FC<PlanetPulseProps> = ({
  progress,
  dailyChange,
  onlineCount,
  aiTagline,
  onTap,
}) => {
  return (
    <View
      className={`planet-pulse${onTap ? ' planet-pulse--tappable' : ''}`}
      onClick={onTap}
    >
      <View className="planet-pulse__planet">
        <PlanetView progress={progress} size="small" showLabel={false} animated={false} />
      </View>
      <View className="planet-pulse__stats">
        <Text className="planet-pulse__progress">
          已苏醒 {progress.toFixed(1)}%
        </Text>
        <Text className="planet-pulse__change">
          ↑{dailyChange.toFixed(2)}%
        </Text>
        <Text className="planet-pulse__online">
          👥 {onlineCount.toLocaleString()} 在线
        </Text>
        <Text className="planet-pulse__tagline">{aiTagline}</Text>
      </View>
    </View>
  );
};

export default PlanetPulse;
