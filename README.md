# AI Agent Deployment Approval System

A real-time multi-device prototype that simulates an AI agent requesting approval before a software deployment can continue.

## Components

- **Web Admin** — creates a deployment request
- **Mobile Approval** — approves or rejects the request
- **Tablet Operations** — displays live deployment status
- **Server** — manages shared state and Socket.IO communication
- **Shared Types** — keeps TypeScript state and event definitions consistent

## Tech Stack

- React
- React Native
- Expo SDK 57
- TypeScript
- Vite
- Node.js
- Socket.IO
- Expo Haptics

## How to Run

Use Node.js **22.18.0**.

Start each part of the project in its own terminal:
```
cd server
npm run start
```
```
cd web-admin
npm run dev
```
```
cd mobile-approval
npm run start
```
```
cd tablet-operations
npm run start
```

For physical-device testing, the Expo apps must be able to reach the development computer over the local network.

## Prototype Flow

1. Web Admin creates a deployment request.
2. The server updates the shared state.
3. Mobile and Tablet receive the request in real time.
4. Mobile approves or rejects the request.
5. Web and Tablet immediately display the updated status.

## Testing

Verified:

- Server TypeScript check
- Web build and lint
- Mobile TypeScript check
- Tablet TypeScript check
- Real-time request synchronization
- Approve flow
- Reject flow

Haptic feedback is implemented but was not physically verified on a phone.

## Challenges / Change Log

- Used NVM to keep the project on Node.js 22.18.0 when new terminals defaulted to Node 25.
- Resolved a Vite TypeScript / ESLint dependency conflict by using TypeScript 6.0.3.
- Removed unnecessary Expo-generated agent and Claude configuration files.
- Corrected the local ChatGPT project path after the desktop app reinstall.
- Updated Expo Go to match Expo SDK 57.

## Current Limitations

- State is stored in server memory and resets when the server restarts.
- No database or authentication.
- AI agent behavior is simulated.
- No real deployment integration.
- Automatic deployment and completion stages are not implemented yet.

## AI Disclosure

ChatGPT assisted with organizing, planning, troubleshooting, and drafting portions of this project. I reviewed, tested, edited, and approved the final implementation and documentation.
