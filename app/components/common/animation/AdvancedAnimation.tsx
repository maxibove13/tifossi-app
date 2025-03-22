import { StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  WithTimingConfig,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useCallback, useEffect, useMemo } from 'react'

type AnimationPreset = 
  | 'fade'
  | 'scale'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'bounce'

type SpringConfig = {
  damping?: number
  mass?: number
  stiffness?: number
  overshootClamping?: boolean
  restSpeedThreshold?: number
  restDisplacementThreshold?: number
}

interface AdvancedAnimationProps {
  children: React.ReactNode
  preset?: AnimationPreset
  isVisible?: boolean
  duration?: number
  delay?: number
  style?: Animated.AnimateStyle<any>
  springConfig?: SpringConfig
  timingConfig?: Partial<WithTimingConfig>
  enableGestures?: boolean
  onAnimationComplete?: () => void
}

export const AdvancedAnimation = ({
  children,
  preset = 'fade',
  isVisible = true,
  duration = 300,
  delay = 0,
  style,
  springConfig,
  timingConfig,
  enableGestures,
  onAnimationComplete,
}: AdvancedAnimationProps) => {
  const opacity = useSharedValue(isVisible ? 1 : 0)
  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)

  const defaultSpringConfig = useMemo<SpringConfig>(() => ({
    damping: 10,
    mass: 1,
    stiffness: 100,
    ...springConfig,
  }), [springConfig]);

  const defaultTimingConfig = useMemo<WithTimingConfig>(() => ({
    duration,
    easing: Easing.inOut(Easing.ease),
    ...timingConfig,
  }), [duration, timingConfig]);

  const runAnimation = useCallback(() => {
    'worklet'
    const onComplete = () => {
      if (onAnimationComplete) {
        runOnJS(onAnimationComplete)()
      }
    }

    switch (preset) {
      case 'fade':
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'scale':
        scale.value = withDelay(
          delay,
          withSpring(isVisible ? 1 : 0.8, defaultSpringConfig)
        )
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'slide-up':
        translateY.value = withDelay(
          delay,
          withSpring(isVisible ? 0 : 100, defaultSpringConfig)
        )
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'slide-down':
        translateY.value = withDelay(
          delay,
          withSpring(isVisible ? 0 : -100, defaultSpringConfig)
        )
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'slide-left':
        translateX.value = withDelay(
          delay,
          withSpring(isVisible ? 0 : 100, defaultSpringConfig)
        )
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'slide-right':
        translateX.value = withDelay(
          delay,
          withSpring(isVisible ? 0 : -100, defaultSpringConfig)
        )
        opacity.value = withDelay(
          delay,
          withTiming(isVisible ? 1 : 0, defaultTimingConfig, onComplete)
        )
        break
      case 'bounce':
        scale.value = withDelay(
          delay,
          withSequence(
            withSpring(1.2, defaultSpringConfig),
            withSpring(0.9, defaultSpringConfig),
            withSpring(1, defaultSpringConfig, onComplete)
          )
        )
        break
    }
  }, [
    preset, 
    isVisible, 
    delay, 
    defaultSpringConfig, 
    defaultTimingConfig, 
    onAnimationComplete, 
    opacity, 
    scale, 
    translateX, 
    translateY
  ])

  useEffect(() => {
    runAnimation()
  }, [isVisible, runAnimation])

  const animatedStyle = useAnimatedStyle(() => {
    const transform = []

    if (['scale', 'bounce'].includes(preset)) {
      transform.push({ scale: scale.value })
    }

    if (['slide-up', 'slide-down'].includes(preset)) {
      transform.push({ translateY: translateY.value })
    }

    if (['slide-left', 'slide-right'].includes(preset)) {
      transform.push({ translateX: translateX.value })
    }

    return {
      opacity: opacity.value,
      transform,
    }
  })

  const panGesture = Gesture.Pan()
    .enabled(!!enableGestures)
    .onUpdate((event) => {
      translateX.value = event.translationX
      translateY.value = event.translationY
    })
    .onEnd(() => {
      translateX.value = withSpring(0, defaultSpringConfig)
      translateY.value = withSpring(0, defaultSpringConfig)
    })

  const content = (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  )

  if (enableGestures) {
    return <GestureDetector gesture={panGesture}>{content}</GestureDetector>
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
})

export default AdvancedAnimation 