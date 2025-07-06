// ProfileScreen.js
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, Avatar, TextInput as PaperTextInput, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { getUserProfile, saveUserProfile } from "../../firebase/firebase";
import { signOut } from "../../firebase/firebase";
import { nameValidator } from "../helpers/nameValidator";
import { phoneValidator } from "../helpers/phoneValidator";

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [name, setName] = useState({ value: "", error: "" });
  const [phone, setPhone] = useState({ value: "", error: "" });
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      // Set form values
      setName({ value: profile.name || "", error: "" });
      setPhone({ value: profile.phone || "", error: "" });
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    // Validate form
    const nameError = nameValidator(name.value);
    const phoneError = phoneValidator(phone.value);
    
    if (nameError || phoneError) {
      setName({ ...name, error: nameError });
      setPhone({ ...phone, error: phoneError });
      return;
    }
    
    try {
      setSaving(true);
      
      // Update profile
      await saveUserProfile({
        name: name.value,
        phone: phone.value,
      });
      
      // Update local state
      setUserProfile({
        ...userProfile,
        name: name.value,
        phone: phone.value,
      });
      
      // Exit edit mode
      setEditMode(false);
      
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          onPress: async () => {
            try {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: "StartScreen" }],
              });
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          } 
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <Background>
        <BackButton goBack={navigation.goBack} />
        <Header>Profile</Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </Background>
    );
  }
  
  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Profile</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={userProfile?.name?.charAt(0) || "U"} 
            backgroundColor={theme.colors.primary}
            color="#fff"
          />
          
          {!editMode && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile?.name || "User"}</Text>
              <Text style={styles.profileEmail}>{userProfile?.email || ""}</Text>
            </View>
          )}
        </View>
        
        {editMode ? (
          <View style={styles.editForm}>
            <TextInput
              label="Full Name"
              returnKeyType="next"
              value={name.value}
              onChangeText={(text) => setName({ value: text, error: "" })}
              error={!!name.error}
              errorText={name.error}
              autoCompleteType="name"
              textContentType="name"
            />
            
            <TextInput
              label="Phone Number"
              returnKeyType="done"
              value={phone.value}
              onChangeText={(text) => setPhone({ value: text, error: "" })}
              error={!!phone.error}
              errorText={phone.error}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoCompleteType="tel"
            />
            
            <View style={styles.editButtons}>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                style={styles.saveButton}
                loading={saving}
                disabled={saving}
              >
                Save Changes
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => {
                  // Reset form values and exit edit mode
                  setName({ value: userProfile.name || "", error: "" });
                  setPhone({ value: userProfile.phone || "", error: "" });
                  setEditMode(false);
                }}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <View style={styles.detailCard}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{userProfile?.name || "Not set"}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="email" size={24} color={theme.colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{userProfile?.email || "Not set"}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{userProfile?.phone || "Not set"}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statsCard}>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{userProfile?.vehicles || 0}</Text>
                <Text style={styles.statsLabel}>Vehicles</Text>
              </View>
              
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{userProfile?.totalBookings || 0}</Text>
                <Text style={styles.statsLabel}>Bookings</Text>
              </View>
            </View>
            
            <Button
              mode="contained"
              onPress={() => setEditMode(true)}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              Sign Out
            </Button>
          </View>
        )}
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 5,
  },
  profileDetails: {
    width: '100%',
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailContent: {
    marginLeft: 15,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 3,
  },
  statsCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  editButton: {
    marginTop: 10,
    width: '100%',
  },
  signOutButton: {
    marginTop: 10,
    width: '100%',
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  editForm: {
    width: '100%',
    marginTop: 20,
  },
  editButtons: {
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 10,
  },
  cancelButton: {
    borderColor: theme.colors.placeholder,
  },
});