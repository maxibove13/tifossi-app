import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ProfileStats {
  orders?: number
  favorites?: number
  reviews?: number
}

interface ProfileCardProps {
  name: string
  email: string
  imageUrl?: string
  stats?: ProfileStats
  variant?: 'default' | 'vertical'
  isEditable?: boolean
  isLoading?: boolean
  isDark?: boolean
  style?: StyleProp<ViewStyle>
  onEdit?: () => void
  onStatsPress?: (type: keyof ProfileStats) => void
}

const ProfileCard = ({
  name,
  email,
  imageUrl,
  stats,
  variant = 'default',
  isEditable = false,
  isLoading = false,
  isDark = false,
  style,
  onEdit,
  onStatsPress,
}: ProfileCardProps) => {
  const isVertical = variant === 'vertical'

  if (isLoading) {
    return (
      <View style={[
        styles.container,
        isVertical && styles.containerVertical,
        isDark && styles.containerDark,
        style,
      ]}>
        <View style={[styles.header, isVertical && styles.headerVertical]}>
          <View style={[
            styles.loadingImage,
            isDark && styles.loadingDark,
          ]} />
          <View style={styles.info}>
            <View style={[
              styles.loadingName,
              isDark && styles.loadingDark,
            ]} />
            <View style={[
              styles.loadingEmail,
              isDark && styles.loadingDark,
            ]} />
          </View>
        </View>
        {stats && (
          <View style={[styles.stats, isVertical && styles.statsVertical]}>
            {Object.keys(stats).map((key, index) => (
              <View
                key={key}
                style={[
                  styles.statItem,
                  index > 0 && styles.statItemBorder,
                  isVertical && styles.statItemVertical,
                  isVertical && index > 0 && styles.statItemBorderVertical,
                ]}
              >
                <View style={[
                  styles.loadingStatValue,
                  isDark && styles.loadingDark,
                ]} />
                <View style={[
                  styles.loadingStatLabel,
                  isDark && styles.loadingDark,
                ]} />
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={[
      styles.container,
      isVertical && styles.containerVertical,
      isDark && styles.containerDark,
      style,
    ]}>
      <View style={[styles.header, isVertical && styles.headerVertical]}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.imagePlaceholder, isDark && styles.imagePlaceholderDark]}>
              <Text style={[styles.initial, isDark && styles.initialDark]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isDark && styles.nameDark]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.email, isDark && styles.emailDark]} numberOfLines={1}>
            {email}
          </Text>
        </View>
        {isEditable && (
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons
              name="pencil"
              size={20}
              color={isDark ? '#FFFFFF' : '#0C0C0C'}
            />
          </TouchableOpacity>
        )}
      </View>
      {stats && (
        <View style={[styles.stats, isVertical && styles.statsVertical]}>
          {Object.entries(stats).map(([key, value], index) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.statItem,
                index > 0 && styles.statItemBorder,
                isVertical && styles.statItemVertical,
                isVertical && index > 0 && styles.statItemBorderVertical,
              ]}
              onPress={() => onStatsPress?.(key as keyof ProfileStats)}
            >
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {value}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 16,
  },
  containerVertical: {
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#0C0C0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderDark: {
    backgroundColor: '#373737',
  },
  initial: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '500',
    color: '#707070',
  },
  initialDark: {
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  nameDark: {
    color: '#FFFFFF',
  },
  email: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#707070',
    marginTop: 2,
  },
  emailDark: {
    color: '#909090',
  },
  editButton: {
    marginLeft: 16,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#DCDCDC',
  },
  statsVertical: {
    flexDirection: 'column',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemVertical: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#DCDCDC',
  },
  statItemBorderVertical: {
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#DCDCDC',
  },
  statValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#909090',
  },
  loadingImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
  },
  loadingName: {
    width: 120,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  loadingEmail: {
    width: 160,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
  },
  loadingStatValue: {
    width: 40,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 4,
  },
  loadingStatLabel: {
    width: 60,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
  },
  loadingDark: {
    backgroundColor: '#373737',
  },
})

export default ProfileCard 