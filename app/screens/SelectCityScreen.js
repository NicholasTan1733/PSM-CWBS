import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { Text, Card, Searchbar, ActivityIndicator, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';

import Background from "../components/Background";
import Header from "../components/Header";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { cities } from "../data/city-data";

const stateCoordinates = {
  'selangor': { latitude: 3.0738, longitude: 101.5183 },
  'johor': { latitude: 1.4927, longitude: 103.7414 },
  'perlis': { latitude: 6.4414, longitude: 100.1986 },
  'kuala_lumpur': { latitude: 3.1390, longitude: 101.6869 },
  'penang': { latitude: 5.4164, longitude: 100.3327 },
  'sabah': { latitude: 5.9804, longitude: 116.0735 },
  'sarawak': { latitude: 1.5533, longitude: 110.3592 },
  'pahang': { latitude: 3.8126, longitude: 103.3256 },
  'perak': { latitude: 4.5921, longitude: 101.0901 },
  'kedah': { latitude: 6.1184, longitude: 100.3685 },
  'kelantan': { latitude: 6.1254, longitude: 102.2386 },
  'terengganu': { latitude: 5.3117, longitude: 103.1324 },
  'melaka': { latitude: 2.1896, longitude: 102.2501 },
  'negeri_sembilan': { latitude: 2.7297, longitude: 101.9381 },
};

export default function SelectCityScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(cities);
  const [nearbyCity, setNearbyCity] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        setLocationError('Location services are disabled. Please enable them in settings.');
        setLocationLoading(false);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please select city manually.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });
      
      setUserLocation(location.coords);
      
      const nearest = findNearestCity(location.coords);
      setNearbyCity(nearest);
      
    } catch (error) {
      console.error('Error getting location:', error);
      let errorMessage = 'Could not get your current location.';
      
      if (error.code === 'TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error.code === 'UNAVAILABLE') {
        errorMessage = 'Location services unavailable.';
      }
      
      setLocationError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const findNearestCity = (userCoords) => {
    let nearestCity = null;
    let shortestDistance = Infinity;

    cities.forEach(city => {
      const cityCoords = stateCoordinates[city.id];
      if (cityCoords) {
        const distance = calculateDistance(
          userCoords.latitude, 
          userCoords.longitude,
          cityCoords.latitude, 
          cityCoords.longitude
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestCity = { ...city, distance: Math.round(distance) };
        }
      }
    });

    return nearestCity;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleCitySelect = (city) => {
    navigation.navigate("SelectShopScreen", { cityId: city.id });
  };

  const renderNearbyCity = () => {
    if (locationLoading) {
      return (
        <View style={styles.nearbySection}>
          <Text style={styles.sectionTitle}>📍 Finding Nearby Location...</Text>
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </Card.Content>
          </Card>
        </View>
      );
    }

    if (locationError || !nearbyCity) {
      return (
        <View style={styles.nearbySection}>
          <Text style={styles.sectionTitle}>📍 Nearby Location</Text>
          <Card style={styles.noLocationCard}>
            <Card.Content style={styles.noLocationContent}>
              <MaterialCommunityIcons name="map-marker-off" size={24} color={theme.colors.placeholder} />
              <Text style={styles.noLocationText}>
                {locationError || 'Location not available'}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return (
      <View style={styles.nearbySection}>
        <Text style={styles.sectionTitle}>📍 Nearby Location</Text>
        <TouchableOpacity onPress={() => handleCitySelect(nearbyCity)}>
          <Card style={styles.nearbyCityCard}>
            <Card.Content style={styles.nearbyCityContent}>
              <View style={styles.nearbyBadge}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
                <Text style={styles.nearbyBadgeText}>{nearbyCity.distance} km</Text>
              </View>
              
              <Image source={nearbyCity.image} style={styles.cityImage} />
              
              <View style={styles.cityDetails}>
                <Text style={styles.cityName}>{nearbyCity.name}</Text>
                <Text style={styles.cityDescription}>{nearbyCity.description}</Text>
                <View style={styles.distanceContainer}>
                  <MaterialCommunityIcons name="navigation" size={14} color={theme.colors.primary} />
                  <Text style={styles.distanceText}>Nearest to you</Text>
                </View>
              </View>
              
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleCitySelect(item)}>
      <Card style={styles.cityCard}>
        <Card.Content style={styles.cityCardContent}>
          <Image source={item.image} style={styles.cityImage} />
          <View style={styles.cityDetails}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityDescription}>{item.description}</Text>
            
            {userLocation && (
              <View style={styles.distanceContainer}>
                <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.placeholder} />
                <Text style={styles.distanceText}>
                  {Math.round(calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    stateCoordinates[item.id]?.latitude || 0,
                    stateCoordinates[item.id]?.longitude || 0
                  ))} km away
                </Text>
              </View>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.placeholder} />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Select City</Header>
      
      <View style={styles.container}>
        {renderNearbyCity()}
        
        {nearbyCity && <Divider style={styles.divider} />}
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search cities..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>
        
        <View style={styles.otherCitiesHeader}>
          <Text style={styles.sectionTitle}>🏙️ All Cities</Text>
        </View>
        
        <FlatList
          data={filteredCities}
          renderItem={renderCityItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="city-variant-outline" size={60} color={theme.colors.placeholder} />
              <Text style={styles.emptyText}>No cities found</Text>
            </View>
          }
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  nearbySection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  loadingCard: {
    borderRadius: 10,
    elevation: 2,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  noLocationCard: {
    borderRadius: 10,
    elevation: 2,
  },
  noLocationContent: {
    alignItems: 'center',
    padding: 20,
  },
  noLocationText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nearbyCityCard: {
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
  },
  nearbyCityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    position: 'relative',
  },
  nearbyBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  nearbyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#e0e0e0',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    elevation: 2,
  },
  otherCitiesHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cityCard: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
  },
  cityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  cityImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cityDetails: {
    flex: 1,
    marginLeft: 15,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cityDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.placeholder,
  },
});