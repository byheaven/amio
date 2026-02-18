import { BehaviorNode, NodeStatus } from '../types';

export class ConditionNode<TContext> implements BehaviorNode<TContext> {
  private readonly predicate: (context: TContext) => boolean;

  public constructor(predicate: (context: TContext) => boolean) {
    this.predicate = predicate;
  }

  public tick(context: TContext): NodeStatus {
    return this.predicate(context) ? NodeStatus.Success : NodeStatus.Failure;
  }
}
