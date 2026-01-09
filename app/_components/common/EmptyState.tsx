import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../_styles/typography';
import { spacing } from '../../_styles/spacing';

type EmptyStateVariant = 'noFavorites' | 'notLoggedIn' | 'emptyCart' | 'noOrders';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onPress: () => void;
}

const CONTENT = {
  noFavorites: {
    title: 'Nada guardado aún.',
    description:
      'Para guardar un producto como favorito, toca el corazón contenido en las imágenes.',
    buttonText: 'Ir a Tienda',
    showArrow: true,
  },
  notLoggedIn: {
    title: 'No has iniciado sesión.',
    description: 'Inicia sesión con tu cuenta para ver tus artículos favoritos.',
    buttonText: 'Iniciar sesión',
    showArrow: false,
  },
  emptyCart: {
    title: 'Tu carrito está vacío.',
    description: 'Puedes agregar y quitar ítems de tu carrito cuantas veces desees.',
    buttonText: 'Ir a Tienda',
    showArrow: true,
  },
  noOrders: {
    title: 'No tienes pedidos.',
    description: 'Cuando realices una compra, tus pedidos aparecerán aquí.',
    buttonText: 'Ir a Tienda',
    showArrow: true,
  },
};

export default function EmptyState({ variant, onPress }: EmptyStateProps) {
  const content = CONTENT[variant];

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={onPress} style={styles.buttonContainer} activeOpacity={0.8}>
          <LinearGradient
            colors={['#373737', '#171717']}
            locations={[0.25, 0.75]}
            style={[styles.buttonGradient, !content.showArrow && styles.buttonGradientCentered]}
          >
            <Text style={[styles.buttonText, !content.showArrow && styles.buttonTextCentered]}>
              {content.buttonText}
            </Text>
            {content.showArrow && <Ionicons name="arrow-forward" size={24} color="#FBFBFB" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  messageContainer: {
    gap: 0,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.primary,
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 32,
    color: '#0C0C0C',
  },
  description: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: '#575757',
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 48,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
  },
  buttonGradientCentered: {
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#FBFBFB',
  },
  buttonTextCentered: {
    textAlign: 'center',
  },
});
