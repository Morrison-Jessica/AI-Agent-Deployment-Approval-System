import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  DeploymentState,
  ServerToClientEvents,
} from '../shared-types/index';

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
type DeploymentSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export default function App() {
  const socketRef = useRef<DeploymentSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<DeploymentState | null>(null);

  useEffect(() => {
    if (!serverUrl) return;

    const socket: DeploymentSocket = io(serverUrl, { autoConnect: false });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('state:update', (nextState) => setState(nextState));
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function decide(approved: boolean) {
    const socket = socketRef.current;
    if (!serverUrl || !socket?.connected || state?.status !== 'awaiting-approval') return;

    void Haptics.notificationAsync(
      approved
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {
      // Haptic availability must not prevent sending the decision.
    });
    if (approved) {
      socket.emit('deployment:approve');
    } else {
      socket.emit('deployment:reject');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Deployment Approval</Text>
      <Text style={[styles.connection, connected ? styles.connected : styles.disconnected]}>
        {connected ? 'Connected' : 'Disconnected'}
      </Text>

      {!serverUrl && (
        <Text style={styles.notice}>
          Set EXPO_PUBLIC_SERVER_URL to http://YOUR-COMPUTER-LAN-IP:3001 when
          starting Expo, then reload the app. Approval controls are disabled until configured.
        </Text>
      )}

      <View style={styles.panel}>
        <Text style={styles.heading}>Current shared state</Text>
        {!connected && state && (
          <Text style={styles.notice}>Disconnected. Showing last received state.</Text>
        )}
        {state ? (
          <>
            <Text style={styles.label}>Release</Text>
            <Text style={styles.value}>{state.release || '—'}</Text>
            <Text style={styles.label}>Environment</Text>
            <Text style={styles.value}>{state.environment}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{state.status}</Text>
            <Text style={styles.label}>Agent request</Text>
            <Text style={styles.value}>{state.agentRequest ?? '—'}</Text>
            <Text style={styles.label}>Last action</Text>
            <Text style={styles.value}>{state.lastAction ?? '—'}</Text>
          </>
        ) : (
          <Text style={styles.value}>Waiting for the server’s current state.</Text>
        )}
      </View>

      {state?.status === 'awaiting-approval' && (
        <View style={styles.actions}>
          <Button
            title="Approve"
            color="#18633b"
            disabled={!serverUrl || !connected}
            onPress={() => decide(true)}
          />
          <Button
            title="Reject"
            color="#9b2929"
            disabled={!serverUrl || !connected}
            onPress={() => decide(false)}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f5f8',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  heading: { fontSize: 20, fontWeight: '600', color: '#1e293b', marginBottom: 16 },
  connection: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 20 },
  connected: { color: '#18633b' },
  disconnected: { color: '#9b2929' },
  notice: { color: '#9b2929', fontSize: 16, marginBottom: 20 },
  panel: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dbe4',
  },
  label: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  value: { fontSize: 16, color: '#1e293b', marginTop: 4, marginBottom: 16 },
  actions: { gap: 16, marginTop: 24 },
});
