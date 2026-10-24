import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

const LABEL = {
  recue: 'Reçue',
  en_cours: "En cours d'examen",
  entretien: 'Entretien',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
};

export default function MyApplicationsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () =>
    api.get('/candidatures/mes')
      .then((r) => setList(r.data))
      .catch((e) => setMsg(errMsg(e)));

  useEffect(() => navigation.addListener('focus', load), [navigation]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Mes candidatures</Text>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => {
          const match = item.match_etudiant && item.match_recruteur;
          return (
            <View style={s.card}>
              <Text style={s.cardTitle}>{item.titre}</Text>
              <Text>{item.raison_sociale} - {item.ville}</Text>
              <Text style={s.label}>Statut : {LABEL[item.statut]}</Text>
              {match ? (
                <Button
                  title="Ouvrir la messagerie"
                  onPress={() =>
                    navigation.navigate('Chat', { candidatureId: item.id, titre: item.titre })
                  }
                />
              ) : (
                <Text>Messagerie : en attente de l'intérêt du recruteur</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}