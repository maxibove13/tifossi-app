import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import SubheaderClose from '../_components/common/SubheaderClose';

export default function TermsScreen() {
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <SubheaderClose title="Términos y Condiciones" onClose={handleClose} />

        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            <Text style={styles.lastUpdated}>Última actualización: 7 de Diciembre, 2025</Text>

            <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
            <Text style={styles.paragraph}>
              Al acceder y utilizar la aplicación Tifossi, usted acepta estar sujeto a estos
              Términos y Condiciones de uso. Si no está de acuerdo con alguno de estos términos, le
              rogamos que no utilice nuestra aplicación.
            </Text>

            <Text style={styles.sectionTitle}>2. Uso de la Aplicación</Text>
            <Text style={styles.paragraph}>
              Tifossi es una plataforma de comercio electrónico que permite a los usuarios navegar
              por productos, crear cuentas, guardar favoritos y realizar compras. El uso de estas
              funcionalidades está sujeto a estos términos y a nuestra Política de Privacidad.
            </Text>

            <Text style={styles.sectionTitle}>3. Cuentas de Usuario</Text>
            <Text style={styles.paragraph}>
              Para acceder a ciertas funciones de nuestra aplicación, deberá crear una cuenta. Usted
              es responsable de mantener la confidencialidad de su información de cuenta, incluyendo
              su contraseña, y de todas las actividades que ocurran con su cuenta.
            </Text>

            <Text style={styles.sectionTitle}>4. Compras y Pagos</Text>
            <Text style={styles.paragraph}>
              Al realizar una compra a través de Tifossi, usted acepta proporcionar información de
              pago precisa y completa. Todos los precios mostrados son en la moneda local e incluyen
              impuestos aplicables. Los métodos de pago aceptados se mostrarán durante el proceso de
              compra.
            </Text>

            <Text style={styles.sectionTitle}>5. Envíos y Devoluciones</Text>
            <Text style={styles.paragraph}>
              Las políticas de envío, entrega y devolución se detallan durante el proceso de compra.
              Al realizar un pedido, usted acepta estas políticas. Los tiempos de entrega son
              estimados y pueden variar según su ubicación.
            </Text>

            <Text style={styles.sectionTitle}>6. Propiedad Intelectual</Text>
            <Text style={styles.paragraph}>
              Todos los contenidos presentes en la aplicación Tifossi, incluyendo textos, gráficos,
              logos, imágenes, y software, son propiedad de Tifossi o de sus proveedores de
              contenido y están protegidos por leyes de propiedad intelectual.
            </Text>

            <Text style={styles.sectionTitle}>7. Limitación de Responsabilidad</Text>
            <Text style={styles.paragraph}>
              Tifossi no será responsable por daños indirectos, incidentales, especiales,
              consecuentes o punitivos, incluyendo pérdida de beneficios, datos, o cualquier otro
              daño intangible, resultante del uso o la imposibilidad de usar la aplicación.
            </Text>

            <Text style={styles.sectionTitle}>8. Modificaciones de los Términos</Text>
            <Text style={styles.paragraph}>
              Tifossi se reserva el derecho de modificar estos términos en cualquier momento. Los
              cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
              El uso continuado de la aplicación después de tales cambios constituirá su
              consentimiento a dichos cambios.
            </Text>

            <Text style={styles.sectionTitle}>9. Ley Aplicable</Text>
            <Text style={styles.paragraph}>
              Estos términos se regirán e interpretarán de acuerdo con las leyes locales, sin tener
              en cuenta sus principios de conflicto de leyes.
            </Text>
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.7}>
          <Text style={styles.primaryButtonText}>Aceptar</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  lastUpdated: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  paragraph: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    marginBottom: spacing.md,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
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
