import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated'

interface CounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  isDark?: boolean
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

const Counter = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  isDark = false,
}: CounterProps) => {
  const scale = useSharedValue(1)

  const handleIncrement = () => {
    if (disabled || value >= max) return
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1)
    })
    onChange(Math.min(value + step, max))
  }

  const handleDecrement = () => {
    if (disabled || value <= min) return
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1)
    })
    onChange(Math.max(value - step, min))
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        isDark && styles.containerDark,
        disabled && styles.containerDisabled,
        animatedStyle,
      ]}
      disabled={disabled}
    >
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={disabled || value <= min}
        style={[
          styles.button,
          isDark && styles.buttonDark,
          (disabled || value <= min) && styles.buttonDisabled,
        ]}
      >
        <Ionicons
          name="remove"
          size={20}
          color={
            disabled || value <= min
              ? isDark
                ? '#707070'
                : '#DCDCDC'
              : isDark
              ? '#FFFFFF'
              : '#0C0C0C'
          }
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.value,
          isDark && styles.valueDark,
          disabled && styles.valueDisabled,
        ]}
      >
        {value}
      </Text>

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={disabled || value >= max}
        style={[
          styles.button,
          isDark && styles.buttonDark,
          (disabled || value >= max) && styles.buttonDisabled,
        ]}
      >
        <Ionicons
          name="add"
          size={20}
          color={
            disabled || value >= max
              ? isDark
                ? '#707070'
                : '#DCDCDC'
              : isDark
              ? '#FFFFFF'
              : '#0C0C0C'
          }
        />
      </TouchableOpacity>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#373737',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    backgroundColor: '#373737',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  value: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
    minWidth: 40,
    textAlign: 'center',
  },
  valueDark: {
    color: '#FFFFFF',
  },
  valueDisabled: {
    color: '#707070',
  },
})

export default Counter 