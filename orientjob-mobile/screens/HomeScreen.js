import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const removeItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.removeItem(key);
  return await SecureStore.deleteItemAsync(key);
};

export default function HomeScreen({ navigation }) {
  const [role, setRole] = useState('');

  useEffect(() => {
    getItem('role').then((r) => setRole(r || ''));
  }, []);

  const logout = async () => {
    await removeItem('token');
    await removeItem('role');
    await removeItem('userId');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion réussie ✅</Text>
      <Text style={styles.sub}>Rôle : {role}</Text>
      <Button title="Se déconnecter" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  sub: { fontSize: 16, marginBottom: 20 },
});