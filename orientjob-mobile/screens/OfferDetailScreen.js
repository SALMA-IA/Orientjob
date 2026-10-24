import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Button, TextInput, View } from 'react-native';
import api, { errMsg } from '../api';
import { getItem } from '../storage';
import { s } from '../styles';

export default function OfferDetailScreen({ route }) {
  const { id } = route.params;
  const [o, setO] = useState(null);
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');
  const [motif, setMotif] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api.get(`/offres/${id}`).then((r) => setO(r.data)).catch((e) => setMsg(errMsg(e)));
    getItem('role').then((r) => setRole(r || ''));
  }, [id]);

  const postuler = async () => {
    try {
      await api.post('/candidatures', { offreId: id });
      setMsg('Candidature envoyée');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  const signaler = async () => {
    try {
      await api.post('/signalements', { offreId: id, motif });
      setMsg('Signalement envoyé, merci');
      setShowReport(false);
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  if (!o) {
    return (
      <View style={s.container}>
        <Text>{msg || 'Chargement...'}</Text>
      </View>
    );
  }

  const pct = Math.round(o.score_fiabilite * 100);
  const candidat = role === 'etudiant' || role === 'diplome';

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>{o.titre}</Text>
      <Text style={s.label}>{o.raison_sociale} - {o.ville}</Text>
      <Text>
        Type : {o.type} {o.type_contrat ? `(${o.type_contrat})` : ''} {o.duree ? `- ${o.duree}` : ''}
      </Text>
      {o.experience ? <Text>Expérience : {o.experience}</Text> : null}
      {o.salaire ? <Text>Salaire indicatif : {o.salaire}</Text> : null}
      {o.teletravail ? <Text>Télétravail possible</Text> : null}
      <Text style={{ marginVertical: 10 }}>{o.description}</Text>
      <Text>Compétences : {(o.competences_requises || []).join(', ')}</Text>
      <Text style={[s.label, { marginTop: 10 }]}>
        Score de fiabilité : {pct} % {pct >= 80 ? '' : '(à vérifier)'}
      </Text>
      {msg ? <Text style={s.label}>{msg}</Text> : null}
      <View style={s.gap} />
      {candidat && <Button title="Postuler en un clic" onPress={postuler} />}
      <View style={s.gap} />
      <Button title="Signaler cette offre" color="#a00" onPress={() => setShowReport(!showReport)} />
      {showReport && (
        <View style={{ marginTop: 10 }}>
          <TextInput
            placeholder="Motif du signalement"
            value={motif}
            onChangeText={setMotif}
            style={s.input}
          />
          <Button title="Envoyer le signalement" onPress={signaler} />
        </View>
      )}
    </ScrollView>
  );
}