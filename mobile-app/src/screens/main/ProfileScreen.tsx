import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  
  // States për modalet
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  // States për modulet e reja të suportit
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [isRequesting, setIsRequesting] = useState(false);
  const [profileData, setProfileData] = useState<{ full_name: string; profession: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user || !user.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, profession')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Gabim gjatë marrjes së profilit:', error.message);
      } else if (data) {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Gabim lidhjeje:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await supabase.auth.signOut();
  };

  const handlePasswordRequest = async () => {
    setIsRequesting(true);
    try {
      const { error } = await supabase.from('notifications').insert([{
        target_role: 'admin', 
        title: 'Kërkesë për Fjalëkalim 🔐',
        message: `Përdoruesi ${profileData?.full_name || user?.email} (${profileData?.profession || 'Staf'}) ka kërkuar një ndryshim të fjalëkalimit.`,
        patient_code: 'SISTEMI' 
      }]);

      if (error) throw error;

      setSecurityModalVisible(false);
      setTimeout(() => {
        setSuccessModalVisible(true);
      }, 300);

    } catch (error) {
      console.error('Gabim në dërgimin e kërkesës:', error);
      Alert.alert("Gabim", "Kërkesa nuk mund të dërgohej. Provoni sërish.");
    } finally {
      setIsRequesting(false);
    }
  };

  // Logjika Profesionale e Suportit
  const handleSupportAction = (type: 'manual' | 'contact') => {
    setSupportModalVisible(false);
    setTimeout(() => {
      if (type === 'manual') setManualModalVisible(true);
      if (type === 'contact') setContactModalVisible(true);
    }, 300);
  };

  // Funksionet native për thirrje dhe email
  const handleCallIT = () => {
    Linking.openURL('tel:+38349123456').catch(() => {
      Alert.alert("Gabim", "Pajisja juaj nuk mund të kryejë thirrje telefonike.");
    });
  };

  const handleEmailIT = () => {
    const subject = encodeURIComponent("Kërkesë për Suport - ViziTrack App");
    const body = encodeURIComponent(`Përshëndetje IT,\n\nKam një problem me aplikacionin.\nPërdoruesi: ${profileData?.full_name || user?.email}\n\n[Përshkruani problemin këtu]`);
    Linking.openURL(`mailto:support@vizitrack.com?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert("Gabim", "Nuk keni asnjë aplikacion emaili të instaluar.");
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profili Im</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#38bdf8" />
          </View>
          <View style={styles.userInfo}>
            {loadingProfile ? (
              <ActivityIndicator size="small" color="#38bdf8" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <Text style={styles.fullNameText} numberOfLines={1}>{profileData?.full_name || 'Përdorues i panjohur'}</Text>
                <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
                <View style={styles.roleBadge}><Text style={styles.roleText}>{profileData?.profession?.replace('_', ' ') || 'Punëtor në Terren'}</Text></View>
              </>
            )}
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Cilësimet e Llogarisë</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSecurityModalVisible(true)}>
            <View style={styles.optionIcon}><Ionicons name="shield-checkmark-outline" size={20} color="#cbd5e1" /></View>
            <Text style={styles.optionText}>Siguria dhe Fjalëkalimi</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSupportModalVisible(true)}>
            <View style={styles.optionIcon}><Ionicons name="help-circle-outline" size={20} color="#cbd5e1" /></View>
            <Text style={styles.optionText}>Ndihma dhe Suporti</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Dil nga llogaria</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>ViziTrack v1.0.0</Text>
      </ScrollView>

      {/* MODALET E VJETRA */}
      <Modal animationType="fade" transparent={true} visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><Ionicons name="warning-outline" size={32} color="#f59e0b" /></View>
            <Text style={styles.modalTitle}>A jeni i sigurt?</Text>
            <Text style={styles.modalText}>Dëshironi me të vërtetë të dilni nga aplikacioni ViziTrack?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setLogoutModalVisible(false)}><Text style={styles.cancelBtnText}>Anulo</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleLogout}><Text style={styles.confirmBtnText}>Po, Dil</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={securityModalVisible} onRequestClose={() => setSecurityModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}><Ionicons name="lock-closed-outline" size={32} color="#38bdf8" /></View>
            <Text style={styles.modalTitle}>Menaxhimi i Sigurisë</Text>
            <Text style={styles.modalText}>Për arsye sigurie dhe përputhshmërie, ndryshimi i fjalëkalimit dhe i të dhënave të llogarisë menaxhohet <Text style={{fontWeight: 'bold', color: '#cbd5e1'}}>vetëm nga Administratori i Sistemit.</Text></Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setSecurityModalVisible(false)} disabled={isRequesting}><Text style={styles.cancelBtnText}>Mbyll</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#38bdf8'}]} onPress={handlePasswordRequest} disabled={isRequesting}>{isRequesting ? (<ActivityIndicator color="#0f172a" size="small" />) : (<Text style={[styles.confirmBtnText, {color: '#0f172a'}]}>Kërko Ndryshim</Text>)}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={successModalVisible} onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}><Ionicons name="checkmark-circle-outline" size={40} color="#10b981" /></View>
            <Text style={styles.modalTitle}>Kërkesa u Dërgua!</Text>
            <Text style={styles.modalText}>Administratori i sistemit u njoftua. Do të kontaktoheni së shpejti për të verifikuar identitetin tuaj.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#10b981'}]} onPress={() => setSuccessModalVisible(false)}>
                <Text style={[styles.confirmBtnText, {color: '#ffffff'}]}>Në rregull</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={supportModalVisible} onRequestClose={() => setSupportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.supportHeader}>
              <Ionicons name="headset-outline" size={28} color="#cbd5e1" style={{marginBottom: 8}} />
              <Text style={styles.modalTitle}>Qendra e Suportit</Text>
              <Text style={[styles.modalText, {marginBottom: 0, color: '#94a3b8'}]}>Si mund t'ju ndihmojmë sot?</Text>
            </View>
            <View style={styles.supportOptionsList}>
              <TouchableOpacity style={styles.supportOptionBtn} onPress={() => handleSupportAction('manual')}>
                <View style={[styles.supportIconBg, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}><Ionicons name="book-outline" size={22} color="#10b981" /></View>
                <View style={styles.supportOptionTextContainer}>
                  <Text style={styles.supportOptionTitle}>Manuali i Përdorimit</Text>
                  <Text style={styles.supportOptionSubtitle}>Udhëzime mbi përdorimin e ViziTrack</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.supportOptionBtn, {borderBottomWidth: 0}]} onPress={() => handleSupportAction('contact')}>
                <View style={[styles.supportIconBg, {backgroundColor: 'rgba(139, 92, 246, 0.1)'}]}><Ionicons name="chatbubbles-outline" size={22} color="#8b5cf6" /></View>
                <View style={styles.supportOptionTextContainer}>
                  <Text style={styles.supportOptionTitle}>Kontakto IT</Text>
                  <Text style={styles.supportOptionSubtitle}>Asistencë teknike për sistemin</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.supportCloseBtn} onPress={() => setSupportModalVisible(false)}><Text style={styles.supportCloseBtnText}>Mbyll</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODALET E REJA PROFESIONALE --- */}
      
      {/* 1. Modali i Manualit të Përdorimit */}
      <Modal animationType="slide" transparent={true} visible={manualModalVisible} onRequestClose={() => setManualModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden', maxHeight: '80%' }]}>
            <View style={styles.supportHeader}>
              <Ionicons name="book" size={28} color="#10b981" style={{marginBottom: 8}} />
              <Text style={styles.modalTitle}>Manuali i Terrenit</Text>
            </View>
            <ScrollView style={{ width: '100%', padding: 20 }} showsVerticalScrollIndicator={false}>
              
              <View style={styles.manualBlock}>
                <View style={styles.manualTitleRow}>
                  <Ionicons name="location" size={18} color="#38bdf8" />
                  <Text style={styles.manualTitle}>1. Kryerja e Vizitës</Text>
                </View>
                <Text style={styles.manualDesc}>Pasi të mbërrini te pacienti, shtypni <Text style={{fontWeight: 'bold', color: '#38bdf8'}}>Check-In</Text> për të regjistruar lokacionin dhe orën. Pasi të përfundoni, shtypni <Text style={{fontWeight: 'bold', color: '#10b981'}}>Check-Out</Text>.</Text>
              </View>

              <View style={styles.manualBlock}>
                <View style={styles.manualTitleRow}>
                  <Ionicons name="cloud-offline" size={18} color="#f59e0b" />
                  <Text style={styles.manualTitle}>2. Puna Jashtë Linje (Offline)</Text>
                </View>
                <Text style={styles.manualDesc}>Nëse nuk keni internet, ViziTrack ruan automatikisht të dhënat në telefon. Një shirit portokalli do t'ju njoftojë. Kur të keni sërish rrjet, të dhënat dërgohen automatikisht në server.</Text>
              </View>

              <View style={styles.manualBlock}>
                <View style={styles.manualTitleRow}>
                  <Ionicons name="document-text" size={18} color="#a78bfa" />
                  <Text style={styles.manualTitle}>3. Raportet Digjitale</Text>
                </View>
                <Text style={styles.manualDesc}>Vetëm pasi të plotësoni raportin tuaj digjital nga butoni <Text style={{fontWeight: 'bold', color: '#a78bfa'}}>"Shto Shënime"</Text>, vizita mund të mbyllet plotësisht nga Ekipi.</Text>
              </View>

            </ScrollView>
            <TouchableOpacity style={styles.supportCloseBtn} onPress={() => setManualModalVisible(false)}><Text style={styles.supportCloseBtnText}>Kthehu</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Modali i Kontaktit me IT */}
      <Modal animationType="fade" transparent={true} visible={contactModalVisible} onRequestClose={() => setContactModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.supportHeader}>
              <Ionicons name="hardware-chip" size={32} color="#8b5cf6" style={{marginBottom: 8}} />
              <Text style={styles.modalTitle}>Departamenti IT</Text>
              <Text style={[styles.modalText, {marginBottom: 0, color: '#94a3b8'}]}>Oraret e suportit: 08:00 - 16:00</Text>
            </View>
            
            <View style={{ width: '100%', padding: 24, gap: 16 }}>
              <TouchableOpacity style={styles.contactBtnCard} onPress={handleCallIT}>
                <View style={[styles.contactIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="call" size={20} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.contactLabel}>Thirrje Emergjente</Text>
                  <Text style={styles.contactValue}>+383 49 123 456</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactBtnCard} onPress={handleEmailIT}>
                <View style={[styles.contactIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <Ionicons name="mail" size={20} color="#38bdf8" />
                </View>
                <View>
                  <Text style={styles.contactLabel}>Raporto një problem</Text>
                  <Text style={styles.contactValue}>support@vizitrack.com</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.supportCloseBtn} onPress={() => setContactModalVisible(false)}><Text style={styles.supportCloseBtnText}>Kthehu</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.5 },
  scrollContent: { padding: 20 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  userInfo: { marginLeft: 16, flex: 1, justifyContent: 'center' },
  fullNameText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  emailText: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  roleBadge: { backgroundColor: '#0f172a', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  roleText: { fontSize: 12, color: '#38bdf8', fontWeight: 'bold', textTransform: 'capitalize' },
  optionsContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  optionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionText: { flex: 1, fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 20 },
  logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  versionText: { textAlign: 'center', color: '#64748b', fontSize: 12, marginBottom: 20 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#334155' },
  modalIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  cancelBtnText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 15 },
  confirmBtn: { backgroundColor: '#ef4444' },
  confirmBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },

  supportHeader: { backgroundColor: '#0f172a', width: '100%', alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#334155' },
  supportOptionsList: { width: '100%', padding: 16 },
  supportOptionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  supportIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  supportOptionTextContainer: { flex: 1 },
  supportOptionTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  supportOptionSubtitle: { color: '#94a3b8', fontSize: 12 },
  supportCloseBtn: { width: '100%', paddingVertical: 16, backgroundColor: '#0f172a', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155' },
  supportCloseBtnText: { color: '#cbd5e1', fontSize: 15, fontWeight: 'bold' },

  // Stilet e reja për modulet e suportit
  manualBlock: { marginBottom: 20, backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  manualTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  manualTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  manualDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },

  contactBtnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  contactIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contactLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' }
});