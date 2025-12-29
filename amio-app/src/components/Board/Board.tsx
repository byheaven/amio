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
    return (
        <View className="board">
            <View className="board-container">
                {tiles.map((tile) => (
                    <View
                        key={tile.id}
                        className="tile-wrapper"
                        style={{
                            left: `${tile.x * 32}px`, // Simple generic scaling for now
                            top: `${tile.y * 32}px`,
                            zIndex: tile.layer,
                        }}
                    >
                        <Tile data={tile} onClick={onTileClick} />
                    </View>
                ))}
            </View>
        </View>
    );
};

export default Board;
