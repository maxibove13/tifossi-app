import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Input from '../_components/ui/form/Input';
import SubheaderClose from '../_components/common/SubheaderClose';
import addressService from '../_services/address/addressService';
import { useAuthStore } from '../_stores/authStore';
import { usePaymentStore } from '../_stores/paymentStore';
import { useCheckoutFormValidation } from '../_hooks/useCheckoutFormValidation';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius, layout } from '../_styles/spacing';
import { fontWeights, fontSizes, lineHeights } from '../_styles/typography';

// Define form data interface
interface AddressFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  department: string;
  additionalInfo: string;
}

type AddressFormField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'street'
  | 'number'
  | 'city'
  | 'department';

function NewAddressScreen() {
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === 'true';

  const { token } = useAuthStore();
  const setGuestData = usePaymentStore((state) => state.setGuestData);

  // Form validation hook
  const { errors, setErrors, validateRequired, validateEmail, clearFieldError } =
    useCheckoutFormValidation<AddressFormField>();

  // Form state
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    city: '',
    department: '',
    additionalInfo: '',
  });

  // Track if form was submitted to show validation errors
  const [submitted, setSubmitted] = useState(false);

  // Loading and API error states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Update form fields
  const handleChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field if it has a value now
    if (value.trim() && errors[field as AddressFormField]) {
      clearFieldError(field as AddressFormField);
    }
  };

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<AddressFormField, string>> = {
      firstName: validateRequired(formData.firstName, 'firstName'),
      lastName: validateRequired(formData.lastName, 'lastName'),
      phone: validateRequired(formData.phone, 'phone'),
      street: validateRequired(formData.street, 'street'),
      number: validateRequired(formData.number, 'number'),
      city: validateRequired(formData.city, 'city'),
      department: validateRequired(formData.department, 'department'),
    };

    // Email required for guest mode (needed for MercadoPago)
    if (isGuestMode) {
      newErrors.email = validateEmail(formData.email);
    }

    // Filter out undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => v !== undefined)
    ) as Partial<Record<AddressFormField, string>>;

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Handle back button
  const handleBack = () => {
    router.back();
  };

  // Handle save button
  const handleSave = async () => {
    setSubmitted(true);
    setApiError(null);

    // Validate form before saving
    if (!validateForm()) {
      return;
    }

    // Guest mode: store address locally and continue to payment
    if (isGuestMode) {
      setGuestData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        addressLine1: `${formData.street} ${formData.number}`.trim(),
        addressLine2: formData.additionalInfo || undefined,
        city: formData.city,
        state: formData.department,
        country: 'UY',
      });
      router.push('/checkout/payment-selection?guest=true');
      return;
    }

    // Logged-in mode: save to backend
    if (!token) {
      setApiError('Debes iniciar sesión para guardar direcciones');
      return;
    }

    setIsLoading(true);
    try {
      addressService.setAuthToken(token);
      await addressService.createAddress({
        firstName: formData.firstName,
        lastName: formData.lastName,
        addressLine1: `${formData.street} ${formData.number}`.trim(),
        addressLine2: formData.additionalInfo || undefined,
        city: formData.city,
        state: formData.department,
        country: 'UY',
        phoneNumber: formData.phone,
        isDefault: false,
        type: 'shipping',
      });
      router.back();
    } catch {
      setApiError('Error al guardar la dirección. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.mainContent}>
        <SubheaderClose title="Añadir dirección de envío" onClose={handleBack} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              {/* API Error */}
              {apiError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              )}

              {/* Personal Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Información personal</Text>
                </View>
                <Input
                  placeholder="Nombre"
                  value={formData.firstName}
                  onChangeText={(value) => handleChange('firstName', value)}
                  error={submitted ? errors.firstName : undefined}
                  pill
                />
                <Input
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChangeText={(value) => handleChange('lastName', value)}
                  error={submitted ? errors.lastName : undefined}
                  pill
                />
                <Input
                  placeholder="No. Celular"
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  keyboardType="phone-pad"
                  error={submitted ? errors.phone : undefined}
                  pill
                />
                {isGuestMode && (
                  <Input
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={submitted ? errors.email : undefined}
                    pill
                  />
                )}
              </View>

              {/* Address Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Dirección</Text>
                </View>
                <View style={styles.streetNumberRow}>
                  <View style={styles.streetContainer}>
                    <Input
                      placeholder="Calle"
                      value={formData.street}
                      onChangeText={(value) => handleChange('street', value)}
                      error={submitted ? errors.street : undefined}
                    />
                  </View>
                  <View style={styles.numberContainer}>
                    <Input
                      placeholder="No."
                      value={formData.number}
                      onChangeText={(value) => handleChange('number', value)}
                      keyboardType="number-pad"
                      error={submitted ? errors.number : undefined}
                      style={styles.numberInput}
                    />
                  </View>
                </View>
                <Input
                  placeholder="Ciudad"
                  value={formData.city}
                  onChangeText={(value) => handleChange('city', value)}
                  error={submitted ? errors.city : undefined}
                />
                <Input
                  placeholder="Departamento"
                  value={formData.department}
                  onChangeText={(value) => handleChange('department', value)}
                  error={submitted ? errors.department : undefined}
                />
                {/* Country - Uruguay only */}
                <View style={styles.countryField}>
                  <Image
                    source={{ uri: 'https://flagcdn.com/w20/uy.png' }}
                    style={styles.countryFlag}
                  />
                  <Text style={styles.countryText}>Uruguay</Text>
                </View>
              </View>

              {/* Optional Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Opcional</Text>
                </View>
                <Input
                  placeholder="Información adicional"
                  value={formData.additionalInfo}
                  onChangeText={(value) => handleChange('additionalInfo', value)}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Action Buttons - Outside KeyboardAvoidingView so they stay fixed */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <LinearGradient
            colors={colors.button.defaultGradient}
            style={styles.primaryButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FBFBFB" />
            ) : (
              <Text style={styles.primaryButtonText}>Siguiente</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBack}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Atrás</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Explicitly set as default export
export default NewAddressScreen;

type Styles = {
  container: ViewStyle;
  keyboardAvoid: ViewStyle;
  mainContent: ViewStyle;
  scrollView: ViewStyle;
  content: ViewStyle;
  errorBanner: ViewStyle;
  errorBannerText: TextStyle;
  formSection: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  streetNumberRow: ViewStyle;
  streetContainer: ViewStyle;
  numberContainer: ViewStyle;
  numberInput: TextStyle;
  countryField: ViewStyle;
  countryFlag: ImageStyle;
  countryText: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonGradient: ViewStyle;
  disabledButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoid: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: layout.subheaderScreenTop,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorBannerText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    color: '#C62828',
    textAlign: 'center',
  },
  formSection: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: '#424242',
  },
  streetNumberRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  streetContainer: {
    flex: 1,
  },
  numberContainer: {
    width: 58,
  },
  numberInput: {
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  countryField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    height: 40,
    backgroundColor: '#E1E1E1',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 24,
  },
  countryFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
    opacity: 0.5,
  },
  countryText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#575757',
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: 34,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: '#FBFBFB',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: '#0C0C0C',
  },
});
