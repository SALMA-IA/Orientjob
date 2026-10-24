import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import OffersScreen from './screens/OffersScreen';
import OfferDetailScreen from './screens/OfferDetailScreen';
import CompanyScreen from './screens/CompanyScreen';
import MyApplicationsScreen from './screens/MyApplicationsScreen';
import ApplicantsScreen from './screens/ApplicantsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon profil' }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offres de stage' }} />
        <Stack.Screen name="OfferDetail" component={OfferDetailScreen} options={{ title: "Détail de l'offre" }} />
        <Stack.Screen name="Company" component={CompanyScreen} options={{ title: 'Mon entreprise' }} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ title: 'Candidatures' }} />
<Stack.Screen name="Applicants" component={ApplicantsScreen} options={{ title: 'Candidats' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}