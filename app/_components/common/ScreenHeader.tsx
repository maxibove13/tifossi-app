import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { spacing } from '../../_styles/spacing';
import { colors } from '../../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../../_styles/typography';

type ScreenHeaderProps = {
  title: string;
};

type Styles = {
  header: ViewStyle;
  // Removed headerTopSpace from Styles type as it might not be needed when stacked
  title: TextStyle;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title }) => {
  return (
    <View style={styles.header}>
      {/* Removed headerTopSpace View as its padding might be redundant if this header is always below another one 
          that already accounts for safe area / status bar. 
          The paddingTop on styles.header itself will handle spacing from the component above it. */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  header: {
    backgroundColor: colors.background.light,
    // Adjusted paddingTop, assuming the main Header above handles safe area.
    // If this ScreenHeader is used standalone, this padding might need to be larger.
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    // Removed gap as headerTopSpace is gone, direct padding used for title spacing.
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start', // Align title to the left
  },
  title: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
});

export default ScreenHeader;
