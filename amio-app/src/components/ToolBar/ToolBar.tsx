import React from 'react';
import { View, Text } from '@tarojs/components';
import './ToolBar.scss';

// SVG Icons for consistent cross-platform rendering
const UndoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
);

const PopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const ShuffleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);

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
    return (
        <View className="tool-bar">
            <View
                className={`tool-btn ${undoDisabled ? 'disabled' : ''}`}
                onClick={undoDisabled ? undefined : onUndo}
            >
                <View className="tool-icon"><UndoIcon /></View>
                <Text className="tool-name">撤回</Text>
                <Text className="tool-count">{undoDisabled ? '0/1' : '1/1'}</Text>
            </View>
            <View
                className={`tool-btn ${removeDisabled ? 'disabled' : ''}`}
                onClick={removeDisabled ? undefined : onRemove}
            >
                <View className="tool-icon"><PopIcon /></View>
                <Text className="tool-name">移出</Text>
                <Text className="tool-count">{removeDisabled ? '0/1' : '1/1'}</Text>
            </View>
            <View
                className={`tool-btn ${shuffleDisabled ? 'disabled' : ''}`}
                onClick={shuffleDisabled ? undefined : onShuffle}
            >
                <View className="tool-icon"><ShuffleIcon /></View>
                <Text className="tool-name">洗牌</Text>
                <Text className="tool-count">{shuffleDisabled ? '0/1' : '1/1'}</Text>
            </View>
        </View>
    );
};

export default ToolBar;
