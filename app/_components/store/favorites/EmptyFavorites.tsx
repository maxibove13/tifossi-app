import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../_styles/typography';
import { spacing } from '../../../_styles/spacing';
import { colors } from '../../../_styles/colors';

interface EmptyFavoritesProps {
  onGoToStore: () => void;
}

export default function EmptyFavorites({ onGoToStore }: EmptyFavoritesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Nada guardado aún.</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Para guardar un producto como favorito, toca el corazón contenido en las imágenes.
          </Text>
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={onGoToStore} style={styles.buttonContainer} activeOpacity={0.8}>
          <LinearGradient
            colors={['#373737', '#171717']}
            locations={[0.25, 0.75]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Ir a Tienda</Text>
            <Ionicons name="arrow-forward" size={16} color="#FBFBFB" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    width: '100%',
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
    width: '100%',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400',
    color: colors.primary,
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  descriptionContainer: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  description: {
    fontFamily: fonts.secondary,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.secondary,
    alignSelf: 'stretch',
  },
  buttonWrapper: {
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  buttonContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.background.light,
  },
});
