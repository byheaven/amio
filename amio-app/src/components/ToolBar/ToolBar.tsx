import React from 'react';
import { View, Text } from '@tarojs/components';
import { useToolIcons } from '../../themes/ThemeContext';
import './ToolBar.scss';

interface ToolBarProps {
    onUndo: () => void;
    onShuffle: () => void;
    onRemove: () => void;
    undoDisabled?: boolean;
    shuffleDisabled?: boolean;
    removeDisabled?: boolean;
}

const ToolBar: React.FC<ToolBarProps> = ({
    onUndo,
    onShuffle,
    onRemove,
    undoDisabled = false,
    shuffleDisabled = false,
    removeDisabled = false,
}) => {
    const toolIcons = useToolIcons();

    return (
        <View className="tool-bar">
            <View
                className={`tool-btn ${undoDisabled ? 'disabled' : ''}`}
                onClick={undoDisabled ? undefined : onUndo}
            >
                <View className="tool-icon" dangerouslySetInnerHTML={{ __html: toolIcons.undo }} />
                <Text className="tool-name">撤回</Text>
                <Text className="tool-count">{undoDisabled ? '0/1' : '1/1'}</Text>
            </View>
            <View
                className={`tool-btn ${removeDisabled ? 'disabled' : ''}`}
                onClick={removeDisabled ? undefined : onRemove}
            >
                <View className="tool-icon" dangerouslySetInnerHTML={{ __html: toolIcons.pop }} />
                <Text className="tool-name">移出</Text>
                <Text className="tool-count">{removeDisabled ? '0/1' : '1/1'}</Text>
            </View>
            <View
                className={`tool-btn ${shuffleDisabled ? 'disabled' : ''}`}
                onClick={shuffleDisabled ? undefined : onShuffle}
            >
                <View className="tool-icon" dangerouslySetInnerHTML={{ __html: toolIcons.shuffle }} />
                <Text className="tool-name">洗牌</Text>
                <Text className="tool-count">{shuffleDisabled ? '0/1' : '1/1'}</Text>
            </View>
        </View>
    );
};

export default ToolBar;
