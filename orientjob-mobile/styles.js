import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  card: { padding: 14, borderRadius: 8, backgroundColor: '#EAF2FB', marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  error: { color: 'red', marginBottom: 10 },
  ok: { color: 'green', marginBottom: 10 },
  link: { color: '#2E6DA4', textAlign: 'center', marginTop: 16 },
  gap: { height: 10 },
  label: { fontWeight: 'bold', marginBottom: 4 },
});