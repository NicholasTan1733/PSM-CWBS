import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, Card, Avatar, RadioButton, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getUserVehicles } from "../../firebase/firebase";
import { shops, services, addOns } from "../data/city-data";

const vehicleIcons = {
  sedan: "car-hatchback",
  hatchback: "car-hatchback",
  suv: "car-estate",
  mpv: "car-estate",
};

export default function BookingScreen({ route, navigation }) {
  const { shopId, shopName } = route.params;
  const selectedVehicleId = route.params?.selectedVehicleId;
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [shopServices, setShopServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const shop = shops.find(s => s.id === shopId);
      setShopDetails(shop);
      
      if (shop && services[shop.id]) {
        const servicesData = services[shop.id];
        setShopServices(servicesData);
        
        if (servicesData.length > 0 && servicesData[0]) {
          setSelectedService(servicesData[0].id);
        }
      }

      const userVehicles = await getUserVehicles();
      
      if (!userVehicles || userVehicles.length === 0) {
        Alert.alert(
          "No Vehicles Found",
          "Please add a vehicle before booking a service.",
          [{ text: "OK", onPress: () => navigation.navigate("AddVehicleScreen") }]
        );
        return;
      }
      
      setVehicles(userVehicles);
      
      if (selectedVehicleId) {
        const vehicle = userVehicles.find(v => v.id === selectedVehicleId);
        if (vehicle) {
          setSelectedVehicle(vehicle);
        } else {
          setSelectedVehicle(userVehicles.length > 0 ? userVehicles[0] : null);
        }
      } else {
        setSelectedVehicle(userVehicles.length > 0 ? userVehicles[0] : null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId, selectedVehicleId]);

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
  };

  const handleAddOnToggle = (addOnId) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        return prev.filter(id => id !== addOnId);
      } else {
        return [...prev, addOnId];
      }
    });
  };

  const calculateTotal = () => {
    const service = shopServices.find(s => s.id === selectedService);
    let total = service ? service.price : 0;
    
    selectedAddOns.forEach(addOnId => {
      const addOn = addOns.find(a => a.id === addOnId);
      if (addOn) total += addOn.price;
    });
    
    return total.toFixed(2);
  };

  const handleContinue = () => {
    if (!selectedVehicle) {
      Alert.alert("Error", "Please select a vehicle");
      return;
    }

    if (!selectedService) {
      Alert.alert("Error", "Please select a service");
      return;
    }

    const serviceDetails = shopServices.find(s => s.id === selectedService) || shopServices[0];
    const selectedAddOnsDetails = addOns.filter(addon => selectedAddOns.includes(addon.id));
    const totalPrice = calculateTotal();

    navigation.navigate("BookingTimeScreen", {
      shopId,
      shopName: shopDetails?.name,
      vehicle: selectedVehicle,
      service: serviceDetails,
      addOns: selectedAddOnsDetails,
      totalPrice: totalPrice
    });
  };

  if (loading) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Book a Service</Header>
        <View style={styles.loadingContainer}>
          <Text>Loading booking options...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Book a Service</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {shopDetails && (
          <Card style={styles.shopInfoCard}>
            <Card.Content style={styles.shopInfoContent}>
              <Text style={styles.shopName}>{shopDetails.name}</Text>
              <Text style={styles.shopAddress}>{shopDetails.address}</Text>
            </Card.Content>
          </Card>
        )}
        
        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleScroll}
          contentContainerStyle={styles.vehicleScrollContent}
        >
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              onPress={() => handleVehicleSelect(vehicle)}
              style={[
                styles.vehicleCard,
                selectedVehicle?.id === vehicle.id && styles.selectedVehicleCard
              ]}
            >
              <Avatar.Icon 
                size={40} 
                icon={() => (
                  <MaterialCommunityIcons 
                    name={vehicleIcons[vehicle.type.toLowerCase()] || "car"} 
                    size={24} 
                    color={selectedVehicle?.id === vehicle.id ? theme.colors.primary : theme.colors.text} 
                  />
                )}
                style={[
                  styles.vehicleIcon,
                  selectedVehicle?.id === vehicle.id && styles.selectedVehicleIcon
                ]}
                color={selectedVehicle?.id === vehicle.id ? theme.colors.primary : theme.colors.text}
              />
              <Text style={[
                styles.vehiclePlate,
                selectedVehicle?.id === vehicle.id && styles.selectedVehicleText
              ]}>
                {vehicle.plateNumber}
              </Text>
              <Text style={[
                styles.vehicleType,
                selectedVehicle?.id === vehicle.id && styles.selectedVehicleText
              ]}>
                {vehicle.type}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.addVehicleCard}
            onPress={() => navigation.navigate("AddVehicleScreen")}
          >
            <MaterialCommunityIcons name="plus" size={30} color={theme.colors.primary} />
            <Text style={styles.addVehicleText}>Add Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Service</Text>
        
        {shopServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService === service.id && styles.selectedServiceCard
            ]}
            onPress={() => handleServiceSelect(service.id)}
          >
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceMetaContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.placeholder} />
                  <Text style={styles.serviceMeta}>{service.duration} min</Text>
                </View>
              </View>
              <View style={styles.servicePriceContainer}>
                <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
                <RadioButton
                  value={service.id}
                  status={selectedService === service.id ? 'checked' : 'unchecked'}
                  onPress={() => handleServiceSelect(service.id)}
                  color={theme.colors.primary}
                />
              </View>
            </View>
            
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Add-ons (Optional)</Text>
        
        <View style={styles.addOnsContainer}>
          {addOns.map((addOn) => (
            <Chip
              key={addOn.id}
              style={[
                styles.addOnChip,
                selectedAddOns.includes(addOn.id) && styles.selectedAddOnChip
              ]}
              textStyle={[
                styles.addOnChipText,
                selectedAddOns.includes(addOn.id) && styles.selectedAddOnChipText
              ]}
              icon={addOn.icon}
              selected={selectedAddOns.includes(addOn.id)}
              onPress={() => handleAddOnToggle(addOn.id)}
            >
              {addOn.name} (+${addOn.price.toFixed(2)})
            </Chip>
          ))}
        </View>
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>${calculateTotal()}</Text>
        </View>
        
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
        >
          Continue to Book Time
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
  shopInfoCard: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: theme.colors.primary,
  },
  shopInfoContent: {
    padding: 15,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  shopAddress: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: theme.colors.text,
  },
  vehicleScroll: {
    marginBottom: 20,
  },
  vehicleScrollContent: {
    paddingRight: 20,
  },
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedVehicleCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f4ff',
  },
  vehicleIcon: {
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  selectedVehicleIcon: {
    backgroundColor: '#e6ecff',
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  selectedVehicleText: {
    color: theme.colors.primary,
  },
  addVehicleCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addVehicleText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 5,
    fontWeight: '500',
  },
  serviceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedServiceCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f4ff',
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
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  addOnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  addOnChip: {
    margin: 4,
    backgroundColor: '#f5f5f5',
  },
  selectedAddOnChip: {
    backgroundColor: '#e6ecff',
  },
  addOnChipText: {
    color: theme.colors.text,
  },
  selectedAddOnChipText: {
    color: theme.colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  continueButton: {
    marginTop: 10,
  },
});