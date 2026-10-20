import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, Button, StyleSheet,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:5000/api'; // ou http://192.168.2.192:5000/api sur téléphone

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function OffersScreen({ navigation }) {
  const [offres, setOffres] = useState([]);
  const [ville, setVille] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const chargerOffres = async () => {
    setChargement(true);
    setErreur('');
    try {
      const token = await getItem('token');
      const res = await axios.get(`${API_URL}/offres`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: 'stage', ville: ville.trim() || undefined },
      });
      setOffres(res.data);
    } catch (err) {
      setErreur(err.response?.data?.error || err.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerOffres(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offres de stage</Text>

      <TextInput
        placeholder="Filtrer par ville (ex. Casablanca)"
        value={ville}
        onChangeText={setVille}
        onSubmitEditing={chargerOffres}
        style={styles.input}
      />
      <Button title="Rechercher" onPress={chargerOffres} />
      <View style={{ height: 12 }} />

      {chargement && <ActivityIndicator size="large" />}
      {erreur ? <Text style={styles.erreur}>Erreur : {erreur}</Text> : null}

      <FlatList
        data={offres}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          !chargement && !erreur ? <Text style={styles.vide}>Aucune offre trouvée.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OfferDetail', { offre: item })}
          >
            <Text style={styles.cardTitle}>{item.titre}</Text>
            <Text style={styles.entreprise}>{item.raison_sociale}</Text>
            <Text>{item.ville} — {item.duree}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 },
  card: { padding: 14, borderRadius: 8, backgroundColor: '#EAF2FB', marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  entreprise: { color: '#2E6DA4', marginVertical: 2 },
  erreur: { color: 'red', marginBottom: 10 },
  vide: { textAlign: 'center', marginTop: 20, color: '#666' },
});