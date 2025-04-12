import { StyleSheet, View, Text } from 'react-native';
import { spacing } from '../styles/spacing';
import { colors } from '../styles/colors';
import { fonts, fontSizes, lineHeights } from '../styles/typography';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopSpace} />
        <Text style={styles.title}>Favorites</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    backgroundColor: colors.background.light,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerTopSpace: {
    height: spacing.xxxl, // Match the height that the toggle/search takes in the Tienda tab
  },
  title: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
});
