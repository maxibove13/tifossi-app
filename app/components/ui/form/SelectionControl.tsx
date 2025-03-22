import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated'

type SelectionType = 'radio' | 'checkbox'

interface SelectionControlProps {
  type?: SelectionType
  label: string
  selected?: boolean
  disabled?: boolean
  error?: string
  onSelect?: () => void
  containerStyle?: StyleProp<ViewStyle>
}

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons)

export const SelectionControl = ({
  type = 'checkbox',
  label,
  selected = false,
  disabled = false,
  error,
  onSelect,
  containerStyle,
}: SelectionControlProps) => {
  const scale = useSharedValue(1)

  const handlePress = () => {
    if (disabled) return

    scale.value = withSpring(0.8, {}, () => {
      scale.value = withSpring(1, {}, () => {
        onSelect?.()
      })
    })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const renderIcon = () => {
    if (type === 'radio') {
      return (
        <View
          style={[
            styles.radio,
            selected && styles.radioSelected,
            disabled && styles.controlDisabled,
            error && styles.controlError,
          ]}
        >
          {selected && <View style={styles.radioInner} />}
        </View>
      )
    }

    return (
      <AnimatedIonicons
        name={selected ? 'checkbox' : 'square-outline'}
        size={24}
        color={
          disabled
            ? '#DCDCDC'
            : error
            ? '#AD3026'
            : selected
            ? '#0C0C0C'
            : '#707070'
        }
        style={animatedStyle}
      />
    )
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.control,
          disabled && styles.controlDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        {renderIcon()}
        <Text
          style={[
            styles.label,
            disabled && styles.labelDisabled,
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  controlDisabled: {
    opacity: 0.5,
  },
  controlError: {
    borderColor: '#AD3026',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#707070',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#0C0C0C',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0C0C0C',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0C0C0C',
    marginLeft: 8,
    flex: 1,
  },
  labelDisabled: {
    color: '#909090',
  },
  labelError: {
    color: '#AD3026',
  },
  error: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#AD3026',
    marginTop: 4,
    marginLeft: 32,
  },
})

export default SelectionControl 