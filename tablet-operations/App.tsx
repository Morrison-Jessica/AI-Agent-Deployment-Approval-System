import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type {
  DeploymentState,
  DeploymentStatus,
  ServerToClientEvents,
} from '../shared-types/index';

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
type Stage = { label: string; tone: 'neutral' | 'active' | 'success' | 'rejected' };
const stageNames = ['Request', 'Approval', 'Deploy', 'Complete'];
const notStarted: Stage = { label: 'Not started', tone: 'neutral' };
const done: Stage = { label: 'Done', tone: 'success' };
const approved: Stage = { label: 'Approved', tone: 'success' };
const pipeline: Record<DeploymentStatus, Stage[]> = {
  idle: [notStarted, notStarted, notStarted, notStarted],
  'awaiting-approval': [done, { label: 'Awaiting approval', tone: 'active' }, notStarted, notStarted],
  approved: [done, approved, notStarted, notStarted],
  rejected: [done, { label: 'Rejected', tone: 'rejected' }, notStarted, notStarted],
  deploying: [done, approved, { label: 'In progress', tone: 'active' }, notStarted],
  complete: [done, approved, done, { label: 'Complete', tone: 'success' }],
};

export default function App() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<DeploymentState | null>(null);

  useEffect(() => {
    if (!serverUrl) return;

    const socket: Socket<ServerToClientEvents, Record<string, never>> = io(serverUrl, {
      autoConnect: false,
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('state:update', (nextState) => setState(nextState));
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Deployment Operations</Text>
      <Text style={[styles.connection, connected ? styles.connected : styles.disconnected]}>
        {connected ? 'Connected' : 'Disconnected'}
      </Text>
      {!serverUrl && (
        <Text style={styles.notice}>
          Set EXPO_PUBLIC_SERVER_URL to http://YOUR-COMPUTER-LAN-IP:3001 when
          starting Expo, then reload the app.
        </Text>
      )}
      {!connected && state && (
        <Text style={styles.notice}>Disconnected. Showing last received state.</Text>
      )}

      <View style={styles.panel}>
        <Text style={styles.heading}>Deployment pipeline</Text>
        {state ? (
          <View style={styles.pipeline}>
            {pipeline[state.status].map((stage, index) => (
              <View key={stageNames[index]} style={[styles.stage, styles[stage.tone]]}>
                <Text style={styles.stageName}>{index + 1}. {stageNames[index]}</Text>
                <Text style={styles.stageLabel}>{stage.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.value}>Waiting for the server’s current state.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.heading}>Current shared state</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f5f8' },
  container: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  title: { fontSize: 30, fontWeight: '700', color: '#1e293b' },
  heading: { fontSize: 22, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
  connection: { fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 24 },
  connected: { color: '#18633b' },
  disconnected: { color: '#9b2929' },
  notice: { color: '#9b2929', fontSize: 18, marginBottom: 20 },
  panel: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dbe4',
    marginBottom: 24,
  },
  pipeline: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stage: { flexGrow: 1, flexBasis: 160, padding: 16, borderRadius: 6, borderWidth: 2 },
  neutral: { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
  active: { backgroundColor: '#eff6ff', borderColor: '#2459a9' },
  success: { backgroundColor: '#edf8f0', borderColor: '#18633b' },
  rejected: { backgroundColor: '#fff1f2', borderColor: '#9b2929' },
  stageName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  stageLabel: { fontSize: 17, color: '#1e293b' },
  label: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  value: { fontSize: 18, color: '#1e293b', marginTop: 4, marginBottom: 20 },
});
