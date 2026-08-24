import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Funksion për të kontrolluar nëse jemi Online
export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable;
};

// Funksion për të ruajtur të dhënat e vizitave lokalish për përdorim offline
export const cacheDailyVisits = async (visits: any[]) => {
  try {
    await AsyncStorage.setItem('@cached_visits', JSON.stringify(visits));
  } catch (e) {
    console.error('Gabim në ruajtjen offline', e);
  }
};

// Funksion për të marrë vizitat kur nuk ka internet
export const getCachedVisits = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@cached_visits');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch(e) {
    return [];
  }
};