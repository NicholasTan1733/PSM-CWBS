import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button as PaperButton, Avatar, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getVehicleDetails, deleteVehicle, getVehicleBookingHistory } from "../../firebase/firebase";

// Vehicle type icons mapping
const vehicleIcons = {
  sedan: "car-hatchback",
  hatchback: "car-hatchback",
  suv: "car-estate",
  mpv: "car-estate",
};

export default function VehicleDetailsScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      // Fetch vehicle details - This would be implemented to query Firestore
      const vehicleData = await getVehicleDetails(vehicleId);
      setVehicle(vehicleData);
      
      // Fetch vehicle booking history - This would be implemented to query Firestore
      const history = await getVehicleBookingHistory(vehicleId);
      setBookingHistory(history || []);
    } catch (error) {
      console.error("Error loading vehicle data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Vehicle",
      "Are you sure you want to delete this vehicle? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      // This function would be implemented to delete vehicle from Firestore
      await deleteVehicle(vehicleId);
      setDeleteLoading(false);
      navigation.goBack();
    } catch (error) {
      setDeleteLoading(false);
      console.error("Error deleting vehicle:", error);
      Alert.alert("Error", "Failed to delete vehicle. Please try again.");
    }
  };

  const handleBookNow = () => {
    navigation.navigate("SelectCityScreen", { selectedVehicleId: vehicleId });
  };

  if (loading || !vehicle) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Vehicle Details</Header>
        <View style={styles.loadingContainer}>
          <Text>Loading vehicle details...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Vehicle Details</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.vehicleCard}>
          <Card.Content style={styles.vehicleCardContent}>
            <Avatar.Icon 
              size={80} 
              icon={() => (
                <MaterialCommunityIcons 
                  name={vehicleIcons[vehicle.type?.toLowerCase()] || "car"} 
                  size={48} 
                  color={theme.colors.primary} 
                />
              )}
              style={styles.vehicleIcon}
              color={theme.colors.primary}
            />
            
            <View style={styles.vehicleMainDetails}>
              <Text style={styles.plateNumber}>{vehicle.plateNumber || 'N/A'}</Text>
              <Text style={styles.vehicleType}>{vehicle.type || 'Unknown'}</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.detailsSectionTitle}>Vehicle Information</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{vehicle.brand || 'Not specified'}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{vehicle.model || 'Not specified'}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{vehicle.color || 'Not specified'}</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text style={styles.detailsSectionTitle}>Booking History</Text>
            
            {bookingHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <MaterialCommunityIcons name="calendar-remove" size={40} color={theme.colors.placeholder} />
                <Text style={styles.emptyHistoryText}>No booking history</Text>
              </View>
            ) : (
              bookingHistory.map((booking, index) => (
                <View key={index}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyDate}>{booking.date} • {booking.time}</Text>
                      <Text style={styles.historyService}>
                        {typeof booking.service === 'object' 
                          ? booking.service?.name || 'Car Wash Service' 
                          : booking.service || 'Car Wash Service'
                        }
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: booking.status === 'Completed' || booking.status === 'completed' 
                          ? theme.colors.success 
                          : theme.colors.accent }
                    ]}>
                      <Text style={styles.statusText}>
                        {booking.status === 'Completed' || booking.status === 'completed' 
                          ? 'Completed' 
                          : booking.status || 'Pending'
                        }
                      </Text>
                    </View>
                  </View>
                  {index < bookingHistory.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleBookNow}
            style={styles.bookButton}
          >
            Book a Wash
          </Button>
          
          <PaperButton
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            loading={deleteLoading}
            disabled={deleteLoading}
            icon="delete"
            color={theme.colors.error}
          >
            Delete Vehicle
          </PaperButton>
        </View>
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
  vehicleCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
  },
  vehicleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  vehicleIcon: {
    backgroundColor: '#f0f4ff',
  },
  vehicleMainDetails: {
    marginLeft: 20,
  },
  plateNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  vehicleType: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 5,
  },
  detailsCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 1,
  },
  historyCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 1,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: theme.colors.placeholder,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHistoryText: {
    marginTop: 10,
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    color: theme.colors.placeholder,
  },
  historyService: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 10,
  },
  bookButton: {
    marginBottom: 10,
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
});