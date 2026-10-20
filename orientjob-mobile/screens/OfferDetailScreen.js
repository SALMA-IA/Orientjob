import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function OfferDetailScreen({ route }) {
  const { offre } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{offre.titre}</Text>
      <Text style={styles.entreprise}>{offre.raison_sociale}</Text>

      <Text style={styles.label}>Ville</Text>
      <Text style={styles.value}>{offre.ville}</Text>

      <Text style={styles.label}>Durée</Text>
      <Text style={styles.value}>{offre.duree}</Text>

      <Text style={styles.label}>Description</Text>
      <Text style={styles.value}>{offre.description}</Text>

      <Text style={styles.label}>Compétences requises</Text>
      <View style={styles.tags}>
        {(offre.competences_requises || []).map((c, i) => (
          <Text key={i} style={styles.tag}>{c}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  entreprise: { fontSize: 16, color: '#2E6DA4', marginBottom: 16 },
  label: { fontWeight: 'bold', marginTop: 12 },
  value: { marginTop: 4, fontSize: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  tag: { backgroundColor: '#EAF2FB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
});