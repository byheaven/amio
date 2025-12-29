import React from 'react';
import { View, Text } from '@tarojs/components';
import './ToolBar.scss';

interface ToolBarProps {
    onUndo: () => void;
    onShuffle: () => void;
    onRemove: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({ onUndo, onShuffle, onRemove }) => {
    return (
        <View className="tool-bar">
            <View className="tool-btn" onClick={onUndo}>
                <Text>Undo</Text>
            </View>
            <View className="tool-btn" onClick={onShuffle}>
                <Text>Shuffle</Text>
            </View>
            <View className="tool-btn" onClick={onRemove}>
                <Text>Pop</Text>
            </View>
        </View>
    );
};

export default ToolBar;
