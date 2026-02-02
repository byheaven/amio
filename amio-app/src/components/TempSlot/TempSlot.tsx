import React from 'react';
import { View } from '@tarojs/components';
import { TempSlotStacks } from '../../utils/toolsLogic';
import Tile from '../Tile/Tile';
import './TempSlot.scss';

interface TempSlotProps {
    stacks: TempSlotStacks;
    onStackClick: (positionIndex: number) => void;
}

const TempSlot: React.FC<TempSlotProps> = ({ stacks, onStackClick }) => {
    // Check if all stacks are empty
    const hasAnyTiles = stacks.some(stack => stack.length > 0);
    if (!hasAnyTiles) return null;

    return (
        <View className="temp-slot">
            {stacks.map((stack, positionIndex) => (
                <View
                    key={positionIndex}
                    className="temp-position"
                    onClick={() => stack.length > 0 && onStackClick(positionIndex)}
                >
                    {stack.map((tile, stackIndex) => (
                        <View
                            key={tile.id}
                            className="stacked-tile"
                            style={{
                                zIndex: stackIndex,
                                transform: `translate(-50%, calc(-50% - ${stackIndex * 4}px))` // Centered + Visual offset for stacking
                            }}
                        >
                            <Tile
                                data={{ ...tile, isClickable: stackIndex === stack.length - 1 }}
                                onClick={() => { }} // Click handled by parent
                                width={32}
                                height={36}
                            />
                        </View>
                    ))}
                    {/* Show empty slot placeholder */}
                    {stack.length === 0 && <View className="empty-slot" />}
                </View>
            ))}
        </View>
    );
};

export default TempSlot;
