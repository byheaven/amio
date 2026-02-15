import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from '@tarojs/components';
import { MoveInputVector } from '../input/composeMoveInput';
import VirtualJoystick from '../input/VirtualJoystick';
import { WorldRuntime } from '../runtime/WorldRuntime';
import './worldViewport.scss';

export interface WorldViewportProps {
  onLoaded?: () => void;
}

const WorldViewport: React.FC<WorldViewportProps> = ({ onLoaded }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const runtimeRef = useRef<WorldRuntime | null>(null);
  const [showJoystick, setShowJoystick] = useState(false);

  const handleContainerRef = useCallback((node: unknown) => {
    containerRef.current = node instanceof HTMLElement ? node : null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const syncJoystickVisibility = () => {
      setShowJoystick(mediaQuery.matches);
    };

    syncJoystickVisibility();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncJoystickVisibility);
      return () => {
        mediaQuery.removeEventListener('change', syncJoystickVisibility);
      };
    }

    mediaQuery.addListener(syncJoystickVisibility);
    return () => {
      mediaQuery.removeListener(syncJoystickVisibility);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const runtime = new WorldRuntime(container, { onLoaded });
    runtime.start();
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [onLoaded]);

  const handleJoystickChange = useCallback((vector: MoveInputVector) => {
    runtimeRef.current?.setJoystickInput(vector, true);
  }, []);

  const handleJoystickEnd = useCallback(() => {
    runtimeRef.current?.setJoystickInput({ x: 0, z: 0 }, false);
  }, []);

  return (
    <View className="world-viewport">
      <View className="world-viewport__canvas" ref={handleContainerRef} />
      {showJoystick && (
        <VirtualJoystick
          onChange={handleJoystickChange}
          onEnd={handleJoystickEnd}
        />
      )}
    </View>
  );
};

export default WorldViewport;
