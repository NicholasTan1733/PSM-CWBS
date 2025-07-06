import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, Card, TextInput, Avatar, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from 'moment';

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getBookingDetails, submitFeedback } from "../../firebase/firebase";

export default function FeedbackScreen({ route, navigation }) {
  const { bookingId } = route.params;
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const details = await getBookingDetails(bookingId);
        setBookingDetails(details);
        
        // If feedback already exists, populate the form
        if (details.feedback) {
          setRating(details.feedback.rating);
          setFeedback(details.feedback.comment);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
        Alert.alert("Error", "Failed to load booking details. Please try again.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId]);
  
  const handleRatingSelect = (value) => {
    setRating(value);
  };
  
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit feedback to database
      await submitFeedback(bookingId, {
        rating,
        comment: feedback,
        timestamp: new Date().toISOString()
      });
      
      // Show success state
      setSubmitSuccess(true);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('ddd, MMM D, YYYY');
  };
  
  const formatTime = (timeString) => {
    return moment(timeString, 'HH:mm').format('h:mm A');
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Feedback</Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </Background>
    );
  }
  
  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Rate Your Experience</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {submitSuccess ? (
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={80} color={theme.colors.success} />
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successText}>Your feedback has been submitted.</Text>
          </View>
        ) : (
          <>
            <Card style={styles.bookingSummary}>
              <Card.Content>
                <View style={styles.bookingDetail}>
                  <Text style={styles.bookingLabel}>Service</Text>
                  <Text style={styles.bookingValue}>{bookingDetails?.service?.name}</Text>
                </View>
                
                <View style={styles.bookingDetail}>
                  <Text style={styles.bookingLabel}>Date & Time</Text>
                  <Text style={styles.bookingValue}>
                    {formatDate(bookingDetails?.date)} at {formatTime(bookingDetails?.time)}
                  </Text>
                </View>
                
                <View style={styles.bookingDetail}>
                  <Text style={styles.bookingLabel}>Vehicle</Text>
                  <Text style={styles.bookingValue}>
                    {bookingDetails?.vehicle?.plateNumber} ({bookingDetails?.vehicle?.type})
                  </Text>
                </View>
              </Card.Content>
            </Card>
            
            <Text style={styles.ratingTitle}>How would you rate your experience?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRatingSelect(star)}
                  style={styles.starButton}
                >
                  <MaterialCommunityIcons
                    name={rating >= star ? "star" : "star-outline"}
                    size={40}
                    color={rating >= star ? theme.colors.accent : theme.colors.placeholder}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.ratingText}>
              {rating === 0 ? 'Tap to rate' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
            
            <TextInput
              label="Additional Comments (Optional)"
              value={feedback}
              onChangeText={setFeedback}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.feedbackInput}
              placeholder="Tell us about your experience..."
            />
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={submitting}
              disabled={submitting}
            >
              Submit Feedback
            </Button>
          </>
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  bookingSummary: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  bookingDetail: {
    marginVertical: 5,
  },
  bookingLabel: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 3,
  },
  bookingValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  feedbackInput: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    marginTop: 10,
  },
});