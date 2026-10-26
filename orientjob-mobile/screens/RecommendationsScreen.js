import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function RecommendationsScreen() {
  const [metiers, setMetiers] = useState([]);
  const [mode, setMode] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [ecarts, setEcarts] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/orientation/recommandations')
      .then((r) => { setMetiers(r.data.metiers); setMode(r.data.mode); })
      .catch((e) => setMsg(errMsg(e)));
  }, []);

  const voir = async (m) => {
    if (ouvert === m.id) { setOuvert(null); return; }
    try {
      const r = await api.get(`/orientation/ecarts/${m.id}`);
      setEcarts(r.data.ecarts);
      setOuvert(m.id);
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Mes recommandations</Text>
      {mode ? <Text style={s.label}>Moteur sémantique : {mode}</Text> : null}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      {metiers.map((m) => (
        <TouchableOpacity key={m.id} style={s.card} onPress={() => voir(m)}>
          <Text style={s.cardTitle}>{m.nom} : {m.score} %</Text>
          <View style={{ height: 8, backgroundColor: '#CCC', borderRadius: 4, marginVertical: 6 }}>
            <View style={{ height: 8, width: `${m.score}%`, backgroundColor: '#1F4E79', borderRadius: 4 }} />
          </View>
          <Text>{m.description}</Text>
          {ouvert === m.id && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.label}>Compétences à acquérir (par priorité) :</Text>
              {ecarts.length === 0 && <Text>Aucun écart : profil compatible</Text>}
              {ecarts.map((e) => (
                <Text key={e.competence}>
                  - {e.competence} : niveau {e.actuel}/{e.requis} - {e.formation}
                </Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}