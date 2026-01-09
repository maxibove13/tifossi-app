import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import Input from '../_components/ui/form/Input';
import Svg, { Path } from 'react-native-svg';
import addressService from '../_services/address/addressService';
import { useAuthStore } from '../_stores/authStore';
import { usePaymentStore } from '../_stores/paymentStore';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fontWeights, fontSizes, lineHeights } from '../_styles/typography';

// Define country code type locally
type CountryCode = string;

// Simple Chevron Down icon component
const ChevronDownIcon = ({ width = 20, height = 20, stroke = '#424242', strokeWidth = 1.5 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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
  postalCode: string;
  countryCode: CountryCode;
  countryName: string;
  additionalInfo: string;
}

// Define validation errors interface
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
  department?: string;
  postalCode?: string;
}

// South American countries as specified in the Figma design
const SOUTH_AMERICAN_COUNTRIES = [
  { name: 'Uruguay', code: 'UY' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Bolivia', code: 'BO' },
  { name: 'Brasil', code: 'BR' },
  { name: 'Chile', code: 'CL' },
  { name: 'Colombia', code: 'CO' },
  { name: 'Ecuador', code: 'EC' },
  { name: 'Paraguay', code: 'PY' },
  { name: 'Perú', code: 'PE' },
  { name: 'Venezuela', code: 'VE' },
];

// Custom Country Dropdown component
const CountryDropdown = ({
  value,
  onSelect,
}: {
  value: { code: CountryCode; name: string } | null;
  onSelect: (code: CountryCode, name: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectCountry = (code: CountryCode, name: string) => {
    onSelect(code, name);
    setIsOpen(false);
  };

  return (
    <View style={dropdownStyles.container}>
      <TouchableOpacity
        style={[dropdownStyles.header, isOpen ? dropdownStyles.headerOpen : {}]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={dropdownStyles.headerContent}>
          {value ? (
            <View style={dropdownStyles.selectedCountry}>
              <Image
                source={{
                  uri: `https://flagcdn.com/w20/${value.code.toLowerCase()}.png`,
                }}
                style={dropdownStyles.flagImage}
              />
              <Text style={dropdownStyles.selectedText}>{value.name}</Text>
            </View>
          ) : (
            <Text style={dropdownStyles.placeholderText}>Seleccionar país</Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDownIcon width={20} height={20} stroke="#424242" strokeWidth={1.5} />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={dropdownStyles.dropdown}>
          <ScrollView
            style={dropdownStyles.list}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {SOUTH_AMERICAN_COUNTRIES.filter((country) => country.code !== value?.code).map(
              (item) => (
                <TouchableOpacity
                  key={item.code}
                  style={dropdownStyles.countryItem}
                  onPress={() => handleSelectCountry(item.code as CountryCode, item.name)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{
                      uri: `https://flagcdn.com/w20/${item.code.toLowerCase()}.png`,
                    }}
                    style={dropdownStyles.flagImage}
                  />
                  <Text style={dropdownStyles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

function NewAddressScreen() {
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === 'true';

  const { token } = useAuthStore();
  const setGuestAddress = usePaymentStore((state) => state.setGuestAddress);

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
    postalCode: '',
    countryCode: 'UY',
    countryName: 'Uruguay',
    additionalInfo: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});

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
    if (value.trim() && errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle country selection
  const handleCountrySelect = (code: CountryCode, name: string) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: code,
      countryName: name,
    }));
  };

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Check required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    // Email required for guest mode (needed for MercadoPago)
    if (isGuestMode) {
      if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'El email no es válido';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El número de celular es obligatorio';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'La calle es obligatoria';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'El número es obligatorio';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es obligatoria';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es obligatorio';
    }

    // Postal code required for Uruguay
    if (formData.countryCode === 'UY') {
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'El código postal es obligatorio';
      } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
        newErrors.postalCode = 'El código postal debe tener 5 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle close button
  const handleClose = () => {
    router.back();
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
      setGuestAddress({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        addressLine1: `${formData.street} ${formData.number}`.trim(),
        addressLine2: formData.additionalInfo || undefined,
        city: formData.city,
        state: formData.department,
        postalCode: formData.postalCode || undefined,
        country: formData.countryCode,
        phoneNumber: formData.phone,
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
        postalCode: formData.postalCode || undefined,
        country: formData.countryCode,
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Añadir dirección de envío</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView style={styles.scrollView}>
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
              />
              <Input
                placeholder="Apellido"
                value={formData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                error={submitted ? errors.lastName : undefined}
              />
              <Input
                placeholder="No. Celular"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                error={submitted ? errors.phone : undefined}
              />
              {isGuestMode && (
                <Input
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={submitted ? errors.email : undefined}
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
              <Input
                placeholder="Código postal"
                value={formData.postalCode}
                onChangeText={(value) => handleChange('postalCode', value)}
                keyboardType="number-pad"
                maxLength={5}
                error={submitted ? errors.postalCode : undefined}
              />
              {/* Country Dropdown */}
              <CountryDropdown
                value={
                  formData.countryCode
                    ? { code: formData.countryCode, name: formData.countryName }
                    : null
                }
                onSelect={handleCountrySelect}
              />
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
                multiline
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FBFBFB" />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar</Text>
          )}
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

// Dropdown styles
const dropdownStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    height: 40,
  },
  headerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#707070',
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
  flagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
    opacity: 0.5,
  },
  dropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#DCDCDC',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  list: {
    maxHeight: 220,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryName: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
});

// Explicitly set as default export
export default NewAddressScreen;

type Styles = {
  container: ViewStyle;
  mainContent: ViewStyle;
  scrollView: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  content: ViewStyle;
  errorBanner: ViewStyle;
  errorBannerText: TextStyle;
  formSection: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  streetNumberRow: ViewStyle;
  streetContainer: ViewStyle;
  numberContainer: ViewStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  disabledButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    paddingTop: 54,
  },
  scrollView: {
    flex: 1,
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
    gap: spacing.lg,
  },
  sectionHeader: {
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
    gap: spacing.lg,
  },
  streetContainer: {
    flex: 1,
  },
  numberContainer: {
    width: 80,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.dark,
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
