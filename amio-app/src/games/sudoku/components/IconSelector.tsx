import React from 'react';
import { View, Text } from '@tarojs/components';

interface IconSelectorProps {
  symbols: string[];
  onPick: (symbol: string) => void;
  onClear: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  symbols,
  onPick,
  onClear,
  disabled = false,
  disabledReason = null,
}) => {
  return (
    <View className={`icon-selector${disabled ? ' icon-selector--disabled' : ''}`}>
      {symbols.map((symbol, index) => (
        <View
          key={`${symbol}-${index}`}
          className={`icon-selector__item${disabled ? ' icon-selector__item--disabled' : ''}`}
          data-selector-symbol={symbol}
          onClick={() => {
            if (disabled) {
              return;
            }
            onPick(symbol);
          }}
        >
          <Text>{symbol}</Text>
        </View>
      ))}
      <View
        className={`icon-selector__item${disabled ? ' icon-selector__item--disabled' : ''}`}
        data-selector-symbol="clear"
        onClick={() => {
          if (disabled) {
            return;
          }
          onClear();
        }}
      >
        <Text>✕</Text>
      </View>
      {disabled && disabledReason && (
        <Text className="icon-selector__reason">{disabledReason}</Text>
      )}
    </View>
  );
};

export default IconSelector;
