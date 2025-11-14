import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useThemeVariant} from '@/contexts/ThemeVariantContext';
import {ServiceScheduleView} from './ServiceScheduleView';

interface ServiceDetailModalProps {
  visible: boolean;
  service: any;
  providerType: 'professional' | 'place';
  providerId: number;
  onClose: () => void;
  onBook?: (date: string, slot: any) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  visible,
  service,
  providerType,
  providerId,
  onClose,
  onBook,
}) => {
  const {colors} = useThemeVariant();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const handleSlotSelect = (date: string, slot: any) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
  };

  const handleBook = () => {
    if (selectedDate && selectedSlot && onBook) {
      onBook(selectedDate, selectedSlot);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Detalle del Servicio
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Service Info */}
          <View style={[styles.serviceCard, {backgroundColor: colors.card}]}>
            {service.image_url && (
              <Image
                source={{uri: service.image_url}}
                style={styles.serviceImage}
              />
            )}
            <Text style={[styles.serviceName, {color: colors.foreground}]}>
              {service.name}
            </Text>
            {service.description && (
              <Text
                style={[styles.serviceDescription, {color: colors.mutedForeground}]}>
                {service.description}
              </Text>
            )}
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="time-outline" color={colors.mutedForeground} size={16} />
                <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                  {service.duration_minutes || service.duration} minutos
                </Text>
              </View>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="cash-outline" color={colors.mutedForeground} size={16} />
                <Text style={[styles.serviceDetailText, {color: colors.mutedForeground}]}>
                  ${service.price} MXN
                </Text>
              </View>
            </View>
          </View>

          {/* Schedule View */}
          <ServiceScheduleView
            providerType={providerType}
            providerId={providerId}
            serviceId={service.id}
            serviceDuration={service.duration_minutes || service.duration}
            onSlotSelect={handleSlotSelect}
          />
        </ScrollView>

        {/* Book Button */}
        {selectedDate && selectedSlot && (
          <View style={[styles.footer, {borderTopColor: colors.border}]}>
            <TouchableOpacity
              style={[styles.bookButton, {backgroundColor: colors.primary}]}
              onPress={handleBook}
              activeOpacity={0.9}>
              <Text style={styles.bookButtonText}>Reservar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

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
  closeButton: {
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
  serviceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  serviceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  bookButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

