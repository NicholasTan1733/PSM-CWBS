import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Text, Card, Chip, Divider, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';

import Background from "../components/Background";
import Header from "../components/Header";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { shops } from "../data/city-data";

// Shop coordinates (you should add these to your city-data.js)
const shopCoordinates = {
  'selangor_premium': { latitude: 3.0448, longitude: 101.5315 },
  'johor_deluxe': { latitude: 1.4849, longitude: 103.7618 },
  'perlis_express': { latitude: 6.4414, longitude: 100.1986 },
};

export default function SelectShopScreen({ route, navigation }) {
  const { cityId } = route.params;
  const [loading, setLoading] = useState(false);
  const [cityShops, setCityShops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [shopsWithDistance, setShopsWithDistance] = useState([]);

  useEffect(() => {
    // Filter shops based on selected city
    const filteredShops = shops.filter(shop => shop.cityId === cityId);
    setCityShops(filteredShops);
    getUserLocation();
  }, [cityId]);

  useEffect(() => {
    if (userLocation && cityShops.length > 0) {
      calculateDistances();
    }
  }, [userLocation, cityShops]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location.coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
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

  const calculateDistances = () => {
    const shopsWithDist = cityShops.map(shop => {
      const shopCoords = shopCoordinates[shop.id];
      if (shopCoords && userLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          shopCoords.latitude,
          shopCoords.longitude
        );
        return { ...shop, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
      }
      return shop;
    });

    // Sort by distance (nearest first)
    const sortedShops = shopsWithDist.sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      if (a.distance && !b.distance) return -1;
      if (!a.distance && b.distance) return 1;
      return 0;
    });

    setShopsWithDistance(sortedShops);
  };

  const handleShopSelect = (shop) => {
    navigation.navigate("ShopDetailsScreen", { shopId: shop.id });
  };

  const formatOpeningHours = (openingHour, closingHour) => {
    const formatHour = (time) => {
      const [hour, minute] = time.split(':');
      const hourInt = parseInt(hour);
      return `${hourInt > 12 ? hourInt - 12 : hourInt}:${minute} ${hourInt >= 12 ? 'PM' : 'AM'}`;
    };
    
    return `${formatHour(openingHour)} - ${formatHour(closingHour)}`;
  };

  const getShopStatusColor = (openingHour, closingHour) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [openHour, openMin] = openingHour.split(':').map(Number);
    const [closeHour, closeMin] = closingHour.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      return { color: theme.colors.success, text: 'Open' };
    } else {
      return { color: theme.colors.error, text: 'Closed' };
    }
  };

  const renderShopItem = ({ item, index }) => {
    const statusInfo = getShopStatusColor(item.openingHour, item.closingHour);
    const isNearest = index === 0 && item.distance;

    return (
      <TouchableOpacity onPress={() => handleShopSelect(item)}>
        <Card style={[styles.shopCard, isNearest && styles.nearestShopCard]}>
          <Card.Content>
            {isNearest && (
              <View style={styles.nearestBadge}>
                <MaterialCommunityIcons name="navigation" size={12} color="#fff" />
                <Text style={styles.nearestBadgeText}>Nearest</Text>
              </View>
            )}
            
            <View style={styles.shopHeader}>
              <Image source={item.image} style={styles.shopImage} />
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{item.name}</Text>
                
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                      key={star}
                      name={star <= Math.floor(item.rating) ? "star" : star <= item.rating ? "star-half-full" : "star-outline"}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                  <Text style={styles.ratingText}>({item.rating})</Text>
                </View>
                
                <View style={styles.locationInfo}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.placeholder} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                </View>
                
                {item.distance && (
                  <View style={styles.distanceInfo}>
                    <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.primary} />
                    <Text style={styles.distanceText}>{item.distance} km away</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.shopActions}>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: statusInfo.color }]}
                  textStyle={styles.statusText}
                >
                  {statusInfo.text}
                </Chip>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.shopDetails}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.placeholder} />
                <Text style={styles.detailText}>
                  {formatOpeningHours(item.openingHour, item.closingHour)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.placeholder} />
                <Text style={styles.detailText} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const displayShops = shopsWithDistance.length > 0 ? shopsWithDistance : cityShops;

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Select Car Wash Shop</Header>
      
      <View style={styles.container}>
        {userLocation && (
          <View style={styles.locationHeader}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={theme.colors.success} />
            <Text style={styles.locationHeaderText}>Shops sorted by distance</Text>
          </View>
        )}
        
        <FlatList
          data={displayShops}
          renderItem={renderShopItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="store-off" size={60} color={theme.colors.placeholder} />
              <Text style={styles.emptyText}>No shops available in this city</Text>
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
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: theme.colors.success + '10',
    marginBottom: 10,
  },
  locationHeaderText: {
    marginLeft: 5,
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  shopCard: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  nearestShopCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#f8f9ff',
  },
  nearestBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  nearestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shopImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  shopInfo: {
    flex: 1,
    marginLeft: 15,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  addressText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    marginLeft: 5,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  shopActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
    backgroundColor: '#e0e0e0',
  },
  shopDetails: {
    paddingTop: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: theme.colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
});