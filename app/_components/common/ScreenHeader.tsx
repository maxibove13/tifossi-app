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
  headerTopSpace: ViewStyle;
  title: TextStyle;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopSpace} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  header: {
    backgroundColor: colors.background.light,
    paddingTop: spacing.xxxl + spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopSpace: {
    height: spacing.xxxl,
  },
  title: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
});

export default ScreenHeader;
