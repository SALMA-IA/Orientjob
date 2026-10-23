import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';
const LABEL = { en_attente: 'En attente de vérification', verifiee: 'Vérifiée ', refusee: 'Refusée ' };
export default function CompanyScreen() {
const [f, setF] = useState({ raisonSociale: '', iceRc: '', secteur: '' });
const [statut, setStatut] = useState('');
const [msg, setMsg] = useState('');
const set = (k) => (v) => setF({ ...f, [k]: v });
useEffect(() => {
api.get('/entreprise/moi').then((r) => {
if (r.data) {
setF({ raisonSociale: r.data.raison_sociale || '', iceRc: r.data.ice_rc || '',
secteur: r.data.secteur || '' });
setStatut(r.data.statut_verification);
}
}).catch(() => {});
}, []);
const save = async () => {
try {
const r = await api.post('/entreprise', f);
setStatut(r.data.statut_verification);
setMsg('Enregistré');
} catch (e) { setMsg(errMsg(e)); }
};
return (
<View style={s.container}>
<Text style={s.title}>Mon entreprise</Text>
{statut ? <Text style={s.label}>Statut : {LABEL[statut]}</Text> : null}
<TextInput placeholder="Raison sociale" value={f.raisonSociale}
onChangeText={set('raisonSociale')} style={s.input} />
<TextInput placeholder="ICE / RC (chiffres)" value={f.iceRc}
onChangeText={set('iceRc')} style={s.input} />
<TextInput placeholder="Secteur" value={f.secteur} onChangeText={set('secteur')} style={s.input} />
{msg ? <Text style={s.label}>{msg}</Text> : null}
<Button title="Enregistrer" onPress={save} />
</View>
);
}