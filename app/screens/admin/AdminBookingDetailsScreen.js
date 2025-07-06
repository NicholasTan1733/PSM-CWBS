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
import { getBookingDetails, updateBookingStatus } from "../../../firebase/firebase";

// Admin theme colors
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Booking Details</Text>
        
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Status Card */}
        <Surface style={styles.statusCard} elevation={2}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.bookingId}>Booking #{bookingId.slice(-8)}</Text>
              <Text style={styles.bookingDate}>
                {moment(bookingDetails.date).format('MMMM D, YYYY')} at {bookingDetails.time}
              </Text>
            </View>
            
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(bookingDetails.status) + '20' }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(bookingDetails.status) }]}
            >
              {bookingDetails.status?.toUpperCase()}
            </Chip>
          </View>

          {bookingDetails.status === 'pending' && (
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => handleStatusUpdate('confirmed')}
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                loading={updateLoading}
                disabled={updateLoading}
              >
                Confirm Booking
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => handleStatusUpdate('cancelled')}
                style={styles.actionButton}
                textColor="#EF4444"
                loading={updateLoading}
                disabled={updateLoading}
              >
                Cancel
              </Button>
            </View>
          )}

          {bookingDetails.status === 'confirmed' && (
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate('completed')}
              style={[styles.fullWidthButton, { backgroundColor: adminTheme.primary }]}
              loading={updateLoading}
              disabled={updateLoading}
            >
              Mark as Completed
            </Button>
          )}
        </Surface>

        {/* Customer Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={20} color={adminTheme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{bookingDetails.customerName}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email" size={20} color={adminTheme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{bookingDetails.customerEmail || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color={adminTheme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{bookingDetails.customerPhone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.contactButtons}>
              <Button
                mode="contained-tonal"
                onPress={() => handleCall(bookingDetails.customerPhone)}
                icon="phone"
                style={styles.contactButton}
                buttonColor={adminTheme.primaryLight}
                textColor={adminTheme.primary}
              >
                Call
              </Button>
              
              <Button
                mode="contained-tonal"
                onPress={() => handleEmail(bookingDetails.customerEmail)}
                icon="email"
                style={styles.contactButton}
                buttonColor={adminTheme.primaryLight}
                textColor={adminTheme.primary}
              >
                Email
              </Button>
            </View>

            <TouchableOpacity 
              style={styles.viewCustomerLink}
              onPress={() => navigation.navigate('AdminCustomerDetailsScreen', { 
                customerId: bookingDetails.userId || bookingDetails.customerId 
              })}
            >
              <Text style={styles.linkText}>View Customer Profile</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={adminTheme.primary} />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.vehicleInfo}>
              <MaterialCommunityIcons name="car" size={48} color={adminTheme.primary} />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>
                  {bookingDetails.vehicleMake} {bookingDetails.vehicleModel}
                </Text>
                <Text style={styles.vehiclePlate}>{bookingDetails.vehicleNumber}</Text>
                <Text style={styles.vehicleType}>{bookingDetails.vehicleType || 'Standard'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Service Details */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.servicesList}>
              {bookingDetails.services?.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <MaterialCommunityIcons name="car-wash" size={20} color={adminTheme.primary} />
                  <Text style={styles.serviceName}>{service}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Amount</Text>
              <Text style={styles.priceValue}>RM{bookingDetails.totalPrice}</Text>
            </View>
            
            {bookingDetails.isPaid && (
              <Chip 
                style={styles.paidChip}
                textStyle={styles.paidChipText}
                icon="check-circle"
              >
                Payment Received
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* Additional Notes */}
        {bookingDetails.notes && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Divider style={styles.divider} />
              <Text style={styles.notesText}>{bookingDetails.notes}</Text>
            </Card.Content>
          </Card>
        )}
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
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
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
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingId: {
    fontSize: 14,
    color: adminTheme.primary,
    fontWeight: '600',
  },
  bookingDate: {
    fontSize: 16,
    color: '#000',
    marginTop: 4,
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  fullWidthButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  divider: {
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  infoValue: {
    fontSize: 15,
    color: '#000',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    borderRadius: 8,
  },
  viewCustomerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: adminTheme.primary,
    fontWeight: '500',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  vehiclePlate: {
    fontSize: 14,
    color: adminTheme.primary,
    marginTop: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  servicesList: {
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: {
    fontSize: 16,
    color: '#000',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminTheme.primary,
  },
  paidChip: {
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    alignSelf: 'center',
  },
  paidChipText: {
    color: '#10B981',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});