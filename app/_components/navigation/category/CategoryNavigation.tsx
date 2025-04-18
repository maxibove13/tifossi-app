import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

interface CategoryNavigationProps {
  categories: {
    id: string
    name: string
    itemCount?: number
  }[]
  onSelectCategory: (id: string) => void
}

export const CategoryNavigation = ({ categories, onSelectCategory }: CategoryNavigationProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onSelectCategory(category.id)}
          style={styles.categoryButton}
        >
          <LinearGradient
            colors={['#0C0C0C', '#3E3E3E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.itemCount !== undefined && (
                <Text style={styles.itemCount}>{category.itemCount} items</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    height: 80,
    minWidth: 280,
    borderRadius: 2,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
  },
  categoryName: {
    fontFamily: 'Roboto',
    fontSize: 32,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  itemCount: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#909090',
    marginTop: 4,
  },
})

export default CategoryNavigation 