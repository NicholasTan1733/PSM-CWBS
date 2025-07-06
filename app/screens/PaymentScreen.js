import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from "react-native";
import { Text, Card, TextInput, RadioButton, Divider, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { processPayment, getBookingDetails } from "../../firebase/firebase";

export default function PaymentScreen({ route, navigation }) {
  const { bookingId, totalPrice, showWarning, isEarlyPayment } = route.params;
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  
  const warningAccepted = !isEarlyPayment;
  
  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const details = await getBookingDetails(bookingId);
        setBookingDetails(details);
      } catch (error) {
        console.error("Error fetching booking details:", error);
        Alert.alert("Error", "Failed to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId]);

  // Format card number
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  // Format expiry date
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' + cleaned.slice(2, 4) : '');
    }
    return cleaned;
  };

  // Format price to RM with proper decimal places
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    // If it's a whole number, show without decimals
    if (numPrice % 1 === 0) {
      return `RM${numPrice.toFixed(0)}.00`;
    }
    // Otherwise show with 2 decimal places
    return `RM${numPrice.toFixed(2)}`;
  };

  const handlePayment = async () => {
    // Validate payment method selection
    if (paymentMethod === 'e_wallet' && !selectedWallet) {
      Alert.alert("Error", "Please select an e-wallet");
      return;
    }

    // Validate card details if credit card is selected
    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        Alert.alert("Error", "Please fill in all card details");
        return;
      }
      
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert("Error", "Invalid card number");
        return;
      }
      
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        Alert.alert("Error", "Expiry date should be in MM/YY format");
        return;
      }
      
      if (!/^\d{3}$/.test(cardCVV)) {
        Alert.alert("Error", "CVV should be 3 digits");
        return;
      }
    }
    
    try {
      setProcessingPayment(true);
      
      // Determine payment type
      const paymentType = paymentMethod === 'credit_card' ? 'card' : selectedWallet;
      
      // Process the payment
      await processPayment(bookingId, paymentMethod, paymentType);
      
      // Show success state
      setPaymentSuccess(true);
      setPaymentResult({ status: 'completed' });
      
      // Navigate back to home screen after a delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      }, 2500);
    } catch (error) {
      console.error("Error processing payment:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <Background>
        <BackButton goBack={() => navigation.goBack()} />
        <Header>Payment</Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <BackButton goBack={() => navigation.goBack()} />
      <Header>Secure Payment</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {paymentSuccess ? (
          <View style={styles.successContainer}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={80} 
              color={theme.colors.success} 
            />
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successDescription}>
              Your payment has been processed successfully.
            </Text>
            <View style={styles.successDetails}>
              <Text style={styles.successAmount}>{formatPrice(totalPrice)}</Text>
              <Text style={styles.successMethod}>
                Paid via {paymentMethod === 'credit_card' ? 'Credit Card' : selectedWallet}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>
                    {typeof bookingDetails?.service === 'object' ? 
                      bookingDetails.service?.name || 'Car Wash Service'
                      : bookingDetails?.service || 'Car Wash Service'
                    }
                  </Text>
                </View>
                
                {bookingDetails?.addOns && bookingDetails.addOns.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Add-ons</Text>
                    <Text style={styles.summaryValue}>
                      {bookingDetails.addOns.map(addon => addon.name).join(', ')}
                    </Text>
                  </View>
                )}
                
                <Divider style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
                </View>
              </Card.Content>
            </Card>
            
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            
            <View style={styles.paymentMethodsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodItem,
                  paymentMethod === 'credit_card' && styles.selectedPaymentMethod
                ]}
                onPress={() => {
                  setPaymentMethod('credit_card');
                  setSelectedWallet('');
                }}
              >
                <MaterialCommunityIcons 
                  name="credit-card" 
                  size={24} 
                  color={paymentMethod === 'credit_card' ? theme.colors.primary : theme.colors.text} 
                />
                <Text style={[
                  styles.paymentMethodName,
                  paymentMethod === 'credit_card' && styles.selectedPaymentMethodText
                ]}>
                  Credit/Debit Card
                </Text>
                <RadioButton
                  value="credit_card"
                  status={paymentMethod === 'credit_card' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setPaymentMethod('credit_card');
                    setSelectedWallet('');
                  }}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentMethodItem,
                  paymentMethod === 'e_wallet' && styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentMethod('e_wallet')}
              >
                <MaterialCommunityIcons 
                  name="wallet" 
                  size={24} 
                  color={paymentMethod === 'e_wallet' ? theme.colors.primary : theme.colors.text} 
                />
                <Text style={[
                  styles.paymentMethodName,
                  paymentMethod === 'e_wallet' && styles.selectedPaymentMethodText
                ]}>
                  E-Wallet
                </Text>
                <RadioButton
                  value="e_wallet"
                  status={paymentMethod === 'e_wallet' ? 'checked' : 'unchecked'}
                  onPress={() => setPaymentMethod('e_wallet')}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
            
            {paymentMethod === 'credit_card' && (
              <Card style={styles.cardDetailsCard}>
                <Card.Content>
                  <Text style={styles.cardDetailsTitle}>Card Details</Text>
                  
                  <TextInput
                    label="Card Number"
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={19}
                    style={styles.input}
                    left={<TextInput.Icon icon="credit-card" />}
                  />
                  
                  <View style={styles.cardRow}>
                    <View style={styles.cardRowItem}>
                      <TextInput
                        label="Expiry Date"
                        value={cardExpiry}
                        onChangeText={(text) => setCardExpiry(formatExpiryDate(text))}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={5}
                        style={styles.input}
                        placeholder="MM/YY"
                      />
                    </View>
                    <View style={styles.cardRowItem}>
                      <TextInput
                        label="CVV"
                        value={cardCVV}
                        onChangeText={setCardCVV}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={3}
                        style={styles.input}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  
                  <TextInput
                    label="Cardholder Name"
                    value={cardName}
                    onChangeText={setCardName}
                    mode="outlined"
                    style={styles.input}
                  />
                  
                  <View style={styles.cardBrandsContainer}>
                    <Image 
                      source={require('../../assets/items/visa.png')} 
                      style={styles.cardBrandIcon}
                      resizeMode="contain"
                    />
                    <Image 
                      source={require('../../assets/items/mastercard.png')} 
                      style={styles.cardBrandIcon}
                      resizeMode="contain"
                    />
                  </View>
                </Card.Content>
              </Card>
            )}
            
            {paymentMethod === 'e_wallet' && (
              <Card style={styles.walletCard}>
                <Card.Content>
                  <Text style={styles.walletTitle}>Select E-Wallet</Text>
                  
                  <View style={styles.walletOptions}>
                    <TouchableOpacity 
                      style={[
                        styles.walletOption,
                        selectedWallet === 'tng' && styles.selectedWallet
                      ]}
                      onPress={() => setSelectedWallet('tng')}
                    >
                      <Image 
                        source={require('../../assets/items/tng.png')} 
                        style={styles.walletIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.walletName}>Touch 'n Go</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.walletOption,
                        selectedWallet === 'google-pay' && styles.selectedWallet
                      ]}
                      onPress={() => setSelectedWallet('google-pay')}
                    >
                      <Image 
                        source={require('../../assets/items/google-pay.png')} 
                        style={styles.walletIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.walletName}>Google Pay</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.walletOption,
                        selectedWallet === 'paypal' && styles.selectedWallet
                      ]}
                      onPress={() => setSelectedWallet('paypal')}
                    >
                      <Image 
                        source={require('../../assets/items/paypal.png')} 
                        style={styles.walletIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.walletName}>PayPal</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            )}
            
            <Button
              mode="contained"
              onPress={handlePayment}
              style={styles.payButton}
              loading={processingPayment}
              disabled={processingPayment}
            >
              {processingPayment ? 'Processing...' : `Pay ${formatPrice(totalPrice)} Securely`}
            </Button>
            
            <Text style={styles.secureText}>
              🔒 Your payment information is encrypted and secure
            </Text>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 20,
  },
  successDescription: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 10,
    textAlign: 'center',
  },
  successDetails: {
    marginTop: 20,
    alignItems: 'center',
  },
  successAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  successMethod: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 5,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  divider: {
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  summaryRow: {
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 15,
    color: theme.colors.text,
  },
  totalRow: {
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    color: theme.colors.text,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedPaymentMethod: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f4ff',
  },
  paymentMethodName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedPaymentMethodText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cardDetailsCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 1,
  },
  cardDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
    backgroundColor: theme.colors.surface,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardRowItem: {
    width: '48%',
  },
  cardBrandsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  cardBrandIcon: {
    width: 50,
    height: 30,
    marginHorizontal: 5,
  },
  walletCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  walletOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  walletOption: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  selectedWallet: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f4ff',
  },
  walletIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  walletName: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  payButton: {
    marginTop: 10,
  },
  secureText: {
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 15,
  },
});