import React, { useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import SelectionListScreen, { SelectionItem } from '../../_components/checkout/SelectionListScreen';
import { storesData } from '../../_data/stores';
import { StoreDetails } from '../../_types';

// Helper function to get city display name from cityId
const getCityDisplayName = (cityId: string): string => {
  const store = storesData.find((s) => s.cityId === cityId);
  if (!store) return cityId; // Fallback to cityId if not found
  // Assuming the city display name is consistent across stores in the same cityId
  return store.cityId === 'mvd'
    ? 'Montevideo'
    : store.cityId === 'pde'
      ? 'Punta del Este'
      : store.name;
};

export default function LocationZoneSelectionScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();

  const zones = useMemo<SelectionItem[]>(() => {
    if (!cityId) return [];
    // Filter stores strictly by cityId
    const cityStores = storesData.filter((store: StoreDetails) => store.cityId === cityId);

    // Map stores to SelectionItem, using zoneId as id and store name as name
    // Ensure unique zones if multiple stores share a zoneId (though unlikely for locations)
    const uniqueZonesMap = new Map<string, SelectionItem>();
    cityStores.forEach((store) => {
      if (!uniqueZonesMap.has(store.zoneId)) {
        uniqueZonesMap.set(store.zoneId, { id: store.zoneId, name: store.name });
      }
    });
    return Array.from(uniqueZonesMap.values());
  }, [cityId]);

  const handleZoneSelect = (selectedItem: SelectionItem) => {
    // Navigate using cityId and the selected zoneId
    router.push(`/locations/${encodeURIComponent(cityId!)}/${encodeURIComponent(selectedItem.id)}`);
  };

  const pageTitle = useMemo(() => {
    return cityId ? `Seleccionar tienda en ${getCityDisplayName(cityId)}` : 'Seleccionar tienda';
  }, [cityId]);

  // Check based on cityId
  if (!cityId || zones.length === 0) return null;

  return (
    <SelectionListScreen
      pageTitle={pageTitle}
      sectionTitle="Tienda" // Changed section title to Tienda
      items={zones}
      onItemSelect={handleZoneSelect}
    />
  );
}
