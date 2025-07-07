import React from "react";
import { Provider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from 'expo-status-bar';

import { theme } from "./app/core/theme";


import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  HomeScreen,
  AddVehicleScreen,
  MyVehiclesScreen,
  VehicleDetailsScreen,
  BookingScreen,
  BookingTimeScreen,
  BookingConfirmationScreen,
  PaymentScreen,
  BookingHistoryScreen,
  FeedbackScreen,
} from "./app/screens";


import SelectCityScreen from "./app/screens/SelectCityScreen";
import SelectShopScreen from "./app/screens/SelectShopScreen";
import ShopDetailsScreen from "./app/screens/ShopDetailsScreen";
import ProfileScreen from "./app/screens/ProfileScreen";

import AdminDashboardScreen from "./app/screens/admin/AdminDashboardScreen";
import AdminBookingDetailsScreen from "./app/screens/admin/AdminBookingDetailsScreen";
import AdminBookingHistoryScreen from "./app/screens/admin/AdminBookingHistoryScreen";
import AdminCustomersScreen from "./app/screens/admin/AdminCustomersScreen";
import AdminCustomerDetailsScreen from "./app/screens/admin/AdminCustomerDetailsScreen";
import AdminSettingsScreen from "./app/screens/admin/AdminSettingsScreen";
import ShopOwnerSalesDashboard from "./app/screens/admin/ShopOwnerSalesDashboard";

const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider theme={theme}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
    
          <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
          <Stack.Screen name="ShopOwnerSalesDashboard" component={ShopOwnerSalesDashboard} />
          <Stack.Screen name="AdminBookingDetailsScreen" component={AdminBookingDetailsScreen} />
          <Stack.Screen name="AdminBookingHistoryScreen" component={AdminBookingHistoryScreen} />
          <Stack.Screen name="AdminCustomersScreen" component={AdminCustomersScreen} />
          <Stack.Screen name="AdminCustomerDetailsScreen" component={AdminCustomerDetailsScreen} />
          <Stack.Screen name="AdminSettingsScreen" component={AdminSettingsScreen} />
          
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
         
          <Stack.Screen name="AddVehicleScreen" component={AddVehicleScreen} />
          <Stack.Screen name="MyVehiclesScreen" component={MyVehiclesScreen} />
          <Stack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} />
          
          <Stack.Screen name="SelectCityScreen" component={SelectCityScreen} />
          <Stack.Screen name="SelectShopScreen" component={SelectShopScreen} />
          <Stack.Screen name="ShopDetailsScreen" component={ShopDetailsScreen} />
          <Stack.Screen name="BookingScreen" component={BookingScreen} />
          <Stack.Screen name="BookingTimeScreen" component={BookingTimeScreen} />
          <Stack.Screen name="BookingConfirmationScreen" component={BookingConfirmationScreen} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} /> 
          <Stack.Screen name="BookingHistoryScreen" component={BookingHistoryScreen} />
          <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}