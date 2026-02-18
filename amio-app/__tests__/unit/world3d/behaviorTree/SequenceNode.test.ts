import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';
import { SequenceNode } from '@/world3d/behaviorTree/nodes/SequenceNode';
import { NodeStatus } from '@/world3d/behaviorTree/types';

describe('SequenceNode', () => {
  it('returns Failure when any child fails', () => {
    const sequence = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => NodeStatus.Failure),
    ]);

    expect(sequence.tick({})).toBe(NodeStatus.Failure);
  });

  it('returns Success when all children succeed', () => {
    const sequence = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(sequence.tick({})).toBe(NodeStatus.Success);
  });

  it('resumes from the running child on next tick', () => {
    let secondCalls = 0;
    const sequence = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => {
        secondCalls += 1;
        return secondCalls === 1 ? NodeStatus.Running : NodeStatus.Success;
      }),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(sequence.tick({})).toBe(NodeStatus.Running);
    expect(sequence.tick({})).toBe(NodeStatus.Success);
  });
});
