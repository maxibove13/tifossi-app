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
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import Input from '../_components/ui/form/Input';
import SubheaderClose from '../_components/common/SubheaderClose';
import { usePaymentStore } from '../_stores/paymentStore';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, layout } from '../_styles/spacing';
import { fontWeights, fontSizes, lineHeights } from '../_styles/typography';

// Define form data interface
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Define validation errors interface
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function GuestContactInfoScreen() {
  const setGuestContactInfo = usePaymentStore((state) => state.setGuestContactInfo);

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Track if form was submitted to show validation errors
  const [submitted, setSubmitted] = useState(false);

  // Update form fields
  const handleChange = (field: keyof ContactFormData, value: string) => {
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

    // Email is required for MercadoPago
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El número de celular es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle close button
  const handleClose = () => {
    router.navigate('/(tabs)');
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
      return;
    }

    // Store guest contact info
    setGuestContactInfo({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phone,
    });

    // Navigate to payment
    router.push('/checkout/payment-selection');
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
        <SubheaderClose title="Datos de contacto" onClose={handleClose} />

        {/* Form Content */}
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Description */}
            <Text style={styles.description}>
              Necesitamos tus datos de contacto para procesar tu pedido y enviarte la confirmación.
            </Text>

            {/* Contact Information Section */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información de contacto</Text>
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
                placeholder="Email"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={submitted ? errors.email : undefined}
              />
              <Input
                placeholder="No. Celular"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                error={submitted ? errors.phone : undefined}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.7}>
          <LinearGradient
            colors={colors.button.defaultGradient}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Atrás</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Explicitly set as default export
export default GuestContactInfoScreen;

type Styles = {
  container: ViewStyle;
  mainContent: ViewStyle;
  scrollView: ViewStyle;
  content: ViewStyle;
  description: TextStyle;
  formSection: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonGradient: ViewStyle;
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
    paddingTop: layout.subheaderScreenTop,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: '#707070',
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
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
