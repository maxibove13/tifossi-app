import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import { Feather } from '@expo/vector-icons';

export default function VerifySuccessScreen() {
  const handleContinue = () => {
    // Navigate to profile or home screen after successful verification
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.successIconContainer}>
            <Feather name="check" size={40} color={colors.background.light} />
          </View>

          <Text style={styles.title}>¡Verificación completada!</Text>

          <Text style={styles.description}>
            Tu correo electrónico ha sido verificado exitosamente. Ahora puedes disfrutar de todas
            las funcionalidades de Tiffosi.
          </Text>
        </View>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.7}>
          <LinearGradient
            colors={colors.button.defaultGradient}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.background.light,
    justifyContent: 'space-between',
  },
  mainContainer: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.background.light,
  },
});
