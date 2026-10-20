import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const web = Platform.OS === 'web';
export const saveItem = async (k, v) =>
  web ? localStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
export const getItem = async (k) =>
  web ? localStorage.getItem(k) : SecureStore.getItemAsync(k);
export const removeItem = async (k) =>
  web ? localStorage.removeItem(k) : SecureStore.deleteItemAsync(k);