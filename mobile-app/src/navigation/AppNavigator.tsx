import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importimi i ikonave nga Expo

import { useAuth } from '../contexts/AuthContext';

// Importimi i Ekraneve
import LoginScreen from '../screens/auth/LoginScreen';
import AgendaScreen from '../screens/main/AgendaScreen';
import PatientListScreen from '../screens/main/AuditTrail';
import ProfileScreen from '../screens/main/ProfileScreen';
import VisitDetailScreen from '../screens/visit/VisitDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Menuja e Poshtme (Bottom Tabs) e stilizuar për standarde profesionale
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Konfigurimi dinamik i ikonave bazuar në ekranin aktiv
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Agjenda') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Historia e pacientëve') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profili') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline'; // Fallback i sigurt
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // Stilizimi i ngjyrave për t'u përshtatur me Dark Theme-in e aplikacionit
        tabBarActiveTintColor: '#3b82f6', // Bluja e ViziTrack
        tabBarInactiveTintColor: '#64748b', // Ngjyrë hiri e lehtë për ato jo-aktive
        tabBarStyle: {
          backgroundColor: '#0f172a', // Sfondi i errët i agjendës
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Agjenda" component={AgendaScreen} />
      <Tab.Screen name="Historia" component={PatientListScreen} />
      <Tab.Screen name="Profili" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. Stack-u i Aplikacionit (Mban Tab-et + Ekranet e Detajuara)
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* Ekrani i detajeve hapet sipër tab-eve për t'i dhënë fokus përmbajtjes */}
      <Stack.Screen 
        name="VisitDetail" 
        component={VisitDetailScreen} 
        options={{ animation: 'slide_from_right' }} // Animacion modern tranzicioni
      />
    </Stack.Navigator>
  );
}

// 3. Navigatori Kryesor (Logjika e Ndarjes Auth vs App)
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}