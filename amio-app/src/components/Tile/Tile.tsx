import React from 'react';
import { View, Text } from '@tarojs/components';
import { TileData } from '../../constants/game';
import { useTileIcon } from '../../themes/ThemeContext';
import './Tile.scss';

interface TileProps {
    data: TileData;
    onClick: (tile: TileData) => void;
    width?: number;
    height?: number;
}

const Tile: React.FC<TileProps> = ({ data, onClick, width = 60, height = 66 }) => {
    const { type, isClickable } = data;

    const handleClick = () => {
        if (isClickable) {
            onClick(data);
        }
    };

    const iconSvg = useTileIcon(type);

    return (
        <View
            className={`tile ${!isClickable ? 'disabled' : ''}`}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                // Position will be handled by the parent board usually, 
                // but if absolute positioning is needed per tile:
                // left: data.x * width,
                // top: data.y * height,
                // zIndex: data.layer
            }}
            onClick={handleClick}
        >
            {iconSvg ? (
                <View
                    className="icon-container"
                    dangerouslySetInnerHTML={{ __html: iconSvg }}
                />
            ) : (
                <Text className="content">{type}</Text>
            )}
        </View>
    );
};

export default Tile;
