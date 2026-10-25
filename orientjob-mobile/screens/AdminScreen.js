import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, ScrollView } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';

const TABS = {
  Entreprises: '/admin/entreprises?statut=en_attente',
  Signalements: '/admin/signalements',
  Modération: '/admin/offres-moderation',
  Audit: '/admin/audit',
};

export default function AdminScreen() {
  const [tab, setTab] = useState('Entreprises');
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () =>
    api.get(TABS[tab])
      .then((r) => { setData(r.data); setMsg(''); })
      .catch((e) => setMsg(errMsg(e)));

  useEffect(() => { load(); }, [tab]);

  const p = async (url, body) => {
    try {
      await api.patch(url, body);
      load();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  const row = { flexDirection: 'row', gap: 8, marginTop: 6 };

  const renderItem = ({ item: x }) => {
    if (tab === 'Entreprises')
      return (
        <View style={s.card}>
          <Text style={s.cardTitle}>{x.raison_sociale}</Text>
          <Text>ICE/RC : {x.ice_rc} - {x.secteur} - {x.email}</Text>
          <View style={row}>
            <Button title="Valider" onPress={() => p(`/admin/entreprises/${x.id}`, { statut: 'verifiee' })} />
            <Button title="Refuser" color="#a00"
              onPress={() => p(`/admin/entreprises/${x.id}`, { statut: 'refusee' })} />
          </View>
        </View>
      );
    if (tab === 'Signalements')
      return (
        <View style={s.card}>
          <Text style={s.cardTitle}>{x.titre}</Text>
          <Text>Motif : {x.motif} (par {x.auteur})</Text>
          <View style={row}>
            <Button title="Masquer l'offre" color="#a00"
              onPress={() => p(`/admin/signalements/${x.id}`, { action: 'masquer' })} />
            <Button title="Rejeter" onPress={() => p(`/admin/signalements/${x.id}`, { action: 'rejeter' })} />
          </View>
        </View>
      );
    if (tab === 'Modération')
      return (
        <View style={s.card}>
          <Text style={s.cardTitle}>{x.titre} ({x.raison_sociale})</Text>
          <Text>Fiabilité {Math.round(x.score_fiabilite * 100)} % - {x.raisons_fraude}</Text>
          <View style={row}>
            <Button title="Approuver" onPress={() => p(`/admin/offres/${x.id}`, { statut: 'active' })} />
            <Button title="Refuser" color="#a00" onPress={() => p(`/admin/offres/${x.id}`, { statut: 'refusee' })} />
          </View>
        </View>
      );
    return (
      <View style={s.card}>
        <Text style={s.label}>{x.action}</Text>
        <Text>{x.email || 'anonyme'} - {x.adresse_ip} - {new Date(x.date_action).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Administration</Text>
      <ScrollView horizontal style={{ flexGrow: 0, marginBottom: 10 }}>
        {Object.keys(TABS).map((t) => (
          <View key={t} style={{ marginRight: 8 }}>
            <Button title={t} color={t === tab ? '#1F4E79' : '#999'} onPress={() => setTab(t)} />
          </View>
        ))}
      </ScrollView>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      {!data.length && !msg ? <Text>Rien à afficher.</Text> : null}
      <FlatList data={data} keyExtractor={(x) => String(x.id)} renderItem={renderItem} />
    </View>
  );
}