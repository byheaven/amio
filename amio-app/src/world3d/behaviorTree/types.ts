export enum NodeStatus {
  Running = 'Running',
  Success = 'Success',
  Failure = 'Failure',
}

export interface BehaviorNode<TContext> {
  tick: (context: TContext) => NodeStatus;
  reset?: () => void;
}
