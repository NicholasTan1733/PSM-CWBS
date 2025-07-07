import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from "react-native";
import { Text, Card, Title, Avatar, Badge, Searchbar, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import { theme } from "../core/theme";
import { getUserProfile, getUpcomingBookings, getUserBookingHistory } from "../../firebase/firebase";
import { signOut } from "../../firebase/firebase";

export default function HomeScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPendingPayments = async () => {
    try {
      const allBookings = await getUserBookingHistory();
      const pendingPayments = allBookings.filter(booking => 
        booking.status === 'completed' && !booking.isPaid
      );
      
      if (pendingPayments.length > 0) {
        const oldestPending = pendingPayments[0];
        
        navigation.reset({
          index: 0,
          routes: [{
            name: 'PaymentScreen',
            params: {
              bookingId: oldestPending.id,
              totalPrice: oldestPending.totalPrice,
              showWarning: true
            }
          }]
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking pending payments:", error);
      return false;
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const redirectedToPayment = await checkPendingPayments();
      if (redirectedToPayment) {
        return;
      }
      
      const profile = await getUserProfile();
      setUserProfile(profile || { name: "User", vehicles: [] });
      
      const bookings = await getUpcomingBookings();
      setUpcomingBookings(bookings || []);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "StartScreen" }],
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const vehicleCount = userProfile?.vehicles?.length || 0;

  if (loading) {
    return (
      <Background>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={50} 
              label={userProfile?.name?.charAt(0) || "U"} 
              color="#fff"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userProfile?.name || "User"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.bookNowCard}>
          <Card.Content style={styles.bookNowContent}>
            <View style={styles.bookNowTextContainer}>
              <Text style={styles.bookNowTitle}>Ready for a car wash?</Text>
              <Text style={styles.bookNowSubtitle}>Book your appointment now at one of our premium locations</Text>
            </View>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => navigation.navigate("SelectCityScreen")}
            >
              <Text style={styles.bookNowButtonText}>Book Now</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.actionCardsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("MyVehiclesScreen")}
          >
            <View style={styles.vehicleBadge}>
              <MaterialCommunityIcons name="car" size={32} color={theme.colors.primary} />
              {vehicleCount > 0 && (
                <Badge style={styles.badge}>{vehicleCount}</Badge>
              )}
            </View>
            <Text style={styles.actionCardText}>My Vehicles</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("BookingHistoryScreen")}
          >
            <MaterialCommunityIcons name="history" size={32} color={theme.colors.primary} />
            <Text style={styles.actionCardText}>Booking History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <MaterialCommunityIcons name="account" size={32} color={theme.colors.primary} />
            <Text style={styles.actionCardText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Title style={styles.sectionTitle}>Upcoming Bookings</Title>
          
          {upcomingBookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyCardContent}>
                <MaterialCommunityIcons name="calendar-blank" size={40} color={theme.colors.placeholder} />
                <Text style={styles.emptyText}>No upcoming bookings</Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("SelectCityScreen")}
                  style={styles.bookNowButton}
                >
                  Book Now
                </Button>
              </Card.Content>
            </Card>
          ) : (
            upcomingBookings.map((booking, index) => (
              <Card
                key={index}
                style={styles.bookingCard}
                onPress={() => navigation.navigate("BookingConfirmationScreen", { bookingId: booking.id })}
              >
                <Card.Content style={styles.bookingCardContent}>
                  <View style={styles.shopInfo}>
                    <Image 
                      source={booking.shopImage || require("../../assets/items/shop1.png")} 
                      style={styles.shopImage} 
                    />
                    <Text style={styles.shopName}>{booking.shopName || "Car Wash Shop"}</Text>
                  </View>
                  <View style={styles.bookingHeader}>
                    <View>
                      <Text style={styles.bookingDate}>{booking.date} • {booking.time}</Text>
                      <Text style={styles.bookingService}>
                        {typeof booking.service === 'object' ? booking.service?.name || 'Car Wash Service' : booking.service || 'Car Wash Service'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: 
                        booking.status === 'completed' ? theme.colors.success :
                        booking.status === 'confirmed' ? theme.colors.primary :
                        booking.status === 'cancelled' ? theme.colors.error :
                        theme.colors.accent
                    }]}>
                      <Text style={styles.statusText}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingDetails}>
                    <MaterialCommunityIcons name="car" size={18} color={theme.colors.text} />
                    <Text style={styles.bookingVehicle}>{booking.vehiclePlate} ({booking.vehicleType})</Text>
                  </View>

                  <View style={styles.paymentStatus}>
                    <MaterialCommunityIcons 
                      name={booking.isPaid ? "check-circle" : "clock-time-four"} 
                      size={16} 
                      color={booking.isPaid ? theme.colors.success : theme.colors.accent} 
                    />
                    <Text style={[
                      styles.paymentStatusText, 
                      { color: booking.isPaid ? theme.colors.success : theme.colors.accent }
                    ]}>
                      {booking.isPaid ? "Paid" : "Payment Pending"}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeContainer: {
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  logoutButton: {
    padding: 8,
  },
  bookNowCard: {
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: theme.colors.primary,
  },
  bookNowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  bookNowTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  bookNowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  bookNowSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
  },
  bookNowButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minWidth: 100,
  },
  bookNowButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  actionCardText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.text,
  },
  vehicleBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: theme.colors.accent,
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: theme.colors.placeholder,
    marginVertical: 10,
    fontSize: 16,
  },
  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCardContent: {
    padding: 15,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  shopName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingDate: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  bookingService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
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
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingVehicle: {
    marginLeft: 5,
    fontSize: 14,
    color: theme.colors.text,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
});