import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, Card, Avatar, Modal, TextInput, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Calendar } from 'react-native-calendars';
import moment from 'moment';

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getAvailableTimeSlots, checkSlotAvailability } from "../../firebase/firebase";

export default function EnhancedBookingTimeScreen({ route, navigation }) {
  const { shopId, shopName, vehicle, service, addOns, totalPrice } = route.params;
  
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [remarksVisible, setRemarksVisible] = useState(false);
  const [slotCheckLoading, setSlotCheckLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const minDate = moment().format('YYYY-MM-DD');
  const maxDate = moment().add(30, 'days').format('YYYY-MM-DD');
  
  const loadAvailableTimeSlots = async (date, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const availableSlots = await getAvailableTimeSlots(shopId, date, service.duration);
      if (date === minDate) {
        const now = moment();
        const filteredSlots = availableSlots.filter(slot => {
          const [hour, minute] = slot.split(':').map(Number);
          const slotTime = moment().hour(hour).minute(minute);
          return slotTime.isAfter(now.clone().add(2, 'hours'));
        });
        setAvailableTimeSlots(filteredSlots);
      } else {
        setAvailableTimeSlots(availableSlots);
      }
    } catch (error) {
      console.error("Error loading time slots:", error);
      setAvailableTimeSlots([]);
      Alert.alert("Error", "Failed to load available time slots. Please try again.");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadAvailableTimeSlots(selectedDate);
  }, [selectedDate, service.duration, shopId]);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
    setSelectedTime(null);
  };
  
  const handleTimeSelect = async (time) => {
    setSlotCheckLoading(true);
    
    try {
      const isAvailable = await checkSlotAvailability(shopId, selectedDate, time, service.duration);
      
      if (!isAvailable) {
        Alert.alert(
          "Time Slot Unavailable",
          "Sorry, this time slot has just been booked. Please select another time.",
          [{ text: "OK" }]
        );
        loadAvailableTimeSlots(selectedDate, false);
        return;
      }
      
      setSelectedTime(time);
    } catch (error) {
      console.error("Error checking slot availability:", error);
      Alert.alert("Error", "Failed to verify slot availability. Please try again.");
    } finally {
      setSlotCheckLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadAvailableTimeSlots(selectedDate, false);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedTime) {
      Alert.alert("Error", "Please select a time slot");
      return;
    }
    
    try {
      const isAvailable = await checkSlotAvailability(shopId, selectedDate, selectedTime, service.duration);
      
      if (!isAvailable) {
        Alert.alert(
          "Time Slot Unavailable",
          "Sorry, this time slot has just been booked. Please select another time.",
          [{ text: "OK" }]
        );
        loadAvailableTimeSlots(selectedDate, false);
        return;
      }
      const appointmentDateTime = moment(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');
      const now = moment();
      const hoursUntil = appointmentDateTime.diff(now, 'hours', true);
      
      if (hoursUntil < 2) {
        Alert.alert(
          "Same-Day Booking Notice",
          "⚠️ Important: Since your appointment is within 2 hours, payment will be processed immediately and cannot be refunded.\n\nDo you want to continue?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Continue", onPress: proceedWithBooking }
          ]
        );
      } else {
        proceedWithBooking();
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      Alert.alert("Error", "An error occurred while processing your booking. Please try again.");
    }
  };
  
  const proceedWithBooking = () => {
    navigation.navigate("BookingConfirmationScreen", {
      bookingDetails: {
        shopId,
        shopName,
        vehicle,
        service,
        addOns,
        totalPrice,
        date: selectedDate,
        time: selectedTime,
        remarks
      }
    });
  };
  
  const markedDates = {
    [selectedDate]: { selected: true, selectedColor: theme.colors.primary }
  };
  
  const groupTimeSlots = (slots) => {
    const periods = {
      morning: { label: "Morning (8 AM - 12 PM)", slots: [] },
      afternoon: { label: "Afternoon (12 PM - 5 PM)", slots: [] },
      evening: { label: "Evening (5 PM - 6 PM)", slots: [] }
    };
    
    slots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      
      if (hour < 12) {
        periods.morning.slots.push(slot);
      } else if (hour < 17) {
        periods.afternoon.slots.push(slot);
      } else {
        periods.evening.slots.push(slot);
      }
    });
    
    return periods;
  };
  
  const formatTime = (timeString) => {
    return moment(timeString, 'HH:mm').format('h:mm A');
  };
  
  const formatServiceDuration = (duration) => {
    if (duration < 60) {
      return `${duration} min`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };
  
  const getBookingTimeWarning = () => {
    if (selectedDate === minDate) {
      return {
        type: 'same_day',
        message: '⚠️ Same-day bookings require immediate payment (non-refundable)',
        color: theme.colors.accent
      };
    } else {
      return {
        type: 'advance',
        message: '✅ Advance booking - payment on hold until 2 hours before appointment',
        color: theme.colors.success
      };
    }
  };
  
  const groupedSlots = groupTimeSlots(availableTimeSlots);
  const bookingWarning = getBookingTimeWarning();
  
  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Select Date & Time</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.bookingSummary}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="store" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryText}>{shopName || 'Car Wash Shop'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="car" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryText}>
                {vehicle?.plateNumber || 'N/A'} ({vehicle?.type || 'N/A'})
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="car-wash" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryText}>
                {service?.name || 'Service'} ({formatServiceDuration(service?.duration || 30)})
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="cash" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryText}>${totalPrice || '0'}</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={[styles.warningCard, { borderLeftColor: bookingWarning.color }]}>
          <Card.Content>
            <Text style={[styles.warningText, { color: bookingWarning.color }]}>
              {bookingWarning.message}
            </Text>
            {bookingWarning.type === 'advance' && (
              <Text style={styles.warningSubtext}>
                • Free cancellation until 2 hours before appointment
                • Automatic refund if cancelled in time
              </Text>
            )}
          </Card.Content>
        </Card>
        
        <Text style={styles.sectionTitle}>Select Date</Text>
        
        <Calendar
          style={styles.calendar}
          current={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: theme.colors.primary,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
          }}
        />
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Select Time
            {service?.duration && (
              <Text style={styles.durationNote}>
                {' '}(Service Duration: {formatServiceDuration(service.duration)})
              </Text>
            )}
          </Text>
          
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color={theme.colors.primary} 
              style={{ opacity: refreshing ? 0.5 : 1 }}
            />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading available time slots...</Text>
          </View>
        ) : availableTimeSlots.length === 0 ? (
          <Card style={styles.noSlotsCard}>
            <Card.Content style={styles.noSlotsContent}>
              <MaterialCommunityIcons name="clock-alert" size={40} color={theme.colors.placeholder} />
              <Text style={styles.noSlotsText}>No available time slots for this date</Text>
              <Text style={styles.noSlotsSubtext}>
                {selectedDate === minDate 
                  ? "All slots are booked or within the 2-hour advance booking requirement."
                  : "All slots are booked for this date."
                }
              </Text>
              <Text style={styles.noSlotsSubtext}>Please select another date.</Text>
              
              <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Refresh Slots</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.timeSlotsContainer}>
            <View style={styles.slotInfoCard}>
              <MaterialCommunityIcons name="information" size={16} color={theme.colors.info} />
              <Text style={styles.slotInfoText}>
                Time slots are optimized based on your service duration ({formatServiceDuration(service?.duration || 30)}) to prevent overlaps.
              </Text>
            </View>
            
            {selectedDate === minDate && (
              <View style={styles.sameDayNotice}>
                <MaterialCommunityIcons name="clock-fast" size={16} color={theme.colors.accent} />
                <Text style={styles.sameDayNoticeText}>
                  Same-day bookings require 2+ hours advance notice and immediate payment.
                </Text>
              </View>
            )}
            
            {Object.entries(groupedSlots).map(([period, data]) => {
              if (data.slots.length === 0) return null;
              
              return (
                <View key={period} style={styles.periodGroup}>
                  <Text style={styles.periodLabel}>{data.label}</Text>
                  <View style={styles.timeSlots}>
                    {data.slots.map(time => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          selectedTime === time && styles.selectedTimeSlot,
                          slotCheckLoading && styles.disabledTimeSlot
                        ]}
                        onPress={() => handleTimeSelect(time)}
                        disabled={slotCheckLoading}
                      >
                        {slotCheckLoading && selectedTime === time ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <Text style={[
                            styles.timeSlotText,
                            selectedTime === time && styles.selectedTimeSlotText
                          ]}>
                            {formatTime(time)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.remarksButton}
          onPress={() => setRemarksVisible(true)}
        >
          <MaterialCommunityIcons name="text-box" size={20} color={theme.colors.primary} />
          <Text style={styles.remarksButtonText}>
            {remarks ? 'Edit Special Instructions' : 'Add Special Instructions'}
          </Text>
        </TouchableOpacity>
        
        {remarks ? (
          <View style={styles.remarksPreview}>
            <Text style={styles.remarksPreviewLabel}>Special Instructions:</Text>
            <Text style={styles.remarksPreviewText}>{remarks}</Text>
          </View>
        ) : null}
        
        <Button
          mode="contained"
          onPress={handleConfirmBooking}
          style={styles.confirmButton}
          disabled={!selectedTime || slotCheckLoading}
          loading={slotCheckLoading}
        >
          {slotCheckLoading ? 'Verifying Slot...' : 'Confirm Booking'}
        </Button>
      </ScrollView>
      
      <Modal
        visible={remarksVisible}
        onDismiss={() => setRemarksVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Special Instructions</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={4}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Add any special instructions or requests..."
          style={styles.remarksInput}
        />
        <Button
          mode="contained"
          onPress={() => setRemarksVisible(false)}
          style={styles.saveButton}
        >
          Save
        </Button>
      </Modal>
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
  bookingSummary: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  warningCard: {
    marginBottom: 15,
    borderRadius: 8,
    elevation: 1,
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warningSubtext: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: theme.colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
  },
  durationNote: {
    fontSize: 12,
    fontWeight: 'normal',
    color: theme.colors.placeholder,
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.placeholder,
  },
  noSlotsCard: {
    borderRadius: 10,
    marginBottom: 20,
    elevation: 1,
  },
  noSlotsContent: {
    alignItems: 'center',
    padding: 20,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: theme.colors.text,
    textAlign: 'center',
  },
  noSlotsSubtext: {
    fontSize: 14,
    marginTop: 5,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  slotInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  slotInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 18,
  },
  sameDayNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  sameDayNoticeText: {
    marginLeft: 8,
    fontSize: 13,
    color: theme.colors.accent,
    flex: 1,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  periodGroup: {
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.text,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabledTimeSlot: {
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  remarksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  remarksButtonText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  remarksPreview: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  remarksPreviewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: theme.colors.text,
  },
  remarksPreviewText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  confirmButton: {
    marginTop: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
  },
  remarksInput: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
  },
});