import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { SelectionControl } from './SelectionControl'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SingleChoiceProps {
  options: Option[]
  value?: string
  error?: string
  onChange: (value: string) => void
  containerStyle?: StyleProp<ViewStyle>
}

export const SingleChoice = ({
  options,
  value,
  error,
  onChange,
  containerStyle,
}: SingleChoiceProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option, index) => (
        <SelectionControl
          key={option.value}
          type="radio"
          label={option.label}
          selected={value === option.value}
          disabled={option.disabled}
          error={index === 0 ? error : undefined}
          onSelect={() => onChange(option.value)}
          containerStyle={index > 0 ? styles.option : undefined}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  option: {
    marginTop: 8,
  },
})

export default SingleChoice 