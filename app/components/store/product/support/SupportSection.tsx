import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing } from '../swipeable/styles';

interface SupportOption {
  title: string;
  description: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

interface SupportSectionProps {
  phoneNumber?: string;
  options?: SupportOption[];
}

/**
 * SupportSection component
 * Displays support options and contact information
 */
export default function SupportSection({
  phoneNumber = '+34 900 123 456',
  options = []
}: SupportSectionProps) {
  const handleCallPress = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>¿Necesitas ayuda?</Text>
      
      {options.length > 0 && (
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              {option.icon && (
                <View style={styles.optionIcon}>
                  {option.icon}
                </View>
              )}
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {phoneNumber && (
        <View style={styles.callSection}>
          <Text style={styles.callText}>O llámanos directamente</Text>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCallPress}
            activeOpacity={0.7}
          >
            <Text style={styles.callButtonText}>{phoneNumber}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.background.light,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    marginBottom: spacing.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.background.light,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.secondary.text,
  },
  callSection: {
    alignItems: 'center',
  },
  callText: {
    fontSize: 14,
    color: colors.secondary.text,
    marginBottom: spacing.md,
  },
  callButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.background.light,
  }
}); 