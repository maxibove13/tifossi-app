import { StyleSheet, View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography'

type Props = {
  title: string
}

export default function ProductHeader({ title }: Props) {
  const router = useRouter()

  console.log('Header Title:', title) // Debug log

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#0C0C0C" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="share-outline" size={24} color="#0C0C0C" />
          </Pressable>
          <Pressable
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="heart-outline" size={24} color="#0C0C0C" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 84,
    paddingTop: 52,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FBFBFB',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  backText: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: '#0C0C0C',
    fontFamily: fonts.secondary,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: '#0C0C0C',
    fontFamily: fonts.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
}) 