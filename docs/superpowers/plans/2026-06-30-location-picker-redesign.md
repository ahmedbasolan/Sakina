# Location Picker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text location form with a searchable city dropdown backed by a ~350-city static list, and fix all bugs identified in the location system review.

**Architecture:** A new `src/data/cityData.ts` feeds a redesigned `LocationPickerModal` that has two modes — search (FlatList filtered client-side) and manual fallback (existing two-field form, now with trimming and formatted callback). Call-site fixes in `HomeScreen` and `PrayerTimesScreen` complete the cross-screen state sync and duplicate-method cleanup.

**Tech Stack:** React Native `FlatList`, `useMemo` for filtered results, `useFocusEffect` from `@react-navigation/native`, `expo-blur`, `expo-linear-gradient`, `AsyncStorage` via `locationStorage` service.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/cityData.ts` | Static city list (~350 entries) |
| Rewrite | `src/components/LocationPickerModal.tsx` | Search + manual modes, all bug fixes |
| Modify | `src/services/prayerTimesService.ts` | Remove duplicate `formatCountdown` instance method |
| Modify | `src/screens/PrayerTimesScreen.tsx` | Use `formatCountdown` free fn, pass `currentLocation` to modal |
| Modify | `src/screens/HomeScreen.tsx` | Add `useFocusEffect`, pass `currentLocation` to modal |

---

## Task 1: Create `src/data/cityData.ts`

**Files:**
- Create: `src/data/cityData.ts`

- [ ] **Step 1: Create the file**

```ts
export interface City {
  city: string;
  country: string;
}

