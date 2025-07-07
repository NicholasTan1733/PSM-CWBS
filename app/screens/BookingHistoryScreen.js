import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { Text, Card, Chip, Searchbar, Button as PaperButton, Menu, Divider, FAB } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from 'moment';

import Background from "../components/Background";
import Header from "../components/Header";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getUserBookingHistory } from "../../firebase/firebase";

export default function BookingHistoryScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('date_desc');

  const loadBookingHistory = async () => {
    try {
      setLoading(true);
      const history = await getUserBookingHistory();
      setBookings(history || []);
      applyFiltersAndSort(history || [], activeFilter, activeSort, searchQuery);
    } catch (error) {
      console.error("Error loading booking history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookingHistory();
    setRefreshing(false);
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    applyFiltersAndSort(bookings, activeFilter, activeSort, query);
  };

  const applyFiltersAndSort = (data, filter, sort, query) => {
    let result = data;
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(booking => {
        const serviceName = typeof booking.service === 'object' ? booking.service?.name || '' : booking.service || '';
        const vehiclePlate = booking.vehiclePlate || booking.vehicle?.plateNumber || '';
        const vehicleType = booking.vehicleType || booking.vehicle?.type || '';
        
        return (
          serviceName.toLowerCase().includes(lowerQuery) ||
          vehiclePlate.toLowerCase().includes(lowerQuery) ||
          vehicleType.toLowerCase().includes(lowerQuery) ||
          moment(booking.date).format('MMM D, YYYY').toLowerCase().includes(lowerQuery)
        );
      });
    }
    if (filter !== 'all') {
      result = result.filter(booking => booking.status === filter);
    }
    result = [...result].sort((a, b) => {
      const dateA = moment(`${a.date} ${a.time}`, 'YYYY-MM-DD HH:mm');
      const dateB = moment(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm');

      switch (sort) {
        case 'date_asc':
          return dateA.diff(dateB);
        case 'date_desc':
          return dateB.diff(dateA);
        case 'price_asc':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        case 'price_desc':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        default:
          return dateB.diff(dateA);
      }
    });

    setFilteredBookings(result);
  };

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
    setFilterMenuVisible(false);
    applyFiltersAndSort(bookings, filter, activeSort, searchQuery);
  };

  const handleSortSelect = (sort) => {
    setActiveSort(sort);
    setSortMenuVisible(false);
    applyFiltersAndSort(bookings, activeFilter, sort, searchQuery);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('ddd, MMM D, YYYY');
  };

  const formatTime = (timeString) => {
    return moment(timeString, 'HH:mm').format('h:mm A');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'upcoming':
      case 'confirmed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      case 'pending':
        return theme.colors.accent;
      default:
        return theme.colors.placeholder;
    }
  };

  const renderBookingItem = ({ item }) => {
    const vehiclePlate = item.vehiclePlate || item.vehicle?.plateNumber || 'N/A';
    const vehicleType = item.vehicleType || item.vehicle?.type || 'N/A';
    const serviceName = typeof item.service === 'object' ? item.service?.name || 'Car Wash Service' : item.service || 'Car Wash Service';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingConfirmationScreen', { bookingId: item.id })}
      >
        <Card style={styles.bookingCard}>
          <Card.Content>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.bookingDate}>{formatDate(item.date)} • {formatTime(item.time)}</Text>
                <Text style={styles.serviceName}>{serviceName}</Text>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={styles.statusChipText}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.vehicleRow}>
              <MaterialCommunityIcons name="car" size={16} color={theme.colors.primary} />
              <Text style={styles.vehicleText}>{vehiclePlate} ({vehicleType})</Text>
            </View>
            
            {item.addOns && item.addOns.length > 0 && (
              <View style={styles.addOnsRow}>
                <MaterialCommunityIcons name="plus-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.addOnsText}>{item.addOns.map(addon => addon.name).join(', ')}</Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total:</Text>
              <Text style={styles.priceValue}>${item.totalPrice || '0'}</Text>
            </View>
            
            {item.status === 'completed' && !item.feedback && (
              <PaperButton
                mode="outlined"
                onPress={() => navigation.navigate('FeedbackScreen', { bookingId: item.id })}
                style={styles.feedbackButton}
                icon="star"
              >
                Leave Feedback
              </PaperButton>
            )}
            
            {item.status === 'completed' && item.feedback && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Your Rating:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <MaterialCommunityIcons
                      key={star}
                      name={star <= item.feedback.rating ? "star" : "star-outline"}
                      size={16}
                      color={star <= item.feedback.rating ? theme.colors.accent : theme.colors.placeholder}
                      style={styles.starIcon}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {(item.status === 'upcoming' || item.status === 'confirmed' || item.status === 'pending') && (
              <View style={styles.actionsRow}>
                {!item.isPaid && (
                  <PaperButton
                    mode="contained"
                    onPress={() => navigation.navigate('PaymentScreen', { 
                      bookingId: item.id,
                      totalPrice: item.totalPrice,
                      showWarning: item.status === 'completed',
                      isEarlyPayment: item.status !== 'completed'
                    })}
                    style={[styles.actionButton, styles.payButton]}
                    icon="cash"
                  >
                    {item.status === 'completed' ? 'Pay Now' : 'Pay Early'}
                  </PaperButton>
                )}
                
                {!item.isPaid && (
                  <PaperButton
                    mode="outlined"
                    onPress={() => {}}
                    style={[styles.actionButton, styles.cancelButton]}
                    icon="cancel"
                  >
                    Cancel
                  </PaperButton>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-blank" size={80} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>No booking history</Text>
      <Text style={styles.emptySubtext}>Your booking history will appear here</Text>
      <PaperButton
        mode="contained"
        onPress={() => navigation.navigate('SelectCityScreen')}
        style={styles.newBookingButton}
        icon="plus"
      >
        New Booking
      </PaperButton>
    </View>
  );

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Booking History</Header>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search bookings"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filtersContainer}>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setFilterMenuVisible(true)}
              >
                <MaterialCommunityIcons name="filter" size={20} color={theme.colors.primary} />
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item 
              onPress={() => handleFilterSelect('all')} 
              title="All Bookings"
              titleStyle={activeFilter === 'all' && styles.activeFilterText}
              leadingIcon="calendar-all"
            />
            <Menu.Item 
              onPress={() => handleFilterSelect('upcoming')} 
              title="Upcoming"
              titleStyle={activeFilter === 'upcoming' && styles.activeFilterText}
              leadingIcon="calendar-clock"
            />
            <Menu.Item 
              onPress={() => handleFilterSelect('confirmed')} 
              title="Confirmed"
              titleStyle={activeFilter === 'confirmed' && styles.activeFilterText}
              leadingIcon="calendar-check"
            />
            <Menu.Item 
              onPress={() => handleFilterSelect('completed')} 
              title="Completed"
              titleStyle={activeFilter === 'completed' && styles.activeFilterText}
              leadingIcon="calendar-check"
            />
            <Menu.Item 
              onPress={() => handleFilterSelect('cancelled')} 
              title="Cancelled"
              titleStyle={activeFilter === 'cancelled' && styles.activeFilterText}
              leadingIcon="calendar-remove"
            />
            <Menu.Item 
              onPress={() => handleFilterSelect('pending')} 
              title="Pending Payment"
              titleStyle={activeFilter === 'pending' && styles.activeFilterText}
              leadingIcon="calendar-alert"
            />
          </Menu>
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setSortMenuVisible(true)}
              >
                <MaterialCommunityIcons name="sort" size={20} color={theme.colors.primary} />
                <Text style={styles.filterButtonText}>Sort</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item 
              onPress={() => handleSortSelect('date_desc')} 
              title="Newest First"
              titleStyle={activeSort === 'date_desc' && styles.activeFilterText}
              leadingIcon="sort-calendar-descending"
            />
            <Menu.Item 
              onPress={() => handleSortSelect('date_asc')} 
              title="Oldest First"
              titleStyle={activeSort === 'date_asc' && styles.activeFilterText}
              leadingIcon="sort-calendar-ascending"
            />
            <Menu.Item 
              onPress={() => handleSortSelect('price_desc')} 
              title="Price: High to Low"
              titleStyle={activeSort === 'price_desc' && styles.activeFilterText}
              leadingIcon="sort-numeric-descending"
            />
            <Menu.Item 
              onPress={() => handleSortSelect('price_asc')} 
              title="Price: Low to High"
              titleStyle={activeSort === 'price_asc' && styles.activeFilterText}
              leadingIcon="sort-numeric-ascending"
            />
          </Menu>
        </View>
      </View>
      
      <FlatList
        style={styles.bookingsList}
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
        onPress={() => navigation.navigate('SelectCityScreen')}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '100%',
    marginBottom: 10,
  },
  searchBar: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonText: {
    marginLeft: 5,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  bookingsList: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 80,
    flexGrow: 1,
  },
  bookingCard: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingDate: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 3,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  vehicleText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  addOnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  addOnsText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  feedbackButton: {
    marginTop: 10,
    borderColor: theme.colors.accent,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginRight: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
  },
  payButton: {
    marginRight: 5,
    backgroundColor: theme.colors.success,
  },
  cancelButton: {
    marginLeft: 5,
    borderColor: theme.colors.error,
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
    marginBottom: 20,
    color: theme.colors.placeholder,
  },
  newBookingButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});