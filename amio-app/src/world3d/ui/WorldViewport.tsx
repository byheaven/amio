import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MoveInputVector } from '../input/composeMoveInput';
import VirtualJoystick from '../input/VirtualJoystick';
import { WorldRuntime } from '../runtime/WorldRuntime';
import { WorldPicker } from '../interaction/WorldPicker';
import { ChatService } from '../chat/ChatService';
import { WorldContextForPrompt, AgentAction } from '../chat/types';
import { BuildingSnapshot } from '../buildings/types';
import { BuilderAgent } from '../agents/BuilderAgent';
import ChatDialog from './ChatDialog';
import BuildingInfoPanel from './BuildingInfoPanel';
import './worldViewport.scss';
import './chatDialog.scss';
import './buildingInfoPanel.scss';

export interface WorldViewportProps {
  onLoaded?: () => void;
}

interface ChatState {
  isOpen: boolean;
  agentId: string;
  agentName: string;
  isThinking: boolean;
}

const AGENT_ZONE = 'Central Zone';

const chatService = new ChatService();

const WorldViewport: React.FC<WorldViewportProps> = ({ onLoaded }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const runtimeRef = useRef<WorldRuntime | null>(null);
  const pickerRef = useRef<WorldPicker | null>(null);
  const activeAgentRef = useRef<BuilderAgent | null>(null);

  const [showJoystick, setShowJoystick] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    agentId: '',
    agentName: '',
    isThinking: false,
  });
  const [chatMessages, setChatMessages] = useState<ReturnType<typeof chatService.getHistory>>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingSnapshot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Joystick detection
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

  // Setup picker after runtime has loaded — called by WorldRuntime when scene is ready
  const handleLoaded = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    const scene = runtime.getScene();
    const agentManager = runtime.getAgentManager();
    const buildingManager = runtime.getBuildingManager();

    if (!scene || !agentManager || !buildingManager) {
      return;
    }

    const picker = new WorldPicker({
      scene,
      agentManager,
      buildingManager,
      getPlayerPosition: () => runtime.getPlayerPosition(),
      getCurrentUserId: () => chatService.getUserId(),
      onAgentPicked: (result) => {
        const agent = result.agent;
        const userId = chatService.getUserId();
        activeAgentRef.current = agent;
        agent.startConversation(userId, runtime.getPlayerPosition() ?? new Vector3(0, 0, 0));

        setChatState({
          isOpen: true,
          agentId: result.agentId,
          agentName: result.agentName,
          isThinking: false,
        });
        setChatMessages(chatService.getHistory(result.agentId));
      },
      onBuildingPicked: (result) => {
        setSelectedBuilding(result.building);
      },
      onBuildingUnavailable: (reason) => {
        if (reason === 'under_construction') {
          showToast('This building is still under construction.');
          return;
        }
        showToast('Unable to find building details for this selection.');
      },
      onTooFar: (agentName) => {
        showToast(`走近一点再点击 ${agentName}！(Get closer to ${agentName}!)`);
      },
      onAgentBusy: (agentName) => {
        showToast(`${agentName} 正在忙，请稍后再试。`);
      },
    });

    pickerRef.current = picker;
    onLoaded?.();
  }, [onLoaded, showToast]);

  // Sync active agent's player position while chatting
  useEffect(() => {
    if (!chatState.isOpen) {
      return;
    }
    const interval = setInterval(() => {
      const runtime = runtimeRef.current;
      const agent = activeAgentRef.current;
      if (runtime && agent && agent.isInConversation()) {
        const pos = runtime.getPlayerPosition();
        if (pos) {
          agent.updateConversationPlayerPosition(pos);
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [chatState.isOpen]);

  const handleCloseChatDialog = useCallback(() => {
    const agent = activeAgentRef.current;
    if (agent) {
      agent.endConversation();
      activeAgentRef.current = null;
    }
    setChatState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const { agentId, agentName } = chatState;
    const runtime = runtimeRef.current;
    const agentManager = runtime?.getAgentManager();
    const buildingManager = runtime?.getBuildingManager();

    if (!agentId || !agentManager || !buildingManager) {
      return;
    }

    setChatState((prev) => ({ ...prev, isThinking: true }));

    const nearbyBuildings = buildingManager.getSnapshots()
      .filter((b) => b.status === 'complete')
      .slice(0, 5)
      .map((b) => {
        const playerPos = runtime?.getPlayerPosition();
        const dist = playerPos
          ? Math.sqrt((b.position.x - playerPos.x) ** 2 + (b.position.z - playerPos.z) ** 2)
          : 0;
        return { name: b.name, type: b.type, distance: Math.round(dist) };
      });

    const userId = chatService.getUserId();
    const clientDateKey = chatService.getClientDateKey();
    const agentSnapshot = agentManager.getAgentById(agentId)?.getSnapshot();
    const worldContext: WorldContextForPrompt = {
      agentId,
      agentName,
      agentZone: AGENT_ZONE,
      agentCurrentTask: agentSnapshot?.taskId ?? null,
      buildingCount: buildingManager.getSnapshots().length,
      nearbyBuildings,
      userDailyBuildCount: chatService.getDailyBuildCount(userId),
      userId,
    };

    try {
      const response = await chatService.sendMessage(
        agentId,
        message,
        worldContext,
        userId,
        clientDateKey,
      );
      setChatMessages(chatService.getHistory(agentId));

      if (response.action && response.action.type === 'build') {
        await handleBuildAction(
          agentId,
          response.action,
          agentManager,
          buildingManager,
          response.quota.pendingBuildToken,
          userId,
          clientDateKey,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'error';
      console.error('[WorldViewport] sendMessage error:', msg);
    } finally {
      setChatState((prev) => ({ ...prev, isThinking: false }));
    }
  }, [chatState]);

  const handleBuildAction = useCallback(async (
    agentId: string,
    action: AgentAction & { type: 'build' },
    agentManager: ReturnType<WorldRuntime['getAgentManager']>,
    buildingManager: ReturnType<WorldRuntime['getBuildingManager']>,
    pendingBuildToken: string | undefined,
    userId: string,
    clientDateKey: string,
  ) => {
    if (!agentManager || !buildingManager) {
      return;
    }

    const runtime = runtimeRef.current;
    const playerPos = runtime?.getPlayerPosition() ?? new Vector3(0, 1, 5);
    const agentObj = agentManager.getAgentById(agentId);

    if (!agentObj) {
      return;
    }

    const agentPos = agentObj.getPosition();
    const basePos = action.near === 'player' ? playerPos : agentPos;

    const candidateOffsets = [
      new Vector3(5, 0, 0),
      new Vector3(-5, 0, 0),
      new Vector3(0, 0, 5),
      new Vector3(0, 0, -5),
      new Vector3(7, 0, 7),
      new Vector3(-7, 0, 7),
    ];

    let buildPosition: Vector3 | null = null;
    for (const offset of candidateOffsets) {
      const candidate = basePos.add(offset);
      candidate.y = 0;
      if (!buildingManager.isPositionOccupied(candidate, 4)) {
        buildPosition = candidate;
        break;
      }
    }

    if (!buildPosition) {
      showToast('这附近没有空地可以建造了~ (No space available nearby!)');
      return;
    }

    const taskId = `user-task-${Date.now()}`;
    const assignmentResult = agentManager.assignUserBuildTask(agentId, {
      id: taskId,
      type: action.buildingType,
      name: action.name,
      position: buildPosition,
      requestedBy: userId,
    });

    if (assignmentResult === 'agent_busy') {
      showToast(`${agentObj.getDisplayName()} is busy with another build task.`);
      return;
    }

    if (assignmentResult !== 'assigned') {
      return;
    }

    if (pendingBuildToken) {
      try {
        const confirmResponse = await chatService.confirmBuildAccepted(userId, clientDateKey, pendingBuildToken);
        if (!confirmResponse.success) {
          chatService.recordAcceptedBuild(userId);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'error';
        console.error('[WorldViewport] confirmBuildAccepted error:', msg);
        chatService.recordAcceptedBuild(userId);
      }
    } else {
      chatService.recordAcceptedBuild(userId);
    }

    handleCloseChatDialog();
  }, [handleCloseChatDialog, showToast]);

  const handleContainerRef = useCallback((node: unknown) => {
    containerRef.current = node instanceof HTMLElement ? node : null;
  }, []);

  const handleJoystickChange = useCallback((vector: MoveInputVector) => {
    runtimeRef.current?.setJoystickInput(vector, true);
  }, []);

  const handleJoystickEnd = useCallback(() => {
    runtimeRef.current?.setJoystickInput({ x: 0, z: 0 }, false);
  }, []);

  // WorldRuntime lifecycle — uses handleLoaded to setup picker after scene is ready
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const runtime = new WorldRuntime(container, { onLoaded: handleLoaded });
    // Set ref BEFORE start() so handleLoaded can access it when called synchronously
    runtimeRef.current = runtime;
    runtime.start();

    return () => {
      pickerRef.current?.dispose();
      pickerRef.current = null;
      activeAgentRef.current = null;
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [handleLoaded]);

  return (
    <View className="world-viewport">
      <View className="world-viewport__canvas" ref={handleContainerRef} />
      {showJoystick && (
        <VirtualJoystick
          onChange={handleJoystickChange}
          onEnd={handleJoystickEnd}
        />
      )}

      <ChatDialog
        agentName={chatState.agentName || 'Builder'}
        messages={chatMessages}
        isThinking={chatState.isThinking}
        isOpen={chatState.isOpen}
        onSend={handleSendMessage}
        onClose={handleCloseChatDialog}
      />

      <BuildingInfoPanel
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
      />

      {toastMessage && (
        <View className="world-viewport__toast">
          <Text>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default WorldViewport;
