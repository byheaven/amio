import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';
import { NodeStatus } from '@/world3d/behaviorTree/types';

describe('ActionNode', () => {
  it('returns the action result', () => {
    const node = new ActionNode(() => NodeStatus.Running);
    expect(node.tick({})).toBe(NodeStatus.Running);
  });
});
