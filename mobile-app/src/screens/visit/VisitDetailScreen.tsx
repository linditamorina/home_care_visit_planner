import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  Modal,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import * as DocumentPicker from 'expo-document-picker'; 

// INTEGRIMI I OFFLINE MODE
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VisitDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { visitId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Të dhënat Thelbësore
  const [visitData, setVisitData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [userProfession, setUserProfession] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>(''); 
  const [teamProfessions, setTeamProfessions] = useState<string[]>([]); 
  
  // Modalet
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState({ visible: false, missingRoles: [] as string[] });
  const [targetStatus, setTargetStatus] = useState<string>(''); 
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // Të dhënat e Detyrave (Të ndara për validim)
  const [fieldNote, setFieldNote] = useState<any>(null);
  const [doctorObservations, setDoctorObservations] = useState(''); 
  const [doctorServices, setDoctorServices] = useState(''); 
  const [nurseInterventions, setNurseInterventions] = useState(''); 
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  
  // Laboratori (Përmirësuar për histori dokumentesh)
  const [labResults, setLabResults] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>(''); // Tani mban string me presje "url1,url2"
  const [uploadingFile, setUploadingFile] = useState(false);

  const [hasLabRequest, setHasLabRequest] = useState(false);
  const [requestingLab, setRequestingLab] = useState(false);
  const [requestedLabTests, setRequestedLabTests] = useState('');
  const [labRequestModalVisible, setLabRequestModalVisible] = useState(false);
  const [labVisitId, setLabVisitId] = useState<string | null>(null);
  const [labNoteId, setLabNoteId] = useState<string | null>(null);
  
  const [isLabRejected, setIsLabRejected] = useState(false);
  const [labRejectionReason, setLabRejectionReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // MONITIORIMI I RRJETIT
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (visitId) {
      loadAllData();
      
      try {
        const visitSubscription = supabase.channel(`realtime-visit-${visitId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visits', filter: `id=eq.${visitId}` },
            (payload) => { 
              if (payload.new && payload.new.status) {
                setVisitData((prev: any) => ({ ...prev, status: payload.new.status }));
                if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
                  setReportModalVisible(false);
                  setLabRequestModalVisible(false);
                  setConfirmationModalVisible(false);
                  setRejectModalVisible(false);
                }
              }
            }
          ).subscribe();
        return () => { supabase.removeChannel(visitSubscription); };
      } catch (e) {
        console.log('Realtime nuk iniciohet offline.');
      }
    }
  }, [visitId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const netInfo = await NetInfo.fetch();
      const online = netInfo.isConnected && netInfo.isInternetReachable;
      setIsOffline(!online);

      let vData: any = null;
      let pData: any = null;
      let noteDataArray: any[] = [];
      let currentProf = '';
      let professionsInTeam: string[] = [];
      let existingLabData: any = null;
      let existingLabVisitId: string | null = null;

      if (online) {
        const { data: vResponse } = await supabase.from('visits').select('*').eq('id', visitId).single();
        vData = vResponse;

        const { data: pResponse } = await supabase.from('patients').select('*').eq('id', vData.patient_id).single();
        pData = pResponse;

        const { data: teamMembers } = await supabase.from('users').select('profession').eq('team_id', vData.assigned_team_id);
        if (teamMembers) professionsInTeam = teamMembers.map((m: any) => m.profession?.toLowerCase() || '');

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data: userData } = await supabase.from('users').select('profession').eq('id', user.id).single();
          if (userData) currentProf = userData.profession?.toLowerCase() || '';
        }

        const { data: nData } = await supabase.from('field_notes').select('*').eq('visit_id', visitId).order('created_at', { ascending: false });
        noteDataArray = nData || [];

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const { data: labVisit } = await supabase.from('visits').select('id, status').eq('patient_id', vData.patient_id).eq('care_category', 'Laborator').gte('scheduled_start', startOfDay.toISOString()).limit(1).maybeSingle();
        
        if (labVisit) {
          existingLabVisitId = labVisit.id;
          const { data: labNote } = await supabase.from('field_notes').select('id, requested_lab_tests, lab_results, lab_document_url, is_lab_rejected, lab_rejection_reason').eq('visit_id', labVisit.id).maybeSingle();
          existingLabData = labNote;
        }

        const cachePayload = { vData, pData, currentProf, professionsInTeam, noteDataArray, existingLabData, existingLabVisitId, timestamp: Date.now() };
        await AsyncStorage.setItem(`@cache_visit_${visitId}`, JSON.stringify(cachePayload));

      } else {
        const cachedString = await AsyncStorage.getItem(`@cache_visit_${visitId}`);
        if (cachedString) {
          const cachedData = JSON.parse(cachedString);
          vData = cachedData.vData;
          pData = cachedData.pData;
          currentProf = cachedData.currentProf;
          professionsInTeam = cachedData.professionsInTeam;
          noteDataArray = cachedData.noteDataArray;
          existingLabData = cachedData.existingLabData;
          existingLabVisitId = cachedData.existingLabVisitId;
        } else {
          throw new Error('Jeni jashtë linje dhe nuk ka të dhëna të ruajtura paraprakisht për këtë vizitë.');
        }
      }

      setVisitData(vData);
      setPatientData(pData);
      setUserProfession(currentProf);
      setTeamProfessions(professionsInTeam);

      if (noteDataArray && noteDataArray.length > 0) {
        const mergedNoteData = noteDataArray.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {});
        mergedNoteData.id = noteDataArray[noteDataArray.length - 1].id; 
        
        setFieldNote(mergedNoteData);
        setDoctorObservations(mergedNoteData.clinical_observations || '');
        setDoctorServices(mergedNoteData.doctor_therapy || '');
        setNurseInterventions(mergedNoteData.interventions_performed || '');
        setBp(mergedNoteData.vital_signs_bp || '');
        setHr(mergedNoteData.vital_signs_hr || '');
        setSpo2(mergedNoteData.vital_signs_spo2 || '');
        setTemp(mergedNoteData.vital_signs_temp || '');
        
        if (currentProf === 'laborant') {
          setIsLabRejected(mergedNoteData.is_lab_rejected || false);
          setLabRejectionReason(mergedNoteData.lab_rejection_reason || '');
          
          if (mergedNoteData.is_lab_rejected) {
             setLabResults(''); 
          } else {
             setLabResults(mergedNoteData.lab_results || '');
          }
          
          setExistingFileUrl(mergedNoteData.lab_document_url || ''); 
          setRequestedLabTests(mergedNoteData.requested_lab_tests || '');
        }
      }

      // KRYQËZIMI I DËDHËNAVE (Mjeku lexon Laborantin)
      if (existingLabData && existingLabVisitId) {
        setHasLabRequest(true);
        setLabVisitId(existingLabVisitId);
        
        if (existingLabData.requested_lab_tests) setRequestedLabTests(existingLabData.requested_lab_tests);
        
        if (currentProf === 'mjek') {
          setLabNoteId(existingLabData.id);
          setIsLabRejected(existingLabData.is_lab_rejected || false);
          setLabRejectionReason(existingLabData.lab_rejection_reason || '');
          if (existingLabData.lab_results) setLabResults(existingLabData.lab_results);
          if (existingLabData.lab_document_url) setExistingFileUrl(existingLabData.lab_document_url);
        }
      }

    } catch (err: any) {
      setErrorModal({ visible: true, message: err.message || 'Gabim gjatë marrjes së të dhënave.' });
    } finally {
      setLoading(false);
    }
  };

  // === RUAJTJA E RAPORTIT DHE LOGJIKA E HISTORIKUT TË DOKUMENTEVE ===
  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      if (isOffline && selectedFile) {
        setErrorModal({ visible: true, message: 'Nuk mund të ngarkoni skedarë pa lidhje interneti. Ruani vetëm tekstin.' });
        setSavingReport(false);
        return;
      }

      const payload: any = { visit_id: visitId, author_role: userProfession };

      if (userProfession === 'mjek') {
        payload.doctor_id = currentUserId;
        payload.clinical_observations = doctorObservations; 
        payload.doctor_therapy = doctorServices; 
      } 
      else if (userProfession === 'infermier') {
        payload.nurse_id = currentUserId;
        payload.interventions_performed = nurseInterventions; 
        payload.vital_signs_bp = bp;
        payload.vital_signs_hr = hr;
        payload.vital_signs_spo2 = spo2;
        payload.vital_signs_temp = temp;
      } 
      else if (userProfession === 'laborant') {
        payload.laborant_id = currentUserId;
        
        // Logjika Append për Tekstin e Rezultateve
        let finalLabResults = labResults;
        if (isLabRejected) {
           const timestamp = new Date().toLocaleString('sq-AL');
           let oldText = fieldNote?.lab_results || '';
           
           if (oldText && !oldText.includes('--- REZULTATI I PARË ---')) {
              oldText = `--- REZULTATI I PARË ---\n${oldText}`;
           }
           finalLabResults = `${oldText}\n\n--- REZULTATI I PËRSËRITUR (${timestamp}) ---\n${labResults || '(Pa tekst shtesë)'}`;
        }
        
        payload.lab_results = finalLabResults.trim(); 
        payload.is_lab_rejected = false; 
        payload.lab_rejection_reason = null; 
        
        // Logjika Append për Dokumentet (Mban ruajtur PDF-në e vjetër)
        let finalDocUrl = existingFileUrl || '';
        if (selectedFile && !isOffline) { 
          const cloudUrl = await uploadFileToSupabase(selectedFile); 
          if (isLabRejected && finalDocUrl) {
            finalDocUrl = `${finalDocUrl},${cloudUrl}`; // Ndajmë me presje dokumentet e shumëfishta
          } else {
            finalDocUrl = cloudUrl;
          }
          setExistingFileUrl(finalDocUrl);
          setSelectedFile(null);
        }
        payload.lab_document_url = finalDocUrl;
      }

      if (isOffline) {
        const actionPayload = { type: 'SAVE_REPORT', table: 'field_notes', isUpdate: !!fieldNote?.id, id: fieldNote?.id, visitId: visitId, data: payload, timestamp: Date.now() };
        const existingQueue = await AsyncStorage.getItem('@offline_queue');
        const queue = existingQueue ? JSON.parse(existingQueue) : [];
        queue.push(actionPayload);
        await AsyncStorage.setItem('@offline_queue', JSON.stringify(queue));

        setFieldNote({...fieldNote, ...payload, id: fieldNote?.id || 'temp_offline_id'});
        setReportModalVisible(false);
        setSuccessModal({ visible: true, title: 'Ruajtur Offline!', message: 'Nuk keni internet. Të dhënat u ruajtën lokalisht.' });
        return;
      }

      let error;
      if (fieldNote?.id) { 
        const { error: updateError } = await supabase.from('field_notes').update(payload).eq('id', fieldNote.id); 
        error = updateError; 
      } else { 
        const { error: insertError } = await supabase.from('field_notes').insert([payload]); 
        error = insertError; 
      }
      
      if (error) throw error;

      // NJOFTIMI NGA LABORANTI TE MJEKU
      if (userProfession === 'laborant' && !isOffline) {
        const { data: docUser } = await supabase.from('users').select('id').ilike('profession', '%mjek%').eq('team_id', visitData.assigned_team_id).maybeSingle();
        if (docUser) {
          await supabase.from('notifications').insert([{ 
            target_role: 'mjek', 
            target_user_id: docUser.id, 
            visit_id: visitData.id, 
            patient_code: patientData?.reference_code || 'Pacient', 
            title: isLabRejected ? 'Analiza e Përsëritur u Ngarkua 🔬' : 'Rezultatet Laboratorike Gati 🔬', 
            message: `Laboranti i ekipit ka ngarkuar të dhënat e reja. Shikoni dosjen.` 
          }]);
        }
      }

      setReportModalVisible(false);
      if (userProfession === 'laborant' && isLabRejected) {
         setIsLabRejected(false);
      }
      setSuccessModal({ visible: true, title: 'Shënimet u Ruajtën!', message: 'Të dhënat u regjistruan me sukses.' });
      loadAllData(); 
    } catch (err: any) { setErrorModal({ visible: true, message: 'Dështoi ruajtja e shënimeve: ' + (err.message || 'Gabim i panjohur.') }); } finally { setSavingReport(false); }
  };

  // === MJEKU KTHEN MBRAPSHT ANALIZËN (Pavarësisht a është vizita e tij e mbyllur) ===
  const handleRejectLabReport = async () => {
    if (!rejectionReason.trim()) {
      setErrorModal({ visible: true, message: 'Ju lutem shkruani një arsye për kthimin e analizës.' });
      return;
    }
    if (isOffline) {
      setErrorModal({ visible: true, message: 'Nuk mund të ktheni analizat kur jeni jashtë linje.' });
      return;
    }

    setRejecting(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); 

      await supabase.from('field_notes').update({ 
        is_lab_rejected: true, 
        lab_rejection_reason: rejectionReason,
        laborant_id: null 
      }).eq('id', labNoteId);
      
      await supabase.from('visits').update({ 
        status: 'scheduled',
        scheduled_start: now.toISOString(),
        scheduled_end: endTime.toISOString()
      }).eq('id', labVisitId);
      
      const { data: labUser } = await supabase.from('users').select('id').ilike('profession', '%laborant%').eq('team_id', visitData.assigned_team_id).maybeSingle();
      if (labUser) {
        await supabase.from('notifications').insert([{ 
          target_role: 'laborant', 
          target_user_id: labUser.id, 
          visit_id: labVisitId, 
          patient_code: patientData?.reference_code || 'Pacient', 
          title: 'Analiza u Kthye për Përsëritje ⚠️', 
          message: `Mjeku kërkon përsëritjen e mostrave. Shikoni arsyen në dosje.` 
        }]);
      }
      
      setRejectModalVisible(false);
      setIsLabRejected(true);
      setLabRejectionReason(rejectionReason);
      setRejectionReason('');
      setSuccessModal({ visible: true, title: 'Analiza u Kthye!', message: 'Laboranti u njoftua dhe vizita e tij u rihap me një orar të ri.' });
      
    } catch (error: any) { 
      setErrorModal({ visible: true, message: 'Ndodhi një gabim: ' + error.message }); 
    } finally { 
      setRejecting(false); 
    }
  };

  // === VALIDIMI I KRYQËZUAR PËR BLLOKIMIN E CHECK-OUT ===
  const getMissingRoles = () => {
    const missing = [];
    
    // Laboranti nuk varet nga askush
    if (userProfession === 'laborant') {
      const hasLabReport = labResults.trim() !== '' || existingFileUrl !== '';
      if (!hasLabReport) missing.push('Laboranti (Ju)');
      return missing;
    }

    // Mjeku nuk varet nga Laboranti, varet vetëm nga Infermieri
    const needsNurse = teamProfessions.includes('infermier');
    const hasDocReport = doctorObservations.trim() !== '' || doctorServices.trim() !== '';
    const hasNurseReport = nurseInterventions.trim() !== '' || bp.trim() !== '' || temp.trim() !== '';

    if (!hasDocReport) missing.push('Mjeku');
    if (needsNurse && !hasNurseReport) missing.push('Infermieri');
    
    return missing;
  };

  const initiateStatusChange = (newStatus: string) => {
    if (newStatus === visitData?.status) return;

    if (newStatus === 'completed') {
      const missing = getMissingRoles();
      if (missing.length > 0) {
        setWarningModalVisible({ visible: true, missingRoles: missing });
        return;
      }
    }

    setTargetStatus(newStatus); 
    setConfirmationModalVisible(true);
  };

  const confirmAndExecuteStatusChange = async () => {
    setConfirmationModalVisible(false); 
    setUpdating(true);
    try {
      const updateData: any = { status: targetStatus };
      if (targetStatus === 'in_progress') updateData.actual_start = new Date().toISOString();
      if (targetStatus === 'completed') updateData.actual_end = new Date().toISOString();

      if (isOffline) {
        const actionPayload = { type: 'UPDATE_STATUS', table: 'visits', id: visitId, data: updateData, timestamp: Date.now() };
        const existingQueue = await AsyncStorage.getItem('@offline_queue');
        const queue = existingQueue ? JSON.parse(existingQueue) : [];
        queue.push(actionPayload);
        await AsyncStorage.setItem('@offline_queue', JSON.stringify(queue));

        setVisitData((prev: any) => ({ ...prev, ...updateData }));
        setSuccessModal({ visible: true, title: 'Ruajtur Offline!', message: 'Statusi i vizitës u ndryshua lokalisht.' });
        setUpdating(false);
        return;
      }

      const { error } = await supabase.from('visits').update(updateData).eq('id', visitId); 
      if (error) throw error;

      let notifTitle = ''; let notifMessage = '';
      if (targetStatus === 'in_progress') { notifTitle = 'Vizita Fiksoi Fillimin 🚀'; notifMessage = `Ekipi nisi vizitën për pacientin ${patientData?.reference_code}.`; } 
      else if (targetStatus === 'completed') { notifTitle = 'Vizita Përfundoi ✅'; notifMessage = `Ekipi mbylli vizitën për pacientin ${patientData?.reference_code}.`; } 
      else if (targetStatus === 'cancelled') { notifTitle = 'Vizita u Anulua ❌'; notifMessage = `Vizita për pacientin ${patientData?.reference_code} u anulua.`; }

      if (notifTitle) {
        await supabase.from('notifications').insert([
          { target_role: 'admin', visit_id: visitId, patient_code: patientData?.reference_code || 'Pacient', title: notifTitle, message: notifMessage },
          { target_role: 'supervisor', visit_id: visitId, patient_code: patientData?.reference_code || 'Pacient', title: notifTitle, message: notifMessage }
        ]);
      }

      setVisitData((prev: any) => ({ ...prev, ...updateData }));
    } catch (err: any) { setErrorModal({ visible: true, message: err.message || 'Përditësimi dështoi nga sistemi.' }); } finally { setUpdating(false); }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (result.canceled === false && result.assets && result.assets.length > 0) setSelectedFile(result.assets[0]);
    } catch (err) { console.log('Gabim:', err); }
  };

  const handleOpenDocument = async (fileUrl: string) => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith('http')) {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) await Linking.openURL(fileUrl);
        else setErrorModal({ visible: true, message: 'Nuk ka aplikacion në këtë pajisje për të hapur linkun.' });
      } else { setErrorModal({ visible: true, message: 'Ky skedar nuk është i ngarkuar në sistem.' }); }
    } catch (error) { setErrorModal({ visible: true, message: 'Ndodhi një problem gjatë përpjekjes për të hapur skedarin.' }); }
  };

  const uploadFileToSupabase = async (fileInfo: any) => {
    try {
      setUploadingFile(true);
      const cleanFileName = fileInfo.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const uniqueFileName = `${visitId}_${Date.now()}_${cleanFileName}`;
      const formData = new FormData();
      formData.append('file', { uri: Platform.OS === 'ios' ? fileInfo.uri.replace('file://', '') : fileInfo.uri, name: uniqueFileName, type: fileInfo.mimeType || 'application/octet-stream' } as any);
      const { error } = await supabase.storage.from('lab-results').upload(uniqueFileName, formData);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('lab-results').getPublicUrl(uniqueFileName);
      return publicUrlData.publicUrl;
    } catch (error: any) { throw new Error("Nuk u ngarkua skedari."); } finally { setUploadingFile(false); }
  };

  const handleSendLabRequest = async () => {
    if (!requestedLabTests.trim()) { setErrorModal({ visible: true, message: 'Ju lutem specifikoni detyrat/analizat e kërkuara.' }); return; }
    if (isOffline) { setErrorModal({ visible: true, message: 'Kërkesat e reja për laborantin mund të dërgohen vetëm kur keni internet.' }); return; }
    
    setLabRequestModalVisible(false); setRequestingLab(true);
    try {
      const now = new Date(); const endTime = new Date(now.getTime() + 60 * 60 * 1000); 
      const { data: newVisit, error: insertError } = await supabase.from('visits').insert([{ patient_id: visitData.patient_id, assigned_team_id: visitData.assigned_team_id, scheduled_start: now.toISOString(), scheduled_end: endTime.toISOString(), status: 'scheduled', care_category: 'Laborator', priority: visitData?.priority || 'normale' }]).select().single(); 
      if (insertError) throw insertError;

      const { data: noteInsert } = await supabase.from('field_notes').insert([{ visit_id: newVisit.id, needs_lab_tests: true, requested_lab_tests: requestedLabTests, author_role: 'laborant' }]).select().single();
      
      const { data: labUser } = await supabase.from('users').select('id').ilike('profession', '%laborant%').eq('team_id', visitData.assigned_team_id).maybeSingle();

      if (labUser) {
        await supabase.from('notifications').insert([{ target_role: 'laborant', target_user_id: labUser.id, visit_id: newVisit.id, patient_code: patientData?.reference_code || 'Pacient', title: 'Detyrë e Re Laboratorike 🔬', message: `Mjeku ka deleguar një detyrë laboratori.` }]);
      }

      setHasLabRequest(true);
      setLabVisitId(newVisit.id);
      setLabNoteId(noteInsert?.id);
      setSuccessModal({ visible: true, title: 'Kërkesa u Dërgua!', message: 'Laboranti u njoftua dhe udhëzimet tuaja u ruajtën.' });
    } catch (error: any) { setErrorModal({ visible: true, message: 'Dështoi dërgimi: ' + error.message }); setHasLabRequest(false); } finally { setRequestingLab(false); }
  };

  const getStatusName = (status: string) => {
    switch(status) { case 'scheduled': return 'Në pritje'; case 'in_progress': return 'Check-In'; case 'completed': return 'Check-Out (Përfunduar)'; case 'cancelled': return 'Anuluar'; default: return ''; }
  };

  // Funksion ndihmës për të shfaqur listën e dokumenteve (p.sh. e para, e përsëritur, etj.)
  const renderDocumentBadges = (urlStr: string, isDoctor: boolean) => {
    if (!urlStr) return null;
    const urls = urlStr.split(',').filter(Boolean);
    return urls.map((url, index) => (
      <TouchableOpacity 
        key={index}
        style={[styles.fileAttachmentBadge, { marginTop: index === 0 ? (isDoctor ? 12 : 0) : 10 }]} 
        onPress={() => handleOpenDocument(url)}
      >
        <Ionicons name={isDoctor ? "document-text" : "checkmark-circle"} size={24} color={isDoctor ? "#a78bfa" : "#10b981"} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 13}}>
            {isDoctor ? `Shkarko / Hap Rezultatin ${urls.length > 1 ? index + 1 : ''}` : `Skedari ${urls.length > 1 ? index + 1 : ''} u ruajt`}
          </Text>
          <Text style={{color: '#a7f3d0', fontSize: 12}} numberOfLines={1}>{url.split('/').pop()}</Text>
        </View>
        <Ionicons name={isDoctor ? "download-outline" : "open-outline"} size={20} color={isDoctor ? "#a78bfa" : "#10b981"} />
      </TouchableOpacity>
    ));
  };

  if (loading || !visitData) {
    return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#38bdf8" /><Text style={styles.loadingText}>Po sinkronizoj të dhënat...</Text></View> );
  }

  const isEmergency = visitData.priority?.toLowerCase() === 'emergjente';
  const isFinalized = visitData.status === 'completed' || visitData.status === 'cancelled';
  const isTargetFinal = targetStatus === 'completed' || targetStatus === 'cancelled';
  const visitTimeStr = new Date(visitData.scheduled_start).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
  const isClinicalStaff = ['mjek', 'infermier', 'laborant'].includes(userProfession);

  const isDoctorInTeam = teamProfessions.includes('mjek');
  const isTeamLead = userProfession === 'laborant' || userProfession === 'mjek' || (userProfession === 'infermier' && !isDoctorInTeam);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {isOffline && (
        <View style={{ backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>Modaliteti Jashtë Linje (Offline Mode)</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Detajet e Detyrës (Terren)</Text>
        <View style={{ width: 40 }}></View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={44} color="#38bdf8" />
            <View style={styles.cardTitleContainer}>
              <Text style={styles.patientCode}>{patientData?.reference_code || 'Pacient i Panjohur'}</Text>
              <Text style={styles.timeText}>🕒 Orari i Caktuar: {visitTimeStr}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, isEmergency && styles.emergencyCard]}>
          <Text style={styles.sectionTitle}>Specifikat e Detyrës</Text>
          <View style={styles.infoRow}><Ionicons name="medkit" size={20} color="#38bdf8" /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Kategoria e Shërbimit</Text><Text style={styles.infoValue}>{visitData.care_category || 'E paspecifikuar'}</Text></View></View>
          <View style={styles.infoRow}><Ionicons name="warning" size={20} color={isEmergency ? "#ef4444" : "#f59e0b"} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Prioriteti</Text><Text style={[styles.infoValue, isEmergency && styles.emergencyText]}>{visitData.priority ? visitData.priority.charAt(0).toUpperCase() + visitData.priority.slice(1) : 'Normal'}</Text></View></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Të Dhëna Paraprake (Regjistri)</Text>
          <View style={styles.medicalBlock}><View style={styles.medicalLabelRow}><Ionicons name="alert-circle" size={18} color="#ef4444"/><Text style={[styles.medicalLabel, {color: '#ef4444'}]}> Alergjitë e Njohura:</Text></View><Text style={styles.medicalValue}>{patientData?.allergies || 'Nuk ka të dhëna'}</Text></View>
          <View style={[styles.medicalBlock, { borderLeftColor: '#8b5cf6', marginBottom: 0 }]}><View style={styles.medicalLabelRow}><Ionicons name="fitness" size={18} color="#8b5cf6"/><Text style={[styles.medicalLabel, {color: '#c4b5fd'}]}> Kushtet Specifike:</Text></View><Text style={styles.medicalValue}>{patientData?.medical_condition || patientData?.medical_conditions || 'Nuk ka të dhëna'}</Text></View>
        </View>

        {isClinicalStaff && (
          <View style={[styles.card, { borderColor: '#10b981', borderWidth: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
            <Text style={[styles.sectionTitle, { color: '#10b981', marginBottom: 12 }]}>📝 Shënimet dhe Detyrat</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>Regjistri i Terrenit</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{isFinalized ? 'Vizita është e mbyllur. Shënimet janë vetëm për lexim.' : fieldNote ? 'Keni shtuar shënime për këtë detyrë. Ato janë gati për rishikim.' : 'Plotësoni shënimet objektive dhe detyrat e kryera për këtë vizitë.'}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: isFinalized ? '#475569' : '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }} onPress={() => setReportModalVisible(true)}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>{isFinalized ? 'Shiko Shënimet' : fieldNote ? 'Shiko/Edito' : 'Shto Shënime'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- PAMJA E LABORANTIT --- */}
        {userProfession === 'laborant' && (
          <View style={[styles.card, { borderColor: '#a78bfa', borderWidth: 1.5, backgroundColor: 'rgba(167, 139, 250, 0.05)' }]}>
            <Text style={[styles.sectionTitle, { color: '#c4b5fd', marginBottom: 12 }]}>🧪 Detyra nga Ekipi</Text>
            
            {isLabRejected && (
              <View style={{backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#ef4444'}}>
                <Text style={{color: '#ef4444', fontWeight: 'bold', fontSize: 14}}>⚠️ Analiza u kthye për përsëritje!</Text>
                <Text style={{color: '#fca5a5', marginTop: 4, fontSize: 13}}>{labRejectionReason}</Text>
                <Text style={{color: '#fca5a5', marginTop: 8, fontSize: 11, fontStyle: 'italic'}}>Ju lutem ngarkoni rezultatet e reja në "Shënimet Digjitale".</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: existingFileUrl ? 12 : 0 }}>
              <Ionicons name="document-text" size={22} color="#a78bfa" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.medicalValue, { fontWeight: '500', color: '#ffffff', lineHeight: 22 }]}>{requestedLabTests || 'Nuk ka udhëzime shtesë nga mjeku. Veproni sipas protokollit.'}</Text>
              </View>
            </View>
            
            {/* Shfaq të gjithë skedarët që janë ngarkuar */}
            {renderDocumentBadges(existingFileUrl, false)}
          </View>
        )}

        {/* --- PAMJA E MJEKUT PËR DELEGIM KËRKESE --- */}
        {userProfession === 'mjek' && (
          <View style={[styles.card, { borderColor: isFinalized && !hasLabRequest ? '#334155' : '#8b5cf6', borderWidth: 1.5, backgroundColor: isFinalized && !hasLabRequest ? 'transparent' : 'rgba(139, 92, 246, 0.05)', opacity: isFinalized && !hasLabRequest ? 0.6 : 1 }]}>
            <Text style={[styles.sectionTitle, { color: isFinalized && !hasLabRequest ? '#64748b' : '#c4b5fd', marginBottom: 12 }]}>🔬 Delegimi i Detyrës (Laborator)</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: isFinalized && !hasLabRequest ? '#94a3b8' : '#ffffff', fontSize: 14, fontWeight: 'bold' }}>Kërko Asistencë Laboratorike</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{hasLabRequest ? 'Detyra i është deleguar laborantit të ekipit.' : isFinalized ? 'Vizita është mbyllur. Nuk mund të delegoni detyra të reja.' : 'Njoftoni laborantin për marrje mostrash.'}</Text>
              </View>
              {requestingLab ? ( <ActivityIndicator size="small" color="#8b5cf6" /> ) : (
                <Switch value={hasLabRequest} onValueChange={(val) => { if (val && !hasLabRequest) setLabRequestModalVisible(true); }} disabled={hasLabRequest || isFinalized} trackColor={{ false: '#334155', true: '#8b5cf6' }} thumbColor={isFinalized && !hasLabRequest ? '#64748b' : '#ffffff'} />
              )}
            </View>

            {hasLabRequest && requestedLabTests ? (
              <View style={{ marginTop: 16, backgroundColor: 'rgba(139,92,246,0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' }}>
                <Text style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' }}>Analizat e Kërkuara:</Text>
                <Text style={{ color: '#ffffff', fontSize: 14 }}>{requestedLabTests}</Text>
              </View>
            ) : null}

            {/* MJEKU SHIKON REZULTATET DHE MUND T'I KTHEJË MBRAPSHT */}
            {hasLabRequest && (labResults || existingFileUrl || isLabRejected) ? (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.2)', paddingTop: 16 }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>Të Dhënat e Kthyera nga Laboranti:</Text>
                  
                  {/* BUTONI PËR KTHIM TË ANALIZËS (Gjithmonë aktiv për mjekun nëse nuk e ka kthyer tashmë) */}
                  {!isLabRejected && (
                    <TouchableOpacity onPress={() => setRejectModalVisible(true)} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6}}>
                      <Ionicons name="refresh-circle" size={16} color="#ef4444" />
                      <Text style={{color: '#ef4444', fontSize: 12, fontWeight: 'bold', marginLeft: 4}}>Kërko Përsëritje</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isLabRejected && (
                  <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ef4444' }}>
                    <Text style={{color: '#ef4444', fontSize: 13, fontWeight: 'bold'}}>Keni kërkuar përsëritjen e kësaj analize.</Text>
                    <Text style={{color: '#fca5a5', fontSize: 12, marginTop: 4, fontStyle: 'italic'}}>Arsyeja: {labRejectionReason}</Text>
                    <Text style={{color: '#fca5a5', fontSize: 11, marginTop: 4}}>Në pritje të rezultateve të reja nga laboranti...</Text>
                  </View>
                )}

                {!isLabRejected && labResults ? (<View style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 12, borderRadius: 8 }}><Text style={{ color: '#e2e8f0', fontSize: 14 }}>{labResults}</Text></View>) : null}
                
                {/* Renderimi i shumëfishtë i PDF-ve për Mjekun */}
                {!isLabRejected && existingFileUrl ? renderDocumentBadges(existingFileUrl, true) : null}
              </View>
            ) : null}
          </View>
        )}

        {/* MENAXHIMI I STATUSIT TË VIZITËS */}
        {!isTeamLead ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Menaxhimi i Vizitës</Text>
            <View style={[styles.lockedMessageContainer, { borderColor: '#3b82f6', backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Ionicons name="information-circle" size={24} color="#38bdf8" />
              <Text style={[styles.lockedMessageText, { color: '#e0f2fe' }]}>Check-In dhe Check-Out për këtë vizitë menaxhohen nga Mjeku i Ekipit. Plotësoni raportin tuaj.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Statusi i Detyrës (Ekipi)</Text>
            
            {isFinalized ? (
              <View style={styles.lockedMessageContainer}>
                <Ionicons name="lock-closed" size={16} color="#f59e0b" />
                <Text style={styles.lockedMessageText}>Operacioni është mbyllur dhe detyrat janë në pritje të rishikimit nga Mbikëqyrësi.</Text>
              </View>
            ) : (
              <Text style={styles.statusDescription}>Regjistroni Check-in dhe Check-out për të përditësuar panelin qendror.</Text>
            )}

            {updating ? (
              <View style={styles.updatingContainer}><ActivityIndicator size="small" color="#38bdf8" /><Text style={styles.updatingText}>Po sinkronizohet...</Text></View>
            ) : (
              <View style={styles.statusGrid}>
                <TouchableOpacity style={[styles.statusBtn, visitData.status === 'scheduled' && styles.statusActiveScheduled, isFinalized && styles.statusDisabled]} disabled={isFinalized} onPress={() => initiateStatusChange('scheduled')}>
                  <Ionicons name="calendar-outline" size={20} color={visitData.status === 'scheduled' ? "#a16207" : "#64748b"} />
                  <Text style={[styles.statusBtnText, visitData.status === 'scheduled' && { color: "#a16207" }]}>Në pritje</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.statusBtn, visitData.status === 'in_progress' && styles.statusActiveProgress, isFinalized && styles.statusDisabled]} disabled={isFinalized} onPress={() => initiateStatusChange('in_progress')}>
                  <Ionicons name="location-outline" size={20} color={visitData.status === 'in_progress' ? "#1d4ed8" : "#64748b"} />
                  <Text style={[styles.statusBtnText, visitData.status === 'in_progress' && { color: "#1d4ed8" }]}>Check-In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.statusBtn, visitData.status === 'completed' && styles.statusActiveCompleted, isFinalized && styles.statusDisabled]} 
                  disabled={isFinalized} 
                  onPress={() => initiateStatusChange('completed')}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={visitData.status === 'completed' ? "#15803d" : "#64748b"} />
                  <Text style={[styles.statusBtnText, visitData.status === 'completed' && { color: "#15803d" }]}>Check-Out</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.statusBtn, visitData.status === 'cancelled' && styles.statusActiveCancelled, isFinalized && styles.statusDisabled]} disabled={isFinalized} onPress={() => initiateStatusChange('cancelled')}>
                  <Ionicons name="close-circle-outline" size={20} color={visitData.status === 'cancelled' ? "#991b1b" : "#64748b"} />
                  <Text style={[styles.statusBtnText, visitData.status === 'cancelled' && { color: "#991b1b" }]}>Anulo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODALI I SHËNIMEVE DIGJITALE (Të ndara sipas rolit) */}
      <Modal animationType="slide" transparent={true} visible={reportModalVisible} onRequestClose={() => setReportModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{isFinalized ? 'Shënimet e Arkivuara' : 'Detyrat dhe Shënimet Digjitale'}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}><Ionicons name="close" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.reportForm} showsVerticalScrollIndicator={false}>
              
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>⚠️ NJOFTIM MBI PËRDORIMIN</Text>
                <Text style={{ color: '#fcd34d', fontSize: 11, lineHeight: 16 }}>Ky sistem është ekskluzivisht për menaxhim logjistik dhe regjistrim objektiv të detyrave në terren. Sistemi nuk ofron diagnoza.</Text>
              </View>

              {userProfession === 'mjek' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Vëzhgime Objektive (Nga Terreni)</Text>
                    <TextInput style={styles.textArea} editable={!isFinalized} placeholder="Shënoni vëzhgimet objektive rreth gjendjes së ambientit apo situatës fizike..." placeholderTextColor="#475569" value={doctorObservations} onChangeText={setDoctorObservations} multiline={true} numberOfLines={3} textAlignVertical="top" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Detyrat e Kryera</Text>
                    <TextInput style={styles.textArea} editable={!isFinalized} placeholder="Listoni detyrat apo shërbimet e kryera..." placeholderTextColor="#475569" value={doctorServices} onChangeText={setDoctorServices} multiline={true} numberOfLines={3} textAlignVertical="top" />
                  </View>
                </>
              )}

              {userProfession === 'infermier' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ndërhyrjet Infermierore (Detyrat)</Text>
                    <TextInput style={styles.textArea} editable={!isFinalized} placeholder="Përshkruani shërbimet si fashime, pastrime, etj..." placeholderTextColor="#475569" value={nurseInterventions} onChangeText={setNurseInterventions} multiline={true} numberOfLines={3} textAlignVertical="top" />
                  </View>
                  
                  <Text style={[styles.sectionTitle, {color: '#cbd5e1', marginBottom: 12, marginTop: 10}]}>Regjistrimi i Vlerave (Parametrat Baze)</Text>
                  <View style={styles.vitalSignsRow}>
                    <View style={styles.inputGroupHalf}><Text style={styles.inputLabel}>Presioni (BP)</Text><TextInput style={styles.input} editable={!isFinalized} placeholder="p.sh. 120/80" placeholderTextColor="#475569" value={bp} onChangeText={setBp} /></View>
                    <View style={styles.inputGroupHalf}><Text style={styles.inputLabel}>Pulsi (HR)</Text><TextInput style={styles.input} editable={!isFinalized} placeholder="p.sh. 75" placeholderTextColor="#475569" value={hr} onChangeText={setHr} keyboardType="numeric" /></View>
                  </View>
                  <View style={styles.vitalSignsRow}>
                    <View style={styles.inputGroupHalf}><Text style={styles.inputLabel}>Temp (°C)</Text><TextInput style={styles.input} editable={!isFinalized} placeholder="p.sh. 36.5" placeholderTextColor="#475569" value={temp} onChangeText={setTemp} keyboardType="numeric" /></View>
                    <View style={styles.inputGroupHalf}><Text style={styles.inputLabel}>SpO2 (%)</Text><TextInput style={styles.input} editable={!isFinalized} placeholder="p.sh. 98" placeholderTextColor="#475569" value={spo2} onChangeText={setSpo2} keyboardType="numeric" /></View>
                  </View>
                </>
              )}

              {userProfession === 'laborant' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Dokumenti i Analizave (PDF / Foto)</Text>
                    
                    {/* Skedarët e vjetër nëse ekzistojnë */}
                    {existingFileUrl ? (
                      <View style={{marginBottom: 12}}>
                        <Text style={{color: '#94a3b8', fontSize: 12, marginBottom: 4}}>Skedarët e ngarkuar më herët:</Text>
                        {renderDocumentBadges(existingFileUrl, false)}
                      </View>
                    ) : null}

                    <TouchableOpacity style={[styles.fileUploadBtn, isFinalized && {opacity: 0.5}]} onPress={handlePickDocument} disabled={isFinalized}>
                      <Ionicons name={selectedFile ? "document-attach" : "cloud-upload-outline"} size={28} color={selectedFile ? "#10b981" : "#38bdf8"} />
                      <View style={{marginLeft: 12, flex: 1}}>
                        <Text style={{color: '#ffffff', fontWeight: 'bold'}}>{selectedFile ? 'Skedari i ri u zgjodh' : 'Ngarko skedar të ri'}</Text>
                        <Text style={{color: '#94a3b8', fontSize: 12, marginTop: 2}} numberOfLines={1}>{selectedFile?.name || 'Kliko për të zgjedhur nga telefoni'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rezultatet e Matjeve (Vlera Numerike - Opsionale)</Text>
                    <TextInput style={[styles.textArea, { minHeight: 100 }]} editable={!isFinalized} placeholder="Regjistroni rezultatet shtesë ose vlerat numerike..." placeholderTextColor="#475569" value={labResults} onChangeText={setLabResults} multiline={true} textAlignVertical="top" />
                  </View>
                </>
              )}
            </ScrollView>
            
            {!isFinalized && (
              <View style={styles.reportFooter}>
                <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#10b981'}]} onPress={handleSaveReport} disabled={savingReport || uploadingFile}>
                  {savingReport || uploadingFile ? (
                    <View style={{flexDirection: 'row', alignItems: 'center'}}><ActivityIndicator color="#ffffff" size="small" /><Text style={[styles.saveBtnText, {marginLeft: 8}]}>{uploadingFile ? 'Po ngarkoj skedarin...' : 'Po ruaj...'}</Text></View>
                  ) : (
                    <><Ionicons name="save-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} /><Text style={styles.saveBtnText}>Ruaj Shënimet</Text></>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODALI I KTHIMIT TË ANALIZËS MBRAPSHT NGA MJEKU */}
      <Modal animationType="slide" transparent={true} visible={rejectModalVisible} onRequestClose={() => setRejectModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Kërko Përsëritjen e Analizës</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}><Ionicons name="close" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.reportForm}>
              <Text style={{color: '#94a3b8', fontSize: 14, marginBottom: 16, lineHeight: 20}}>Nëse mendoni se rezultati është i pasaktë ose mostra është dëmtuar, shënoni arsyen më poshtë. Kjo do ta rihapë detyrën e laborantit me orar të ri.</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: '#ef4444'}]}>Arsyeja e Kthimit (E detyrueshme)</Text>
                <TextInput style={[styles.textArea, { borderColor: '#ef4444' }]} placeholder="p.sh. Mostra e gjakut ishte e koaguluar..." placeholderTextColor="#475569" value={rejectionReason} onChangeText={setRejectionReason} multiline={true} numberOfLines={4} textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={styles.reportFooter}>
              <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#ef4444'}]} onPress={handleRejectLabReport} disabled={rejecting}>
                {rejecting ? <ActivityIndicator color="#ffffff" size="small" /> : <><Ionicons name="refresh-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} /><Text style={styles.saveBtnText}>Konfirmo Përsëritjen</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODALI I DELEGIMIT TË LABORANTIT */}
      <Modal animationType="slide" transparent={true} visible={labRequestModalVisible} onRequestClose={() => setLabRequestModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Delegimi i Detyrës</Text>
              <TouchableOpacity onPress={() => { setLabRequestModalVisible(false); setRequestedLabTests(''); }}><Ionicons name="close" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.reportForm}>
              <Text style={{color: '#94a3b8', fontSize: 14, marginBottom: 16, lineHeight: 20}}>Specifikoni saktësisht matjet apo mostrat që laboranti duhet të marrë në terren.</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {color: '#a78bfa'}]}>Detyrat për Laborantin</Text>
                <TextInput style={[styles.textArea, { borderColor: '#8b5cf6' }]} placeholder="p.sh. Marrja e mostrave të gjakut..." placeholderTextColor="#475569" value={requestedLabTests} onChangeText={setRequestedLabTests} multiline={true} numberOfLines={4} textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={styles.reportFooter}>
              <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#8b5cf6'}]} onPress={handleSendLabRequest} disabled={requestingLab}>
                {requestingLab ? <ActivityIndicator color="#ffffff" size="small" /> : <><Ionicons name="send" size={20} color="#ffffff" style={{ marginRight: 8 }} /><Text style={styles.saveBtnText}>Delego Detyrën</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* WARNING MODAL: KUR MUNGOJNË SHËNIMET NGA EKIPET E TJERA */}
      <Modal animationType="fade" transparent={true} visible={warningModalVisible.visible} onRequestClose={() => setWarningModalVisible({...warningModalVisible, visible: false})}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Ionicons name="document-text" size={50} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Mungojnë Shënimet</Text>
            <Text style={styles.modalMessage}>
              Për të mbyllur vizitën plotësisht (Check-Out), nevojiten të gjitha raportet nga ekipi.{'\n\n'}
              <Text style={{color: '#cbd5e1', fontWeight: 'bold'}}>Në pritje nga: {warningModalVisible.missingRoles.join(', ')}</Text>
              {isOffline ? '\n(Nëse janë plotësuar në pajisje tjetër, prisni lidhjen me internetin)' : ''}
            </Text>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#f59e0b' }]} onPress={() => setWarningModalVisible({...warningModalVisible, visible: false})}>
              <Text style={styles.modalButtonText}>Kuptova</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION & ALERTS */}
      <Modal animationType="fade" transparent={true} visible={confirmationModalVisible} onRequestClose={() => setConfirmationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: isTargetFinal ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)' }]}>
              <Ionicons name={isTargetFinal ? "warning" : "help-circle"} size={50} color={isTargetFinal ? "#f59e0b" : "#38bdf8"} />
            </View>
            <Text style={styles.modalTitle}>Konfirmim Statusi</Text>
            <Text style={styles.modalMessage}>A dëshironi të shënoni këtë detyrë si <Text style={{fontWeight: 'bold', color: '#ffffff'}}>"{getStatusName(targetStatus)}"</Text>? {isTargetFinal ? 'Kjo do të kyçë të gjitha shënimet për të gjithë ekipin tuaj (Mjek+Infermier)!' : ''}</Text>
            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmationModalVisible(false)}><Text style={styles.cancelBtnText}>Anulo</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, isTargetFinal && {backgroundColor: '#f59e0b'}]} onPress={confirmAndExecuteStatusChange}><Text style={styles.confirmBtnText}>Konfirmo</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={successModal.visible} onRequestClose={() => setSuccessModal({...successModal, visible: false})}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}><Ionicons name="checkmark-circle" size={60} color="#10b981" /></View><Text style={styles.modalTitle}>{successModal.title}</Text><Text style={styles.modalMessage}>{successModal.message}</Text><TouchableOpacity style={[styles.modalButton, {backgroundColor: '#10b981'}]} onPress={() => setSuccessModal({...successModal, visible: false})}><Text style={styles.modalButtonText}>Në rregull</Text></TouchableOpacity></View></View>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={errorModal.visible} onRequestClose={() => setErrorModal({...errorModal, visible: false})}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}><Ionicons name="close-circle" size={60} color="#ef4444" /></View><Text style={styles.modalTitle}>Gabim Sistemi</Text><Text style={styles.modalMessage}>{errorModal.message}</Text><TouchableOpacity style={[styles.modalButton, {backgroundColor: '#ef4444'}]} onPress={() => setErrorModal({...errorModal, visible: false})}><Text style={styles.modalButtonText}>Mbyll</Text></TouchableOpacity></View></View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#0f172a' },
  backBtn: { padding: 8, borderRadius: 8, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  emergencyCard: { borderColor: 'rgba(239, 68, 68, 0.4)', borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitleContainer: { marginLeft: 14 },
  patientCode: { fontSize: 24, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  timeText: { fontSize: 14, color: '#38bdf8', marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  infoTextContainer: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 15, color: '#ffffff', marginTop: 2, fontWeight: '600' },
  emergencyText: { color: '#ef4444', fontWeight: 'bold' },
  medicalBlock: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  medicalLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  medicalLabel: { fontSize: 13, fontWeight: 'bold', color: '#cbd5e1' },
  medicalValue: { fontSize: 15, color: '#e2e8f0', lineHeight: 22, fontWeight: '500' },
  fileUploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', borderStyle: 'dashed', borderRadius: 12, padding: 16 },
  fileAttachmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  statusSection: { marginTop: 8 },
  statusDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 16, marginTop: -8 },
  lockedMessageContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 16, marginTop: -8 },
  lockedMessageText: { fontSize: 13, color: '#fcd34d', marginLeft: 8, flex: 1, lineHeight: 18, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  statusBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', gap: 8 },
  statusBtnText: { fontSize: 15, fontWeight: '700', color: '#cbd5e1' },
  statusDisabled: { opacity: 0.4, borderColor: '#1e293b' },
  statusActiveScheduled: { backgroundColor: 'rgba(254, 240, 138, 0.1)', borderColor: '#ca8a04' },
  statusActiveProgress: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#3b82f6' },
  statusActiveCompleted: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#16a34a' },
  statusActiveCancelled: { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: '#dc2626' },
  updatingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  updatingText: { color: '#38bdf8', marginLeft: 10, fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  modalIconContainer: { marginBottom: 16, borderRadius: 50, padding: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButton: { paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalActionButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 15, fontWeight: 'bold' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' },
  confirmBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  reportModalContent: { backgroundColor: '#1e293b', width: '100%', maxHeight: '90%', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginTop: 'auto' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155', backgroundColor: '#0f172a' },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  reportForm: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputGroupHalf: { width: '48%' },
  vitalSignsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#cbd5e1', fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  textArea: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, minHeight: 80 },
  reportFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#334155', backgroundColor: '#0f172a' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});