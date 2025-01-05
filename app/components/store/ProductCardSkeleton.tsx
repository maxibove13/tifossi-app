import { StyleSheet, View } from 'react-native';
import Skeleton from '../common/Skeleton';

export default function ProductCardSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={132} borderRadius={2} />
      <View style={styles.content}>
        <Skeleton width={65} height={16} />
        <Skeleton width={108} height={16} />
        <Skeleton width={88} height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 132,
    gap: 12,
  },
  content: {
    gap: 8,
  },
}); 