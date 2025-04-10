import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import PlusCircle from '../../assets/icons/plus_circle.svg';
import RadioButton from '../components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../styles/colors';
import { spacing, radius } from '../styles/spacing';
import { fontWeights } from '../styles/typography';

interface Address {
  id: string;
  name: string;
}

export default function ShippingAddressScreen() {
  const params = useLocalSearchParams();
  // Extract product info from params if needed
  
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  
  // Sample addresses - in a real app, these would come from an API or context
  const addresses: Address[] = [
    { id: '1', name: 'Luis A. de Herrera  - Pando' },
    { id: '2', name: 'Calle 13 - Las Toscas' }
  ];

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddress(addressId);
  };

  const handleBack = () => {
    // Navigate back to the previous screen
    router.back();
  };

  const handleNext = () => {
    if (selectedAddress) {
      // In a real app, you would save the selected address
      // For now, just navigate back to the tabs since we don't have a payment screen yet
      router.navigate('/(tabs)');
    }
  };

  const handleAddNewAddress = () => {
    // In a real app, this would navigate to an add address screen
    // For now, we'll just log that this would navigate to a new screen
    console.log('Would navigate to add new address screen');
  };

  const handleClose = () => {
    // Navigate back to the product screen or wherever the flow started
    router.navigate('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Direcciones de envío</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
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
      </ScrollView>

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
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Atrás</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  scrollView: ViewStyle;
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
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 54,
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
    paddingBottom: spacing.xxl,
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
    marginBottom: 34,
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