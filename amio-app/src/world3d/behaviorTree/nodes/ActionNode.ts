import { BehaviorNode, NodeStatus } from '../types';

export class ActionNode<TContext> implements BehaviorNode<TContext> {
  private readonly action: (context: TContext) => NodeStatus;

  public constructor(action: (context: TContext) => NodeStatus) {
    this.action = action;
  }

  public tick(context: TContext): NodeStatus {
    return this.action(context);
  }
}
