import { StyleSheet, View, Text } from 'react-native';
import { spacing } from '../styles/spacing';
import { colors } from '../styles/colors';
import { fonts, fontSizes, lineHeights } from '../styles/typography';
import { layout } from '../styles/spacing';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorites</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingTop: layout.headerTopPadding,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
}); 