import { StyleSheet, View, Text, Pressable } from 'react-native';
import SearchIcon from '../../../../assets/icons/search_glass.svg';
import ToggleSport from '../../ui/toggle/ToggleSport';
import { useState } from 'react';

export default function StoreHeader() {
  const [mode, setMode] = useState<'sport' | 'tiffosi'>('tiffosi');

  return (
    <View style={styles.header}>
      <View style={styles.toggleParent}>
        <ToggleSport 
          mode={mode}
          onToggle={setMode}
          size="l"
          style={styles.toggle}
        />
        <Pressable
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <SearchIcon width={24} height={24} />
        </Pressable>
      </View>
      <Text style={styles.title}>Tienda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FBFBFB',
    paddingTop: 44,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 24,
  },
  toggleParent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    color: '#0C0C0C',
    fontFamily: 'Roboto',
  },
  container: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
}); 