import React, { useEffect, useState } from 'react';
import { ScrollView, TextInput, Button, Text, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function ProfileScreen() {
  const [f, setF] = useState({ nom: '', prenom: '', formation: '', competences: '', ville: '' });
  const [hasCv, setHasCv] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (v) => setF({ ...f, [k]: v });

  useEffect(() => {
    api.get('/profil/moi').then((r) => {
      const p = r.data;
      if (p) {
        setF({
          nom: p.nom || '',
          prenom: p.prenom || '',
          formation: p.formation || '',
          competences: (p.competences || []).join(', '),
          ville: p.ville || '',
        });
        setHasCv(!!p.cv_url);
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.post('/profil', {
        ...f,
        competences: f.competences.split(',').map((c) => c.trim()).filter(Boolean),
      });
      setMsg('Profil enregistré');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  const pickCv = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (r.canceled) return;
    const a = r.assets[0];
    const fd = new FormData();
    if (Platform.OS === 'web') fd.append('cv', a.file, a.name);
    else fd.append('cv', { uri: a.uri, name: a.name, type: 'application/pdf' });
    try {
      await api.post('/profil/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHasCv(true);
      setMsg('CV envoyé et chiffré');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Mon profil</Text>
      <TextInput placeholder="Nom" value={f.nom} onChangeText={set('nom')} style={s.input} />
      <TextInput placeholder="Prénom" value={f.prenom} onChangeText={set('prenom')} style={s.input} />
      <TextInput placeholder="Formation (ex. IA & Cybersécurité)" value={f.formation}
        onChangeText={set('formation')} style={s.input} />
      <TextInput placeholder="Compétences (virgules)" value={f.competences}
        onChangeText={set('competences')} style={s.input} />
      <TextInput placeholder="Ville" value={f.ville} onChangeText={set('ville')} style={s.input} />
      {msg ? <Text style={s.label}>{msg}</Text> : null}
      <Button title="Enregistrer le profil" onPress={save} />
      <Text style={[s.label, { marginTop: 20 }]}>CV : {hasCv ? 'envoyé' : 'aucun'}</Text>
      <Button title="Choisir mon CV (PDF)" onPress={pickCv} />
    </ScrollView>
  );
}