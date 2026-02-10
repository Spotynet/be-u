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
import {useRouter} from 'expo-router';

interface ServiceDetailModalProps {
  visible: boolean;
  service: any;
  providerType: 'professional' | 'place';
  providerId: number;
  providerName?: string;
  onClose: () => void;
  onBook?: (date: string, slot: any) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  visible,
  service,
  providerType,
  providerId,
  providerName,
  onClose,
  onBook,
}) => {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const handleBookNow = () => {
    // Extract the correct service data
    const serviceInstanceId = service.id;
    // For CustomService, there's no service_type_id, so we use the service.id as serviceTypeId
    // For ProfessionalService/PlaceService, use the service_type_id
    const serviceTypeId = service.service_type_id || service.service || (service.service_details?.id) || service.id;
    const serviceName = service.name || service.service_details?.name || 'Servicio';
    const durationMinutes = service.duration_minutes || service.duration || service.time || 60;
    
    // Debug log
    console.log('ServiceDetailModal - Navigating with:', {
      serviceInstanceId,
      serviceTypeId,
      serviceName,
      service,
    });
    
    // Validate required fields before closing modal
    if (!serviceInstanceId) {
      console.error('❌ Missing required service data:', { 
        serviceInstanceId, 
        serviceTypeId, 
        service 
      });
      // Don't navigate if data is missing
      alert('Error: No se pudo obtener la información del servicio');
      return;
    }
    
    onClose(); // Close modal only after validation
    
    // Navigate to booking screen with service info
    router.push({
      pathname: '/booking',
      params: {
        serviceInstanceId: serviceInstanceId.toString(),
        serviceTypeId: serviceTypeId.toString(),
        serviceName: serviceName,
        serviceType: providerType === 'place' ? 'place_service' : 'professional_service',
        providerId: providerId?.toString() || '0',
        providerName: providerName || '',
        price: service.price?.toString() || '0',
        duration: durationMinutes?.toString() || '60',
      },
    });
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
                  ${Math.round(Number(service.price))} MXN
                </Text>
              </View>
            </View>
          </View>

          {/* Booking Info */}
          <View style={[styles.bookingInfoCard, {backgroundColor: colors.card}]}>
            <View style={styles.bookingInfoHeader}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={[styles.bookingInfoTitle, {color: colors.foreground}]}>
                Solicitar Reserva
              </Text>
            </View>
            <Text style={[styles.bookingInfoText, {color: colors.mutedForeground}]}>
              Selecciona la fecha y hora que prefieras. El proveedor revisará tu solicitud y te confirmará si está disponible.
            </Text>
          </View>
        </ScrollView>

        {/* Book Button Footer */}
        <View style={[styles.footer, {borderTopColor: colors.border, backgroundColor: colors.background}]}>
          <TouchableOpacity
            style={[styles.bookButton, {backgroundColor: colors.primary}]}
            onPress={handleBookNow}
            activeOpacity={0.9}>
            <Ionicons name="calendar" size={20} color="#ffffff" />
            <Text style={styles.bookButtonText}>Solicitar Reserva</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingInfoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  bookingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bookingInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bookingInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

