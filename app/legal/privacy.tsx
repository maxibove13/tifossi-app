import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import CloseIcon from '../../assets/icons/close.svg';

export default function PrivacyScreen() {
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
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Política de Privacidad</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            <Text style={styles.lastUpdated}>Última actualización: 1 de Mayo, 2024</Text>

            <Text style={styles.paragraph}>
              En Tifossi, valoramos su privacidad y nos comprometemos a proteger sus datos
              personales. Esta Política de Privacidad explica cómo recopilamos, utilizamos y
              protegemos su información cuando utiliza nuestra aplicación móvil.
            </Text>

            <Text style={styles.sectionTitle}>1. Información que Recopilamos</Text>
            <Text style={styles.paragraph}>
              Podemos recopilar los siguientes tipos de información:
            </Text>
            <Text style={styles.bulletPoint}>
              • Información personal: nombre, dirección de correo electrónico, dirección de envío,
              número de teléfono.
            </Text>
            <Text style={styles.bulletPoint}>
              • Información de la cuenta: nombre de usuario, contraseña (encriptada).
            </Text>
            <Text style={styles.bulletPoint}>
              • Información de transacciones: detalles de productos comprados, historiales de
              pedidos.
            </Text>
            <Text style={styles.bulletPoint}>
              • Información técnica: tipo de dispositivo, sistema operativo, datos de uso de la
              aplicación.
            </Text>

            <Text style={styles.sectionTitle}>2. Cómo Utilizamos Su Información</Text>
            <Text style={styles.paragraph}>Utilizamos su información para:</Text>
            <Text style={styles.bulletPoint}>• Procesar pedidos y gestionar su cuenta.</Text>
            <Text style={styles.bulletPoint}>• Personalizar su experiencia en la aplicación.</Text>
            <Text style={styles.bulletPoint}>
              • Enviar actualizaciones sobre pedidos y notificaciones.
            </Text>
            <Text style={styles.bulletPoint}>• Mejorar nuestros productos y servicios.</Text>
            <Text style={styles.bulletPoint}>
              • Comunicarnos con usted sobre ofertas o promociones, si ha dado su consentimiento.
            </Text>

            <Text style={styles.sectionTitle}>3. Protección de Datos</Text>
            <Text style={styles.paragraph}>
              Implementamos medidas de seguridad técnicas y organizativas para proteger su
              información personal contra acceso no autorizado, alteración, divulgación o
              destrucción. Sin embargo, ningún método de transmisión por Internet o método de
              almacenamiento electrónico es 100% seguro.
            </Text>

            <Text style={styles.sectionTitle}>4. Compartición de Datos</Text>
            <Text style={styles.paragraph}>
              No vendemos ni alquilamos sus datos personales a terceros. Podemos compartir
              información con:
            </Text>
            <Text style={styles.bulletPoint}>
              • Proveedores de servicios que nos ayudan a operar nuestra aplicación.
            </Text>
            <Text style={styles.bulletPoint}>
              • Empresas de procesamiento de pagos para completar transacciones.
            </Text>
            <Text style={styles.bulletPoint}>• Empresas de entrega para enviar sus pedidos.</Text>
            <Text style={styles.bulletPoint}>
              • Autoridades legales cuando sea requerido por ley.
            </Text>

            <Text style={styles.sectionTitle}>5. Sus Derechos</Text>
            <Text style={styles.paragraph}>Usted tiene derecho a:</Text>
            <Text style={styles.bulletPoint}>• Acceder a sus datos personales.</Text>
            <Text style={styles.bulletPoint}>• Corregir información inexacta.</Text>
            <Text style={styles.bulletPoint}>• Eliminar sus datos (con ciertas limitaciones).</Text>
            <Text style={styles.bulletPoint}>• Limitar el procesamiento de sus datos.</Text>
            <Text style={styles.bulletPoint}>
              • Retirar su consentimiento en cualquier momento.
            </Text>

            <Text style={styles.sectionTitle}>6. Cookies y Tecnologías Similares</Text>
            <Text style={styles.paragraph}>
              Nuestra aplicación puede utilizar cookies y tecnologías similares para mejorar la
              experiencia del usuario, recordar preferencias y comprender cómo los usuarios
              interactúan con nuestra aplicación.
            </Text>

            <Text style={styles.sectionTitle}>7. Cambios a Esta Política</Text>
            <Text style={styles.paragraph}>
              Podemos actualizar nuestra Política de Privacidad ocasionalmente. Le notificaremos
              cualquier cambio significativo a través de un aviso en nuestra aplicación o por correo
              electrónico.
            </Text>

            <Text style={styles.sectionTitle}>8. Contacto</Text>
            <Text style={styles.paragraph}>
              Si tiene alguna pregunta sobre esta Política de Privacidad, por favor contáctenos:
              {'\n\n'}
              TIFFOSI S.A.S - RUT 219102480013{'\n'}
              Wilson Ferreira aldunate 1341{'\n'}
              InfoTiffosiuy@gmail.com
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
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
  bulletPoint: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
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
