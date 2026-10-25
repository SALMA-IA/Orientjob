import React, { useState } from 'react';
import { ScrollView, TextInput, Button, Text, View, Switch } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';
export default function PublishOfferScreen() {
const [type, setType] = useState('stage');
const [f, setF] = useState({ titre: '', description: '', competences: '', ville: '', duree: '',
experience: '', secteur: '', typeContrat: '', salaire: '' });
const [tele, setTele] = useState(false);
const [msg, setMsg] = useState('');
const set = (k) => (v) => setF({ ...f, [k]: v });
const publier = async () => {
try {
const r = await api.post('/offres', {
...f, type, teletravail: tele,
competencesRequises: f.competences.split(',').map((c) => c.trim()).filter(Boolean),
});
const pct = Math.round(r.data.score_fiabilite * 100);
setMsg(r.data.statut === 'active'
? `Offre publiée (fiabilité ${pct} %)`
: `Offre en modération (fiabilité ${pct} %) : ${r.data.raisons_fraude}`);
} catch (e) { setMsg(errMsg(e)); }
};
return (
<ScrollView contentContainerStyle={s.container}>
<Text style={s.title}>Publier une offre</Text>
<View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
<Button title="Stage" color={type === 'stage' ? '#1F4E79' : '#999'} onPress={() => setType('stage')} />
<Button title="Emploi" color={type === 'emploi' ? '#1F4E79' : '#999'} onPress={() => setType('emploi')} />
</View>
<TextInput placeholder="Titre" value={f.titre} onChangeText={set('titre')} style={s.input} />
<TextInput placeholder="Description" value={f.description} onChangeText={set('description')}
style={[s.input, { height: 90 }]} multiline />
<TextInput placeholder="Compétences requises (virgules)" value={f.competences}
onChangeText={set('competences')} style={s.input} />
<TextInput placeholder="Ville" value={f.ville} onChangeText={set('ville')} style={s.input} />
<TextInput placeholder="Durée (ex. 3 mois)" value={f.duree} onChangeText={set('duree')} style={s.input} />
{type === 'emploi' && (
<View>
<TextInput placeholder="Expérience requise" value={f.experience}
onChangeText={set('experience')} style={s.input} />
<TextInput placeholder="Secteur" value={f.secteur} onChangeText={set('secteur')} style={s.input} />
<TextInput placeholder="Contrat (CDI, CDD, freelance)" value={f.typeContrat}
onChangeText={set('typeContrat')} style={s.input} />
<TextInput placeholder="Salaire indicatif" value={f.salaire}
onChangeText={set('salaire')} style={s.input} />
<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
<Switch value={tele} onValueChange={setTele} /><Text> Télétravail</Text>
</View>
</View>
)}
{msg ? <Text style={s.label}>{msg}</Text> : null}
<Button title="Publier" onPress={publier} />
</ScrollView>
);
}