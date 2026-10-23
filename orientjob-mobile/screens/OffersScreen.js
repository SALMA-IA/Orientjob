import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Switch, Button } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';
export default function OffersScreen({ navigation, route }) {
const type = route.params?.type || 'stage';
const [offres, setOffres] = useState([]);
const [q, setQ] = useState('');
const [ville, setVille] = useState('');
const [contrat, setContrat] = useState('');
const [tele, setTele] = useState(false);
const [msg, setMsg] = useState('');
const charger = async () => {
try {
const r = await api.get('/offres', { params: { type, q: q || undefined, ville: ville || undefined,
typeContrat: contrat || undefined, teletravail: tele ? 'true' : undefined } });
setOffres(r.data); setMsg('');
} catch (e) { setMsg(errMsg(e)); }
};
useEffect(() => { charger(); }, []);
return (
<View style={s.container}>
OrientJob — Guide de développement, suite (étapes 13 à 28) Page 17
<Text style={s.title}>{type === 'emploi' ? "Offres d'emploi" : 'Offres de stage'}</Text>
<TextInput placeholder="Filière ou mot-clé (ex. python)" value={q} onChangeText={setQ} style={s.input} />
<TextInput placeholder="Ville" value={ville} onChangeText={setVille} style={s.input} />
{type === 'emploi' && (
<View>
<TextInput placeholder="Contrat (CDI, CDD, freelance)" value={contrat}
onChangeText={setContrat} style={s.input} />
<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
<Switch value={tele} onValueChange={setTele} /><Text> Télétravail uniquement</Text>
</View>
</View>
)}
<Button title="Rechercher" onPress={charger} />
{msg ? <Text style={s.error}>{msg}</Text> : null}
<View style={s.gap} />
<FlatList data={offres} keyExtractor={(o) => String(o.id)} renderItem={({ item }) => (
<TouchableOpacity style={s.card} onPress={() => navigation.navigate('OfferDetail', { id: item.id })}>
<Text style={s.cardTitle}>{item.titre}</Text>
<Text>{item.raison_sociale} · {item.ville} · {item.type_contrat || item.duree || ''}</Text>
<Text>{item.score_fiabilite >= 0.8 ? ' Fiable' : '⚠ À vérifier'}</Text>
</TouchableOpacity>
)} />
</View>
);
}