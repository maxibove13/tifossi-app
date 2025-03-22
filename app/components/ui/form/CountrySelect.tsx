import { View, Text, FlatList, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { useState, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Input } from './Input'
import CountryFlag from 'react-native-country-flag'

interface Country {
  code: string
  name: string
  dialCode: string
}

interface CountrySelectProps {
  selectedCountry?: Country
  onSelect: (country: Country) => void
  label?: string
  error?: string
  containerStyle?: StyleProp<ViewStyle>
}

const countries: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  // Add more countries as needed
]

export const CountrySelect = ({
  selectedCountry,
  onSelect,
  label,
  error,
  containerStyle,
}: CountrySelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  )

  const handleSelect = useCallback((country: Country) => {
    onSelect(country)
    setIsOpen(false)
    setSearchQuery('')
  }, [onSelect])

  const renderItem = useCallback(({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry?.code === item.code && styles.selectedItem,
      ]}
      onPress={() => handleSelect(item)}
    >
      <CountryFlag isoCode={item.code} size={24} style={styles.flag} />
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.dialCode}>{item.dialCode}</Text>
      </View>
      {selectedCountry?.code === item.code && (
        <Ionicons name="checkmark" size={20} color="#0C0C0C" />
      )}
    </TouchableOpacity>
  ), [selectedCountry, handleSelect])

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(!isOpen)}
      >
        {selectedCountry ? (
          <View style={styles.selectedCountry}>
            <CountryFlag isoCode={selectedCountry.code} size={24} style={styles.flag} />
            <Text style={styles.selectedText}>{selectedCountry.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select a country</Text>
        )}
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#707070"
        />
      </TouchableOpacity>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {isOpen && (
        <View style={styles.dropdown}>
          <Input
            placeholder="Search countries"
            value={searchQuery}
            onChangeText={setSearchQuery}
            startIcon="search"
            containerStyle={styles.searchInput}
          />
          <FlatList
            data={filteredCountries}
            renderItem={renderItem}
            keyExtractor={(item) => item.code}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    padding: 12,
    minHeight: 44,
  },
  selectorError: {
    borderColor: '#AD3026',
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    borderRadius: 2,
  },
  selectedText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0C0C0C',
    marginLeft: 8,
  },
  placeholder: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#909090',
  },
  error: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#AD3026',
    marginTop: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 2,
    marginTop: 4,
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    margin: 8,
  },
  list: {
    maxHeight: 240,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectedItem: {
    backgroundColor: '#F5F5F5',
  },
  countryInfo: {
    flex: 1,
    marginLeft: 8,
  },
  countryName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0C0C0C',
  },
  dialCode: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
    marginTop: 2,
  },
})

export default CountrySelect 