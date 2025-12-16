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
import { router, Stack } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import Input from '../../_components/ui/form/Input';
import addressService from '../../_services/address/addressService';
import { useAuthStore } from '../../_stores/authStore';

import { colors } from '../../_styles/colors';
import { spacing, radius, layout, components } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';

type CountryCode = string;

const ChevronDownIcon = ({
  width = 20,
  height = 20,
  stroke = colors.secondary,
  strokeWidth = 1.5,
}) => (
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

interface AddressFormData {
  firstName: string;
  lastName: string;
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

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
  department?: string;
  postalCode?: string;
}

const SOUTH_AMERICAN_COUNTRIES = [
  { name: 'Uruguay', code: 'UY' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Bolivia', code: 'BO' },
  { name: 'Brasil', code: 'BR' },
  { name: 'Chile', code: 'CL' },
  { name: 'Colombia', code: 'CO' },
  { name: 'Ecuador', code: 'EC' },
  { name: 'Paraguay', code: 'PY' },
  { name: 'Peru', code: 'PE' },
  { name: 'Venezuela', code: 'VE' },
];

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
            <Text style={dropdownStyles.placeholderText}>Seleccionar pais</Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDownIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.5} />
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

export default function NewAddressScreen() {
  const { token } = useAuthStore();

  const [formData, setFormData] = useState<AddressFormData>({
    firstName: '',
    lastName: '',
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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (value.trim() && errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCountrySelect = (code: CountryCode, name: string) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: code,
      countryName: name,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El numero de celular es obligatorio';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'La calle es obligatoria';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'El numero es obligatorio';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es obligatoria';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es obligatorio';
    }

    if (formData.countryCode === 'UY') {
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'El codigo postal es obligatorio';
      } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
        newErrors.postalCode = 'El codigo postal debe tener 5 digitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    router.back();
  };

  const handleSave = async () => {
    setSubmitted(true);
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setApiError('Debes iniciar sesion para guardar direcciones');
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
      setApiError('Error al guardar la direccion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Adicionar direccion de envio</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {apiError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informacion personal</Text>
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
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Direccion</Text>
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
                placeholder="Codigo postal"
                value={formData.postalCode}
                onChangeText={(value) => handleChange('postalCode', value)}
                keyboardType="number-pad"
                maxLength={5}
                error={submitted ? errors.postalCode : undefined}
              />
              <CountryDropdown
                value={
                  formData.countryCode
                    ? { code: formData.countryCode, name: formData.countryName }
                    : null
                }
                onSelect={handleCountrySelect}
              />
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Opcional</Text>
              </View>
              <Input
                placeholder="Informacion adicional"
                value={formData.additionalInfo}
                onChangeText={(value) => handleChange('additionalInfo', value)}
                multiline
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background.offWhite} />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background.light,
    height: components.dropdown.height,
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
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedText: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  flagImage: {
    width: components.flagImage.width,
    height: components.flagImage.height,
    borderRadius: radius.xs,
    opacity: 0.5,
  },
  dropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    backgroundColor: colors.background.light,
  },
  list: {
    maxHeight: components.dropdown.maxHeight,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.medium,
  },
  countryName: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});

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
    backgroundColor: colors.background.light,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    paddingTop: spacing.md,
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
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: colors.errorBackground,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorBannerText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.error,
    textAlign: 'center',
  },
  formSection: {
    gap: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
  },
  streetNumberRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  streetContainer: {
    flex: 1,
  },
  numberContainer: {
    width: components.input.numberWidth,
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: layout.safeAreaBottom,
  },
  primaryButton: {
    width: '100%',
    height: components.button.height,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.dark,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.offWhite,
  },
  secondaryButton: {
    width: '100%',
    height: components.button.height,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
