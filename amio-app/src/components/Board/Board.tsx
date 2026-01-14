import React from 'react';
import { View } from '@tarojs/components';
import { TileData } from '../../constants/game';
import Tile from '../Tile/Tile';
import './Board.scss';

interface BoardProps {
    tiles: TileData[];
    onTileClick: (tile: TileData) => void;
}

const Board: React.FC<BoardProps> = ({ tiles, onTileClick }) => {
    // Tiles grid: x = 0-8 (9 cols), y = 0-11 (12 rows)
    // With 36px spacing to fill 340x400 tiles-area

    return (
        <View className="board">
            <View className="board-container">
                <View className="tiles-area">
                    {tiles.map((tile) => (
                        <View
                            key={tile.id}
                            className="tile-wrapper"
                            style={{
                                left: `${tile.x * 36}px`,
                                top: `${tile.y * 32}px`,
                                zIndex: tile.layer,
                            }}
                        >
                            <Tile data={tile} onClick={onTileClick} width={40} height={44} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default Board;
