import React, { useCallback, useRef, useState } from 'react';
import { View } from '@tarojs/components';
import { MoveInputVector } from './composeMoveInput';
import './virtualJoystick.scss';

interface JoystickPosition {
  x: number;
  y: number;
}

export interface VirtualJoystickProps {
  onChange: (vector: MoveInputVector) => void;
  onEnd: () => void;
}

const JOYSTICK_MAX_RADIUS = 44;

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onChange, onEnd }) => {
  const [knobOffset, setKnobOffset] = useState<JoystickPosition>({ x: 0, y: 0 });
  const centerRef = useRef<JoystickPosition>({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  const updateFromTouchPoint = useCallback((touchX: number, touchY: number) => {
    const center = centerRef.current;
    const rawDeltaX = touchX - center.x;
    const rawDeltaY = touchY - center.y;
    const distance = Math.sqrt(rawDeltaX * rawDeltaX + rawDeltaY * rawDeltaY);

    const clampRatio = distance > JOYSTICK_MAX_RADIUS
      ? JOYSTICK_MAX_RADIUS / distance
      : 1;
    const clampedX = rawDeltaX * clampRatio;
    const clampedY = rawDeltaY * clampRatio;

    setKnobOffset({ x: clampedX, y: clampedY });
    onChange({
      x: clampedX / JOYSTICK_MAX_RADIUS,
      z: -clampedY / JOYSTICK_MAX_RADIUS,
    });
  }, [onChange]);

  const handleTouchStart = useCallback((event: any) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    draggingRef.current = true;
    updateFromTouchPoint(touch.clientX, touch.clientY);
  }, [updateFromTouchPoint]);

  const handleTouchMove = useCallback((event: any) => {
    if (!draggingRef.current) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    updateFromTouchPoint(touch.clientX, touch.clientY);
  }, [updateFromTouchPoint]);

  const handleTouchEnd = useCallback((event?: any) => {
    if (event) {
      if (event.cancelable) {
        event.preventDefault();
      }
      event.stopPropagation();
    }

    draggingRef.current = false;
    setKnobOffset({ x: 0, y: 0 });
    onChange({ x: 0, z: 0 });
    onEnd();
  }, [onChange, onEnd]);

  return (
    <View
      className="virtual-joystick"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <View className="virtual-joystick__base">
        <View
          className="virtual-joystick__knob"
          style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
        />
      </View>
    </View>
  );
};

export default VirtualJoystick;
