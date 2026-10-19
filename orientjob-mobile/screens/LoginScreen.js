import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:5000/api';

// SecureStore ne marche pas dans le navigateur : on utilise localStorage sur le web
const saveItem = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await saveItem('token', res.data.token);
      await saveItem('role', res.data.role);
      await saveItem('userId', String(res.data.userId));
      setError('');
      navigation.replace('Home');
    } catch (err) {
      const detail = err.response
        ? `Status ${err.response.status} : ${JSON.stringify(err.response.data)}`
        : `Pas de réponse du serveur (${err.message})`;
      console.log('Erreur connexion:', detail);
      setError(detail);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OrientJob</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button title="Se connecter" onPress={handleLogin} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Pas de compte ? S'inscrire
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  link: { color: '#2E6DA4', textAlign: 'center', marginTop: 16 },
});