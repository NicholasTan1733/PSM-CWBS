import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Surface,
  Avatar,
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
import { getAdminCustomerDetails } from "../../../firebase/firebase";

const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminCustomerDetailsScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      const data = await getAdminCustomerDetails(customerId);
      setCustomerData(data);
    } catch (error) {
      console.error("Error loading customer details:", error);
      Alert.alert("Error", "Failed to load customer details");
    } finally {
      setLoading(false);
    }
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

  const renderBookingItem = ({ item }) => (
    <Surface style={styles.bookingCard} elevation={1}>
      <TouchableOpacity 
        style={styles.bookingContent}
        onPress={() => navigation.navigate('AdminBookingDetailsScreen', { bookingId: item.id })}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingDate}>
            {moment(item.date).format('MMM D, YYYY')} at {item.time}
          </Text>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={[styles.chipText, { color: getStatusColor(item.status) }]}
            compact
          >
            {item.status?.toUpperCase()}
          </Chip>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.vehicleMake} {item.vehicleModel} • {item.vehicleNumber}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car-wash" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.services}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <Text style={styles.amountText}>RM{item.totalAmount}</Text>
          {item.feedback && (
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.feedback.rating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Surface>
  );

  const renderVehicleItem = ({ item }) => (
    <Surface style={styles.vehicleCard} elevation={1}>
      <View style={styles.vehicleContent}>
        <MaterialCommunityIcons name="car" size={32} color={adminTheme.primary} />
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {item.make} {item.model} {item.year}
          </Text>
          <Text style={styles.vehiclePlate}>{item.plateNumber}</Text>
          <Text style={styles.vehicleType}>{item.type}</Text>
        </View>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading customer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!customerData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="account-alert" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { customer, bookings, vehicles, stats } = customerData;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Customer Details</Text>
        
        <View style={{ width: 24 }} />
      </View>

      <Surface style={styles.profileCard} elevation={2}>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={64} 
            label={customer.name?.charAt(0) || '?'} 
            backgroundColor={adminTheme.primary}
            color="#fff"
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            <Text style={styles.customerPhone}>{customer.phone || 'No phone'}</Text>
            <Text style={styles.memberSince}>
              Member since {moment(customer.joinDate || customer.createdAt).format('MMM YYYY')}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <IconButton
            icon="phone"
            mode="contained"
            iconColor="#fff"
            containerColor={adminTheme.primary}
            size={20}
            onPress={() => handleCall(customer.phone)}
          >
            Call
          </IconButton>
          <IconButton
            icon="email"
            mode="contained"
            iconColor="#fff"
            containerColor={adminTheme.primary}
            size={20}
            onPress={() => handleEmail(customer.email)}
          >
            Email
          </IconButton>  
        </View>
      </Surface>

      <View style={styles.statsGrid}>
        <Surface style={styles.statCard} elevation={1}>
          <MaterialCommunityIcons name="book-multiple" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats?.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </Surface>
        
        <Surface style={styles.statCard} elevation={1}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats?.completedBookings || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Surface>
        
        <Surface style={styles.statCard} elevation={1}>
          <MaterialCommunityIcons name="cash" size={24} color={adminTheme.primary} />
          <Text style={styles.statNumber}>RM{stats?.totalSpent}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </Surface>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>
            Bookings ({bookings?.length || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
            Vehicles ({vehicles?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <Divider style={styles.divider} />
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account" size={20} color={adminTheme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{customer.name}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={20} color={adminTheme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{customer.email}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color={adminTheme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{customer.phone || 'Not provided'}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={adminTheme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {moment(customer.joinDate || customer.createdAt).format('MMMM D, YYYY')}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Divider style={styles.divider} />
              
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Last Booking</Text>
                <Text style={styles.activityValue}>
                  {bookings && bookings.length > 0 
                    ? moment(bookings[0].date).format('MMM D, YYYY')
                    : 'No bookings yet'}
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Average Rating Given</Text>
                <Text style={styles.activityValue}>
                  {customer.averageRating ? `${customer.averageRating.toFixed(1)} ★` : 'N/A'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      {activeTab === 'bookings' && (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color={theme.colors.placeholder} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          }
        />
      )}

      {activeTab === 'vehicles' && (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car" size={64} color={theme.colors.placeholder} />
              <Text style={styles.emptyText}>No vehicles registered</Text>
            </View>
          }
        />
      )}
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
  profileCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  customerEmail: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: adminTheme.primary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: adminTheme.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: adminTheme.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
  },
  infoCard: {
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
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: adminTheme.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleInfo: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginTop: 16,
  },
});