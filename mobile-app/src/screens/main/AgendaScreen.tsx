import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Visit = {
  id: string;
  patient_code: string;
  address: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  is_patient_notified: boolean; 
  priority: string;
  care_category: string;
  patient_details: any;
  created_at: string;
};

type AppNotification = {
  id: string;
  created_at: string;
  visit_id: string;
  patient_code: string;
  title: string;
  message: string;
  is_read: boolean;
};

export default function AgendaScreen() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  
  const [userProfession, setUserProfession] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearAllModalVisible, setClearAllModalVisible] = useState(false);

  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (!userProfession || !currentUserId) return;

    const notificationSubscription = supabase
      .channel('public-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `target_role=eq.${userProfession}` },
        () => {
          fetchNotifications(userProfession, currentUserId); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [userProfession, currentUserId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const fetchNotifications = async (role: string, userId: string) => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (['mjek', 'infermier', 'laborant'].includes(role)) {
        query = query.eq('target_role', role).eq('target_user_id', userId);
      } else {
        query = query.eq('target_role', role);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Gabim në tërheqjen e njoftimeve:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      let localProfession = userProfession; 
      let localTeamId = null;

      // 1. Gjejmë kush është loguar, çfarë roli ka, dhe NË CILIN EKIP është
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: userData } = await supabase
          .from('users')
          .select('profession, team_id') // Tërheqim edhe team_id
          .eq('id', user.id)
          .single();
          
        if (userData) {
          if (userData.profession) {
            localProfession = userData.profession.toLowerCase();
            setUserProfession(localProfession);
            fetchNotifications(localProfession, user.id); 
          }
          if (userData.team_id) {
            localTeamId = userData.team_id;
          }
        }
      }
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      let query = supabase
        .from('visits')
        .select(`
          id,
          scheduled_start,
          created_at,
          status,
          assigned_staff_id,
          is_patient_notified,
          priority,
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
        .gte('scheduled_start', todayStart.toISOString())
        .lt('scheduled_start', todayEnd.toISOString())
        .order('created_at', { ascending: false });

      // === FILTRIMI I EKIPIT (Data Isolation) ===
      if (localTeamId) {
        query = query.eq('assigned_team_id', localTeamId);
      }

      // === FILTRIMI I KATEGORISË SË VIZITËS ===
      if (localProfession === 'laborant') {
        // Laboranti sheh vetëm atë që gjeneron Toggle i Mjekut
        query = query.eq('care_category', 'Laborator');
      } else {
        // Mjeku & Infermieri shohin ÇDO GJË tjetër (përfshirë vizitat pa kategori nga Admini)
        query = query.or('care_category.neq.Laborator,care_category.is.null');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Gabim nga Supabase:', error.message);
        setVisits([]);
      } else if (!data || data.length === 0) {
        setVisits([]); 
      } else {
        const formattedVisits = data.map((item: any) => {
          const patientData = item.patients || {};
          if (patientData.medical_conditions) {
              patientData.medical_condition = patientData.medical_conditions;
          }

          return {
            id: item.id,
            patient_code: patientData.reference_code || 'PAT-UNKNOWN',
            address: patientData.address || 'Adresa e paspecifikuar',
            scheduled_time: item.scheduled_start ? new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sipas orarit',
            status: item.status || 'scheduled',
            is_patient_notified: item.is_patient_notified || false,
            priority: item.priority || 'normale',
            care_category: item.care_category || '',
            created_at: item.created_at,
            patient_details: patientData,
          };
        });
        setVisits(formattedVisits);
      }
    } catch (err) {
      console.error('Gabim gjatë lidhjes:', err);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    const notifToDelete = notifications.find(n => n.id === notifId);
    if (notifToDelete && !notifToDelete.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    await supabase.from('notifications').delete().eq('id', notifId);
  };

  const handleClearAllClick = () => {
    if (notifications.length === 0) return;
    setClearAllModalVisible(true); 
  };

  const confirmClearAll = async () => {
    setClearAllModalVisible(false);
    const idsToDelete = notifications.map(n => n.id);
    
    if (idsToDelete.length === 0) return;

    setNotifications([]);
    setUnreadCount(0);
    
    await supabase
      .from('notifications')
      .delete()
      .in('id', idsToDelete);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      if (error) console.error("Gabim gjatë përditësimit të njoftimit:", error);
    }
    
    setShowNotifications(false);
    navigation.navigate('VisitDetail', { 
      visitId: notif.visit_id, 
      patient: { reference_code: notif.patient_code } 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'E përfunduar', bg: '#dcfce7', color: '#15803d' };
      case 'in_progress': return { text: 'Në zhvillim', bg: '#dbeafe', color: '#1d4ed8' };
      case 'cancelled': return { text: 'Anuluar', bg: '#fee2e2', color: '#991b1b' };
      default: return { text: 'Në pritje', bg: '#fef9c3', color: '#a16207' };
    }
  };

  const filteredVisits = visits.filter(visit => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'scheduled' && (visit.status === 'scheduled' || visit.status === 'in_progress')) return true;
    return visit.status === activeFilter;
  });

  const renderItem = ({ item }: { item: Visit }) => {
    const badge = getStatusBadge(item.status);
    const isEmergency = item.priority?.toLowerCase() === 'emergjente';
    const isLabTask = item.care_category === 'Laborator';

    return (
      <TouchableOpacity 
        style={[styles.card, isEmergency && styles.emergencyCard, isLabTask && !isEmergency && styles.labCard]}
        onPress={() => navigation.navigate('VisitDetail', { visitId: item.id, patient: item.patient_details })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.timeText, isEmergency && styles.emergencyTimeText, isLabTask && !isEmergency && styles.labTimeText]}>
              🕒 {item.scheduled_time}
            </Text>
            {isEmergency && <Text style={styles.urgentLabel}>URGJENTE</Text>}
            {isLabTask && !isEmergency && <Text style={styles.labLabel}>LABORATOR</Text>}
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.patientInfoRow}>
          <Text style={styles.clientName}>{item.patient_code}</Text>
          <View style={styles.notificationContainer}>
            <Ionicons name={item.is_patient_notified ? "notifications" : "notifications-off"} size={14} color={item.is_patient_notified ? "#15803d" : "#94a3b8"} />
            <Text style={[styles.notificationText, { color: item.is_patient_notified ? "#15803d" : "#94a3b8" }]}>
              {item.is_patient_notified ? "I njoftuar" : "Pa njoftuar"}
            </Text>
          </View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.addressText} numberOfLines={1}>📍 {item.address}</Text>
          <Text style={styles.createdTimeText}>Regjistruar: {new Date(item.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>
            <Text style={styles.brandVizi}>VIZI</Text>
            <Text style={styles.brandTrack}>TRACK</Text>
          </Text>
          <Text style={styles.roleSubtitle}>
            Agjenda: <Text style={{fontWeight: 'bold', color: '#ffffff'}}>{userProfession ? userProfession.charAt(0).toUpperCase() + userProfession.slice(1) : 'Duke u ngarkuar...'}</Text>
          </Text>
        </View>
        
        <TouchableOpacity style={styles.bellButton} onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={26} color="#cbd5e1" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <View>
          <Text style={styles.sectionTitle}>Detyrat e Sotme</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} bounces={false}>
          <TouchableOpacity style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]} onPress={() => setActiveFilter('all')}>
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>Të gjitha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, activeFilter === 'scheduled' && styles.filterBtnActive]} onPress={() => setActiveFilter('scheduled')}>
            <Text style={[styles.filterText, activeFilter === 'scheduled' && styles.filterTextActive]}>Në pritje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, activeFilter === 'completed' && styles.filterBtnActive]} onPress={() => setActiveFilter('completed')}>
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.filterTextActive]}>Të përfunduara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, activeFilter === 'cancelled' && styles.filterBtnActive]} onPress={() => setActiveFilter('cancelled')}>
            <Text style={[styles.filterText, activeFilter === 'cancelled' && styles.filterTextActive]}>Të anuluara</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : (
        <FlatList
          data={filteredVisits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color="#334155" style={{marginBottom: 12}} />
              <Text style={styles.emptyText}>Nuk ka asnjë vizitë për agjendën tuaj sot.</Text>
            </View>
          )}
        />
      )}

      {/* MODALI I RI MODERN PËR KONFIRMIMIN E FSHIRJES SË NJOFTIMEVE */}
      <Modal animationType="fade" transparent={true} visible={clearAllModalVisible} onRequestClose={() => setClearAllModalVisible(false)}>
        <View style={styles.modalOverlayC}>
          <View style={styles.modalContentC}>
            <View style={[styles.modalIconContainerC, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="trash-outline" size={40} color="#ef4444" />
            </View>
            <Text style={styles.modalTitleC}>Pastro Njoftimet</Text>
            <Text style={styles.modalMessageC}>
              A jeni i sigurt që dëshironi të fshini të gjitha njoftimet tuaja? Ky veprim nuk mund të kthehet mbrapsht.
            </Text>
            <View style={styles.modalActionButtonsC}>
              <TouchableOpacity style={styles.cancelBtnC} onPress={() => setClearAllModalVisible(false)}>
                <Text style={styles.cancelBtnTextC}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtnC, {backgroundColor: '#ef4444'}]} onPress={confirmClearAll}>
                <Text style={styles.confirmBtnTextC}>Po, Fshij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QENDRA E NJOFTIMEVE */}
      <Modal visible={showNotifications} animationType="slide" transparent={true} onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationSheet}>
            <View style={styles.notificationHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.notificationTitle}>Qendra e Njoftimeve</Text>
                {unreadCount > 0 && (
                  <View style={[styles.badge, {backgroundColor: '#3b82f6', marginLeft: 8}]}>
                    <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>{unreadCount} Të reja</Text>
                  </View>
                )}
              </View>
              
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearAllClick}>
                    <Text style={styles.clearAllText}>Fshij të gjitha</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={() => (
                <View style={styles.emptyNotification}>
                  <Ionicons name="mail-open-outline" size={50} color="#334155" />
                  <Text style={styles.emptyNotificationTitle}>Inbox i Pastër</Text>
                  <Text style={styles.emptyNotificationText}>Nuk keni asnjë njoftim për momentin.</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={[styles.notificationCard, !item.is_read && styles.notificationCardUnread]}>
                  <TouchableOpacity 
                    style={styles.notifClickableArea}
                    onPress={() => handleNotificationClick(item)}
                  >
                    <View style={styles.notifIconWrapper}>
                      <Ionicons name={item.title.includes('Gati') || item.title.includes('Laborator') ? "flask" : item.title.includes('Kthye') ? "warning" : "medical"} size={22} color={!item.is_read ? "#3b82f6" : "#64748b"} />
                      {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>{item.title}</Text>
                      <Text style={styles.notifMessage} numberOfLines={3}>{item.message}</Text>
                      <Text style={styles.notifTime}>
                        {new Date(item.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })} • {new Date(item.created_at).toLocaleDateString('sq-AL')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deleteNotifBtn}
                    onPress={() => handleDeleteNotification(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  brandVizi: { color: '#3b82f6' },
  brandTrack: { color: '#ffffff' },
  roleSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  bellButton: { padding: 8, borderRadius: 50, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', position: 'relative' },
  bellBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f172a', paddingHorizontal: 4 },
  bellBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  dateText: { fontSize: 13, color: '#94a3b8', fontWeight: '500', marginTop: 4 },
  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  emergencyCard: { backgroundColor: '#fef2f2', borderLeftWidth: 5, borderLeftColor: '#ef4444' },
  labCard: { backgroundColor: '#faf5ff', borderLeftWidth: 5, borderLeftColor: '#8b5cf6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  emergencyTimeText: { color: '#dc2626' },
  labTimeText: { color: '#7c3aed' },
  urgentLabel: { fontSize: 10, fontWeight: '900', color: '#ef4444', letterSpacing: 0.5 },
  labLabel: { fontSize: 10, fontWeight: '900', color: '#8b5cf6', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  patientInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { fontSize: 17, fontWeight: '900', color: '#1e293b', letterSpacing: 0.5, flex: 1 },
  notificationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  notificationText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  addressText: { fontSize: 13, color: '#64748b', marginTop: 4 },
  createdTimeText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },

  notificationOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  notificationSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', borderTopWidth: 1, borderColor: '#334155' },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  notificationTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  clearAllText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  closeModalBtn: { backgroundColor: '#0f172a', padding: 6, borderRadius: 50 },
  emptyNotification: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyNotificationTitle: { color: '#cbd5e1', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyNotificationText: { color: '#64748b', fontSize: 14, marginTop: 8 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  notificationCardUnread: { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.4)' },
  notifClickableArea: { flex: 1, flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
  notifIconWrapper: { backgroundColor: '#0f172a', padding: 12, borderRadius: 50, marginRight: 14, position: 'relative' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, backgroundColor: '#38bdf8', borderRadius: 6, borderWidth: 2, borderColor: '#1e293b' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, color: '#cbd5e1', fontWeight: '600', marginBottom: 4 },
  notifTitleUnread: { color: '#ffffff', fontWeight: 'bold' },
  notifMessage: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  notifTime: { fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: '600' },
  deleteNotifBtn: { padding: 16, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#334155' },

  modalOverlayC: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContentC: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  modalIconContainerC: { marginBottom: 16, borderRadius: 50, padding: 12 },
  modalTitleC: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  modalMessageC: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalActionButtonsC: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  cancelBtnC: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelBtnTextC: { color: '#cbd5e1', fontSize: 15, fontWeight: 'bold' },
  confirmBtnC: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnTextC: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});