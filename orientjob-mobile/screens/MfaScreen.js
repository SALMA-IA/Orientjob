import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Button, Image } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

export default function MfaScreen() {
  const [active, setActive] = useState(false);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/mfa/statut').then((r) => setActive(r.data.mfa_active)).catch(() => {});
  }, []);

  const setup = async () => {
    try {
      const r = await api.post('/mfa/setup');
      setQr(r.data.qr);
      setSecret(r.data.secret);
      setMsg('');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  const activer = async () => {
    try {
      await api.post('/mfa/activer', { code });
      setActive(true);
      setQr('');
      setMsg('MFA activée');
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Double authentification</Text>
      <Text style={s.label}>État : {active ? 'activée' : 'désactivée'}</Text>
      {!active && <Button title="Générer mon QR code" onPress={setup} />}
      {qr ? (
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Image source={{ uri: qr }} style={{ width: 200, height: 200 }} />
          <Text selectable>Clé manuelle : {secret}</Text>
          <TextInput
            placeholder="Code à 6 chiffres"
            value={code}
            onChangeText={setCode}
            style={[s.input, { width: 200, marginTop: 10 }]}
            keyboardType="number-pad"
          />
          <Button title="Activer" onPress={activer} />
        </View>
      ) : null}
      {msg ? <Text style={s.label}>{msg}</Text> : null}
    </ScrollView>
  );
}