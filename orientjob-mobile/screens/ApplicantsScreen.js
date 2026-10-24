import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function ApplicantsScreen({ navigation, route }) {
  const { offreId } = route.params;
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () =>
    api.get(`/candidatures/offre/${offreId}`)
      .then((r) => setList(r.data))
      .catch((e) => setMsg(errMsg(e)));

  useEffect(() => {
    load();
  }, []);

  const act = async (id, path, body) => {
    try {
      await api.patch(`/candidatures/${id}/${path}`, body);
      load();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Candidats</Text>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item: c }) => (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {c.prenom} {c.nom} - pertinence {Math.round(c.score * 100)} %
            </Text>
            <Text>{c.formation} - {c.ville}</Text>
            <Text>Compétences : {(c.competences || []).join(', ')}</Text>
            <Text style={s.label}>Statut : {c.statut} - CV : {c.a_cv ? 'oui' : 'non'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Button title="Entretien" onPress={() => act(c.id, 'statut', { statut: 'entretien' })} />
              <Button title="Accepter" onPress={() => act(c.id, 'statut', { statut: 'acceptee' })} />
              <Button title="Refuser" color="#a00" onPress={() => act(c.id, 'statut', { statut: 'refusee' })} />
            </View>
            <View style={s.gap} />
            {c.match_recruteur ? (
              <Button
                title="Messagerie"
                onPress={() =>
                  navigation.navigate('Chat', {
                    candidatureId: c.id,
                    titre: `${c.prenom} ${c.nom}`,
                  })
                }
              />
            ) : (
              <Button title="Match (intérêt confirmé)" onPress={() => act(c.id, 'match')} />
            )}
          </View>
        )}
      />
    </View>
  );
}