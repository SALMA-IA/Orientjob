import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import api, { errMsg } from '../api';
import { s } from '../styles';
export default function RegisterScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const register = async (role) => {
try {
await api.post('/auth/register', { email, password, role });
navigation.replace('Login');
} catch (e) { setError(errMsg(e)); }
};
return (
<View style={s.center}>
<Text style={[s.title, { textAlign: 'center' }]}>Créer un compte</Text>
<TextInput placeholder="Email académique" value={email} onChangeText={setEmail}
style={s.input} autoCapitalize="none" />
<TextInput placeholder="Mot de passe (8 caractères min.)" value={password}
onChangeText={setPassword} secureTextEntry style={s.input} />
{error ? <Text style={s.error}>{error}</Text> : null}
<Button title="S'inscrire en tant qu'étudiant" onPress={() => register('etudiant')} />
<View style={s.gap} />
<Button title="S'inscrire en tant que diplômé" onPress={() => register('diplome')} />
<View style={s.gap} />
<Button title="S'inscrire en tant que recruteur" onPress={() => register('recruteur')} />
</View>
);
}