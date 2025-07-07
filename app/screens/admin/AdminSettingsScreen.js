import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { Text, Card, Divider, Surface } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../../core/theme";
import { signOut, getUserData, updateUserSettings } from "../../../firebase/firebase";
import { collection, query, where, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/firebase";

const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function AdminSettingsScreen({ navigation }) {
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(false);
  const [showBookingHistory, setShowBookingHistory] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const data = await getUserData();
      setUserData(data);
      if (data.settings) {
        setAutoAcceptBookings(data.settings.autoAcceptBookings ?? false);
        setShowBookingHistory(data.settings.showBookingHistory ?? true);
      } else {
        setAutoAcceptBookings(false);
        setShowBookingHistory(true);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      switch (setting) {

        case 'autoAcceptBookings':
          setAutoAcceptBookings(value);
          if (value && userData?.shopId) {
            Alert.alert(
              "Auto-Accept Enabled",
              "Do you want to automatically confirm all pending bookings?",
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes",
                  onPress: async () => {
                    try {
                      const bookingsQuery = query(
                        collection(db, "bookings"),
                        where("shopId", "==", userData.shopId),
                        where("status", "==", "pending")
                      );
                      
                      const snapshot = await getDocs(bookingsQuery);
                      const batch = writeBatch(db);
                      
                      snapshot.docs.forEach((doc) => {
                        batch.update(doc.ref, {
                          status: "confirmed",
                          autoAccepted: true,
                          autoAcceptedAt: serverTimestamp()
                        });
                      });
                      
                      await batch.commit();
                      
                      if (snapshot.size > 0) {
                        Alert.alert("Success", `${snapshot.size} pending bookings have been confirmed.`);
                      }
                    } catch (error) {
                      console.error("Error auto-confirming bookings:", error);
                    }
                  }
                }
              ]
            );
          }
          break;
        case 'showBookingHistory':
          setShowBookingHistory(value);
          break;
      }

      await updateUserSettings({
        [setting]: value
      });
    } catch (error) {
      Alert.alert("Error", "Failed to update settings");
      
      switch (setting) {

        case 'autoAcceptBookings':
          setAutoAcceptBookings(!value);
          break;
        case 'showBookingHistory':
          setShowBookingHistory(!value);
          break;
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Settings</Text>
        
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.profileSection} elevation={1}>
          <View style={styles.profileHeader}>
            <Surface style={styles.profileAvatar} elevation={2}>
              <MaterialCommunityIcons name="store" size={32} color={adminTheme.primary} />
            </Surface>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userData?.shopName || 'My Shop'}</Text>
              <Text style={styles.profileEmail}>{userData?.email}</Text>
            </View>
          </View>
        </Surface>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Booking Settings</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Accept Bookings</Text>
                <Text style={styles.settingDescription}>Automatically confirm new bookings</Text>
              </View>
              <Switch
                value={autoAcceptBookings}
                onValueChange={(value) => handleSettingChange('autoAcceptBookings', value)}
                trackColor={{ false: '#767577', true: adminTheme.primaryLight }}
                thumbColor={autoAcceptBookings ? adminTheme.primary : '#f4f3f4'}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Booking History</Text>
                <Text style={styles.settingDescription}>Display past bookings in dashboard</Text>
              </View>
              <Switch
                value={showBookingHistory}
                onValueChange={(value) => handleSettingChange('showBookingHistory', value)}
                trackColor={{ false: '#767577', true: adminTheme.primaryLight }}
                thumbColor={showBookingHistory ? adminTheme.primary : '#f4f3f4'}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            <Divider style={styles.divider} />
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleSignOut}
            >
              <MaterialCommunityIcons name="logout" size={24} color={theme.colors.error} />
              <Text style={styles.dangerText}>Sign Out</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Swift Car Wash v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 Swift Car Wash</Text>
        </View>
      </ScrollView>

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
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminCustomersScreen')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#6B7280" />
          <Text style={styles.navText}>Customers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialCommunityIcons name="cog" size={24} color={adminTheme.primary} />
          <Text style={[styles.navText, { color: adminTheme.primary }]}>Settings</Text>
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
  profileSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminTheme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  divider: {
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  settingDescription: {
    fontSize: 13,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dangerButton: {
    marginTop: 8,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.error,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  appCopyright: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
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