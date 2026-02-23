import React from 'react';
import { View, Text } from '@tarojs/components';
import { BuildingSnapshot } from '../buildings/types';
import './buildingInfoPanel.scss';

export interface BuildingInfoPanelProps {
  building: BuildingSnapshot | null;
  onClose: () => void;
}

const BUILDING_TYPE_LABELS: Record<string, string> = {
  monument: '纪念碑 Monument',
  house: '小屋 House',
  garden: '花园 Garden',
};

const formatTime = (ms: number): string => {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const BuildingInfoPanel: React.FC<BuildingInfoPanelProps> = ({ building, onClose }) => {
  if (!building) {
    return null;
  }

  const typeLabel = BUILDING_TYPE_LABELS[building.type] ?? building.type;
  const builtTime = formatTime(building.createdAtMs);
  const requestedBy = building.requestedBy === 'system'
    ? 'Shark Star AI'
    : building.requestedBy;

  return (
    <View className="building-info-panel">
      <View className="building-info-panel__overlay" onClick={onClose} />
      <View className="building-info-panel__card">
        <View className="building-info-panel__header">
          <View className="building-info-panel__icon">
            {building.type === 'monument' ? '🏛️' : building.type === 'house' ? '🏠' : '🌿'}
          </View>
          <View className="building-info-panel__title-group">
            <Text className="building-info-panel__name">{building.name}</Text>
            <Text className="building-info-panel__type">{typeLabel}</Text>
          </View>
          <View className="building-info-panel__close" onClick={onClose}>
            <Text>✕</Text>
          </View>
        </View>

        <View className="building-info-panel__body">
          <View className="building-info-panel__row">
            <Text className="building-info-panel__label">建造者 Builder</Text>
            <Text className="building-info-panel__value">Shark Star AI</Text>
          </View>
          <View className="building-info-panel__row">
            <Text className="building-info-panel__label">命名者 Named by</Text>
            <Text className="building-info-panel__value">{requestedBy}</Text>
          </View>
          <View className="building-info-panel__row">
            <Text className="building-info-panel__label">建造时间 Built</Text>
            <Text className="building-info-panel__value">{builtTime}</Text>
          </View>
        </View>

        <View className="building-info-panel__footer">
          <Text className="building-info-panel__footer-text">
            这座建筑是鲨之星历史的一部分。
          </Text>
          <Text className="building-info-panel__footer-text building-info-panel__footer-text--en">
            This building is part of Shark Star's history.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default BuildingInfoPanel;
