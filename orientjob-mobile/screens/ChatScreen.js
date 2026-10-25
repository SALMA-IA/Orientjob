import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function ChatScreen({ route, navigation }) {
  const { candidatureId, titre } = route.params;
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    api.get(`/messages/${candidatureId}`)
      .then((r) => { setMsgs(r.data); setErr(''); })
      .catch((e) => setErr(errMsg(e)));

  useEffect(() => {
    navigation.setOptions({ title: titre });
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!txt.trim()) return;
    try {
      await api.post(`/messages/${candidatureId}`, { contenu: txt });
      setTxt('');
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <View style={[s.container, { paddingBottom: 10 }]}>
      {err ? <Text style={s.error}>{err}</Text> : null}
      <FlatList
        data={msgs}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.moi ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: item.moi ? '#CDE6FF' : '#EEE',
              padding: 10,
              borderRadius: 10,
              marginBottom: 6,
            }}
          >
            <Text>{item.contenu}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <TextInput
          placeholder="Ton message"
          value={txt}
          onChangeText={setTxt}
          style={[s.input, { flex: 1, marginBottom: 0 }]}
        />
        <Button title="Envoyer" onPress={send} />
      </View>
    </View>
  );
}