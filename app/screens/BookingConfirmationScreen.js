import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, ActivityIndicator, Divider, Button as PaperButton, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { 
  getBookingDetails, 
  createBooking, 
  cancelBooking,
  cancelBookingWithRefund,
  checkSlotAvailability
} from "../../firebase/firebase";
import { formatPrice } from "../helpers/priceFormatter";

export default function BookingConfirmationScreen({ navigation, route }) {
  const { bookingDetails: newBookingDetails, bookingId } = route.params;
  
  const [bookingDetails, setBookingDetails] = useState(newBookingDetails || null);
  const [loading, setLoading] = useState(!!bookingId);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [timeUntilAppointment, setTimeUntilAppointment] = useState(null);
  
  // Load booking details if bookingId is provided
  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);
  
  // Update countdown timer
  useEffect(() => {
    if (!bookingDetails || !bookingId || confirmSuccess) return;
    
    const updateCountdown = () => {
      const now = moment();
      const appointmentTime = moment(`${bookingDetails.date} ${bookingDetails.time}`, 'YYYY-MM-DD HH:mm');
      const duration = moment.duration(appointmentTime.diff(now));
      
      if (duration.asMilliseconds() <= 0) {
        setCountdown("Appointment time has passed");
        setTimeUntilAppointment(0);
      } else {
        const days = Math.floor(duration.asDays());
        const hours = duration.hours();
        const minutes = duration.minutes();
        
        let countdownText = "";
        if (days > 0) {
          countdownText = `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
          countdownText = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
          countdownText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        setCountdown(countdownText);
        setTimeUntilAppointment(duration.asHours());
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [bookingDetails, bookingId, confirmSuccess]);
  
  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const details = await getBookingDetails(bookingId);
      setBookingDetails(details);
    } catch (error) {
      console.error("Error loading booking details:", error);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmBooking = async () => {
    try {
      setConfirmLoading(true);
      
      // Check if time slot is still available
      const isAvailable = await checkSlotAvailability(
        bookingDetails.shopId,
        bookingDetails.date,
        bookingDetails.time,
        bookingDetails.service.duration
      );
      
      if (!isAvailable) {
        Alert.alert(
          "Time Slot Unavailable",
          "This time slot has been booked by another customer. Please select another time.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // Create booking
      const newBookingId = await createBooking(bookingDetails);
      
      setConfirmSuccess(true);
      
      // Navigate to payment with booking ID
      setTimeout(() => {
        navigation.navigate('PaymentScreen', {
          bookingId: newBookingId,
          totalPrice: bookingDetails.totalPrice,
          isEarlyPayment: true // This is early payment since booking just created
        });
      }, 2000);
    } catch (error) {
      console.error("Error confirming booking:", error);
      Alert.alert("Error", "Failed to confirm booking. Please try again.");
      setConfirmLoading(false);
    }
  };
  
  const handleCancelBooking = async () => {
    if (!bookingId) return;
    
    // Check if cancellation is allowed (2+ hours before appointment)
    if (timeUntilAppointment < 2) {
      Alert.alert(
        "Cannot Cancel",
        "Bookings cannot be cancelled less than 2 hours before the appointment time.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check if payment was made
    const hasPayment = bookingDetails.isPaid;

    Alert.alert(
      "Cancel Booking",
      hasPayment 
        ? "Are you sure you want to cancel this booking? Your payment will be refunded within 3-5 business days."
        : "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: confirmCancelBooking 
        }
      ]
    );
  };

  const confirmCancelBooking = async () => {
    try {
      setCancelLoading(true);
      const result = await cancelBookingWithRefund(bookingId);
      
      Alert.alert(
        "Booking Cancelled",
        result.refundProcessing 
          ? "Your booking has been cancelled and refund is being processed. You will receive your money back within 3-5 business days."
          : "Your booking has been successfully cancelled.",
        [{ 
          text: "OK", 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'HomeScreen' }]
          })
        }]
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", error.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const getPaymentStatusInfo = () => {
    if (!bookingDetails.isPaid) {
      return {
        icon: 'clock-outline',
        color: theme.colors.placeholder,
        text: 'Payment Pending',
        description: 'Please complete payment to secure your booking.'
      };
    }
    
    return {
      icon: 'check-circle',
      color: theme.colors.success,
      text: 'Payment Complete',
      description: 'Your payment has been processed successfully.'
    };
  };

  const getCancellationInfo = () => {
    if (!timeUntilAppointment) return null;
    
    if (timeUntilAppointment < 2) {
      return {
        canCancel: false,
        message: "⚠️ Cancellation not available (less than 2 hours to appointment)",
        color: theme.colors.error
      };
    } else {
      return {
        canCancel: true,
        message: `✅ Full refund available until 2 hours before appointment`,
        color: theme.colors.success,
        timeLeft: `${Math.floor(timeUntilAppointment - 2)} hours left for free cancellation`
      };
    }
  };
  
  const formatBookingTime = (time) => {
    return moment(time, 'HH:mm').format('h:mm A');
  };
  
  const formatBookingDate = (date) => {
    return moment(date).format('ddd, MMM D, YYYY');
  };

  if (loading) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Booking Details</Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </Background>
    );
  }
  
  if (!bookingDetails) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Booking Details</Header>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load booking details</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>Go Back</Button>
        </View>
      </Background>
    );
  }
  
  const paymentInfo = getPaymentStatusInfo();
  const cancellationInfo = getCancellationInfo();
  
  return (
    <Background>
      {bookingId ? (
        <BackButton goBack={() => navigation.navigate('HomeScreen')} />
      ) : (
        <BackButton goBack={navigation.goBack} />
      )}
      
      <Header>{bookingId ? 'Booking Details' : 'Confirm Booking'}</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Message for New Bookings */}
        {confirmSuccess && (
          <Card style={styles.successCard}>
            <Card.Content style={styles.successContent}>
              <MaterialCommunityIcons name="check-circle" size={40} color={theme.colors.success} />
              <Text style={styles.successTitle}>Booking Created Successfully!</Text>
              <Text style={styles.successText}>
                Your booking slot has been reserved. Complete payment to secure your appointment.
              </Text>
              <Text style={styles.redirectText}>Redirecting to payment...</Text>
            </Card.Content>
          </Card>
        )}

        {/* Countdown for Active Bookings */}
        {countdown && bookingId && !confirmSuccess && (
          <Card style={styles.countdownCard}>
            <Card.Content style={styles.countdownContent}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary} />
              <View style={styles.countdownTextContainer}>
                <Text style={styles.countdownLabel}>Time until appointment</Text>
                <Text style={styles.countdown}>{countdown}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Booking Information Card */}
        <Card style={styles.bookingCard}>
          <Card.Content>
            <View style={styles.bookingHeader}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.primary} />
              <Text style={styles.bookingHeaderText}>Booking Information</Text>
              {bookingDetails.status && (
                <View style={[styles.statusBadge, { 
                  backgroundColor: 
                    bookingDetails.status === 'completed' ? theme.colors.success :
                    bookingDetails.status === 'confirmed' ? theme.colors.primary :
                    bookingDetails.status === 'pending' ? theme.colors.accent :
                    bookingDetails.status === 'cancelled' ? theme.colors.error :
                    theme.colors.placeholder 
                }]}>
                  <Text style={styles.statusText}>
                    {bookingDetails.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Date & Time</Text>
              <Text style={styles.bookingValue}>
                {formatBookingDate(bookingDetails.date)} at {formatBookingTime(bookingDetails.time)}
              </Text>
            </View>
            
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Shop</Text>
              <Text style={styles.bookingValue}>{bookingDetails.shopName}</Text>
            </View>
            
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Service</Text>
              <Text style={styles.bookingValue}>
                {typeof bookingDetails.service === 'object' ? 
                  bookingDetails.service?.name || 'Car Wash Service'
                  : bookingDetails.service || 'Car Wash Service'
                }
              </Text>
            </View>
            
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Vehicle</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.vehiclePlate || bookingDetails.vehicle?.plateNumber || 'N/A'} 
                ({bookingDetails.vehicleType || bookingDetails.vehicle?.type || 'N/A'})
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.bookingDetail}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatPrice(bookingDetails.totalPrice)}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Payment Status Card - Updated Section */}
        {bookingId && (
          <Card style={styles.paymentCard}>
            <Card.Content>
              <View style={styles.paymentHeader}>
                <MaterialCommunityIcons name={paymentInfo.icon} size={24} color={paymentInfo.color} />
                <Text style={[styles.paymentTitle, { color: paymentInfo.color }]}>{paymentInfo.text}</Text>
              </View>
              <Text style={styles.paymentDescription}>{paymentInfo.description}</Text>
              
              {bookingDetails.isPaid && (
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentDetailText}>
                    Payment Method: {bookingDetails.paymentType === 'ewallet' ? 'E-Wallet' : 'Credit Card'}
                  </Text>
                  {bookingDetails.paymentType === 'ewallet' && bookingDetails.paymentMethod && (
                    <Text style={styles.paymentDetailText}>
                      E-Wallet: {
                        bookingDetails.paymentMethod === 'tng' ? 'Touch \'n Go' :
                        bookingDetails.paymentMethod === 'google-pay' ? 'Google Pay' :
                        bookingDetails.paymentMethod === 'paypal' ? 'PayPal' :
                        bookingDetails.paymentMethod
                      }
                    </Text>
                  )}
                  {bookingDetails.paidAt && (
                    <Text style={styles.paymentDetailText}>
                      Paid on: {moment(bookingDetails.paidAt?.toDate ? bookingDetails.paidAt.toDate() : bookingDetails.paidAt).format('MMM D, YYYY h:mm A')}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Only show payment button if NOT paid and booking is active */}
              {!bookingDetails.isPaid && bookingDetails.status !== 'cancelled' && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('PaymentScreen', { 
                    bookingId: bookingId,
                    totalPrice: bookingDetails.totalPrice,
                    showWarning: false,
                    isEarlyPayment: bookingDetails.status !== 'completed'
                  })}
                  style={styles.paymentButton}
                  icon="cash"
                >
                  Complete Payment
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Cancellation Policy Card */}
        {cancellationInfo && bookingId && bookingDetails.status !== 'cancelled' && bookingDetails.status !== 'completed' && (
          <Card style={styles.cancellationCard}>
            <Card.Content>
              <View style={styles.cancellationHeader}>
                <MaterialCommunityIcons name="information" size={24} color={theme.colors.info} />
                <Text style={styles.cancellationTitle}>Cancellation Policy</Text>
              </View>
              
              <Text style={[styles.cancellationMessage, { color: cancellationInfo.color }]}>
                {cancellationInfo.message}
              </Text>
              
              {cancellationInfo.timeLeft && (
                <Text style={styles.timeLeftText}>{cancellationInfo.timeLeft}</Text>
              )}
              
              <View style={styles.policyPoints}>
                <Text style={styles.policyPoint}>• Free cancellation up to 2 hours before appointment</Text>
                <Text style={styles.policyPoint}>• Automatic refund within 3-5 business days</Text>
                <Text style={styles.policyPoint}>• Cancelled slots become available for other customers</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Action Buttons */}
        {!bookingId && !confirmSuccess && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleConfirmBooking}
              style={styles.confirmButton}
              loading={confirmLoading}
              disabled={confirmLoading}
            >
              Confirm Booking
            </Button>
            
            <PaperButton
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={confirmLoading}
            >
              Back
            </PaperButton>
          </View>
        )}
        
        {/* Cancel button - only show if cancellation is allowed */}
        {bookingId && cancellationInfo?.canCancel && bookingDetails.status !== 'cancelled' && bookingDetails.status !== 'completed' && (
          <View style={styles.actionButtons}>
            <PaperButton
              mode="outlined"
              onPress={handleCancelBooking}
              style={styles.cancelBookingButton}
              loading={cancelLoading}
              disabled={cancelLoading}
              icon="cancel"
            >
              Cancel Booking
            </PaperButton>
          </View>
        )}
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
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 15,
    color: theme.colors.error,
    textAlign: 'center',
  },
  successCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.success,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 10,
  },
  successText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  redirectText: {
    marginTop: 5,
    fontSize: 12,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  countdownCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#f0f4ff',
  },
  countdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  countdownTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  countdown: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  bookingCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bookingHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  bookingDetail: {
    marginBottom: 10,
  },
  bookingLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 2,
  },
  bookingValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
  divider: {
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  paymentDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 10,
  },
  paymentDetails: {
    marginTop: 10,
    paddingLeft: 34,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  paymentDetailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  paymentButton: {
    marginTop: 15,
  },
  cancellationCard: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#f8f9fa',
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancellationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: theme.colors.text,
  },
  cancellationMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  timeLeftText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 10,
  },
  policyPoints: {
    marginTop: 10,
  },
  policyPoint: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 5,
  },
  actionButtons: {
    marginTop: 20,
  },
  confirmButton: {
    marginBottom: 10,
  },
  backButton: {
    borderColor: theme.colors.placeholder,
  },
  cancelBookingButton: {
    borderColor: theme.colors.error,
  },
});