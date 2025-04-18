import React, { useState } from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography'
import { spacing } from '../../../../_styles/spacing'
import { colors } from '../../../../_styles/colors'

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  initiallyExpanded?: boolean
  darkMode?: boolean
}

function ExpandableSection({ 
  title, 
  children, 
  initiallyExpanded = false,
  darkMode = false
}: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  
  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withTiming(expanded ? '180deg' : '0deg', { duration: 300 }) }
      ]
    }
  })
  
  const contentStyle = useAnimatedStyle(() => {
    return {
      maxHeight: withTiming(expanded ? 500 : 0, { duration: 300 }),
      opacity: withTiming(expanded ? 1 : 0, { duration: 300 }),
    }
  })
  
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <Pressable 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={[styles.title, darkMode && styles.titleDark]}>{title}</Text>
        <Animated.View style={rotateStyle}>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={darkMode ? colors.background.light : colors.primary} 
          />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerDark: {
    borderBottomColor: 'rgba(251, 251, 251, 0.2)', // Semi-transparent white as per Figma
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
  titleDark: {
    color: colors.background.light,
  },
  content: {
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
}) 

// Ensure this component is not treated as a route
export default ExpandableSection;

// Add metadata to help router identification
const metadata = {
  isRoute: false,
  componentType: 'Component'
};