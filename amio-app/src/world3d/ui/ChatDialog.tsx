import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { ChatMessage } from '../chat/types';
import './chatDialog.scss';

type KeyboardEvent = React.KeyboardEvent<HTMLInputElement>;

export interface ChatDialogProps {
  agentName: string;
  messages: ChatMessage[];
  isThinking: boolean;
  isOpen: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  agentName,
  messages,
  isThinking,
  isOpen,
  onSend,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking) {
      return;
    }
    setInputValue('');
    onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return null;
  }

  const firstOpenMessage = messages.length === 0 ? (
    <View className="chat-dialog__bubble chat-dialog__bubble--agent">
      <View className="chat-dialog__avatar">{agentName[0]}</View>
      <View className="chat-dialog__bubble-content">
        <Text>你好！有什么我可以帮你建造的吗？ (Hi! What can I build for you?)</Text>
      </View>
    </View>
  ) : null;

  return (
    <View className="chat-dialog">
      <View className="chat-dialog__overlay" onClick={onClose} />
      <View className="chat-dialog__sheet">
        <View className="chat-dialog__header">
          <View className="chat-dialog__agent-info">
            <View className="chat-dialog__avatar chat-dialog__avatar--header">{agentName[0]}</View>
            <Text className="chat-dialog__agent-name">{agentName}</Text>
          </View>
          <View className="chat-dialog__close" onClick={onClose}>
            <Text>✕</Text>
          </View>
        </View>

        <View className="chat-dialog__messages">
          {firstOpenMessage}
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`chat-dialog__bubble chat-dialog__bubble--${msg.role === 'user' ? 'user' : 'agent'}`}
            >
              {msg.role === 'assistant' && (
                <View className="chat-dialog__avatar">{agentName[0]}</View>
              )}
              <View className="chat-dialog__bubble-content">
                <Text>{msg.content}</Text>
              </View>
            </View>
          ))}
          {isThinking && (
            <View className="chat-dialog__bubble chat-dialog__bubble--agent">
              <View className="chat-dialog__avatar">{agentName[0]}</View>
              <View className="chat-dialog__bubble-content chat-dialog__bubble-content--thinking">
                <View className="chat-dialog__dots">
                  <View className="chat-dialog__dot" />
                  <View className="chat-dialog__dot" />
                  <View className="chat-dialog__dot" />
                </View>
              </View>
            </View>
          )}
          <View ref={(el) => { messagesEndRef.current = el as HTMLDivElement | null; }} />
        </View>

        <View className="chat-dialog__input-bar">
          {/* Note: Taro Input doesn't support onKeyDown on H5; send via button */}
          <input
            className="chat-dialog__input"
            value={inputValue}
            placeholder="说点什么... (Say something...)"
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
          />
          <View
            className={`chat-dialog__send-btn${isThinking || !inputValue.trim() ? ' chat-dialog__send-btn--disabled' : ''}`}
            onClick={handleSend}
          >
            <Text>发送</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChatDialog;
