import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.2.192:5000/api';

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function ProfileScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [formation, setFormation] = useState('');
  const [competences, setCompetences] = useState('');
  const [message, setMessage] = useState('');

  // Charger le profil existant à l'ouverture de l'écran
  useEffect(() => {
    const charger = async () => {
      try {
        const token = await getItem('token');
        const res = await axios.get(`${API_URL}/profil/moi`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setNom(res.data.nom || '');
          setPrenom(res.data.prenom || '');
          setFormation(res.data.formation || '');
          setCompetences((res.data.competences || []).join(', '));
        }
      } catch (err) {
        // pas de profil encore : on laisse les champs vides
      }
    };
    charger();
  }, []);

  const handleSave = async () => {
    try {
      const token = await getItem('token');
      await axios.post(
        `${API_URL}/profil`,
        {
          nom,
          prenom,
          formation,
          competences: competences.split(',').map((c) => c.trim()).filter(Boolean),
          cvUrl: '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Profil enregistré !');
    } catch (err) {
      setMessage("Erreur lors de l'enregistrement");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>
      <TextInput placeholder="Nom" value={nom} onChangeText={setNom} style={styles.input} />
      <TextInput placeholder="Prénom" value={prenom} onChangeText={setPrenom} style={styles.input} />
      <TextInput placeholder="Formation (ex. IA & Cybersécurité)" value={formation} onChangeText={setFormation} style={styles.input} />
      <TextInput placeholder="Compétences (séparées par des virgules)" value={competences} onChangeText={setCompetences} style={styles.input} />
      {message ? <Text style={{ marginBottom: 10 }}>{message}</Text> : null}
      <Button title="Enregistrer" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
});