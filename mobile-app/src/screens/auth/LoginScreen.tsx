import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Gjendja për Modalin e Gabimit
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Fusha të zbrazëta', 'Ju lutem plotësoni email-in dhe fjalëkalimin për të vazhduar.');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showError('Hyrja Dështoi', 'Kredencialet janë të pasakta ose llogaria nuk ekziston.');
      }
      // AuthContext do ta kapë sesionin automatikisht nëse është e suksesshme
    } catch (err) {
      showError('Gabim i Papritur', 'Ndodhi një problem me serverin. Ju lutem provoni përsëri më vonë.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        
        {/* Logoja dhe Titulli */}
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>VIZI<Text style={styles.logoSubText}>TRACK</Text></Text>
          <Text style={styles.subtitle}>Sistemi i Menaxhimit në Terren</Text>
        </View>

        {/* Fusha e Email-it */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email i Përdoruesit</Text>
          <TextInput
            style={styles.input}
            placeholder="shembull@vizitrack.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Fusha e Fjalëkalimit */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fjalëkalimi</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Butoni i Hyrjes */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Hyr në Sistem</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modali Profesional i Gabimit */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={errorModal.visible} 
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={48} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalMessage}>{errorModal.message}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
            >
              <Text style={styles.modalButtonText}>Kuptova</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', 
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 1.5,
  },
  logoSubText: {
    color: '#3b82f6', 
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#2563eb', 
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Stilet e Modalit
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Sfond i errët transparent për të mbuluar aplikacionin
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
  },
  modalIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 50,
    padding: 16,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});