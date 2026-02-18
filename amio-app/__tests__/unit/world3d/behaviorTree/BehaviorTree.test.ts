import { BehaviorTree } from '@/world3d/behaviorTree/BehaviorTree';
import { BehaviorNode, NodeStatus } from '@/world3d/behaviorTree/types';

describe('BehaviorTree', () => {
  it('delegates tick to root node', () => {
    const root: BehaviorNode<{ value: number }> = {
      tick: (context) => (context.value > 0 ? NodeStatus.Success : NodeStatus.Failure),
    };

    const tree = new BehaviorTree(root);
    expect(tree.tick({ value: 1 })).toBe(NodeStatus.Success);
    expect(tree.tick({ value: 0 })).toBe(NodeStatus.Failure);
  });

  it('calls root reset when reset is invoked', () => {
    const reset = jest.fn();
    const root: BehaviorNode<Record<string, never>> = {
      tick: () => NodeStatus.Success,
      reset,
    };

    const tree = new BehaviorTree(root);
    tree.reset();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
