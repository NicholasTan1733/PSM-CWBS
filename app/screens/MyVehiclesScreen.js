import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { Text, Card, Avatar, FAB } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getUserVehicles } from "../../firebase/firebase";


const vehicleIcons = {
  sedan: "car-hatchback",
  hatchback: "car-hatchback",
  suv: "car-estate",
  mpv: "car-estate",
};

export default function MyVehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const userVehicles = await getUserVehicles();
      setVehicles(userVehicles || []);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    const unsubscribe = navigation.addListener('focus', () => {
      loadVehicles();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const renderVehicleCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate("VehicleDetailsScreen", { vehicleId: item.id })}
    >
      <Card style={styles.vehicleCard}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon 
            size={60} 
            icon={() => (
              <MaterialCommunityIcons 
                name={vehicleIcons[item.type.toLowerCase()] || "car"} 
                size={36} 
                color={theme.colors.primary} 
              />
            )}
            style={styles.vehicleIcon}
            color={theme.colors.primary}
          />
          <View style={styles.vehicleDetails}>
            <Text style={styles.plateNumber}>{item.plateNumber}</Text>
            <Text style={styles.vehicleType}>{item.type}</Text>
            <Text style={styles.vehicleInfo}>{item.color || ''} {item.brand || ''} {item.model || ''}</Text>
          </View>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={theme.colors.placeholder} 
            style={styles.chevron}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="car-off" size={80} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>No vehicles added yet</Text>
      <Text style={styles.emptySubtext}>Add your first vehicle to start booking car wash services</Text>
    </View>
  );

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>My Vehicles</Header>
      
      <FlatList
        style={styles.list}
        data={vehicles}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#ffffff"
        onPress={() => navigation.navigate("AddVehicleScreen")}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 80,
    flexGrow: 1,
  },
  vehicleCard: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  vehicleIcon: {
    backgroundColor: '#f0f4ff',
  },
  vehicleDetails: {
    flex: 1,
    marginLeft: 15,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  vehicleType: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 13,
    color: theme.colors.placeholder,
  },
  chevron: {
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: theme.colors.placeholder,
    paddingHorizontal: 30,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});