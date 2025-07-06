import React, { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../../firebase/firebase";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  FAB,
  Portal,
  Surface,
  Button,
  Menu,
  Divider,
  Avatar,
  Badge,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
import { 
  getBookingsForAdmin, 
  getUserData, 
  updateBookingStatus,
  signOut 
} from "../../../firebase/firebase";

// Define Admin theme colors
const adminTheme = {
  primary: '#8e44ad', // Purple
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminDashboardScreen({ navigation }) {
  const [shopData, setShopData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingBookings: 0,
    completedToday: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    loadDashboardData();
    
    // Refresh when navigating back from settings
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const loadDashboardData = async () => {
    try {
      const userData = await getUserData();
      
      // Include settings in shopData
      const shopDataWithSettings = {
        ...userData,
        settings: userData.settings || {}
      };
      setShopData(shopDataWithSettings);
      
      const bookingsData = await getBookingsForAdmin();
      setBookings(bookingsData);
      calculateStats(bookingsData);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const today = moment().startOf('day');
    
    const todayBookings = bookingsData.filter(booking => 
      moment(booking.date).isSame(today, 'day')
    );
    
    const stats = {
      todayBookings: todayBookings.length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      completedToday: todayBookings.filter(b => b.status === 'completed').length,
      todayRevenue: todayBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };
    
    setStats(stats);
  };

  const filterBookings = () => {
    const today = moment().startOf('day');
    let filtered = [...bookings];

    switch (activeTab) {
      case "today":
        filtered = filtered.filter(booking => 
          moment(booking.date).isSame(today, 'day')
        );
        break;
      case "upcoming":
        filtered = filtered.filter(booking => 
          moment(booking.date).isAfter(today) && 
          ['pending', 'confirmed'].includes(booking.status)
        );
        break;
      case "pending":
        filtered = filtered.filter(booking => booking.status === 'pending');
        break;
      default:
        break;
    }

    // Sort by time
    filtered.sort((a, b) => {
      const timeA = moment(`${a.date} ${a.time}`, "YYYY-MM-DD HH:mm");
      const timeB = moment(`${b.date} ${b.time}`, "YYYY-MM-DD HH:mm");
      return timeA - timeB;
    });

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleBookingAction = async (booking, action) => {
    const statusMap = {
      confirm: 'confirmed',
      complete: 'completed',
      cancel: 'cancelled'
    };
    
    const newStatus = statusMap[action];
    
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await updateBookingStatus(booking.id, newStatus);
              await loadDashboardData();
              Alert.alert("Success", `Booking ${action}ed successfully`);
            } catch (error) {
              Alert.alert("Error", `Failed to ${action} booking`);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
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
          <View style={styles.timeContainer}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={adminTheme.primary} />
            <Text style={styles.bookingTime}>{item.time}</Text>
          </View>
          
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={[styles.chipText, { color: getStatusColor(item.status) }]}
            compact
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.customerInfo}>
          <Avatar.Text 
            size={40} 
            label={item.customerName?.charAt(0) || '?'} 
            backgroundColor={adminTheme.primaryLight}
            color={adminTheme.primary}
          />
          
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.vehicleInfo}>
              {item.vehicleMake} {item.vehicleModel} • {item.vehicleNumber}
            </Text>
          </View>
          
          <Text style={styles.bookingAmount}>RM{item.totalAmount}</Text>
        </View>

        <View style={styles.servicesContainer}>
          <MaterialCommunityIcons name="car-wash" size={16} color="#6B7280" />
          <Text style={styles.servicesText} numberOfLines={1}>
            {item.services?.join(', ') || 'No services'}
          </Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleBookingAction(item, 'confirm')}
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              labelStyle={styles.actionButtonText}
              compact
            >
              Confirm
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleBookingAction(item, 'cancel')}
              style={styles.actionButton}
              labelStyle={[styles.actionButtonText, { color: '#EF4444' }]}
              compact
            >
              Decline
            </Button>
          </View>
        )}
      </TouchableOpacity>
    </Surface>
  );

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'StartScreen' }],
            });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.shopInfo}>
            <Surface style={styles.shopAvatar} elevation={1}>
              <MaterialCommunityIcons name="store" size={28} color={adminTheme.primary} />
            </Surface>
            
            <View style={styles.shopDetails}>
              <Text style={styles.shopName}>{shopData?.shopName || 'My Shop'}</Text>
              <Text style={[styles.shopLocation, { color: shopData?.settings?.autoAcceptBookings ? '#10B981' : '#6B7280' }]}>
                {shopData?.settings?.autoAcceptBookings ? '✓ Auto-accept ON' : 'Manual approval'}
              </Text>
            </View>
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color="#000" />
              </TouchableOpacity>
            }
          >
            <Menu.Item 
              onPress={() => navigation.navigate('AdminSettingsScreen')} 
              title="Settings"
              leadingIcon="cog"
            />
            <Menu.Item 
              onPress={onRefresh} 
              title="Refresh"
              leadingIcon="refresh"
            />
            <Divider />
            <Menu.Item 
              onPress={handleSignOut} 
              title="Sign Out"
              leadingIcon="logout"
            />
          </Menu>
        </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsContainer}
        >
          <Surface style={[styles.statCard, { backgroundColor: adminTheme.primaryLight }]} elevation={1}>
            <MaterialCommunityIcons name="calendar-today" size={28} color={adminTheme.primary} />
            <Text style={styles.statNumber}>{stats.todayBookings}</Text>
            <Text style={styles.statLabel}>Today's Bookings</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#FEF3C7' }]} elevation={1}>
            <MaterialCommunityIcons name="clock-alert" size={28} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#D1FAE5' }]} elevation={1}>
            <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#E0E7FF' }]} elevation={1}>
            <MaterialCommunityIcons name="cash" size={28} color="#4F46E5" />
            <Text style={styles.statNumber}>RM{stats.todayRevenue}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </Surface>
        </ScrollView>
      </View>

      {/* Tab Filters */}
      <View style={styles.tabContainer}>
        {[
          { key: 'today', label: 'Today', icon: 'calendar-today' },
          { key: 'upcoming', label: 'Upcoming', icon: 'calendar-clock' },
          { key: 'pending', label: 'Pending', icon: 'clock-alert' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: adminTheme.primary }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? '#fff' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && { color: '#fff' }
            ]}>
              {tab.label}
            </Text>
            {tab.key === 'pending' && stats.pendingBookings > 0 && (
              <Badge style={styles.tabBadge}>{stats.pendingBookings}</Badge>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
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
            <Text style={styles.emptyText}>
              {activeTab === 'today' ? 'No bookings scheduled for today' : `No ${activeTab} bookings`}
            </Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color={adminTheme.primary} />
          <Text style={[styles.navText, { color: adminTheme.primary }]}>Dashboard</Text>
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
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminTheme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    marginLeft: 12,
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  shopLocation: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#6B7280',
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: '#EF4444',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 6,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  vehicleInfo: {
    fontSize: 13,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  bookingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: adminTheme.primary,
  },
  servicesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicesText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
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