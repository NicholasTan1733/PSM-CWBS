import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Surface,
  Chip,
  Button,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
// FIX: Import from firebase instead of mock-data
import { updateBookingStatus, getBookingDetails } from "../../../firebase/firebase";

const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminBookingDetailsScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const details = await getBookingDetails(bookingId);
      setBookingDetails(details);
    } catch (error) {
      console.error("Error loading booking details:", error);
      Alert.alert("Error", "Could not load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    const statusMessages = {
      'confirmed': 'confirm',
      'completed': 'mark as completed',
      'cancelled': 'cancel',
    };

    Alert.alert(
      "Update Status",
      `Are you sure you want to ${statusMessages[newStatus]} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setUpdateLoading(true);
              await updateBookingStatus(bookingId, newStatus);
              setBookingDetails({ ...bookingDetails, status: newStatus });
              Alert.alert("Success", "Booking status updated successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to update booking status");
            } finally {
              setUpdateLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCall = (phone) => {
    Alert.alert(
      "Call Customer",
      `Call ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Booking not found</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Booking Details</Text>
        
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(bookingDetails.status) + '20' }]}
                textStyle={[styles.chipText, { color: getStatusColor(bookingDetails.status) }]}
              >
                {bookingDetails.status.toUpperCase()}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appointment Details</Text>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={adminTheme.primary} />
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {moment(bookingDetails.date).format('MMMM DD, YYYY')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={adminTheme.primary} />
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>{bookingDetails.time}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="store" size={20} color={adminTheme.primary} />
                <Text style={styles.detailLabel}>Shop:</Text>
                <Text style={styles.detailValue}>{bookingDetails.shopName}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              
              <View style={styles.serviceContainer}>
                <Text style={styles.serviceName}>
                  {bookingDetails.service?.name || bookingDetails.service || 'Standard Service'}
                </Text>
                {bookingDetails.services && bookingDetails.services.length > 0 && (
                  <View style={styles.servicesList}>
                    {bookingDetails.services.map((service, index) => (
                      <Chip key={index} style={styles.serviceChip}>
                        {service}
                      </Chip>
                    ))}
                  </View>
                )}
              </View>

              {bookingDetails.addOns && bookingDetails.addOns.length > 0 && (
                <View style={styles.addOnsContainer}>
                  <Text style={styles.addOnsTitle}>Add-ons:</Text>
                  {bookingDetails.addOns.map((addOn, index) => (
                    <Text key={index} style={styles.addOnItem}>
                      • {addOn.name} - RM{addOn.price}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Amount:</Text>
                <Text style={styles.priceValue}>RM{bookingDetails.totalPrice}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.customerInfo}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account" size={20} color={adminTheme.primary} />
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{bookingDetails.customerName}</Text>
                </View>

                {bookingDetails.customerPhone && (
                  <TouchableOpacity 
                    style={styles.detailRow}
                    onPress={() => handleCall(bookingDetails.customerPhone)}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color={adminTheme.primary} />
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={[styles.detailValue, styles.link]}>
                      {bookingDetails.customerPhone}
                    </Text>
                  </TouchableOpacity>
                )}

                {bookingDetails.customerEmail && (
                  <TouchableOpacity 
                    style={styles.detailRow}
                    onPress={() => handleEmail(bookingDetails.customerEmail)}
                  >
                    <MaterialCommunityIcons name="email" size={20} color={adminTheme.primary} />
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={[styles.detailValue, styles.link]}>
                      {bookingDetails.customerEmail}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              
              <View style={styles.vehicleInfo}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="car" size={20} color={adminTheme.primary} />
                  <Text style={styles.detailLabel}>Vehicle:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.vehicleMake} {bookingDetails.vehicleModel}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="numeric" size={20} color={adminTheme.primary} />
                  <Text style={styles.detailLabel}>Plate:</Text>
                  <Text style={styles.detailValue}>{bookingDetails.vehiclePlate}</Text>
                </View>

                {bookingDetails.vehicleColor && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="palette" size={20} color={adminTheme.primary} />
                    <Text style={styles.detailLabel}>Color:</Text>
                    <Text style={styles.detailValue}>{bookingDetails.vehicleColor}</Text>
                  </View>
                )}
              </View>
            </View>

            {bookingDetails.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notes}>{bookingDetails.notes}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          {bookingDetails.status === 'pending' && (
            <>
              <Button
                mode="contained"
                onPress={() => handleStatusUpdate('confirmed')}
                loading={updateLoading}
                style={[styles.button, styles.confirmButton]}
                contentStyle={styles.buttonContent}
              >
                Confirm Booking
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => handleStatusUpdate('cancelled')}
                loading={updateLoading}
                style={[styles.button, styles.cancelButton]}
                contentStyle={styles.buttonContent}
                textColor="#EF4444"
              >
                Cancel Booking
              </Button>
            </>
          )}

          {bookingDetails.status === 'confirmed' && (
            <>
              <Button
                mode="contained"
                onPress={() => handleStatusUpdate('completed')}
                loading={updateLoading}
                style={[styles.button, styles.completeButton]}
                contentStyle={styles.buttonContent}
              >
                Mark as Completed
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => handleStatusUpdate('cancelled')}
                loading={updateLoading}
                style={[styles.button, styles.cancelButton]}
                contentStyle={styles.buttonContent}
                textColor="#EF4444"
              >
                Cancel Booking
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  mainCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    height: 32,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  link: {
    color: adminTheme.primary,
    textDecorationLine: 'underline',
  },
  serviceContainer: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  serviceChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: adminTheme.primaryLight,
  },
  addOnsContainer: {
    marginTop: 12,
  },
  addOnsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  addOnItem: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminTheme.primary,
  },
  customerInfo: {
    marginTop: 8,
  },
  vehicleInfo: {
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButtons: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    borderColor: '#EF4444',
  },
});