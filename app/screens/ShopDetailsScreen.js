import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { Text, Card, Divider, Button as PaperButton, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { shops, services } from "../data/city-data";

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const [shop, setShop] = useState(null);
  const [shopServices, setShopServices] = useState([]);

  useEffect(() => {
    // Find shop details
    const selectedShop = shops.find(s => s.id === shopId);
    setShop(selectedShop);
    
    // Get services for this shop
    if (selectedShop && services[selectedShop.id]) {
      setShopServices(services[selectedShop.id]);
    }
  }, [shopId]);

  const handleBookService = () => {
    navigation.navigate("BookingScreen", { 
      shopId: shopId,
      shopName: shop?.name
    });
  };

  const formatOpeningHours = (openingHour, closingHour) => {
    const formatHour = (time) => {
      const [hour, minute] = time.split(':');
      const hourInt = parseInt(hour);
      return `${hourInt > 12 ? hourInt - 12 : hourInt}:${minute} ${hourInt >= 12 ? 'PM' : 'AM'}`;
    };
    
    return `${formatHour(openingHour)} - ${formatHour(closingHour)}`;
  };

  if (!shop) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Shop Details</Header>
        <View style={styles.loadingContainer}>
          <Text>Loading shop details...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={shop.image} style={styles.shopImage} />
        
        <View style={styles.headerContainer}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= Math.floor(shop.rating) ? "star" : star <= shop.rating ? "star-half-full" : "star-outline"}
                size={18}
                color={theme.colors.accent}
                style={styles.starIcon}
              />
            ))}
            <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{shop.address}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {formatOpeningHours(shop.openingHour, shop.closingHour)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>+60 123 456 789</Text>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About</Text>
          <Text style={styles.descriptionText}>{shop.description}</Text>
        </View>
        
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>Our Services</Text>
          
          {shopServices.map((service) => (
            <Card key={service.id} style={styles.serviceCard}>
              <Card.Content>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.serviceMetaContainer}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.placeholder} />
                      <Text style={styles.serviceMeta}>{service.duration} min</Text>
                    </View>
                  </View>
                  <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
                </View>
                
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
        
        <Button
          mode="contained"
          onPress={handleBookService}
          style={styles.bookButton}
        >
          Book a Service
        </Button>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  headerContainer: {
    marginBottom: 15,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  infoCard: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
  },
  servicesContainer: {
    marginBottom: 20,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  serviceMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMeta: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 5,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  bookButton: {
    marginTop: 10,
  },
});