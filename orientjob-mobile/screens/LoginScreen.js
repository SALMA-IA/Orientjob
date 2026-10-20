import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import api, { errMsg } from '../api';
import { saveItem } from '../storage';
import { s } from '../styles';
export default function LoginScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [code, setCode] = useState('');
const [needCode, setNeedCode] = useState(false);
const [error, setError] = useState('');
const login = async () => {
try {
const res = await api.post('/auth/login', { email, password, code });
await saveItem('token', res.data.token);
await saveItem('role', res.data.role);
await saveItem('userId', String(res.data.userId));
navigation.replace('Home');
} catch (e) {
if (e.response?.data?.mfaRequired) {
setNeedCode(true);
setError('Entre le code à 6 chiffres de ton application Authenticator');
} else setError(errMsg(e));
}
};
return (
<View style={s.center}>
<Text style={[s.title, { textAlign: 'center' }]}>OrientJob</Text>
<TextInput placeholder="Email" value={email} onChangeText={setEmail}
style={s.input} autoCapitalize="none" />
<TextInput placeholder="Mot de passe" value={password} onChangeText={setPassword}
secureTextEntry style={s.input} />
{needCode && (
<TextInput placeholder="Code MFA (6 chiffres)" value={code} onChangeText={setCode}
style={s.input} keyboardType="number-pad" />
)}
{error ? <Text style={s.error}>{error}</Text> : null}
<Button title="Se connecter" onPress={login} />
<Text style={s.link} onPress={() => navigation.navigate('Register')}>
Pas de compte ? S'inscrire
</Text>
</View>
);
}