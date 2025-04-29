# Store Locations System

## Overview

The Tifossi app implements a dynamic routing system for store locations, allowing users to browse stores by city and zone. This document details the implementation of the location screens, data structure, and navigation flow.

## Location Screens

### 1. Location Zone Selection Screen (`/locations/[cityId]/index.tsx`)

This screen displays all available zones for a specific city:

- **Route Parameters**: `cityId` - Identifier for the city (e.g., 'mvd', 'pde')
- **Data Source**: Filtered stores from `storesData` based on `cityId`
- **UI Elements**:
  - Page title showing selected city name
  - List of available store zones in that city
  - Each zone is clickable and navigates to its details

### 2. Store Details Screen (`/locations/[cityId]/[zoneId].tsx`)

This screen displays detailed information about a specific store:

- **Route Parameters**: 
  - `cityId` - Identifier for the city
  - `zoneId` - Identifier for the zone within that city
- **Data Source**: Filtered store from `storesData` based on `cityId` and `zoneId`
- **UI Elements**:
  - Store name in the header
  - Store image
  - Address information
  - Opening hours
  - Close button to return to previous screen

## Data Structure

Stores data is structured with location details in `app/_data/stores.ts`:

```typescript
interface StoreDetails {
  id: string;
  name: string;
  cityId: string; // E.g., 'mvd' for Montevideo
  zoneId: string; // E.g., 'centro' for city center
  address: string;
  hours: string;
  image: ImageSourcePropType;
  // Additional store details...
}
```

## Navigation Flow

1. **City Selection**: User selects a city from the main interface
2. **Zone Selection**: User is shown available zones/stores in `/locations/[cityId]`
3. **Store Details**: User can view specific store details in `/locations/[cityId]/[zoneId]`

## Implementation Details

### Dynamic Route Parameters

The implementation uses Expo Router's dynamic route parameters with bracket notation:

- Files/folders with `[param]` in their name become dynamic segments
- Parameters are accessed via `useLocalSearchParams()` from Expo Router

### City Display Name Helper

A helper function maps cityId values to human-readable names:

```typescript
const getCityDisplayName = (cityId: string): string => {
  const store = storesData.find((s) => s.cityId === cityId);
  if (!store) return cityId; 
  return store.cityId === 'mvd'
    ? 'Montevideo'
    : store.cityId === 'pde'
      ? 'Punta del Este'
      : store.name;
};
```

### Zone Mapping

The application maps store locations to zones within a city, ensuring unique zones:

```typescript
const uniqueZonesMap = new Map<string, SelectionItem>();
cityStores.forEach((store) => {
  if (!uniqueZonesMap.has(store.zoneId)) {
    uniqueZonesMap.set(store.zoneId, { id: store.zoneId, name: store.name });
  }
});
```

## Integration with Other Systems

- **SelectionListScreen**: Reuses the `SelectionListScreen` component from checkout flow for consistent UI
- **Navigation System**: Leverages Expo Router for dynamic routes and parameter handling
- **Design System**: Uses consistent styling tokens from the design system
