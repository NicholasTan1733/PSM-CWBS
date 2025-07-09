import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Surface,
  SegmentedButtons,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,
  Button,
  DataTable,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
import { getAdminBookingHistory } from "../../../firebase/firebase";

const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminBookingHistoryScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadBookingHistory();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  const loadBookingHistory = async () => {
    try {
      const bookingsData = await getAdminBookingHistory();
      setBookings(bookingsData);
      calculateStats(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading booking history:", error);
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const stats = {
      total: bookingsData.length,
      completed: bookingsData.filter(b => b.status === 'completed').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
      revenue: bookingsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };
    setStats(stats);
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    const now = moment();
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(booking => 
          moment(booking.date).isSame(now, 'day')
        );
        break;
      case "week":
        filtered = filtered.filter(booking => 
          moment(booking.date).isAfter(moment().subtract(7, 'days'))
        );
        break;
      case "month":
        filtered = filtered.filter(booking => 
          moment(booking.date).isAfter(moment().subtract(30, 'days'))
        );
        break;
    }

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookingHistory();
    setRefreshing(false);
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
        style={styles.cardContent}
        onPress={() => navigation.navigate('AdminBookingDetailsScreen', { bookingId: item.id })}
      >
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.bookingId}>#{item.id?.slice(-8) || 'N/A'}</Text>
            <Text style={styles.bookingDate}>
              {moment(item.date).format('MMM D, YYYY')} at {item.time}
            </Text>
          </View>
          
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
            <MaterialCommunityIcons name="account" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.customerName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.vehicleMake} {item.vehicleModel} • {item.vehicleNumber}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="car-wash" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.services?.join(', ') || 'No services'}
            </Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.amountText}>RM{item.totalAmount || 0}</Text>
          {item.isPaid && (
            <Chip 
              style={styles.paidChip}
              textStyle={styles.paidChipText}
              compact
              icon="check"
            >
              Paid
            </Chip>
          )}
        </View>
      </TouchableOpacity>
    </Surface>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading booking history...</Text>
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
        
        <Text style={styles.headerTitle}>Booking History</Text>
        
        <View style={{ width: 24 }} />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.statsContainer}
      >
        <Surface style={[styles.statCard, { backgroundColor: '#E0E7FF' }]} elevation={1}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#D1FAE5' }]} elevation={1}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#FEE2E2' }]} elevation={1}>
          <Text style={styles.statNumber}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: adminTheme.primaryLight }]} elevation={1}>
          <Text style={styles.statNumber}>RM{stats.revenue}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </Surface>
      </ScrollView>
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search by name, vehicle, or ID..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={adminTheme.primary}
        />
        
        <View style={styles.filterButtons}>
          <SegmentedButtons
            value={statusFilter}
            onValueChange={setStatusFilter}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            style={styles.segmentedButtons}
            theme={{ colors: { primary: adminTheme.primary } }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilters}>
          {['all', 'today', 'week', 'month'].map((filter) => (
            <Chip
              key={filter}
              selected={dateFilter === filter}
              onPress={() => setDateFilter(filter)}
              style={[
                styles.dateChip,
                dateFilter === filter && { backgroundColor: adminTheme.primary }
              ]}
              textStyle={[
                styles.dateChipText,
                dateFilter === filter && { color: '#fff' }
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[adminTheme.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="calendar-blank" 
              size={64} 
              color={theme.colors.placeholder} 
            />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your booking history will appear here'}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminDashboardScreen')}
        >
          <MaterialCommunityIcons name="view-dashboard" size={24} color="#6B7280" />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('ShopOwnerSalesDashboard')}
        >
          <MaterialCommunityIcons name="chart-line" size={24} color="#6B7280" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialCommunityIcons name="history" size={24} color={adminTheme.primary} />
          <Text style={[styles.navText, { color: adminTheme.primary }]}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminCustomersScreen')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#6B7280" />
          <Text style={styles.navText}>Customers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminSettingsScreen')}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#6B7280" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
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
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  statCard: {
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
  },
  filterButtons: {
    marginBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: '#F3F4F6',
  },
  dateFilters: {
    flexDirection: 'row',
  },
  dateChip: {
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  dateChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: adminTheme.primary,
  },
  bookingDate: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
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
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: adminTheme.primary,
  },
  paidChip: {
    backgroundColor: '#D1FAE5',
    height: 24,
  },
  paidChipText: {
    fontSize: 11,
    color: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.placeholder,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 8,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: adminTheme.primary,
    marginTop: -1,
  },
  navText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});