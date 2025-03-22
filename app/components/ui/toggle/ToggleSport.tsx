import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Image, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type ToggleMode = 'sport' | 'tiffosi'

interface ToggleSportProps {
  mode: ToggleMode
  onToggle: (mode: ToggleMode) => void
  size?: 's' | 'l'
  style?: StyleProp<ViewStyle>
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

const ToggleSport = ({
  mode,
  onToggle,
  size = 's',
  style,
}: ToggleSportProps) => {
  const progress = useSharedValue(mode === 'sport' ? 1 : 0)
  const isSmall = size === 's'

  const handleToggle = () => {
    const newMode = mode === 'sport' ? 'tiffosi' : 'sport'
    progress.value = withSpring(newMode === 'sport' ? 1 : 0, {
      mass: 0.5,
      damping: 12,
      stiffness: 100,
    })
    onToggle(newMode)
  }

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value === 1 ? 'rgba(251, 251, 251, 0.25)' : undefined,
  }))

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value === 0 ? 1 : 0, { duration: 200 }),
  }))

  const highlightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          mode === 'sport' ? 
            (isSmall ? 40 : 35) :
            0, 
          {
            mass: 0.5,
            damping: 12,
            stiffness: 100,
          }
        ),
      },
    ],
    width: withSpring(
      mode === 'sport' ? 
        (isSmall ? 32 : 57) :
        (isSmall ? 28 : 36),
      {
        mass: 0.5,
        damping: 12,
        stiffness: 100,
      }
    ),
    height: withSpring(
      mode === 'sport' ? 
        (isSmall ? 28 : 36) :
        (isSmall ? 28 : 36),
      {
        mass: 0.5,
        damping: 12,
        stiffness: 100,
      }
    ),
  }))

  return (
    <AnimatedTouchable
      onPress={handleToggle}
      style={[
        styles.container,
        isSmall ? styles.containerSmall : styles.containerLarge,
        containerAnimatedStyle,
        style,
      ]}
    >
      <Animated.View 
        style={[
          styles.gradient,
          gradientAnimatedStyle,
        ]} 
      />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.highlight,
            isSmall ? styles.highlightSmall : styles.highlightLarge,
            highlightAnimatedStyle,
          ]}
        />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/images/logo/tiffosi.png')}
            style={isSmall ? styles.iconSmall : styles.iconLarge}
          />
        </View>

        <Image
          source={require('../../../../assets/images/logo/tiffosi-sport.png')}
          style={[
            styles.sportText,
            isSmall ? styles.sportTextSmall : styles.sportTextLarge,
          ]}
        />
      </View>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
    padding: 2,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(180deg, #A1A1A1 50%, #E1E1E1 100%)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    position: 'relative',
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  containerSmall: {
    width: 72,
    height: 32,
  },
  containerLarge: {
    width: 96,
    height: 40,
  },
  logoContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    right: 2,
    zIndex: 2,
  },
  highlight: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FBFBFB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 2,
    left: 2,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightSmall: {
    width: 32,
    height: 32,
  },
  highlightLarge: {
    width: 36,
    height: 36,
  },
  iconSmall: {
    width: 12,
    height: 12,
  },
  iconLarge: {
    width: 16,
    height: 16,
  },
  sportText: {
    zIndex: 2,
    left: 2,
  },
  sportTextSmall: {
    width: 24,
    height: 4,
  },
  sportTextLarge: {
    width: 49,
    height: 8,
  },
})

export default ToggleSport 