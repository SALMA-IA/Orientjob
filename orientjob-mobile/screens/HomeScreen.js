import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
OrientJob — Guide de développement, suite (étapes 13 à 28) Page 7
import { getItem, removeItem } from '../storage';
import { s } from '../styles';
const MENUS = {
etudiant: [['Mon profil', 'Profile'], ['Offres de stage', 'Offers', { type: 'stage' }],
['Offres recommandées (IA)', 'Recommended'], ['Mes candidatures', 'MyApplications'],
['Orientation (IA)', 'SelfEval'], ['Sécurité (MFA)', 'Mfa']],
diplome: [['Mon profil', 'Profile'], ["Offres d'emploi", 'Offers', { type: 'emploi' }],
['Offres recommandées (IA)', 'Recommended'], ['Mes candidatures', 'MyApplications'],
['Orientation (IA)', 'SelfEval'], ['Sécurité (MFA)', 'Mfa']],
recruteur: [['Mon entreprise', 'Company'], ['Publier une offre', 'PublishOffer'],
['Mes offres', 'MyOffers'], ['Sécurité (MFA)', 'Mfa']],
admin: [['Administration', 'Admin'], ['Sécurité (MFA)', 'Mfa']],
};
export default function HomeScreen({ navigation }) {
const [role, setRole] = useState('');
useEffect(() => { getItem('role').then((r) => setRole(r || '')); }, []);
const logout = async () => {
for (const k of ['token', 'role', 'userId']) await removeItem(k);
navigation.replace('Login');
};
return (
<ScrollView contentContainerStyle={s.container}>
<Text style={s.title}>Accueil ({role})</Text>
{(MENUS[role] || []).map(([label, screen, params]) => (
<View key={label} style={{ marginBottom: 10 }}>
<Button title={label} onPress={() => navigation.navigate(screen, params)} />
</View>
))}
<View style={s.gap} />
<Button title="Se déconnecter" color="#a00" onPress={logout} />
</ScrollView>
);
}