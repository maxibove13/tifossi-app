import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { colors } from '../../../_styles/colors';

type Props = {
  title: string;
  variant?: 'default' | 'catalog';
};

export default function ProductHeader({ title, variant = 'default' }: Props) {
  const router = useRouter();

  // Removed debug log

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.actions}>
          {variant === 'catalog' ? (
            <>
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="filter-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="search-outline" size={24} color={colors.primary} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="share-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="heart-outline" size={24} color={colors.primary} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 84,
    paddingTop: 52,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background.light,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  backText: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    lineHeight: lineHeights.md,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
});
