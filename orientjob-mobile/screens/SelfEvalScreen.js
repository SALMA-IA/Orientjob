import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Button } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function SelfEvalScreen({ navigation }) {
  const [q, setQ] = useState({ technique: [], soft: [] });
  const [niv, setNiv] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/orientation/questionnaire').then((r) => setQ(r.data)).catch((e) => setMsg(errMsg(e)));
  }, []);

  const ligne = (comp) => (
    <View key={comp} style={{ marginBottom: 12 }}>
      <Text style={s.label}>{comp}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setNiv({ ...niv, [comp]: n })}
            style={{
              width: 38, height: 38, borderRadius: 19,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: niv[comp] === n ? '#1F4E79' : '#DDD',
            }}
          >
            <Text style={{ color: niv[comp] === n ? '#fff' : '#000' }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const envoyer = async () => {
    try {
      await api.post('/orientation/evaluation', { niveaux: niv });
      navigation.navigate('Recommendations');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Auto-évaluation</Text>
      <Text style={{ marginBottom: 10 }}>1 = débutant, 5 = expert. Évalue au moins 3 compétences.</Text>
      <Text style={[s.cardTitle, { marginBottom: 8 }]}>Compétences techniques</Text>
      {q.technique.map(ligne)}
      <Text style={[s.cardTitle, { marginBottom: 8 }]}>Soft skills</Text>
      {q.soft.map(ligne)}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      <Button title="Voir mes recommandations" onPress={envoyer} />
    </ScrollView>
  );
}