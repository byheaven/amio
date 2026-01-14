import React from 'react';
import { View } from '@tarojs/components';
import { TileData, MAX_SLOTS } from '../../constants/game';
import Tile from '../Tile/Tile';
import './Slot.scss';

interface SlotProps {
    tiles: TileData[];
}

const Slot: React.FC<SlotProps> = ({ tiles }) => {
    // Create an array of length MAX_SLOTS to render placeholders if needed, 
    // but for now just rendering the tiles is enough. 
    // However, to keep strict layout, we might want to render empty cells.

    const slots = Array(MAX_SLOTS).fill(null).map((_, index) => tiles[index] || null);

    return (
        <View className="slot-bar">
            {slots.map((tile, index) => (
                <View key={`slot-${index}`} className="slot-cell">
                    {tile && (
                        // Tiles in slot are generally not clickable to move back to board in basic version,
                        // or valid for 'move out' prop. For now, disable click.
                        <Tile
                            data={{ ...tile, isClickable: false }}
                            onClick={() => { }}
                            width={32}
                            height={36}
                        />
                    )}
                </View>
            ))}
        </View>
    );
};

export default Slot;
