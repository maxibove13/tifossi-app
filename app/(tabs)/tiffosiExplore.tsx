import { StyleSheet, View, Text } from 'react-native';
import { colors } from '../styles/colors';
import { spacing, layout } from '../styles/spacing';
import { fonts, fontSizes, lineHeights } from '../styles/typography';

export default function TiffosiExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiffosi Explore</Text>
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