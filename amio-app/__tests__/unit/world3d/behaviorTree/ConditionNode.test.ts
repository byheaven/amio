import { ConditionNode } from '@/world3d/behaviorTree/nodes/ConditionNode';
import { NodeStatus } from '@/world3d/behaviorTree/types';

describe('ConditionNode', () => {
  it('returns Success when predicate is true', () => {
    const node = new ConditionNode(() => true);
    expect(node.tick({})).toBe(NodeStatus.Success);
  });

  it('returns Failure when predicate is false', () => {
    const node = new ConditionNode(() => false);
    expect(node.tick({})).toBe(NodeStatus.Failure);
  });
});
