export type DeploymentStatus =
  | 'idle'
  | 'awaiting-approval'
  | 'approved'
  | 'rejected'
  | 'deploying'
  | 'complete';

export interface DeploymentState {
  release: string;
  environment: 'staging' | 'production';
  status: DeploymentStatus;
  agentRequest: string | null;
  lastAction: string | null;
}

export interface DeploymentRequest {
  release: string;
  environment: DeploymentState['environment'];
  agentRequest: string;
}

export interface ClientToServerEvents {
  'deployment:request': (request: DeploymentRequest) => void;
  'deployment:approve': () => void;
  'deployment:reject': () => void;
}

export interface ServerToClientEvents {
  'state:update': (state: DeploymentState) => void;
}
