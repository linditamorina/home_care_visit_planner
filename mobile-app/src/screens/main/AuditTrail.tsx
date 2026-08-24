import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type HistoryVisit = {
  id: string;
  patient_code: string;
  address: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled';
  care_category: string;
  patient_details: any;
};

export default function AuditTrail() {
  const [history, setHistory] = useState<HistoryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Përdorim useFocusEffect që të rifreskohet sa herë hapim këtë tab
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          scheduled_start,
          status,
          care_category,
          patients (
            id,
            reference_code,
            address,
            phone_number,
            email,
            age_group,
            allergies,
            medical_conditions
          )
        `)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_start', { ascending: false }) // Më të rejat lart
        .limit(50); 

      if (error) {
        console.error('Gabim gjatë marrjes së historikut:', error.message);
        setHistory([]);
      } else if (data) {
        const formattedHistory = data.map((item: any) => {
          const dateObj = item.scheduled_start ? new Date(item.scheduled_start) : new Date();
          return {
            id: item.id,
            patient_code: item.patients?.reference_code || 'PAT-UNKNOWN',
            address: item.patients?.address || 'E paspecifikuar',
            date: dateObj.toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
            status: item.status,
            care_category: item.care_category || 'Kujdes i përgjithshëm',
            patient_details: item.patients || {},
          };
        });
        setHistory(formattedHistory);
      }
    } catch (err) {
      console.error('Gabim lidhjeje:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: HistoryVisit }) => {
    const isCompleted = item.status === 'completed';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('VisitDetail', { 
          visitId: item.id, 
          patient: item.patient_details 
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.dateText}>{item.date} • {item.time}</Text>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.badgeCompleted : styles.badgeCancelled]}>
            <Ionicons 
              name={isCompleted ? "checkmark-circle" : "close-circle"} 
              size={12} 
              color={isCompleted ? "#15803d" : "#991b1b"} 
            />
            <Text style={[styles.statusText, isCompleted ? { color: '#15803d' } : { color: '#991b1b' }]}>
              {isCompleted ? 'Përfunduar' : 'Anuluar'}
            </Text>
          </View>
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#38bdf8" />
          </View>
          <View style={styles.details}>
            <Text style={styles.patientCode}>{item.patient_code}</Text>
            <Text style={styles.categoryText}>{item.care_category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historiku i Punës</Text>
        <Text style={styles.headerSubtitle}>Vizitat e përfunduara nga ekipi juaj</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
              colors={['#38bdf8']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>Nuk keni asnjë vizitë të përfunduar në historik.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeCompleted: {
    backgroundColor: '#dcfce7',
  },
  badgeCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  patientCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  }
});