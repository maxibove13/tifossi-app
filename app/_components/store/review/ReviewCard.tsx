import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    user: {
      name: string;
      image?: string;
    };
    date: string;
    helpfulCount: number;
    isHelpful?: boolean;
  };
  onHelpfulPress?: (id: string) => void;
  onReportPress?: (id: string) => void;
}

export const ReviewCard = ({ review, onHelpfulPress, onReportPress }: ReviewCardProps) => {
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color="#0C0C0C"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {review.user.image ? (
          <Image source={{ uri: review.user.image }} style={styles.userImage} />
        ) : (
          <View style={styles.userImagePlaceholder}>
            <Text style={styles.userInitial}>{review.user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{review.user.name}</Text>
          <Text style={styles.date}>{review.date}</Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>{renderStars()}</View>

      <Text style={styles.comment}>{review.comment}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, review.isHelpful && styles.actionButtonActive]}
          onPress={() => onHelpfulPress?.(review.id)}
        >
          <Ionicons
            name={review.isHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={review.isHelpful ? '#0C0C0C' : '#707070'}
          />
          <Text style={[styles.actionText, review.isHelpful && styles.actionTextActive]}>
            Helpful ({review.helpfulCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onReportPress?.(review.id)}>
          <Ionicons name="flag-outline" size={16} color="#707070" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#707070',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  date: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
    marginTop: 2,
  },
  ratingContainer: {
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  comment: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0C0C0C',
    marginTop: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
  },
  actionTextActive: {
    color: '#0C0C0C',
  },
});

export default ReviewCard;
