import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';
export default function MyOffersScreen({ navigation }) {
const [offres, setOffres] = useState([]);
const [msg, setMsg] = useState('');
const load = () => api.get('/offres/mes-offres').then((r) => setOffres(r.data))
.catch((e) => setMsg(errMsg(e)));
useEffect(() => navigation.addListener('focus', load), [navigation]);
return (
<View style={s.container}>
<Text style={s.title}>Mes offres</Text>
{msg ? <Text style={s.error}>{msg}</Text> : null}
<FlatList data={offres} keyExtractor={(o) => String(o.id)} renderItem={({ item }) => (
<TouchableOpacity style={s.card}
onPress={() => navigation.navigate('Applicants', { offreId: item.id, titre: item.titre })}>
<Text style={s.cardTitle}>{item.titre}</Text>
<Text>{item.type} · {item.ville} · statut : {item.statut}</Text>
<Text>Candidatures : {item.nb_candidatures} · fiabilité {Math.round(item.score_fiabilite * 100)} %</Text>
</TouchableOpacity>
)} />
</View>
);
}