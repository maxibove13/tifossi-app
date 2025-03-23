import { StyleSheet, View, ViewStyle } from 'react-native';
import { layout } from '../../../styles/spacing';

type GridProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Grid({ children, style }: GridProps) {
  return (
    <View style={[styles.grid, style]}>
      {children}
    </View>
  );
}

export function GridItem({ children, index, total }: { children: React.ReactNode; index: number; total: number }) {
  return (
    <View 
      style={[
        styles.gridItem,
        index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
        index < total - 2 ? styles.gridItemBottom : null
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '48%',
  },
  gridItemLeft: {
    marginRight: '2%',
  },
  gridItemRight: {
    marginLeft: '2%',
  },
  gridItemBottom: {
    marginBottom: layout.gridGap,
  },
}); 