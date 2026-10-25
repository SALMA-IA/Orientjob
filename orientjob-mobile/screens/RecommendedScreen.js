import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function RecommendedScreen({ navigation }) {
  const [offres, setOffres] = useState([]);
  const [mode, setMode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/offres/recommandees')
      .then((r) => { setOffres(r.data.offres); setMode(r.data.mode); })
      .catch((e) => setMsg(errMsg(e)));
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>Offres recommandées</Text>
      {mode ? <Text style={s.label}>Moteur : {mode}</Text> : null}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      <FlatList
        data={offres}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('OfferDetail', { id: item.id })}
          >
            <Text style={s.cardTitle}>{item.titre}</Text>
            <Text>{item.raison_sociale} - {item.ville}</Text>
            <Text style={s.label}>Pertinence : {Math.round(item.score * 100)} %</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}