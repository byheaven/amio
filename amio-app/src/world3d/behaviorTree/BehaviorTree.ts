import { BehaviorNode, NodeStatus } from './types';

export class BehaviorTree<TContext> {
  private readonly root: BehaviorNode<TContext>;

  public constructor(root: BehaviorNode<TContext>) {
    this.root = root;
  }

  public tick(context: TContext): NodeStatus {
    return this.root.tick(context);
  }

  public reset(): void {
    this.root.reset?.();
  }
}
