import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../swipeable/styles';

interface SectionHeaderProps {
  title: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

/**
 * SectionHeader component
 * Header for product list sections with optional "View All" action
 */
export default function SectionHeader({
  title,
  showViewAll = false,
  onViewAllPress
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {showViewAll && (
        <TouchableOpacity 
          onPress={onViewAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Ver todo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.background.light,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.secondary.text,
  }
}); 