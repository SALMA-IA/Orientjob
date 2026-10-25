import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import CompanyScreen from './screens/CompanyScreen';
import PublishOfferScreen from './screens/PublishOfferScreen';
import MyOffersScreen from './screens/MyOffersScreen';
import OffersScreen from './screens/OffersScreen';
import OfferDetailScreen from './screens/OfferDetailScreen';
import ApplicantsScreen from './screens/ApplicantsScreen';
import MyApplicationsScreen from './screens/MyApplicationsScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon profil' }} />
        <Stack.Screen name="Company" component={CompanyScreen} options={{ title: 'Mon entreprise' }} />
        <Stack.Screen name="PublishOffer" component={PublishOfferScreen} options={{ title: 'Publier' }} />
        <Stack.Screen name="MyOffers" component={MyOffersScreen} options={{ title: 'Mes offres' }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offres' }} />
        <Stack.Screen name="OfferDetail" component={OfferDetailScreen} options={{ title: "Détail de l'offre" }} />
        <Stack.Screen name="Applicants" component={ApplicantsScreen} options={{ title: 'Candidats' }} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ title: 'Candidatures' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messagerie' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}