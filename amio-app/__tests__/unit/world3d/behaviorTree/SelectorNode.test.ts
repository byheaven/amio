import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';
import { SelectorNode } from '@/world3d/behaviorTree/nodes/SelectorNode';
import { NodeStatus } from '@/world3d/behaviorTree/types';

describe('SelectorNode', () => {
  it('returns Success when any child succeeds', () => {
    const selector = new SelectorNode([
      new ActionNode(() => NodeStatus.Failure),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(selector.tick({})).toBe(NodeStatus.Success);
  });

  it('returns Failure when all children fail', () => {
    const selector = new SelectorNode([
      new ActionNode(() => NodeStatus.Failure),
      new ActionNode(() => NodeStatus.Failure),
    ]);

    expect(selector.tick({})).toBe(NodeStatus.Failure);
  });

  it('resumes from the running child on next tick', () => {
    let firstCalls = 0;
    const selector = new SelectorNode([
      new ActionNode(() => {
        firstCalls += 1;
        return firstCalls === 1 ? NodeStatus.Running : NodeStatus.Success;
      }),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(selector.tick({})).toBe(NodeStatus.Running);
    expect(selector.tick({})).toBe(NodeStatus.Success);
  });
});
