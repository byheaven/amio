import { BehaviorNode, NodeStatus } from '../types';

export class SelectorNode<TContext> implements BehaviorNode<TContext> {
  private readonly children: Array<BehaviorNode<TContext>>;
  private runningIndex = 0;

  public constructor(children: Array<BehaviorNode<TContext>>) {
    this.children = children;
  }

  public reset(): void {
    this.runningIndex = 0;
    this.children.forEach((child) => child.reset?.());
  }

  public tick(context: TContext): NodeStatus {
    for (let index = this.runningIndex; index < this.children.length; index += 1) {
      const status = this.children[index].tick(context);
      if (status === NodeStatus.Running) {
        this.runningIndex = index;
        return NodeStatus.Running;
      }
      if (status === NodeStatus.Success) {
        this.reset();
        return NodeStatus.Success;
      }
    }

    this.reset();
    return NodeStatus.Failure;
  }
}