export const CITIES: City[] = [
  // Middle East
  { city: 'Riyadh', country: 'Saudi Arabia' },
  { city: 'Jeddah', country: 'Saudi Arabia' },
  { city: 'Mecca', country: 'Saudi Arabia' },
  { city: 'Medina', country: 'Saudi Arabia' },
  { city: 'Dammam', country: 'Saudi Arabia' },
  { city: 'Khobar', country: 'Saudi Arabia' },
  { city: 'Taif', country: 'Saudi Arabia' },
  { city: 'Abha', country: 'Saudi Arabia' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Abu Dhabi', country: 'UAE' },
  { city: 'Sharjah', country: 'UAE' },
  { city: 'Ajman', country: 'UAE' },
  { city: 'Al Ain', country: 'UAE' },
  { city: 'Kuwait City', country: 'Kuwait' },
  { city: 'Doha', country: 'Qatar' },
  { city: 'Manama', country: 'Bahrain' },
  { city: 'Muscat', country: 'Oman' },
  { city: 'Salalah', country: 'Oman' },
  { city: 'Amman', country: 'Jordan' },
  { city: 'Irbid', country: 'Jordan' },
  { city: 'Zarqa', country: 'Jordan' },
  { city: 'Aqaba', country: 'Jordan' },
  { city: 'Beirut', country: 'Lebanon' },
  { city: 'Tripoli', country: 'Lebanon' },
  { city: 'Damascus', country: 'Syria' },
  { city: 'Aleppo', country: 'Syria' },
  { city: 'Homs', country: 'Syria' },
  { city: 'Latakia', country: 'Syria' },
  { city: 'Baghdad', country: 'Iraq' },
  { city: 'Basra', country: 'Iraq' },
  { city: 'Mosul', country: 'Iraq' },
  { city: 'Erbil', country: 'Iraq' },
  { city: 'Najaf', country: 'Iraq' },
  { city: 'Karbala', country: 'Iraq' },
  { city: 'Sanaa', country: 'Yemen' },
  { city: 'Aden', country: 'Yemen' },
  { city: 'Taiz', country: 'Yemen' },
  { city: 'Hodeidah', country: 'Yemen' },
  // Egypt
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Alexandria', country: 'Egypt' },
  { city: 'Giza', country: 'Egypt' },
  { city: 'Luxor', country: 'Egypt' },
  { city: 'Aswan', country: 'Egypt' },
  { city: 'Sharm el-Sheikh', country: 'Egypt' },
  { city: 'Hurghada', country: 'Egypt' },
  { city: 'Suez', country: 'Egypt' },
  // North Africa
  { city: 'Tripoli', country: 'Libya' },
  { city: 'Benghazi', country: 'Libya' },
  { city: 'Misrata', country: 'Libya' },
  { city: 'Tunis', country: 'Tunisia' },
  { city: 'Sfax', country: 'Tunisia' },
  { city: 'Sousse', country: 'Tunisia' },
  { city: 'Bizerte', country: 'Tunisia' },
  { city: 'Algiers', country: 'Algeria' },
  { city: 'Oran', country: 'Algeria' },
  { city: 'Constantine', country: 'Algeria' },
  { city: 'Annaba', country: 'Algeria' },
  { city: 'Tlemcen', country: 'Algeria' },
  { city: 'Casablanca', country: 'Morocco' },
  { city: 'Rabat', country: 'Morocco' },
  { city: 'Marrakech', country: 'Morocco' },
  { city: 'Fez', country: 'Morocco' },
  { city: 'Tangier', country: 'Morocco' },
  { city: 'Agadir', country: 'Morocco' },
  { city: 'Meknes', country: 'Morocco' },
  { city: 'Oujda', country: 'Morocco' },
  { city: 'Khartoum', country: 'Sudan' },
  { city: 'Omdurman', country: 'Sudan' },
  { city: 'Port Sudan', country: 'Sudan' },
  { city: 'Nouakchott', country: 'Mauritania' },
  // Sub-Saharan Africa
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Abuja', country: 'Nigeria' },
  { city: 'Kano', country: 'Nigeria' },
  { city: 'Ibadan', country: 'Nigeria' },
  { city: 'Kaduna', country: 'Nigeria' },
  { city: 'Port Harcourt', country: 'Nigeria' },
  { city: 'Maiduguri', country: 'Nigeria' },
  { city: 'Sokoto', country: 'Nigeria' },
  { city: 'Accra', country: 'Ghana' },
  { city: 'Kumasi', country: 'Ghana' },
  { city: 'Tamale', country: 'Ghana' },
  { city: 'Dakar', country: 'Senegal' },
  { city: 'Touba', country: 'Senegal' },
  { city: 'Bamako', country: 'Mali' },
  { city: 'Niamey', country: 'Niger' },
  { city: 'Ouagadougou', country: 'Burkina Faso' },
  { city: 'Conakry', country: 'Guinea' },
  { city: 'Freetown', country: 'Sierra Leone' },
  { city: 'Banjul', country: 'Gambia' },
  { city: 'Abidjan', country: 'Ivory Coast' },
  { city: 'Dar es Salaam', country: 'Tanzania' },
  { city: 'Zanzibar', country: 'Tanzania' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Mombasa', country: 'Kenya' },
  { city: 'Kampala', country: 'Uganda' },
  { city: 'Addis Ababa', country: 'Ethiopia' },
  { city: 'Mogadishu', country: 'Somalia' },
  // South Asia — Pakistan
  { city: 'Karachi', country: 'Pakistan' },
  { city: 'Lahore', country: 'Pakistan' },
  { city: 'Islamabad', country: 'Pakistan' },
  { city: 'Rawalpindi', country: 'Pakistan' },
  { city: 'Faisalabad', country: 'Pakistan' },
  { city: 'Multan', country: 'Pakistan' },
  { city: 'Peshawar', country: 'Pakistan' },
  { city: 'Quetta', country: 'Pakistan' },
  { city: 'Hyderabad', country: 'Pakistan' },
  { city: 'Sialkot', country: 'Pakistan' },
  { city: 'Gujranwala', country: 'Pakistan' },
  { city: 'Bahawalpur', country: 'Pakistan' },
  // South Asia — India
  { city: 'Mumbai', country: 'India' },
  { city: 'Delhi', country: 'India' },
  { city: 'Bangalore', country: 'India' },
  { city: 'Hyderabad', country: 'India' },
  { city: 'Chennai', country: 'India' },
  { city: 'Kolkata', country: 'India' },
  { city: 'Ahmedabad', country: 'India' },
  { city: 'Pune', country: 'India' },
  { city: 'Surat', country: 'India' },
  { city: 'Lucknow', country: 'India' },
  { city: 'Kanpur', country: 'India' },
  { city: 'Nagpur', country: 'India' },
  { city: 'Jaipur', country: 'India' },
  { city: 'Bhopal', country: 'India' },
  { city: 'Kozhikode', country: 'India' },
  { city: 'Malappuram', country: 'India' },
  // South Asia — Bangladesh, Afghanistan, others
  { city: 'Dhaka', country: 'Bangladesh' },
  { city: 'Chittagong', country: 'Bangladesh' },
  { city: 'Sylhet', country: 'Bangladesh' },
  { city: 'Khulna', country: 'Bangladesh' },
  { city: 'Rajshahi', country: 'Bangladesh' },
  { city: 'Comilla', country: 'Bangladesh' },
  { city: 'Kabul', country: 'Afghanistan' },
  { city: 'Kandahar', country: 'Afghanistan' },
  { city: 'Herat', country: 'Afghanistan' },
  { city: 'Mazar-i-Sharif', country: 'Afghanistan' },
  { city: 'Jalalabad', country: 'Afghanistan' },
  { city: 'Colombo', country: 'Sri Lanka' },
  { city: 'Male', country: 'Maldives' },
  // Iran
  { city: 'Tehran', country: 'Iran' },
  { city: 'Isfahan', country: 'Iran' },
  { city: 'Mashhad', country: 'Iran' },
  { city: 'Shiraz', country: 'Iran' },
  { city: 'Tabriz', country: 'Iran' },
  { city: 'Ahvaz', country: 'Iran' },
  { city: 'Qom', country: 'Iran' },
  // Central Asia
  { city: 'Almaty', country: 'Kazakhstan' },
  { city: 'Astana', country: 'Kazakhstan' },
  { city: 'Shymkent', country: 'Kazakhstan' },
  { city: 'Tashkent', country: 'Uzbekistan' },
  { city: 'Samarkand', country: 'Uzbekistan' },
  { city: 'Bukhara', country: 'Uzbekistan' },
  { city: 'Bishkek', country: 'Kyrgyzstan' },
  { city: 'Dushanbe', country: 'Tajikistan' },
  { city: 'Ashgabat', country: 'Turkmenistan' },
  { city: 'Baku', country: 'Azerbaijan' },
  // Turkey & Balkans
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Ankara', country: 'Turkey' },
  { city: 'Izmir', country: 'Turkey' },
  { city: 'Bursa', country: 'Turkey' },
  { city: 'Antalya', country: 'Turkey' },
  { city: 'Konya', country: 'Turkey' },
  { city: 'Adana', country: 'Turkey' },
  { city: 'Gaziantep', country: 'Turkey' },
  { city: 'Diyarbakir', country: 'Turkey' },
  { city: 'Trabzon', country: 'Turkey' },
  { city: 'Tirana', country: 'Albania' },
  { city: 'Sarajevo', country: 'Bosnia and Herzegovina' },
  { city: 'Pristina', country: 'Kosovo' },
  { city: 'Skopje', country: 'North Macedonia' },
  // Southeast Asia
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Penang', country: 'Malaysia' },
  { city: 'Johor Bahru', country: 'Malaysia' },
  { city: 'Kota Kinabalu', country: 'Malaysia' },
  { city: 'Kuching', country: 'Malaysia' },
  { city: 'Jakarta', country: 'Indonesia' },
  { city: 'Surabaya', country: 'Indonesia' },
  { city: 'Bandung', country: 'Indonesia' },
  { city: 'Medan', country: 'Indonesia' },
  { city: 'Semarang', country: 'Indonesia' },
  { city: 'Makassar', country: 'Indonesia' },
  { city: 'Palembang', country: 'Indonesia' },
  { city: 'Yogyakarta', country: 'Indonesia' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Bandar Seri Begawan', country: 'Brunei' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Pattani', country: 'Thailand' },
  { city: 'Hat Yai', country: 'Thailand' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Cotabato', country: 'Philippines' },
  { city: 'Zamboanga', country: 'Philippines' },
  // East Asia
  { city: 'Beijing', country: 'China' },
  { city: 'Shanghai', country: 'China' },
  { city: 'Guangzhou', country: 'China' },
  { city: 'Shenzhen', country: 'China' },
  { city: 'Urumqi', country: 'China' },
  { city: 'Xian', country: 'China' },
  { city: 'Chengdu', country: 'China' },
  { city: 'Wuhan', country: 'China' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Seoul', country: 'South Korea' },
  // Europe — United Kingdom
  { city: 'London', country: 'United Kingdom' },
  { city: 'Manchester', country: 'United Kingdom' },
  { city: 'Birmingham', country: 'United Kingdom' },
  { city: 'Leeds', country: 'United Kingdom' },
  { city: 'Glasgow', country: 'United Kingdom' },
  { city: 'Edinburgh', country: 'United Kingdom' },
  { city: 'Liverpool', country: 'United Kingdom' },
  { city: 'Bristol', country: 'United Kingdom' },
  { city: 'Sheffield', country: 'United Kingdom' },
  { city: 'Bradford', country: 'United Kingdom' },
  { city: 'Leicester', country: 'United Kingdom' },
  { city: 'Coventry', country: 'United Kingdom' },
  { city: 'Nottingham', country: 'United Kingdom' },
  { city: 'Newcastle', country: 'United Kingdom' },
  // Europe — France
  { city: 'Paris', country: 'France' },
  { city: 'Lyon', country: 'France' },
  { city: 'Marseille', country: 'France' },
  { city: 'Toulouse', country: 'France' },
  { city: 'Bordeaux', country: 'France' },
  { city: 'Lille', country: 'France' },
  { city: 'Strasbourg', country: 'France' },
  { city: 'Nantes', country: 'France' },
  { city: 'Nice', country: 'France' },
  // Europe — Germany
  { city: 'Berlin', country: 'Germany' },
  { city: 'Hamburg', country: 'Germany' },
  { city: 'Munich', country: 'Germany' },
  { city: 'Frankfurt', country: 'Germany' },
  { city: 'Cologne', country: 'Germany' },
  { city: 'Stuttgart', country: 'Germany' },
  { city: 'Dusseldorf', country: 'Germany' },
  { city: 'Dortmund', country: 'Germany' },
  { city: 'Essen', country: 'Germany' },
  { city: 'Bremen', country: 'Germany' },
  // Europe — rest
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Rotterdam', country: 'Netherlands' },
  { city: 'The Hague', country: 'Netherlands' },
  { city: 'Utrecht', country: 'Netherlands' },
  { city: 'Brussels', country: 'Belgium' },
  { city: 'Antwerp', country: 'Belgium' },
  { city: 'Liege', country: 'Belgium' },
  { city: 'Stockholm', country: 'Sweden' },
  { city: 'Gothenburg', country: 'Sweden' },
  { city: 'Malmo', country: 'Sweden' },
  { city: 'Oslo', country: 'Norway' },
  { city: 'Bergen', country: 'Norway' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Helsinki', country: 'Finland' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Valencia', country: 'Spain' },
  { city: 'Seville', country: 'Spain' },
  { city: 'Zaragoza', country: 'Spain' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Naples', country: 'Italy' },
  { city: 'Turin', country: 'Italy' },
  { city: 'Palermo', country: 'Italy' },
  { city: 'Zurich', country: 'Switzerland' },
  { city: 'Geneva', country: 'Switzerland' },
  { city: 'Basel', country: 'Switzerland' },
  { city: 'Vienna', country: 'Austria' },
  { city: 'Graz', country: 'Austria' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Porto', country: 'Portugal' },
  { city: 'Athens', country: 'Greece' },
  { city: 'Moscow', country: 'Russia' },
  { city: 'Saint Petersburg', country: 'Russia' },
  { city: 'Kazan', country: 'Russia' },
  { city: 'Ufa', country: 'Russia' },
  { city: 'Grozny', country: 'Russia' },
  { city: 'Makhachkala', country: 'Russia' },
  // North America — USA
  { city: 'New York', country: 'USA' },
  { city: 'Los Angeles', country: 'USA' },
  { city: 'Chicago', country: 'USA' },
  { city: 'Houston', country: 'USA' },
  { city: 'Phoenix', country: 'USA' },
  { city: 'Philadelphia', country: 'USA' },
  { city: 'San Antonio', country: 'USA' },
  { city: 'San Diego', country: 'USA' },
  { city: 'Dallas', country: 'USA' },
  { city: 'San Jose', country: 'USA' },
  { city: 'Austin', country: 'USA' },
  { city: 'Jacksonville', country: 'USA' },
  { city: 'Columbus', country: 'USA' },
  { city: 'Charlotte', country: 'USA' },
  { city: 'Indianapolis', country: 'USA' },
  { city: 'San Francisco', country: 'USA' },
  { city: 'Seattle', country: 'USA' },
  { city: 'Denver', country: 'USA' },
  { city: 'Boston', country: 'USA' },
  { city: 'Nashville', country: 'USA' },
  { city: 'Memphis', country: 'USA' },
  { city: 'Las Vegas', country: 'USA' },
  { city: 'Portland', country: 'USA' },
  { city: 'Atlanta', country: 'USA' },
  { city: 'Detroit', country: 'USA' },
  { city: 'Minneapolis', country: 'USA' },
  { city: 'Miami', country: 'USA' },
  { city: 'Baltimore', country: 'USA' },
  { city: 'Raleigh', country: 'USA' },
  { city: 'Dearborn', country: 'USA' },
  { city: 'Paterson', country: 'USA' },
  { city: 'Jersey City', country: 'USA' },
  // North America — Canada
  { city: 'Toronto', country: 'Canada' },
  { city: 'Montreal', country: 'Canada' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Calgary', country: 'Canada' },
  { city: 'Edmonton', country: 'Canada' },
  { city: 'Ottawa', country: 'Canada' },
  { city: 'Winnipeg', country: 'Canada' },
  { city: 'Mississauga', country: 'Canada' },
  { city: 'Brampton', country: 'Canada' },
  { city: 'Hamilton', country: 'Canada' },
  // Australasia
  { city: 'Sydney', country: 'Australia' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'Brisbane', country: 'Australia' },
  { city: 'Perth', country: 'Australia' },
  { city: 'Adelaide', country: 'Australia' },
  { city: 'Canberra', country: 'Australia' },
  { city: 'Gold Coast', country: 'Australia' },
  { city: 'Auckland', country: 'New Zealand' },
  { city: 'Wellington', country: 'New Zealand' },
  { city: 'Christchurch', country: 'New Zealand' },
  // South America & Caribbean
  { city: 'Sao Paulo', country: 'Brazil' },
  { city: 'Rio de Janeiro', country: 'Brazil' },
  { city: 'Brasilia', country: 'Brazil' },
  { city: 'Buenos Aires', country: 'Argentina' },
  { city: 'Bogota', country: 'Colombia' },
  { city: 'Port of Spain', country: 'Trinidad and Tobago' },
  { city: 'Georgetown', country: 'Guyana' },
];
```

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/cityData.ts
git commit -m "feat(data): add static city list for location picker (~350 cities)"
```

---

## Task 2: Remove duplicate `formatCountdown` from `PrayerTimesService`

**Files:**
- Modify: `src/services/prayerTimesService.ts` (remove lines 291–300)
- Modify: `src/screens/PrayerTimesScreen.tsx` (line 16 import, line 109 usage)

- [ ] **Step 1: Delete the instance method from `prayerTimesService.ts`**

Remove these lines entirely (the JSDoc comment and the method):

```ts
  /**
   * Formats minutes remaining into "2h 15m" style.
   */
  public formatCountdown(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
```

The module-level `export const formatCountdown` at the top of the file (lines 39–43) stays.

- [ ] **Step 2: Update `PrayerTimesScreen.tsx` import (line 16)**

Change:
```ts
import PrayerTimesService, { PrayerTimesData, formatPrayerTime, TimeFormat } from '../services/prayerTimesService';
```

To:
```ts
import PrayerTimesService, { PrayerTimesData, formatPrayerTime, formatCountdown, TimeFormat } from '../services/prayerTimesService';
```

- [ ] **Step 3: Update `PrayerTimesScreen.tsx` usage (line 109)**

Change:
```ts
const countdown = displayNext ? service.formatCountdown(displayNext.minutesRemaining) : '';
```

To:
```ts
const countdown = displayNext ? formatCountdown(displayNext.minutesRemaining) : '';
```

- [ ] **Step 4: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/prayerTimesService.ts src/screens/PrayerTimesScreen.tsx
git commit -m "fix(prayerTimes): remove duplicate formatCountdown instance method"
```

---

## Task 3: Rewrite `LocationPickerModal`

**Files:**
- Rewrite: `src/components/LocationPickerModal.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { saveUserLocation, formatLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService from '../services/prayerTimesService';
import { CITIES } from '../data/cityData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation?: UserLocation;
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentLocation,
  onClose,
  onLocationSelected,
}) => {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMode('search');
      setQuery(currentLocation?.city ?? '');
      setCity('');
      setCountry('');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [visible]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [query]);

  const handleSelect = async (selected: { city: string; country: string }) => {
    const formatted = formatLocation({ city: selected.city, country: selected.country });
    await saveUserLocation(formatted);
    onLocationSelected(formatted);
    onClose();
  };

  const handleManualSave = async () => {
    if (!city.trim() || !country.trim()) {
      Alert.alert('Incomplete Information', 'Please provide both city and country.');
      return;
    }
    setIsLoading(true);
    try {
      const prayerService = PrayerTimesService.getInstance();
      await prayerService.getTimingsByCity(city.trim(), country.trim());
      const formatted = formatLocation({ city: city.trim(), country: country.trim() });
      await saveUserLocation(formatted);
      onLocationSelected(formatted);
      onClose();
    } catch {
      Alert.alert(
        'Location Error',
        `We couldn't find prayer times for ${city}, ${country}. Please check the spelling.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {mode === 'manual' ? (
                  <TouchableOpacity
                    onPress={() => setMode('search')}
                    style={styles.backButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.accent.primary} />
                    <Text style={styles.backText}>Search</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Ionicons name="location-outline" size={20} color={Colors.accent.primary} />
                    <Text style={styles.headerTitle}>Where are you?</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="rgba(245, 237, 227, 0.7)" />
              </TouchableOpacity>
            </View>

            {mode === 'search' ? (
              <>
                {/* Search input */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search-outline" size={18} color="rgba(245, 237, 227, 0.4)" />
                  <TextInput
                    ref={searchRef}
                    style={styles.searchInput}
                    placeholder="Search city..."
                    value={query}
                    onChangeText={setQuery}
                    placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="rgba(245, 237, 227, 0.4)" />
                    </TouchableOpacity>
                  )}
                </View>

                {query.trim() ? (
                  results.length > 0 ? (
                    <FlatList
                      data={results}
                      keyExtractor={(item, i) => `${item.city}-${item.country}-${i}`}
                      keyboardShouldPersistTaps="handled"
                      style={styles.list}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.resultRow}
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.resultCity}>{item.city}</Text>
                          <Text style={styles.resultCountry}>{item.country}</Text>
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                      ListFooterComponent={
                        <TouchableOpacity
                          style={styles.manualFooter}
                          onPress={() => setMode('manual')}
                        >
                          <Text style={styles.manualLink}>Can't find your city? Enter manually →</Text>
                        </TouchableOpacity>
                      }
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No results for "{query}"</Text>
                      <TouchableOpacity onPress={() => setMode('manual')}>
                        <Text style={styles.manualLink}>Enter manually →</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <Text style={styles.hint}>Start typing to search cities</Text>
                )}
              </>
            ) : (
              <View style={styles.form}>
                <Text style={styles.description}>
                  Enter your city and country for accurate prayer times. Stored privately on your device.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="business-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. London"
                      value={city}
                      onChangeText={setCity}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Country</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="earth-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. United Kingdom"
                      value={country}
                      onChangeText={setCountry}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleManualSave} disabled={isLoading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#E8C84A', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.background.secondary} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Location</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  list: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  resultCity: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    flex: 1,
  },
  resultCountry: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    marginLeft: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: Spacing.xl,
  },
  manualFooter: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  manualLink: {
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  hint: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  form: {
    padding: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  saveButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.background.secondary,
  },
});
```

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LocationPickerModal.tsx
git commit -m "feat(location): redesign picker with city search dropdown and manual fallback"
```

---

## Task 4: Update `PrayerTimesScreen` call-site

**Files:**
- Modify: `src/screens/PrayerTimesScreen.tsx`

- [ ] **Step 1: Pass `currentLocation` prop to modal**

Find the `<LocationPickerModal` block (near the bottom of the file):

```tsx
<LocationPickerModal
  visible={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelected={handleLocationSelected}
/>
```

Replace with:

```tsx
<LocationPickerModal
  visible={showLocationPicker}
  currentLocation={location ?? undefined}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelected={handleLocationSelected}
/>
```

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/PrayerTimesScreen.tsx
git commit -m "fix(location): pre-fill picker with current location in PrayerTimesScreen"
```

---

## Task 5: Update `HomeScreen` — `useFocusEffect` + `currentLocation` prop

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add `useFocusEffect` import**

`HomeScreen.tsx` line 1 currently reads:
```ts
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
```

That line is unchanged. Find the existing `@react-navigation/native` import in `HomeScreen.tsx` — if one exists, add `useFocusEffect` to it. If none exists, add a new import after line 1:

```ts
import { useFocusEffect } from '@react-navigation/native';
```

- [ ] **Step 2: Add `useFocusEffect` call inside the component**

Find where `useHomeData` is destructured (around line 97 in the current file). After the destructuring block, add:

```ts
// Reload prayer data when returning from any screen that may have changed location
useFocusEffect(useCallback(() => { loadPrayerData(); }, [loadPrayerData]));
```

- [ ] **Step 3: Pass `currentLocation` to modal**

Find the `<LocationPickerModal` block in `HomeScreen.tsx`:

```tsx
<LocationPickerModal
  visible={showLocationModal}
  onClose={() => setShowLocationModal(false)}
  onLocationSelected={() => {
    loadPrayerData();
  }}
/>
```

Replace with:

```tsx
<LocationPickerModal
  visible={showLocationModal}
  currentLocation={{ city: currentCity, country: currentCountry }}
  onClose={() => setShowLocationModal(false)}
  onLocationSelected={() => loadPrayerData()}
/>
```

- [ ] **Step 4: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "fix(location): sync HomeScreen on focus + pre-fill modal with current city"
```
