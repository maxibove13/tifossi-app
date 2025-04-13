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
} from 'react-native';
import { router, Stack } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import Input from '../components/ui/form/Input';
import Svg, { Path } from 'react-native-svg';

// Import style tokens
import { colors } from '../styles/colors';
import { spacing, radius } from '../styles/spacing';
import { fontWeights, fontSizes, lineHeights } from '../styles/typography';

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
  name: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  department: string;
  countryCode: CountryCode;
  countryName: string;
  additionalInfo: string;
}

// Define validation errors interface
interface ValidationErrors {
  name?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
  department?: string;
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
            {SOUTH_AMERICAN_COUNTRIES.map((item) => (
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
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

function NewAddressScreen() {
  // Form state
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    phone: '',
    street: '',
    number: '',
    city: '',
    department: '',
    countryCode: 'UY', // Default country code for Uruguay
    countryName: 'Uruguay', // Default value as shown in Figma
    additionalInfo: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Track if form was submitted to show validation errors
  const [submitted, setSubmitted] = useState(false);

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
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
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
  const handleSave = () => {
    setSubmitted(true);

    // Validate form before saving
    if (!validateForm()) {
      return; // Don't proceed if validation fails
    }

    // In a real app, you would save the address data
    // For now, just go back to the address selection screen
    router.back();
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
            {/* Personal Information Section */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información personal</Text>
              </View>
              <Input
                placeholder="Nombre"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                error={submitted ? errors.name : undefined}
              />
              <Input
                placeholder="No. Celular"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                error={submitted ? errors.phone : undefined}
              />
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
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.primaryButtonText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} activeOpacity={0.7}>
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
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#DCDCDC',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  formSection: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  streetNumberRow: ViewStyle;
  streetContainer: ViewStyle;
  numberContainer: ViewStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
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
