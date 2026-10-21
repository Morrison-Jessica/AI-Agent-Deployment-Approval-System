import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  DeploymentState,
  ServerToClientEvents,
} from '../shared-types/index.js';

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

let state: DeploymentState = {
  release: '',
  environment: 'staging',
  status: 'idle',
  agentRequest: null,
  lastAction: null,
};

io.on('connection', (socket) => {
  socket.emit('state:update', state);

  socket.on('deployment:request', (request) => {
    state = {
      release: request.release,
      environment: request.environment,
      status: 'awaiting-approval',
      agentRequest: request.agentRequest,
      lastAction: 'Deployment requested',
    };
    io.emit('state:update', state);
  });

  socket.on('deployment:approve', () => {
    state = { ...state, status: 'approved', lastAction: 'Deployment approved' };
    io.emit('state:update', state);
  });

  socket.on('deployment:reject', () => {
    state = { ...state, status: 'rejected', lastAction: 'Deployment rejected' };
    io.emit('state:update', state);
  });
});

httpServer.listen(3001, () => {
  console.log('Deployment approval server listening on port 3001');
});
