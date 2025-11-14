import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScheduleEditor} from '@/components/schedule/ScheduleEditor';
import {profileCustomizationApi, linkApi} from '@/lib/api';

export default function ScheduleManagementScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{linkId?: string}>();
  const linkId = params.linkId ? parseInt(params.linkId, 10) : undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLinkedSchedule, setIsLinkedSchedule] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [linkId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      if (linkId) {
        // Load linked professional schedule
        const response = await linkApi.getLinkedProfessionalSchedule(linkId);
        setSchedule(response.data || []);
        setIsLinkedSchedule(true);
      } else {
        // Load own schedule
        const response = await profileCustomizationApi.getAvailabilitySchedule();
        setSchedule(response.data || []);
        setIsLinkedSchedule(false);
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'No se pudo cargar el horario');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newSchedule: any[]) => {
    try {
      setSaving(true);
      if (linkId) {
        // Update linked professional schedule
        await linkApi.updateLinkedProfessionalSchedule(linkId, newSchedule);
      } else {
        // Update own schedule
        await profileCustomizationApi.updateAvailabilitySchedule(newSchedule);
      }
      Alert.alert('Éxito', 'Horario guardado correctamente', [
        {text: 'OK', onPress: () => router.back()},
      ]);
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {backgroundColor: colors.background, paddingTop: insets.top},
        ]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Horarios
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingTop: insets.top},
      ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>
          {isLinkedSchedule ? 'Horario del Profesional' : 'Mis Horarios'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <ScheduleEditor
          initialSchedule={schedule}
          onSave={handleSave}
          onCancel={() => router.back()}
        />
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.savingText, {color: colors.foreground}]}>
            Guardando...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

