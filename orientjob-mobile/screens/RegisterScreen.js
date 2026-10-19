import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (role) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password, role });
      navigation.replace('Login');
    } catch (err) {
      const detail = err.response
        ? `Status ${err.response.status} : ${JSON.stringify(err.response.data)}`
        : `Pas de réponse du serveur (${err.message})`;
      console.log('Erreur inscription:', detail);
      setError(detail);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput
        placeholder="Email académique"
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
      <Button title="S'inscrire en tant qu'étudiant" onPress={() => handleRegister('etudiant')} />
      <View style={{ height: 10 }} />
      <Button title="S'inscrire en tant que recruteur" onPress={() => handleRegister('recruteur')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
});