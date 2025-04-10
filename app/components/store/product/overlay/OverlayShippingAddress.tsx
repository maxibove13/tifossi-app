import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import CloseIcon from '../../../../../assets/icons/close.svg';
import PlusCircle from '../../../../../assets/icons/plus_circle.svg';
import RadioButton from '../../../../components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fontWeights } from '../../../../styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface Address {
  id: string;
  name: string;
}

interface OverlayShippingAddressProps {
  isVisible: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext: (selectedAddress: string) => void;
  addresses?: Address[];
}

export default function OverlayShippingAddress({
  isVisible,
  onClose,
  onBack,
  onNext,
  addresses = [
    { id: '1', name: 'Luis A. de Herrera  - Pando' },
    { id: '2', name: 'Calle 13 - Las Toscas' }
  ]
}: OverlayShippingAddressProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    if (isVisible) {
      // Start fade-in and slide-up animations when overlay becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animation values when overlay is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddress(addressId);
  };

  const handleNext = () => {
    if (selectedAddress) {
      onNext(selectedAddress);
    }
  };

  const handleAddNewAddress = () => {
    // This would normally open another screen to add a new address
    console.log('Add new address');
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.modalContainer}>
        {/* Animated overlay background that can be tapped to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View 
            style={[
              styles.overlay, 
              { opacity: fadeAnim }
            ]} 
          />
        </TouchableWithoutFeedback>

        {/* Animated container that slides up */}
        <Animated.View 
          style={[
            styles.container, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Direcciones de envío</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.addressesContainer}>
              <Text style={styles.sectionTitle}>Mis direcciones</Text>
              
              <View style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressItem}
                    onPress={() => handleAddressSelect(address.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addressText}>{address.name}</Text>
                    <RadioButton selected={selectedAddress === address.id} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.addAddressContainer}>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={handleAddNewAddress}
                activeOpacity={0.7}
              >
                <PlusCircle width={20} height={20} stroke={colors.primary} strokeWidth={1.6} />
                <Text style={styles.addAddressText}>Adicionar dirección nueva</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              activeOpacity={0.7}
              disabled={!selectedAddress}
            >
              <Text style={styles.primaryButtonText}>Siguiente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Atrás</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

type Styles = {
  modalContainer: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  content: ViewStyle;
  addressesContainer: ViewStyle;
  sectionTitle: TextStyle;
  addressList: ViewStyle;
  addressItem: ViewStyle;
  addressText: TextStyle;
  addAddressContainer: ViewStyle;
  addAddressButton: ViewStyle;
  addAddressText: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: 54,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 10,
    width: '100%',
    height: '90%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
    color: '#424242',
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
  },
  addressesContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: '#707070',
  },
  addressList: {
    gap: spacing.md,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  addressText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
  addAddressContainer: {
    paddingHorizontal: 48,
  },
  addAddressButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 24,
  },
  addAddressText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    color: '#0C0C0C',
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C0C',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    color: '#FBFBFB',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    color: '#0C0C0C',
  },
}); 