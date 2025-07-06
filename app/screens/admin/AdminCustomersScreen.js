import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Avatar,
  Surface,
  ActivityIndicator,
  Menu,
  Divider,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
import { getAdminCustomers } from "../../../firebase/firebase";

// Admin theme colors
const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminCustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    averageSpend: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchQuery, sortBy]);

  const loadCustomers = async () => {
    try {
      const customersData = await getAdminCustomers();
      setCustomers(customersData);
      calculateStats(customersData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading customers:", error);
      setLoading(false);
    }
  };

  const calculateStats = (customersData) => {
    const totalRevenue = customersData.reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0);
    const activeCustomers = customersData.filter(c => c.status === 'active').length;
    
    setStats({
      totalCustomers: customersData.length,
      activeCustomers,
      totalRevenue: totalRevenue,
      averageSpend: customersData.length > 0 ? totalRevenue / customersData.length : 0,
    });
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => 
          moment(b.lastBookingDate).valueOf() - moment(a.lastBookingDate).valueOf()
        );
        break;
      case "name":
        filtered.sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case "spending":
        filtered.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "bookings":
        filtered.sort((a, b) => b.totalBookings - a.totalBookings);
        break;
    }

    setFilteredCustomers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const handleCustomerPress = (customer) => {
    navigation.navigate('AdminCustomerDetailsScreen', { customerId: customer.id });
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

  const getCustomerStatus = (customer) => {
    // Determine customer status based on activity
    const daysSinceLastBooking = moment().diff(moment(customer.lastBookingDate), 'days');
    
    if (customer.totalBookings >= 10) return 'vip';
    if (daysSinceLastBooking <= 30) return 'active';
    if (daysSinceLastBooking <= 90) return 'regular';
    return 'inactive';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'vip': return '#FFD700';
      case 'active': return '#10B981';
      case 'regular': return '#3B82F6';
      case 'inactive': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderCustomerItem = ({ item }) => {
    const status = getCustomerStatus(item);
    
    return (
      <Surface style={styles.customerCard} elevation={1}>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => handleCustomerPress(item)}
        >
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Avatar.Text 
                size={48} 
                label={item.name?.charAt(0) || '?'} 
                backgroundColor={adminTheme.primaryLight}
                color={adminTheme.primary}
              />
              
              <View style={styles.customerDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.customerName}>{item.name || 'Unknown'}</Text>
                  {status === 'vip' && (
                    <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                  )}
                </View>
                <Text style={styles.customerEmail}>{item.email || 'No email'}</Text>
                <Text style={styles.customerPhone}>{item.phone || 'No phone'}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <IconButton
                icon="phone"
                size={20}
                onPress={() => handleCall(item.phone)}
                style={styles.actionButton}
                iconColor={adminTheme.primary}
              >
                Call
              </IconButton>
              <IconButton
                icon="email"
                size={20}
                onPress={() => handleEmail(item.email)}
                style={styles.actionButton}
                iconColor={adminTheme.primary}
              >
                Email
              </IconButton>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.customerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>RM{(parseFloat(item.totalSpent) || 0).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {item.averageRating ? item.averageRating.toFixed(1) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            
            <View style={styles.statItem}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(status) + '20' }]}
                textStyle={[styles.statusChipText, { color: getStatusColor(status) }]}
                compact
              >
                {status.toUpperCase()}
              </Chip>
            </View>
          </View>

          <View style={styles.lastVisit}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B7280" />
            <Text style={styles.lastVisitText}>
              Last visit: {moment(item.lastBookingDate).format('MMM D, YYYY')}
            </Text>
          </View>
        </TouchableOpacity>
      </Surface>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
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
        
        <Text style={styles.headerTitle}>Customers</Text>
        
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setSortMenuVisible(true)}>
              <MaterialCommunityIcons name="sort" size={24} color={adminTheme.primary} />
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => { setSortBy('recent'); setSortMenuVisible(false); }} 
            title="Recent Activity"
            leadingIcon={sortBy === 'recent' ? 'check' : null}
          />
          <Menu.Item 
            onPress={() => { setSortBy('name'); setSortMenuVisible(false); }} 
            title="Name (A-Z)"
            leadingIcon={sortBy === 'name' ? 'check' : null}
          />
          <Menu.Item 
            onPress={() => { setSortBy('spending'); setSortMenuVisible(false); }} 
            title="Highest Spending"
            leadingIcon={sortBy === 'spending' ? 'check' : null}
          />
          <Menu.Item 
            onPress={() => { setSortBy('bookings'); setSortMenuVisible(false); }} 
            title="Most Bookings"
            leadingIcon={sortBy === 'bookings' ? 'check' : null}
          />
        </Menu>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Surface style={[styles.statCard, { backgroundColor: adminTheme.primaryLight }]} elevation={1}>
          <MaterialCommunityIcons name="account-group" size={24} color={adminTheme.primary} />
          <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#D1FAE5' }]} elevation={1}>
          <MaterialCommunityIcons name="account-check" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.activeCustomers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#E0E7FF' }]} elevation={1}>
          <MaterialCommunityIcons name="cash" size={24} color="#4F46E5" />
          <Text style={styles.statNumber}>RM{isNaN(stats.totalRevenue) ? 0 : Math.round(stats.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#FEF3C7' }]} elevation={1}>
          <MaterialCommunityIcons name="wallet" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>RM{isNaN(stats.averageSpend) ? 0 : Math.round(stats.averageSpend)}</Text>
          <Text style={styles.statLabel}>Avg. Spend</Text>
        </Surface>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={adminTheme.primary}
        />
      </View>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
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
              name="account-search" 
              size={64} 
              color={theme.colors.placeholder} 
            />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Your customers will appear here'}
            </Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
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
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminBookingHistoryScreen')}
        >
          <MaterialCommunityIcons name="history" size={24} color="#6B7280" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialCommunityIcons name="account-group" size={24} color={adminTheme.primary} />
          <Text style={[styles.navText, { color: adminTheme.primary }]}>Customers</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: '#fff',
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  customerEmail: {
    fontSize: 13,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  divider: {
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusChip: {
    height: 24,
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lastVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastVisitText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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