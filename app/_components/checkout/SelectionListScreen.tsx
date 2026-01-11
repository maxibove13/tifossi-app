import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Stack, router } from 'expo-router';
import ChevronRightGrayIcon from '../../../assets/icons/chevron_right_gray.svg';
import SubheaderClose from '../common/SubheaderClose';

import { colors } from '../../_styles/colors';
import { spacing, radius, layout } from '../../_styles/spacing';
import { fontWeights, fonts, fontSizes, lineHeights } from '../../_styles/typography';

export interface SelectionItem {
  id: string;
  name: string;
}

interface SelectionListScreenProps {
  pageTitle: string;
  sectionTitle: string;
  items: SelectionItem[];
  onItemSelect: (item: SelectionItem) => void;
  onClose?: () => void;
  onBack?: () => void;
}

export default function SelectionListScreen({
  pageTitle,
  sectionTitle,
  items,
  onItemSelect,
  onClose = () => router.navigate('/(tabs)'),
  onBack = () => router.back(),
}: SelectionListScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <SubheaderClose title={pageTitle} onClose={onClose} />

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.itemsContainer}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>

              <View style={styles.itemList}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => onItemSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemText}>{item.name}</Text>
                    <ChevronRightGrayIcon width={16} height={16} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Atrás</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type Styles = {
  safeArea: ViewStyle;
  container: ViewStyle;
  scrollView: ViewStyle;
  content: ViewStyle;
  itemsContainer: ViewStyle;
  sectionTitle: TextStyle;
  itemList: ViewStyle;
  itemRow: ViewStyle;
  itemText: TextStyle;
  actionButtons: ViewStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
  },
  container: {
    flex: 1,
    paddingTop: layout.subheaderScreenTop,
    paddingHorizontal: spacing.lg,
    paddingBottom: layout.safeAreaBottom,
    gap: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  itemsContainer: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: colors.secondary,
  },
  itemList: {
    gap: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    padding: spacing.lg,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    flex: 1,
  },
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  secondaryButton: {
    borderRadius: radius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 100,
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
